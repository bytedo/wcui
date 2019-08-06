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
  allowReload: true //连续点击同一个链接是否重新加载
}
const LINKS = []
const RULE_REGEXP = /(:id)|(\{id\})|(\{id:([A-z\d\,\[\]\{\}\-\+\*\?\!:\^\$]*)\})/g

class Router {
  constructor(options) {
    Anot.hideProperty(this, 'table', [])
    Anot.hideProperty(this, 'last', '')
    Anot.hideProperty(this, 'path', '')
    Anot.hideProperty(this, 'pathArr', [])
    Anot.hideProperty(this, 'ready', false)
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

    Anot.router = new this(options)
    return Anot.router
  }

  // 事件监听
  __listen__() {
    let { mode, prefix } = this.options

    Anot.bind(window, 'load, popstate', ev => {
      if (ev.type === 'load') {
        if (this.ready) {
          return
        }
        this.ready = true
      }

      let path = mode === 'hash' ? location.hash : location.pathname

      path = path.replace(prefix, '').trim()
      if (ev.type === 'load') {
        this.go(path)
        // hash模式要手动触发一下路由检测
        if (mode === 'hash') {
          this.__check__(path)
        }
      } else {
        // 因为pushState不会触发popstate事件,
        // 所以这里只在hash模式或有ev.state的情况下才会主动触发路由检测
        path = path.replace(/^[/]+?/, '')
        if (mode === 'hash' || ev.state) {
          this.__check__(path)
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

          if (
            !href ||
            /^(http[s]?:|ftp:)?\/\//.test(href) ||
            /^javascript:/.test(href)
          ) {
            return
          }

          // hash地址,只管修正前缀即可, 会触发popstate事件,所以这里只处理非hash的情况
          if (!prefix.test(href)) {
            // 非hash地址,则需要阻止默认事件
            // 并主动触发跳转, 同时强制清除hash
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
  __check__(path) {
    let { allowReload } = this.options
    if (!allowReload && path === this.last) {
      return
    }

    this.last = this.path
    this.path = path
    this.pathArr = path.split('/')
    LINKS.forEach(vm => {
      if (vm.rule.test(this.path)) {
        vm.active = true
      } else {
        vm.active = false
      }
    })
    for (let i = 0, route; (route = this.table[i++]); ) {
      let args = path.match(route.regexp)
      if (args) {
        args.shift()
        return route.callback.apply(route, args)
      }
    }
    this.noMatch && this.noMatch(this.path)
  }

  // 跳转到路由
  go(path, forceCleanHash = false) {
    path = path.replace(/^[/]+/, '')
    let { mode, prefix } = this.options

    if (mode === 'hash') {
      path = path.trim().replace(prefix, '')
      // 页面刷新时, 不主动添加空hash, 避免执行2次noMatch回调
      if (!path && path === location.hash) {
        return
      }
      location.hash = '!/' + path
    } else {
      let hash = forceCleanHash ? '' : location.hash
      let search = forceCleanHash ? '' : location.search
      path = path.replace(/^[/]+?/, '')
      if (forceCleanHash) {
        window.history.pushState({ path }, null, `/${path + search + hash}`)
      } else {
        window.history.replaceState({ path }, null, `/${path + search + hash}`)
      }
      // pushState不会触发popstate事件,所以要手动触发路由检测
      this.__check__(path)
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
    // 因为先初始化,才开始监听路由规则
    // 所以会导致wondow load的时候, 规则还没生效, 而生效之后,load已经结束
    // 所以这里需要手动再触发一次load
    Anot.fireDom(window, 'load')
  }
}

Anot.component('link', {
  __init__(props, state, next) {
    if (!Anot.router) {
      return Anot.error('使用<anot-link />前,请先初始化路由')
    }
    let { mode } = Anot.router.options
    if (!props.to) {
      return
    }
    this.setAttribute(':class', '{active: active}')
    state.rule = Anot.router.__parseRule__(
      props.to.replace(/^[\/]+|[\/]+$|\s+/g, ''),
      {}
    ).regexp
    props.label = props.label || this.text()
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
  skip: ['rule'],
  componentDidMount() {
    this.active = this.rule.test(Anot.router.path)
    LINKS.push(this)
  },
  state: {
    link: '',
    active: false
  },
  props: {
    label: ''
  }
})

export default Router
