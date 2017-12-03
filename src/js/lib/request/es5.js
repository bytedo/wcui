/**
 * Request组件, modern版, 支持IE9+,chrome,FF
 * @authors yutent (yutent@doui.cc)
 * @date    2016-11-27 13:08:40
 *
 */

'use strict'
define(['yua', './lib/promise'], function(yua) {
  // console.log(11243)
  var _request = function(url, protocol) {
      this.transport = true
      protocol = (protocol + '').trim().toUpperCase()
      this.xhr = Xhr()
      this.defer = Promise.defer()
      this.opt = {
        url: (url + '').trim(),
        type: protocol || 'GET',
        form: '',
        data: {},
        headers: {},
        timeoutID: 0,
        uuid: Math.random()
          .toString(16)
          .substr(2)
      }
    },
    _requestp = _request.prototype,
    toS = Object.prototype.toString,
    win = window,
    doc = win.document,
    encode = encodeURIComponent,
    decode = decodeURIComponent,
    noop = function(e, res) {
      this.defer.resolve(res)
    }

  // -----------------------------

  // 本地协议判断正则
  var rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/
  var isLocal = false
  try {
    isLocal = rlocalProtocol.test(location.ptyperotocol)
  } catch (e) {}

  var rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/gm

  // ----------------- 一些兼容性预处理 --------------------

  win.Xhr = function() {
    return new XMLHttpRequest()
  }
  var supportCors = 'withCredentials' in Xhr()

  // ------------------- 几个解释方法 -----------------------

  function serialize(p, obj, q) {
    var k
    if (Array.isArray(obj)) {
      obj.forEach(function(it, i) {
        k = p ? p + '[' + (Array.isArray(it) ? i : '') + ']' : i
        if (typeof it === 'object') {
          serialize(k, it, q)
        } else {
          q(k, it)
        }
      })
    } else {
      for (var i in obj) {
        k = p ? p + '[' + i + ']' : i
        if (typeof obj[i] === 'object') {
          serialize(k, obj[i], q)
        } else {
          q(k, obj[i])
        }
      }
    }
  }

  var Format = function() {}

  Format.prototype = {
    parseJS: function(code) {
      code = (code + '').trim()
      if (code) {
        if (code.indexOf('use strict') === 1) {
          var script = doc.createElement('script')
          script.text = code
          doc.head.appendChild(script).parentNode.removeChild(script)
        } else {
          eval(code)
        }
      }
    },
    parseXML: function(data, xml, tmp) {
      try {
        tmp = new DOMParser()
        xml = tmp.parseFromString(data, 'text/xml')
      } catch (e) {
        xml = void 0
      }

      if (
        !xml ||
        !xml.documentElement ||
        xml.getElementsByTagName('parsererror').length
      ) {
        console.error('Invalid XML: ' + data)
      }
      return xml
    },
    parseHTML: function(html) {
      return yua.parseHTML(html)
    },
    param: function(obj) {
      if (!obj || typeof obj === 'string' || typeof obj === 'number') return obj

      var arr = []
      var q = function(k, v) {
        if (/native code/.test(v)) return

        v = typeof v === 'function' ? v() : v
        v = toS.call(v) !== '[object File]' ? encode(v) : v

        arr.push(encode(k) + '=' + v)
      }

      if (typeof obj === 'object') serialize('', obj, q)

      return arr.join('&')
    },
    parseForm: function(form) {
      var data = {}
      for (var i = 0, field; (field = form.elements[i++]); ) {
        switch (field.type) {
          case 'select-one':
          case 'select-multiple':
            if (field.name.length && !field.disabled) {
              for (var j = 0, opt; (opt = field.options[j++]); ) {
                if (opt.selected) {
                  data[field.name] = opt.value || opt.text
                }
              }
            }
            break
          case 'file':
            if (field.name.length && !field.disabled) {
              data[field.name] = field.files[0]
            }
            break
          case undefined:
          case 'submit':
          case 'reset':
          case 'button':
            break //按钮啥的, 直接忽略
          case 'radio':
          case 'checkbox':
            // 只处理选中的
            if (!field.checked) break
          default:
            if (field.name.length && !field.disabled) {
              data[field.name] = field.value
            }
        }
      }
      return data
    },
    merge: function(a, b) {
      if (typeof a !== 'object' || typeof b !== 'object')
        throw new TypeError('argument must be an object')

      if (Object.assign) return Object.assign(a, b)

      for (var i in b) {
        a[i] = b[i]
      }
      return a
    }
  }

  var F = new Format()

  // ---------------------------------------------------------
  // -------------------- request 模块开始 --------------------
  // ---------------------------------------------------------

  var requestConvert = {
    text: function(val) {
      return val
    },
    xml: function(val, xml) {
      return xml !== undefined ? xml : F.parseXML(val)
    },
    html: function(val) {
      return F.parseHTML(val)
    },
    json: function(val) {
      return JSON.parse(val)
    },
    script: function(val) {
      return F.parseJS(val)
    },
    jsonp: function(name) {
      var json = request.cache[name]
      delete request.cache[name]
      return json
    }
  }
  var requestExtend = {
    formData: function() {
      if (this.opt.form) {
        var data = F.parseForm(this.opt.form)
        F.merge(this.opt.data, data)
      }

      var form = new FormData()
      for (var i in this.opt.data) {
        var el = this.opt.data[i]
        if (Array.isArray(el)) {
          el.forEach(function(it) {
            form.append(i + '[]', it)
          })
        } else {
          form.append(i, this.opt.data[i])
        }
      }
      return form
    },
    jsonp: function(jsonpcallback) {
      win[jsonpcallback] = function(val) {
        delete win[jsonpcallback]
        request.cache[jsonpcallback] = val
      }
    },
    dispatch: function(self) {
      if (!this.transport) return this.defer.reject('Request pending...')

      var _this = this,
        result = {
          response: {
            url: this.opt.url,
            headers: { 'content-type': '' }
          },
          request: {
            url: this.opt.url,
            headers: _this.opt.headers
          },
          status: self === null ? 504 : 200,
          statusText: self === null ? 'Connected timeout' : 'ok',
          text: '',
          body: '',
          error: null
        }

      //状态为4,既已成功, 则清除超时
      clearTimeout(_this.opt.timeoutID)

      if (typeof this.transport === 'object' && this.opt.type === 'JSONP') {
        //移除script
        // this.transport.parentNode.removeChild(this.transport);

        //超时返回
        if (self !== null) {
          var exec =
            !this.transport.readyState ||
            this.transport.readyState === 'loaded' ||
            this.transport.readyState === 'complete'

          if (exec) {
            result.body = requestConvert.jsonp(this.opt.data.callback)
            result.text = JSON.stringify(result.body)
          }
        }

        this.callback(result.error, result)
      } else {
        //成功的回调
        var isSucc = self
            ? (self.status >= 200 && self.status < 300) || self.status === 304
            : false,
          headers = (self && self.getAllResponseHeaders().split('\n')) || []

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
          result.status = self.status
          if (result.status === 204) {
            result.statusText = 'no content'
          } else if (result.status === 304) {
            result.statusText = 'not modified'
          }
        } else {
          result.status = self === null ? 504 : self.status || 500
          result.statusText =
            self === null
              ? 'Connected timeout'
              : self.statusText || 'Internal Server Error'
          result.error = F.merge(new Error(result.statusText), {
            status: result.status
          })
        }

        try {
          //处理返回的数据
          var dataType = result.response.headers['content-type'].match(
            /json|xml|script|html/i
          ) || ['text']

          dataType = dataType[0].toLowerCase()
          result.text = (self && (self.responseText || self.responseXML)) || ''
          result.body = requestConvert[dataType](
            result.text,
            self && self.responseXML
          )
        } catch (err) {
          result.error = err
          result.statusText = 'parse error'
        }

        _this.callback(result.error, result)
      }
      delete _this.defer
      delete _this.transport
      delete _this.opt
      delete _this.xhr
    }
  }

  // 设置表单类型, 支持2种, form/json
  _requestp.type = function(t) {
    if (this.opt.formType === 'form-data') return this

    this.opt.formType = t || 'form'
    if (t === 'form' || this.opt.type === 'GET')
      this.set(
        'content-type',
        'application/x-www-form-urlencoded; charset=UTF-8'
      )
    else this.set('content-type', 'application/json; charset=UTF-8')

    return this
  }

  //设置头信息
  _requestp.set = function(k, val) {
    if (!this.transport) return

    if (typeof k === 'object') {
      for (var i in k) {
        i = i.toLowerCase()
        this.opt.headers[i] = k[i]
      }
    } else if (typeof k === 'string') {
      if (arguments.length < 2) throw new Error('2 arguments required')

      // 全转小写,避免重复写入
      k = k.toLowerCase()

      if (val === undefined) delete this.opt.headers[k]
      else this.opt.headers[k] = val
    } else {
      throw new Error(
        'arguments must be string/object, but [' + typeof k + '] given'
      )
    }
    return this
  }

  //设置请求参数
  _requestp.send = function(k, val) {
    if (!this.transport) return

    // 1. send方法可以多次调用, 但必须保证格式一致
    // 2. 2次圴提交纯字符串也会抛出异常
    if (typeof k === 'object') {
      if (this.opt.data && typeof this.opt.data === 'string')
        throw new Error('param can not be string and object at the same time')
      if (!this.opt.data) this.opt.data = {}

      F.merge(this.opt.data, k)
    } else {
      if (typeof k === 'string') {
        if (arguments.length === 1) {
          if (this.opt.data) throw new Error('invalid param in function send')

          this.opt.data = k
        } else {
          if (this.opt.data && typeof this.opt.data === 'string')
            throw new Error(
              'param can not be string and object at the same time'
            )

          if (!this.opt.data) this.opt.data = {}

          this.opt.data[k] = val
        }
      } else {
        throw new Error(
          'argument of send must be string/object, but [' + typeof k + '] given'
        )
      }
    }

    return this
  }

  //该方法用于 form-data类型的post请求的参数设置
  _requestp.field = function(k, val) {
    if (!this.transport) return this

    // 此类型优先级最高
    this.opt.formType = 'form-data'
    this.opt.type = 'POST'
    if (!this.opt.data || (this.opt.data && typeof this.opt.data !== 'object'))
      this.opt.data = {}

    if (arguments.length === 1 && typeof k === 'object') {
      F.merge(this.opt.data, k)
    } else if (arguments.length === 2) {
      this.opt.data[k] = val
    } else {
      throw new TypeError(
        'argument must be an object, but ' + typeof k + ' given'
      )
    }
    return this
  }

  //设置缓存
  _requestp.cache = function(t) {
    if (!this.transport) return

    if (this.opt.type === 'GET') this.opt.cache = !!t

    return this
  }

  //取消网络请求
  _requestp.abort = function() {
    delete this.transport
    if (!this.opt.form) this.xhr.abort()

    return this
  }

  //超时设置, 单位毫秒
  _requestp.timeout = function(time) {
    if (typeof time !== 'number' || time < 1) return this

    this.opt.timeout = time
    return this
  }

  _requestp.form = function(form) {
    if (typeof form === 'object' && form.nodeName === 'FORM') {
      this.opt.type = 'POST'
      this.opt.form = form
    }

    return this
  }

  var originAnchor = doc.createElement('a')
  originAnchor.href = location.href
  _requestp.end = function(callback) {
    var _this = this
    // 回调已执行, 或已取消, 则直接返回, 防止重复执行
    if (!this.transport) return this

    if (!this.opt.url) throw new Error('Invalid  request url')

    F.merge(this, requestExtend)

    this.callback = callback || noop.bind(this)

    // 1. url规范化
    this.opt.url = this.opt.url
      .replace(/#.*$/, '')
      .replace(/^\/\//, location.protocol + '//')

    // 2. 处理跨域
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

    // 2.1 进一步处理跨域配置
    if (this.opt.type === 'JSONP') {
      //如果没有跨域，自动转回xhr GET
      if (!this.opt.crossDomain) {
        this.opt.type = 'GET'
      } else {
        this.opt.data['callback'] =
          this.opt.data['callback'] || 'jsonp' + request.cid++
        this.jsonp(this.opt.data['callback']) //创建临时处理方法
      }
    }
    // 2.2 如果不是跨域请求，则自动加上一条header信息，用以标识这是ajax请求
    if (!this.opt.crossDomain) {
      this.set('X-Requested-With', 'XMLHttpRequest')
    } else {
      supportCors && (this.xhr.withCredentials = true)
    }

    // 3. data转字符串
    this.opt.param = F.param(this.opt.data)

    // 4. 设置Content-Type类型, 默认x-www-form-urlencoded
    if (!this.opt.formType) this.type('form')

    // 5.处理GET请求
    this.opt.hasContent = this.opt.type === 'POST' //是否为post请求
    if (!this.opt.hasContent) {
      //GET请求直接把参数拼接到url上
      if (this.opt.param) {
        this.opt.url += (/\?/.test(this.opt.url) ? '&' : '?') + this.opt.param
      }
      //加随机值,避免缓存
      if (this.opt.cache === false)
        this.opt.url +=
          (/\?/.test(this.opt.url) ? '&' : '?') + '_=' + Math.random()
    } else {
      if (this.opt.formType === 'form-data') {
        delete this.opt.headers['content-type']
        this.opt.param = this.formData()
      } else if (this.opt.formType !== 'form') {
        this.opt.param = JSON.stringify(this.opt.data)
      }
    }

    //jsonp
    if (this.opt.type === 'JSONP') {
      this.transport = doc.createElement('script')
      this.transport.onerror = this.transport.onload = function() {
        _this.dispatch(_this.transport)
      }
      this.transport.src = this.opt.url
      doc.head.insertBefore(this.transport, doc.head.firstChild)

      //6. 超时处理
      if (this.opt.timeout && this.opt.timeout > 0) {
        this.opt.timeoutID = setTimeout(function() {
          _this.transport.onerror = _this.transport.onload = null
          _this.dispatch(null)
        }, this.opt.timeout)
      }
    } else {
      this.xhr.onreadystatechange = function(ev) {
        if (_this.opt.timeout && _this.opt.timeout > 0) {
          _this.opt['time' + this.readyState] = ev.timeStamp
          if (this.readyState === 4) {
            _this.opt.isTimeout =
              _this.opt.time4 - _this.opt.time1 > _this.opt.timeout
          }
        }

        if (this.readyState !== 4) {
          return
        }

        _this.dispatch(_this.opt.isTimeout ? null : _this.xhr)
      }

      // 6. 初始化xhr提交
      this.xhr.open(this.opt.type, this.opt.url, true)

      // 7. 设置头信息
      for (var i in this.opt.headers) {
        if (this.opt.headers[i])
          this.xhr.setRequestHeader(i, this.opt.headers[i])
      }

      // 8. 发起网络请求
      _this.xhr.send(_this.opt.param)

      //超时处理
      if (this.opt.timeout && this.opt.timeout > 0) {
        this.xhr.timeout = this.opt.timeout
      }
    }
    return this.defer.promise
  }

  // ---------------------- end ------------------------

  if (!win.request) {
    win.request = {
      get: function(url) {
        if (!url) throw new Error('argument url is required')

        return new _request(url, 'GET')
      },
      post: function(url) {
        if (!url) throw new Error('argument url is required')

        return new _request(url, 'POST')
      },
      jsonp: function(url) {
        if (!url) throw new Error('argument url is required')

        return new _request(url, 'JSONP')
      },
      cache: {},
      cid: 0,
      version: '1.1.0-es5'
    }
    yua.ui.request = request.version
  }

  return request
})
