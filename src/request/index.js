/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-03-25 23:59:13
 * @version $Id$
 */

'use strict'
import Format from './lib/format'

// 本地协议/头 判断正则
const rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/
const rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm
const encode = encodeURIComponent
const decode = decodeURIComponent
const toS = Object.prototype.toString
const win = window
const doc = win.document

const noop = function(e, res) {
  this.defer.resolve(res)
}
const Xhr = function() {
  return new XMLHttpRequest()
}
const supportCors = 'withCredentials' in Xhr()

let isLocal = false
try {
  isLocal = rlocalProtocol.test(location.ptyperotocol)
} catch (e) {}

let originAnchor = doc.createElement('a')
originAnchor.href = location.href

const noBodyMethods = ['GET', 'HEAD', 'JSONP']
const error = {
  10001: 'argument url is required',
  10002: 'method "set" required an object or 2 args',
  10003: 'method "send" can not call by different way',
  10004: 'method "send" arguments error',
  10005: 'method "send" required an object/string or 2 args',
  10006: 'method "field" required an object or 2 args',
  10011: 'Promise  required a callback',
  10012: 'Parse error',
  10104: 'Request pending...',
  10200: 'ok',
  10204: 'no content',
  10304: 'not modified',
  10500: 'Internal Server Error',
  10504: 'Connected timeout',
  form: 'application/x-www-form-urlencoded; charset=UTF-8',
  json: 'application/json; charset=UTF-8',
  text: 'text/plain; charset=UTF-8'
}

const convert = {
  text(val) {
    return val
  },
  xml(val, xml) {
    return xml !== undefined ? xml : Format.parseXML(val)
  },
  html(val) {
    return Format.parseHTML(val)
  },
  json(val) {
    return JSON.parse(val)
  },
  script(val) {
    return Format.parseJS(val)
  },
  jsonp(name) {
    var json = request.cache[name]
    delete request.cache[name]
    return json
  }
}

class _Request {
  constructor(url = '', method = 'GET') {
    if (!url) {
      throw new Error(error[10001])
    }
    method = method.toUpperCase()

    this.transport = Object.create(null)
    this.xhr = Xhr()
    this.defer = Promise.defer()
    this.opt = {
      url,
      method,
      form: null,
      data: {},
      headers: {},
      timeoutID: 0,
      uuid: Math.random()
        .toString(16)
        .slice(2)
    }
  }

  _formData() {
    if (this.opt.form) {
      let data = Format.parseForm(this.opt.form)
      Format.merge(this.opt.data, data)
    }

    let form = new FormData()
    for (let i in this.opt.data) {
      let el = this.opt.data[i]
      if (Array.isArray(el)) {
        el.forEach(function(it) {
          form.append(i + '[]', it)
        })
      } else {
        form.append(i, this.opt.data[i])
      }
    }
    return form
  }

  _jsonp(cb) {
    win[cb] = function(val) {
      delete win[cb]
      request.cache[cb] = val
    }
  }

  _dispatch(isTimeout) {
    if (!this.transport) {
      return this.defer.reject(error[10104])
    }

    let result = {
      response: {
        url: this.opt.url,
        headers: { 'content-type': '' }
      },
      request: {
        url: this.opt.url,
        headers: this.opt.headers
      },
      status: isTimeout === null ? 504 : 200,
      statusText: isTimeout === null ? 'Connected timeout' : 'ok',
      text: '',
      body: '',
      error: null
    }

    //状态为4,既已成功, 则清除超时
    clearTimeout(this.opt.timeoutID)

    if (this.transport.nodeType && this.opt.method === 'JSONP') {
      //移除script
      this.transport.parentNode.removeChild(this.transport)

      //超时返回
      if (!isTimeout) {
        let exec =
          !this.transport.readyState ||
          this.transport.readyState === 'loaded' ||
          this.transport.readyState === 'complete'

        if (exec) {
          result.body = convert.jsonp(this.opt.data.callback)
          result.text = JSON.stringify(result.body)
        }
      }
      this.defer.resolve(result)
    } else {
      //成功的回调
      let isSucc = isTimeout
        ? false
        : this.transport.status >= 200 && this.transport.status < 400

      let headers =
        (!isTimeout && this.transport.getAllResponseHeaders().split('\n')) || []

      //处理返回的Header
      headers.forEach(function(it, i) {
        it = it.trim()
        if (it) {
          it = it.split(':')
          result.response.headers[it.shift().toLowerCase()] = it
            .join(':')
            .trim()
        }
      })

      if (isSucc) {
        result.status = this.transport.status
        if (result.status === 204) {
          result.statusText = error[10204]
        } else if (result.status === 304) {
          result.statusText = error[10304]
        }
      } else {
        result.status = isTimeout ? 504 : this.transport.status || 500
        result.statusText = isTimeout
          ? error[10504]
          : this.transport.statusText || error[10500]
        result.error = new Error(result.statusText)
      }

      try {
        //处理返回的数据
        var dataType = result.response.headers['content-type'].match(
          /json|xml|script|html/i
        ) || ['text']

        dataType = dataType[0].toLowerCase()
        result.text = isTimeout
          ? ''
          : this.transport.responseText || this.transport.responseXML

        result.body = convert[dataType](
          result.text,
          !isTimeout && this.transport.responseXML
        )
      } catch (err) {
        result.error = err
        result.statusText = error[10012]
      }

      if (result.status >= 200 && result.status < 400) {
        this.defer.resolve(result)
      } else {
        this.defer.reject(result)
      }
    }
    delete this.transport
    delete this.opt
    delete this.xhr
  }

