/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-03-25 23:59:13
 * @version $Id$
 */

'use strict'
import Format from './lib/format'
import format from './lib/format'

// 本地协议/头 判断正则
const rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/
const log = console.log

const noop = function(e, res) {
  this.defer.resolve(res)
}

let isLocal = false
try {
  isLocal = rlocalProtocol.test(location.ptyperotocol)
} catch (e) {}

let originAnchor = document.createElement('a')
originAnchor.href = location.href

const NOBODY_METHODS = ['GET', 'HEAD']
const ERRORS = {
  10001: 'argument url is required',
  10011: 'Promise  required a callback',
  10012: 'Parse error',
  10104: 'Request pending...',
  10200: 'ok',
  10204: 'no content',
  10304: 'not modified',
  10500: 'Internal Server Error',
  10504: 'Connected timeout'
}

const FORM_TYPES = {
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
  }
}

class _Request {
  constructor(url = '', method = 'GET', param = {}) {
    if (!url) {
      throw new Error(ERRORS[10001])
    }

    // url规范化
    url = url.replace(/#.*$/, '').replace(/^\/\//, location.protocol + '//')

    method = method.toUpperCase()

    this.xhr = new XMLHttpRequest()
    this.defer = Promise.defer()
    this.opt = {
      url,
      method,
      data: {},
      headers: {}
    }
    return this.__open__(param)
  }

  __open__(param) {
    // 1»» 配置头信息
    if (param.headers) {
      Object.assign(this.opt.headers, param.headers)
    }

    // 2»» 设置表单类型, 其中 form-data不能手动设置
    let hasAttach = false
    if (param.formType) {
      switch (param.formType) {
        case 'form':
          this.__set__('form')
          break
        case 'json':
          this.__set__('json')
          break
        case 'form-data':
          this.opt.method = 'POST'
          hasAttach = true
          break
        default:
          if (NOBODY_METHODS.includes(this.opt.method)) {
            this.__set__('form')
          } else {
            this.__set__('text')
          }
      }
    } else {
      this.__set__('form')
    }

    // 3»» 设置缓存
    if (param.cache) {
      if (NOBODY_METHODS.includes(this.opt.method)) {
        this.opt.cache = true
      }
    }

    // 4»» 设置超时时间(毫秒)
    param.timeout = param.timeout >>> 0
    if (param.timeout > 0) {
      this.opt.timeout = param.timeout
    }

    // 5»» 请求的内容
    if (param.data) {
      let type = typeof param.data

      switch (type) {
        case 'number':
        case 'string':
          this.__set__('text')
          this.opt.data = param.data
          break
        case 'object':
          // 解析表单DOM
          if (param.data.nodeName === 'FORM') {
            this.opt.method = param.data.method.toUpperCase() || 'POST'

            this.opt.data = Format.parseForm(param.data)
            hasAttach = this.opt.data.constructor === FormData

            if (hasAttach) {
              delete this.opt.headers['content-type']
            }
            // 如果是一个 FormData对象
            // 则直接改为POST
          } else if (param.data.constructor === FormData) {
            hasAttach = true
            this.opt.method = 'POST'
            delete this.opt.headers['content-type']
            this.opt.data = param.data
          } else {
            // 有附件,则改为FormData
            if (hasAttach) {
              this.opt.data = Format.mkFormData(param.data)
            } else {
              this.opt.data = param.data
            }
          }
      }
    }

    // 6»» 处理跨域
    try {
      let ancher = document.createElement('a')
      ancher.href = this.opt.url

      this.opt.crossDomain =
        originAnchor.protocol !== anchor.protocol ||
        originAnchor.host !== anchor.host
    } catch (err) {
      this.opt.crossDomain = true
    }

    // 6.1»»
    // 自动加上一条header信息，用以标识这是ajax请求
    // 如果是跨域,在支持Cors时, 自动加上支持(这一步会需要服务端额外返回一些headers)

    this.opt.headers['X-Requested-With'] = 'XMLHttpRequest'

    if (this.opt.crossDomain) {
      this.xhr.withCredentials = true
    }

    // 7»» 根据method类型, 处理g表单数据

    // 是否允许发送body
    let allowBody = !NOBODY_METHODS.includes(this.opt.method)
    if (allowBody) {
      if (!hasAttach) {
        if (param.formType === 'json') {
          this.opt.data = JSON.stringify(this.opt.data)
        } else {
          this.opt.data = Format.param(this.opt.data)
        }
      }
    } else {
      // 否则拼接到url上
      this.opt.data = Format.param(this.opt.data)

      this.opt.url += (/\?/.test(this.opt.url) ? '&' : '?') + this.opt.data

      if (this.opt.cache === false) {
        this.opt.url +=
          (/\?/.test(this.opt.url) ? '&' : '?') + '_=' + Math.random()
      }
    }

    // 8»» 构造请求
    // response ready
    this.xhr.onreadystatechange = ev => {
      if (this.opt.timeout > 0) {
        this.opt['time' + this.xhr.readyState] = ev.timeStamp
        if (this.xhr.readyState === 4) {
          this.opt.isTimeout =
            this.opt.time4 - this.opt.time1 > this.opt.timeout
        }
      }

      if (this.xhr.readyState !== 4) {
        return
      }

      this.__dispatch__(this.opt.isTimeout)
    }

    // 8.1»» 初始化xhr
    this.xhr.open(this.opt.method, this.opt.url, true)

    // 8.2»» 设置头信息
    for (var i in this.opt.headers) {
      this.xhr.setRequestHeader(i, this.opt.headers[i])
    }

    // 8.3»» 发起网络请求
    this.xhr.send(this.opt.data)

    // 8.4»» 超时处理
    if (this.opt.timeout && this.opt.timeout > 0) {
      this.xhr.timeout = this.opt.timeout
    }

    // 取消网络请求
    this.opt.abort = () => {
      delete this.xhr
      if (!this.opt.form) {
        this.xhr.abort()
      }

      return this
    }

    // this.defer.resolve(this.opt)
    return this.defer.promise
  }

  __set__(type) {
    this.opt.headers['content-type'] = FORM_TYPES[type]
  }

  __dispatch__(isTimeout) {
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

    //成功的回调
    let isSucc = isTimeout
      ? false
      : this.xhr.status >= 200 && this.xhr.status < 400

    let headers =
      (!isTimeout && this.xhr.getAllResponseHeaders().split('\n')) || []

    //处理返回的Header
    headers.forEach(function(it, i) {
      it = it.trim()
      if (it) {
        it = it.split(':')
        result.response.headers[it.shift().toLowerCase()] = it.join(':').trim()
      }
    })

    if (isSucc) {
      result.status = this.xhr.status
      if (result.status === 204) {
        result.statusText = ERRORS[10204]
      } else if (result.status === 304) {
        result.statusText = ERRORS[10304]
      }
    } else {
      result.status = isTimeout ? 504 : this.xhr.status || 500
      result.statusText = isTimeout
        ? ERRORS[10504]
        : this.xhr.statusText || ERRORS[10500]
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
        : this.xhr.responseText || this.xhr.responseXML

      result.body = convert[dataType](
        result.text,
        !isTimeout && this.xhr.responseXML
      )
    } catch (err) {
      result.error = err
      result.statusText = ERRORS[10012]
    }

    if (result.status >= 200 && result.status < 400) {
      this.defer.resolve(result)
    } else {
      this.defer.reject(result)
    }

    delete this.opt
    delete this.xhr
  }
}

if (!window.request) {
  window.request = {
    get(url, param) {
      return new _Request(url, 'GET', param)
    },
    post(url, param) {
      return new _Request(url, 'POST', param)
    },
    upload(url, param) {
      param.formType = 'form-data'
      return this.post(url, param)
    },
    open(url, method = 'GET', param) {
      return new _Request(url, method, param)
    },
    version: '2.0.0-normal'
  }
  Anot.ui.request = request.version
}

export default request
