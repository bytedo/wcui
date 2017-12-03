/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-11-26 16:35:45
 *
 */

'use strict'
;(function(global, factory) {
  if (typeof module === 'object' && typeof module.exports === 'object') {
    module.exports = factory(global)
  } else {
    factory(global)
  }
})(window, function(win) {
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

  var toS = Object.prototype.toString
  var doc = win.document
  var encode = encodeURIComponent
  var decode = decodeURIComponent

  var TagHooks = function() {
    this.option = doc.createElement('select')
    this.thead = doc.createElement('table')
    this.td = doc.createElement('tr')
    this.area = doc.createElement('map')
    this.tr = doc.createElement('tbody')
    this.col = doc.createElement('colgroup')
    this.legend = doc.createElement('fieldset')
    this._default = doc.createElement('div')
    this.g = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')

    this.optgroup = this.option
    this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
    this.th = this.td
  }

  var Format = function() {
    var _this = this

    this.tagHooks = new TagHooks()

    'circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use'.replace(
      /,/g,
      function(m) {
        _this.tagHooks[m] = _this.tagHooks.g //处理svg
      }
    )

    this.rtagName = /<([\w:]+)/
    this.rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi
    this.scriptTypes = {
      'text/javascript': 1,
      'text/ecmascript': 1,
      'application/ecmascript': 1,
      'application/javascript': 1
    }
    this.rhtml = /<|&#?\w+;/
  }

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
      var fragment = doc.createDocumentFragment().cloneNode(false)

      if (typeof html !== 'string') return fragment

      if (!this.rhtml.test(html)) {
        fragment.appendChild(document.createTextNode(html))
        return fragment
      }

      html = html.replace(this.rxhtml, '<$1></$2>').trim()
      var tag = (this.rtagName.exec(html) || ['', ''])[1].toLowerCase()
      var wrap = this.tagHooks[tag] || this.tagHooks._default
      var firstChild = null

      //使用innerHTML生成的script节点不会触发请求与执行text属性
      wrap.innerHTML = html
      var script = wrap.getElementsByTagName('script')
      if (script.length) {
        for (var i = 0, el; (el = script[i++]); ) {
          if (this.scriptTypes[el.type]) {
            var tmp = doc.createElement('script').cloneNode(false)
            el.attributes.forEach(function(attr) {
              tmp.setAttribute(attr.name, attr.value)
            })
            tmp.text = el.text
            el.parentNode.replaceChild(tmp, el)
          }
        }
      }

      while ((firstChild = wrap.firstChild)) {
        fragment.appendChild(firstChild)
      }

      return fragment
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

  return new Format()
})
