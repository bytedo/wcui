/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-14 21:04:50
 *
 */

'use strict'
//储存版本信息
Anot.ui.router = '1.0.0'

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

const DEFAULT_OPTIONS = {
  mode: 'hash', // hash | history
  prefix: /^(#!|#)[\/]?/, //hash前缀正则
  historyOpen: true, //是否开启hash历史
  allowReload: true //连续点击同一个链接是否重新加载
}
const RULE_REGEXP = /(:id)|(\{id\})|(\{id:([A-z\d\,\[\]\{\}\-\+\*\?\!:\^\$]*)\})/g

class Router {
  constructor(options) {
    Anot.hideProperty(this, 'table', [])
    Anot.hideProperty(this, 'history', null)
    Anot.hideProperty(this, 'path', '')
    Anot.hideProperty(this, 'noMatch', null)
    Anot.hideProperty(
      this,
      'options',
      Object.assign({}, DEFAULT_OPTIONS, options)
    )
    this.__listen__()
  }

  // 创建无new式Router实例
  static init(options = {}) {
    if (Anot.router) {
      throw new Error('不允许重复创建Router实例...')
    }
    if (!options.allowReload) {
      options.historyOpen = true
    }

    Anot.router = new this(options)
    return Anot.router
  }

  // 事件监听
  __listen__() {
    let { mode, prefix } = this.options

    Anot.bind(window, 'load, popstate', ev => {
      let path = mode === 'hash' ? location.hash : location.pathname

      path = path.replace(prefix, '').trim()

      if (ev.type === 'load') {
        this.go(path)
        // hash模式要手动触发一下路由检测
        if (mode === 'hash') {
          this.__check__()
        }
      } else {
        // 因为pushState不会触发popstate事件,
        // 所以这里只在hash模式或有ev.state的情况下才会主动触发路由检测
        this.path = path.replace(/^[/]+?/, '')
        if (mode === 'hash' || ev.state) {
          this.__check__()
        }
      }
    })

    //劫持页面上所有点击事件，如果事件源来自链接或其内部，
    //并且它不会跳出本页，并且以"#/"或"#!/"开头，那么触发go方法
    Anot.bind(document, 'click', ev => {
      let prevented =
        'defaultPrevented' in ev
          ? ev.defaultPrevented
          : ev.returnValue === false

      if (prevented || ev.ctrlKey || ev.metaKey || ev.which === 2) {
        return
      }

      let target = ev.target
      while (target.nodeName !== 'A') {
        target = target.parentNode
        if (!target || target.tagName === 'BODY') {
          return
        }
      }
      if (mode === 'history') {
        if (targetIsThisWindow(target.target)) {
          let href =
            target.getAttribute('href') || target.getAttribute('xlink:href')

          if (!href) {
            return
          }

          // hash地址,只管修正前缀即可, 会触发popstate事件
          if (prefix.test(href)) {
            this.path = href.replace(prefix, '').trim()
          } else {
            // 非hash地址,则阻止默认事件, 产并主动触发跳转
            // 并强制清除hash
            ev.preventDefault()
            this.go(href, true)
          }
        }
      }
    })
  }

  __parseRule__(rule, opts) {
    let re = rule.replace(RULE_REGEXP, function(m, p1, p2, p3, p4) {
      let w = '([\\w.-]'
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
  }

  __add__(rule, callback) {
    // 特殊值"!", 则自动作非匹配回调处理
    if (rule === '!') {
      this.noMatch = callback
      return
    }
    if (rule.charAt(0) !== '/') {
      console.error('路由规则必须以"/"开头')
      return
    }
    rule = rule.replace(/^[\/]+|[\/]+$|\s+/g, '')
    let opts = { rule, callback }

    Anot.Array.ensure(this.table, this.__parseRule__(rule, opts))
  }

  // 路由检测
  __check__() {
    let { allowReload, historyOpen } = this.options
    if (!allowReload && this.path === this.history) {
      return
    }

    if (historyOpen) {
      this.history = this.path
    }

    for (let i = 0, route; (route = this.table[i++]); ) {
      let args = this.path.match(route.regexp)
      if (args) {
        args.shift()
        return route.callback.apply(route, args)
      }
    }
    this.noMatch && this.noMatch(this.path)
  }

  // 跳转到路由
  go(path, forceCleanHash = false) {
    let { mode, prefix } = this.options

    if (mode === 'hash') {
      path = path.trim().replace(prefix, '')
      // 页面刷新时, 不主动添加空hash, 避免执行2次noMatch回调
      if (!path && path === location.hash) {
        return
      }
      location.hash = '!/' + path
      this.path = path
    } else {
      let hash = forceCleanHash ? '' : location.hash
      path = path.replace(/^[/]+?/, '')
      window.history.pushState({ path }, null, `/${path + hash}`)
      this.path = path
      // pushState不会触发popstate事件,所以要手动触发路由检测
      this.__check__()
    }
  }

  // 绑定路由事件
  on(rule, callback) {
    if (Array.isArray(rule)) {
      rule.forEach(it => {
        this.__add__(it, callback)
      })
    } else {
      this.__add__(rule, callback)
    }
  }
}

Anot.component('link', {
  __init__(props, state, next) {
    let { mode } = Anot.router.options
    if (!props.to) {
      return
    }

    if (mode === 'hash') {
      state.link = '#!' + props.to
    } else {
      state.link = props.to
    }
    delete props.to
    next()
  },
  render() {
    return '<a :attr-href="link" :text="props.label"></a>'
  },
  state: {
    link: ''
  },
  props: {
    label: ''
  }
})

export default Router
