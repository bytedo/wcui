/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-14 21:04:50
 *
 */

'use strict'
//储存版本信息
Anot.ui.router = '0.0.1'

function Router() {
  this.table = { get: [] }
  this.errorFn = null
  this.history = null
  this.hash = ''
  this.started = false
  this.init = {}
}

var defaultOptions = {
  prefix: /^(#!|#)[\/]?/, //hash前缀正则
  historyOpen: true, //是否开启hash历史
  allowReload: true //连续点击同一个链接是否重新加载
}
var isMouseUp = true

var ruleRegExp = /(:id)|(\{id\})|(\{id:([A-z\d\,\[\]\{\}\-\+\*\?\!:\^\$]*)\})/g

Router.prototype = {
  error: function(callback) {
    this.errorFn = callback
  },
  config: function(opts) {
    if (this.started) return console.error('Router config has been set')

    this.started = true
    if (!opts.allowReload) opts.historyOpen = true
    this.init = Anot.mix({}, defaultOptions, opts)
  },
  _getRegExp: function(rule, opts) {
    var re = rule.replace(ruleRegExp, function(m, p1, p2, p3, p4) {
      var w = '([\\w.-]'
      if (p1 || p2) {
        return w + '+)'
      } else {
        if (!/^\{[\d\,]+\}$/.test(p4)) {
          w = '('
        }
        return w + p4 + ')'
      }
    })
    re = re
      .replace(/(([^\\])([\/]+))/g, '$2\\/')
      .replace(/(([^\\])([\.]+))/g, '$2\\.')
      .replace(/(([^\\])([\-]+))/g, '$2\\-')
      .replace(/(\(.*)(\\[\-]+)(.*\))/g, '$1-$3')
    re = '^' + re + '$'
    opts.regexp = new RegExp(re)
    return opts
  },
  _add: function(method, rule, callback) {
    if (!this.started) this.config({})

    var table = this.table[method.toLowerCase()]
    if (rule.charAt(0) !== '/') {
      console.error('char "/" must be in front of router rule')
      return
    }
    rule = rule.replace(/^[\/]+|[\/]+$|\s+/g, '')
    var opts = {}
    opts.rule = rule
    opts.callback = callback
    Anot.Array.ensure(table, this._getRegExp(rule, opts))
  },
  _route: function(method, hash) {
    var hash = hash.trim()
    var table = this.table[method]
    var init = this.init

    if (!init.allowReload && hash === this.history) return

    if (init.historyOpen) {
      this.history = hash
      if (Anot.ls) {
        Anot.ls('lastHash', hash)
      }
    }

    for (var i = 0, obj; (obj = table[i++]); ) {
      var args = hash.match(obj.regexp)
      if (args) {
        args.shift()
        return obj.callback.apply(obj, args)
      }
    }
    this.errorFn && this.errorFn(hash)
  },
  on: function(rule, callback) {
    var _this = this
    if (Array.isArray(rule)) {
      rule.forEach(function(it) {
        _this._add('get', it, callback)
      })
    } else {
      this._add('get', rule, callback)
    }
  }
}

Anot.bind(window, 'load', function() {
  if (!Anot.router.started) return
  var prefix = Anot.router.init.prefix
  var hash = location.hash
  hash = hash.replace(prefix, '').trim()
  Anot.router._route('get', hash)
})

if ('onhashchange' in window) {
  window.addEventListener('hashchange', function(event) {
    if (!isMouseUp) return
    var prefix = Anot.router.init.prefix
    var hash = location.hash.replace(prefix, '').trim()
    Anot.router._route('get', hash)
  })
}

//劫持页面上所有点击事件，如果事件源来自链接或其内部，
//并且它不会跳出本页，并且以"#/"或"#!/"开头，那么触发updateLocation方法
Anot.bind(document, 'mousedown', function(event) {
  var defaultPrevented =
    'defaultPrevented' in event
      ? event['defaultPrevented']
      : event.returnValue === false
  if (defaultPrevented || event.ctrlKey || event.metaKey || event.which === 2)
    return
  var target = event.target
  while (target.nodeName !== 'A') {
    target = target.parentNode
    if (!target || target.tagName === 'BODY') {
      return
    }
  }

  if (targetIsThisWindow(target.target)) {
    if (!Anot.router.started) return
    var href = target.getAttribute('href') || target.getAttribute('xlink:href'),
      prefix = Anot.router.init.prefix

    if (href === null || !prefix.test(href)) return

    Anot.router.hash = href.replace(prefix, '').trim()
    event.preventDefault()
    location.hash = href
    isMouseUp = false
  }
})

Anot.bind(document, 'mouseup', function() {
  if (!isMouseUp) {
    Anot.router._route('get', Anot.router.hash)
    isMouseUp = true
  }
})

//判定A标签的target属性是否指向自身
//thanks https://github.com/quirkey/sammy/blob/master/lib/sammy.js#L219
function targetIsThisWindow(targetWindow) {
  if (
    !targetWindow ||
    targetWindow === window.name ||
    targetWindow === '_self' ||
    (targetWindow === 'top' && window == window.top)
  ) {
    return true
  }
  return false
}

export default (Anot.router = new Router())