  // 设置表单类型, 支持3种, form(即x-www-form-urlencoded)/json/text
  type(type) {
    // 如果已经是带附件上传的表单,不再支持修改表单类型
    if (this.opt.formType === 'form-data') {
      return this
    }

    this.opt.formType = type || 'form'

    // 不是POST方式, 强制为x-www-form-urlencoded
    if (type === 'form' || noBodyMethods.indexOf(this.opt.method) > -1) {
      this.set('content-type', error.form)
    } else if (type === 'json') {
      this.set('content-type', error.json)
    } else {
      this.set('content-type', error.text)
    }

    return this
  }

  //设置头信息
  set(key, val) {
    // 已经发起请求之后,不再允许追加头信息了
    if (!this.transport) {
      return this
    }

    let obj = {}

    if (arguments.length === 1) {
      if (typeof key !== 'object') {
        this.defer.reject(error[10002])
        return this
      }
      obj = key
    } else if (arguments.length === 2) {
      if (typeof key === 'string' && val !== undefined) {
        obj[key] = val
      }
    } else {
      this.defer.reject(error[10002])
      return this
    }
    for (let k in obj) {
      // 全转小写,避免重复写入
      let v = obj[k]
      k = k.toLowerCase()
      this.opt.headers[k] = v
    }
    return this
  }

  // 设置请求数据(POST方式会放入body, GET则拼接到url上)
  send(key, val) {
    if (!this.transport) {
      return this
    }

    if (arguments.length === 1) {
      if (typeof key === 'string') {
        this.opt.data = key
      } else if (typeof key === 'object') {
        if (typeof this.opt.data !== 'object') {
          this.defer.reject(error[10003])
          return this
        }
        Format.merge(this.opt.data, key)
      } else {
        this.defer.reject(error[10004])
      }
    } else if (arguments.length === 2) {
      if (typeof key !== 'string') {
        this.defer.reject(error[10004])
        return this
      }
      if (val === undefined) {
        delete this.opt.data[key]
      } else {
        this.opt.data[key] = val
      }
    } else {
      this.defer.reject(error[10005])
    }

    return this
  }

  //该方法用于 form-data类型的post请求的参数设置
  field(key, val) {
    if (!this.transport) {
      return this
    }

    // 此类型优先级最高
    this.opt.formType = 'form-data'
    this.opt.method = 'POST'
    if (!this.opt.data || typeof this.opt.data !== 'object') {
      this.opt.data = {}
    }

    if (arguments.length === 1 && typeof key === 'object') {
      Format.merge(this.opt.data, key)
    } else if (arguments.length === 2) {
      this.opt.data[key] = val
    } else {
      this.defer.reject(error[10006])
    }
    return this
  }

  //设置缓存
  cache(bool) {
    if (!this.transport) {
      return this
    }

    if (noBodyMethods.indexOf(this.opt.method) > -1) {
      this.opt.cache = !!bool
    }

    return this
  }

  //取消网络请求
  abort() {
    delete this.transport
    if (!this.opt.form) {
      this.xhr.abort()
    }

    return this
  }

  //超时设置, 单位毫秒
  timeout(time) {
    if (typeof time !== 'number' || time < 1) {
      return this
    }

    this.opt.timeout = time
    return this
  }

  form(form) {
    if (typeof form === 'object' && form.nodeName === 'FORM') {
      this.opt.method = 'POST'
      this.opt.form = form
    }

    return this
  }

