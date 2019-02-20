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

const NOBODY_METHODS = ['GET', 'HEAD', 'JSONP']
const ERROR = {
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
  },
  jsonp(name) {
    var json = request.cache[name]
    delete request.cache[name]
    return json
  }
}

class _Request {
  constructor(url = '', method = 'GET', param = {}) {
    if (!url) {
      throw new Error(error[10001])
    }

    // url规范化
    url = url.replace(/#.*$/, '').replace(/^\/\//, location.protocol + '//')

    method = method.toUpperCase()

    this.transport = Object.create(null)
    this.xhr = new XMLHttpRequest()
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
            hasAttach = true
            this.opt.method = 'POST'
            delete this.opt.headers['content-type']
            this.opt.data = this.__parseForm__(param.data)
          } else if (param.data.constructor === FormData) {
            hasAttach = true
            // 如果是一个 FormData对象
            // 则直接改为POST
            this.opt.method = 'POST'
            delete this.opt.headers['content-type']
            this.opt.data = param.data
          } else {
            // 有附件,则改为FormData
            if (hasAttach) {
              let form = new FormData()
              for (let i in param.data) {
                let el = param.data[i]
                if (Array.isArray(el)) {
                  el.forEach(function(it) {
                    form.append(i + '[]', it)
                  })
                } else {
                  form.append(i, param.data[i])
                }
              }
              this.opt.data = form
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

    // 6.1»» 进一步处理跨域
    if (this.opt.method === 'JSONP') {
      // 如果非跨域,则转回 xhr GET
      if (this.opt.crossDomain) {
        this.opt.data.callback =
          this.opt.data.callback || `jsonp${request.cid++}`
      } else {
        this.opt.method = 'GET'
      }
    }

    // 6.2»»
    // 如果不是JSONP，则自动加上一条header信息，用以标识这是ajax请求
    // 如果是跨域,在支持Cors时, 自动加上支持(这一步会需要服务端额外返回一些headers)
    if (this.opt.method !== 'JSONP') {
      this.opt.headers['X-Requested-With'] = 'XMLHttpRequest'
    }
    if (this.opt.crossDomain) {
      supportCors && (this.xhr.withCredentials = true)
    }

    // 7»» 根据method类型, 处理g表单数据

    // 是否允许发送body
    let allowBody = !NOBODY_METHODS.includes(this.opt.method)
    if (allowBody) {
      if (!hasAttach && typeof this.opt.data === 'object') {
        this.opt.data = JSON.stringify(this.opt.data)
      }
    }

    // 取消网络请求
    this.opt.abort = () => {
      delete this.transport
      if (!this.opt.form) {
        this.xhr.abort()
      }

      return this
    }

    this.defer.resolve(this.opt)
    return this.defer.promise
  }

  __set__(type) {
    this.opt.headers['content-type'] = FORM_TYPES[type]
  }

  _jsonp(cb) {
    window[cb] = function(val) {
      delete window[cb]
      request.cache[cb] = val
    }
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
    jsonp(url, param) {
      return new _Request(url, 'JSONP', param)
    },
    open(url, method = 'GET', param) {
      return new _Request(url, method, param)
    },
    cache: {},
    cid: 0,
    version: '2.0.0-normal'
  }
  Anot.ui.request = request.version
}

export default request