  then(cb) {
    if (typeof cb !== 'function') {
      this.defer.reject(error[10011])
      return this.defer.promise
    }

    // 回调已执行, 或已取消, 则直接返回, 防止重复执行
    if (!this.transport) {
      return this.defer.promise
    }

    // ------------------------------------------
    // 1. url规范化
    // ------------------------------------------
    this.opt.url = this.opt.url
      .replace(/#.*$/, '')
      .replace(/^\/\//, location.protocol + '//')

    // ------------------------------------------
    // 2. 处理跨域
    // ------------------------------------------
    // 2.1 判断是否跨域
    if (typeof this.opt.crossDomain !== 'boolean') {
      var anchor = doc.createElement('a')
      try {
        anchor.href = this.opt.url
        // IE7及以下浏览器 '1'[0]的结果是 undefined
        // IE7下需要获取绝对路径
        var absUrl = !'1'[0] ? anchor.getAttribute('href', 4) : anchor.href
        anchor.href = absUrl
        anchor.async = true
        this.opt.crossDomain =
          originAnchor.protocol !== anchor.protocol ||
          originAnchor.host !== anchor.host
      } catch (e) {
        this.opt.crossDomain = true
      }
    }

    // 2.2 进一步处理跨域配置
    if (this.opt.method === 'JSONP') {
      //如果没有跨域，自动转回xhr GET
      if (!this.opt.crossDomain) {
        this.opt.method = 'GET'
      } else {
        this.opt.data['callback'] =
          this.opt.data['callback'] || 'jsonp' + request.cid++
        this._jsonp(this.opt.data['callback']) //创建临时处理方法
      }
    }

    // 2.3 如果不是跨域请求，则自动加上一条header信息，用以标识这是ajax请求
    if (!this.opt.crossDomain) {
      this.set('X-Requested-With', 'XMLHttpRequest')
    } else {
      supportCors && (this.xhr.withCredentials = true)
    }

    // ------------------------------------------
    // 3. 解析 data
    // ------------------------------------------
    this.opt.param = Format.param(this.opt.data)

    // ------------------------------------------
    // 4. 修正默认表单类型
    // ------------------------------------------
    if (!this.opt.formType) {
      this.type('form')
    }

    // ------------------------------------------
    // 5. 根据method类型,处理body
    // ------------------------------------------
    let hasBody = noBodyMethods.indexOf(this.opt.method) < 0 //是否为post请求
    if (!hasBody) {
      //GET请求直接把参数拼接到url上
      if (this.opt.param) {
        this.opt.url += (/\?/.test(this.opt.url) ? '&' : '?') + this.opt.param
      }
      //加随机值,避免缓存
      if (this.opt.cache === false) {
        this.opt.url +=
          (/\?/.test(this.opt.url) ? '&' : '?') + '_=' + Math.random()
      }
    } else {
      if (this.opt.formType === 'form-data') {
        delete this.opt.headers['content-type']
        this.opt.param = this._formData()
      } else if (this.opt.formType !== 'form') {
        if (typeof this.opt.data === 'object') {
          this.opt.data = JSON.stringify(this.opt.data)
        }
        this.opt.param = this.opt.data
      }
    }

    // ------------------------------------------
    // 6. 构造并发起请求
    // ------------------------------------------
    // 6.1 jsonp
    if (this.opt.method === 'JSONP') {
      // 6.1.1 构造script并插入
      this.transport = doc.createElement('script')
      this.transport.onerror = this.transport.onload = () => {
        this._dispatch()
      }
      this.transport.src = this.opt.url
      doc.head.insertBefore(this.transport, doc.head.firstChild)

      // 6.1.2 超时处理
      if (this.opt.timeout && this.opt.timeout > 0) {
        this.opt.timeoutID = setTimeout(() => {
          this.transport.onerror = this.transport.onload = null
          this._dispatch(true)
        }, this.opt.timeout)
      }
    } else {
      this.transport = this.xhr
      // 6.2 非jsonp
      // 6.2.1 监听http状态
      this.xhr.onreadystatechange = ev => {
        if (this.opt.timeout && this.opt.timeout > 0) {
          this.opt['time' + this.xhr.readyState] = ev.timeStamp
          if (this.xhr.readyState === 4) {
            this.opt.isTimeout =
              this.opt.time4 - this.opt.time1 > this.opt.timeout
          }
        }

        if (this.xhr.readyState !== 4) {
          return
        }

        this._dispatch(this.opt.isTimeout)
      }

      // 6.2.2 初始化xhr提交
      this.xhr.open(this.opt.method, this.opt.url, true)

      // 6.2.3 设置头信息
      for (var i in this.opt.headers) {
        this.xhr.setRequestHeader(i, this.opt.headers[i])
      }

      // 6.2.4 发起网络请求
      this.xhr.send(this.opt.param)

      // 6.2.5 超时处理
      if (this.opt.timeout && this.opt.timeout > 0) {
        this.xhr.timeout = this.opt.timeout
      }
    }

    return this.defer.promise.then(res => {
      return cb(res)
    })
  }
}

if (!win.request) {
  win.request = {
    get(url) {
      return new _Request(url, 'GET')
    },
    post(url) {
      return new _Request(url, 'POST')
    },
    jsonp(url) {
      return new _Request(url, 'JSONP')
    },
    open(url, method = 'GET') {
      return new _Request(url, method)
    },
    cache: {},
    cid: 0,
    version: '1.1.0-normal'
  }
  Anot.ui.request = request.version
}

export default request
