/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-21 01:36:29
 *
 */

'use strict'

import '../drag/index'
import 'css/layer-normal.scss'

Anot.ui.layer = '1.0.0-normal'

const LANGUAGES = {
  en: {
    TITLE: 'Dialog',
    YES_BTN: 'OK',
    NO_BTN: 'Cancel',
    ERROR: 'The layer instance is not exists',
    NEED_CONTAINER: 'layer "tips" require a DOM object as container'
  },
  zh: {
    TITLE: '提示',
    YES_BTN: '确定',
    NO_BTN: '取消',
    ERROR: '要关闭的layer实例不存在',
    NEED_CONTAINER: 'tips类型需要指定一个元素节点作为容器'
  },
  'zh-TW': {
    TITLE: '提示',
    YES_BTN: '確定',
    NO_BTN: '取消',
    ERROR: '要關閉的layer實例不存在',
    NEED_CONTAINER: 'tips类型需要指定一個元素節點作爲容器'
  }
}
LANGUAGES['zh-CN'] = LANGUAGES.zh
const lang =
  LANGUAGES[window.__ENV_LANG__ || navigator.language] || LANGUAGES.en
let layerDom = {}
let layerObj = {}
let unique = null // 储存当前打开的1/2/3类型的弹窗
let lid = 0
let defconf = {
  type: 1, // 弹窗类型
  background: '#fff',
  mask: true, // 遮罩
  maskClose: false, // 遮罩点击关闭弹窗
  maskColor: null, // 遮罩背景色
  radius: '0px', // 弹窗圆角半径
  area: ['auto', 'auto'],
  title: lang.TITLE, // 弹窗主标题(在工具栏上的)
  menubar: true, // 是否显示菜单栏
  content: '', // 弹窗的内容
  fixed: false, // 是否固定不可拖拽
  shift: 'cc', // 弹窗出来的初始位置,用于出场动画
  offset: [], // 弹窗出来后的坐标, 为数组,可有4个值,依次是 上右下左
  btns: [lang.YES_BTN, lang.NO_BTN] // 弹窗的2个按钮的文字
}
const $doc = Anot(document)
const uuid = function() {
  return 'layer-' + lid++
}
const close = function(id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    return Anot.error(lang.ERROR)
  }
  if (/^layerwrap\-/.test(id) || layerObj['layerwrap-' + id]) {
    try {
      id = (layerObj['layerwrap-' + id] ? 'layerwrap-' : '') + id
      //未显示过,忽略
      if (!layerObj[id].show) {
        return
      }
      layerObj[id].parentElem.replaceChild(layerObj[id].wrap, layerDom[id][0])
      layerObj[id].wrap.style.display = 'none'
      layerObj[id].show = false
    } catch (err) {}
  } else {
    unique = null
    try {
      layerDom[id][0].classList.add('shift')
      layerDom[id][1].classList.add('shift')
      layerDom[id][0].style.opacity = ''
      layerDom[id][1].style.opacity = 0
      setTimeout(function() {
        layerDom[id][0].parentNode.removeChild(layerDom[id][0])
        delete layerDom[id]
        delete Anot.vmodels[id]
      }, 200)
    } catch (err) {}
  }
  document.body.style.overflow = ''
}

const repeat = function(str, num) {
  let idx = 0
  let result = ''
  while (idx < num) {
    result += str
    idx++
  }
  return result
}
const fixOffset = function(val) {
  if (!val && val !== 0) {
    return 'auto'
  } else {
    return val
  }
}

/* type: { // 弹窗类型对应的id值
  1: 'alert',
  2: 'confirm',
  3: 'prompt',
  4: 'iframe',
  5: 'tips',
  6: 'loading',
  7: 'msg',
} */
class __layer__ {
  get dot() {
    //loading的子元素数量
    return {
      1: 1,
      2: 5,
      3: 5,
      4: 9
    }
  }

  constructor(opt) {
    if (opt) {
      let { yes, no, success } = opt
      delete opt.yes
      delete opt.no
      delete opt.success

      this.__init__({
        state: { ...opt },
        props: { yes, no, success }
      })
        .append()
        .show()
    }
    this.timeout = null
  }

  // 真正的初始化弹层配置
  __init__(opt) {
    let _id = opt.$id || uuid()
    this.init = {
      $id: _id,
      state: {
        ...defconf,
        ...opt.state
      },
      props: opt.props,
      skip: [
        'area',
        'shift',
        'offset',
        'mask',
        'maskClose',
        'container',
        'follow'
      ],
      methods: {
        shake() {
          this.$refs.layer.classList.add('scale')
          setTimeout(() => {
            this.$refs.layer.classList.remove('scale')
          }, 100)
        },
        onMaskClick: function() {
          if (this.type < 4 && !this.maskClose) {
            this.shake()
          } else {
            this.maskClose && this.close()
          }
        },
        handleConfirm: function() {
          if (this.type === 3) {
            if (!this.prompt) {
              return this.shake()
            }
          }
          if (typeof this.props.yes === 'function') {
            let cb = [this.$id]
            if (this.type === 3) {
              cb.unshift(this.prompt)
            }
            this.props.yes.apply(this, cb)
          } else {
            this.close()
          }
        },
        handleCancel: function() {
          if (typeof this.props.no === 'function') {
            this.props.no.call(this, this.$id)
          } else {
            this.close()
          }
        },
        close: function() {
          close(this.$id)
        },
        cancelBubble: function(ev) {
          ev.cancelBubble = true
        }
      },
      mounted: function() {
        if (typeof this.props.success === 'function') {
          this.props.success.call(this)
        }
      }
    }

    // iframe类型补一个自适应高度的方法
    if (this.init.state.type === 4) {
      this.init.methods.autoSize = function() {
        let { layer, frame } = this.$refs
        frame.onload = function() {
          setTimeout(function() {
            try {
              let $body = frame.contentWindow.document.body
              let { clientWidth, clientHeight } = $body
              Anot(layer).css({
                width: clientWidth,
                height: clientHeight,
                marginLeft: -clientWidth / 2,
                marginTop: -clientHeight / 2
              })
              Anot(frame).css({ height: clientHeight })
            } catch (err) {}
          }, 500)
        }
      }
    }
    return this
  }

  // 创建弹层容器及骨架
  create() {
    let { state, $id } = this.init
    let outerBox = document.createElement('div')
    let layBox = document.createElement('div')

    outerBox.setAttribute('anot', $id)
    outerBox.setAttribute(':click', 'onMaskClick')

    outerBox.classList.add('do-layer')
    if (state.mask) {
      outerBox.classList.add('mask')
      if (state.container && state.container !== document.body) {
        outerBox.classList.add('inner')
      }
    }
    if (state.maskColor) {
      outerBox.style.background = state.maskColor
    }

    layBox.classList.add('layer-box')
    layBox.classList.add('skin-normal')

    if (state.extraClass) {
      layBox.classList.add(state.extraClass)
      delete state.extraClass
    }
    if (typeof state.shift === 'string') {
      layBox.classList.add('__' + state.shift)
    } else {
      for (let k in state.shift) {
        let val = state.shift[k]
        val += isFinite(val) ? 'px' : ''
        layBox.style.cssText += `${k}: ${val};`
      }
    }

    if (state.toast) {
      layBox.classList.add('type-toast')
    } else {
      layBox.classList.add('type-' + state.type)
    }

    layBox.setAttribute('ref', 'layer')
    layBox.setAttribute(':click', 'cancelBubble')

    // 暂时隐藏,避免修正定位时,能看到闪一下
    layBox.style.cssText += 'border-radius:' + state.radius + 'px'

    // 没有菜单栏, 且未禁止拖拽,则加上可拖拽属性
    if (!state.menubar && !state.fixed) {
      layBox.setAttribute(':drag', '')
      layBox.setAttribute('data-limit', 'window')
    }

    // size of layer-content
    var boxcss = ''
    if (state.area[0] !== 'auto') {
      boxcss += 'width: ' + state.area[0] + ';'
    }
    if (state.area[1] !== 'auto') {
      boxcss += 'height: ' + state.area[1] + ';'
    }
    let arrow = ''
    if (state.type === 5) {
      arrow += `<i class="arrow"></i>`
    }

    layBox.innerHTML = `
      ${this.mkMenubar()}
      <div
        class="layer-content do-fn-cl"
        style="${boxcss}"
        ${!state.wrap && state.type !== 6 ? ':html="content"' : ''}>

        ${state.type === 6 ? this.mkLoading(state.load) : ''}
      </div>
      ${this.mkCtrl()}
      ${arrow}
    `
    delete state.wrap
    outerBox.appendChild(layBox)
    return [outerBox, layBox]
  }

  // 创建loading元素
  mkLoading(style) {
    return `
      <div class="loading style-${style}">
        <span class="dot-box">
          ${repeat(
            style === 1 ? '<i class="do-icon-loading"></i>' : '<i></i>',
            this.dot[style]
          )}
        </span>
      </div>
    `
  }

  // 创建窗口导航条
  mkMenubar() {
    let { menubar, fixed } = this.init.state
    let html = ''
    if (menubar) {
      html = `
        <div class="layer-title do-fn-noselect"
          :text="title"
          ${!fixed ? ':drag="layer-box" data-limit="window"' : ''}>
        </div>
      `
    }
    return html
  }

  // 创建窗口按钮
  mkCtrl() {
    let { type } = this.init.state
    if (type > 3) {
      return ''
    } else {
      let html = ''
      let btns = `
        <a class="action-yes"
          :click="handleConfirm"
          tabindex="-1"
          :text="btns[0]"
          ></a>
        `
      if (type > 1) {
        btns =
          `
        <a class="action-no"
          :click="handleCancel"
          :text="btns[1]"
          ></a>
        ` + btns
      }
      html = `
        <div class="layer-ctrl do-fn-noselect">
          ${btns}
        </div>
      `
      return html
    }
  }

  append() {
    let { state, $id } = this.init
    let container = state.container

    if (state.type < 4) {
      // 如果有已经打开的弹窗,则关闭
      if (unique) {
        close(unique)
      }
      unique = $id
    }

    // 返回一个数组,第1个元素是容器,第2个是骨架
    layerDom[$id] = this.create()

    delete state.toast
    this.toast = true
    if (!container) {
      container = document.body
    }

    container.appendChild(layerDom[$id][0])
    this.vm = Anot(this.init)
    return this
  }

  show() {
    let vm = this.vm
    let { state, $id } = this.init
    let container = state.container

    setTimeout(function() {
      let style = { background: state.background }
      let css = getComputedStyle(layerDom[$id][1])

      // tips类型, 弹层的定位要在指定的容器上
      if (state.type === 5) {
        // only type[tips] can define `color`
        style.color = state.color
        style.opacity = 1
        let $container = Anot(container)
        let $arrow = $container[0].querySelector('.arrow')
        let cw = $container.innerWidth()
        let ch = $container.innerHeight()
        let ol = $container.offset().left - $doc.scrollLeft()
        let ot = $container.offset().top - $doc.scrollTop()

        let layw = parseInt(css.width)
        let layh = parseInt(css.height)
        let arrowOffset = ['top']

        Anot(layerDom[$id][1]).css(style)

        $container.bind('mouseenter', ev => {
          let tmpStyle = { visibility: 'visible' }
          ol = $container.offset().left - $doc.scrollLeft()
          ot = $container.offset().top - $doc.scrollTop()

          if (ot + 18 < layh) {
            arrowOffset[0] = 'bottom'
            $arrow.style.borderBottomColor = state.background
            tmpStyle.top = ot + ch + 8
          } else {
            $arrow.style.borderTopColor = state.background
            tmpStyle.top = ot - layh - 8
          }

          if (ol + cw * 0.7 + layw > window.innerWidth) {
            tmpStyle.left = ol + cw * 0.3 - layw
            arrowOffset[1] = 'left'
          } else {
            tmpStyle.left = ol + cw * 0.7
          }

          $arrow.classList.add('offset-' + arrowOffset.join('-'))
          Anot(layerDom[$id][1]).css(tmpStyle)
        })
        $container.bind('mouseleave', () => {
          setTimeout(() => {
            $arrow.classList.remove('offset-' + arrowOffset.join('-'))
            arrowOffset = ['top']
            $arrow.style.borderBottomColor = ''
            $arrow.style.borderTopColor = ''
            layerDom[$id][1].style.visibility = 'hidden'
          }, 100)
        })
      } else {
        let offsetStyle = { opacity: 1 }
        if (state.offset) {
          offsetStyle.top = fixOffset(state.offset[0])
          offsetStyle.right = fixOffset(state.offset[1])
          offsetStyle.bottom = fixOffset(state.offset[2])
          offsetStyle.left = fixOffset(state.offset[3])
          //左右都为auto时,改为居中
          if (offsetStyle.left === 'auto' && offsetStyle.right === 'auto') {
            offsetStyle.left = '50%'
            style.marginLeft = -parseInt(css.width) / 2
          }
          //上下都为auto时,同样改为居中
          if (offsetStyle.top === 'auto' && offsetStyle.bottom === 'auto') {
            offsetStyle.top = '50%'
            style.marginTop = -parseInt(css.height) / 2
          }
        } else {
          style = Object.assign(style, {
            marginLeft: -parseInt(css.width) / 2,
            marginTop: -parseInt(css.height) / 2
          })
        }
        Anot(layerDom[$id][1]).css(style)

        setTimeout(() => {
          document.body.style.overflow = 'hidden'
          layerDom[$id][1].classList.add('shift')
          setTimeout(_ => {
            Anot(layerDom[$id][1]).css(offsetStyle)
            setTimeout(_ => {
              try {
                layerDom[$id][1].classList.remove('shift')
                layerDom[$id][1].classList.remove('__' + state.shift)
              } catch (err) {}
            }, 500)
          }, 50)
        }, 50)
      }
    }, 4)

    // loading类型,回调需要自动触发
    if (state.type > 3) {
      //大于0自动触发超时关闭
      if (state.timeout > 0) {
        clearTimeout(this.timeout)
        this.timeout = setTimeout(() => {
          clearTimeout(this.timeout)
          close($id)

          // 为loading类型时,自动关闭同时触发回调
          if (state.type === 6) {
            this.vm.props.yes.call(this.vm, $id)
          }
        }, state.timeout)
      } else if (state.type === 6) {
        // loading类型, 非自动关闭时, 主动触发回调
        this.vm.props.yes.call(this.vm, $id)
      }
    }
  }
}

const _layer = {
  alert(content, title, cb) {
    let opt = { content, fixed: true }

    if (typeof title === 'function') {
      opt.yes = title
    } else {
      if (title) {
        opt.title = title + ''
      }
      if (cb && typeof cb === 'function') {
        opt.yes = cb
      }
    }
    return _layer.open(opt)
  },
  confirm(content, title, yescb, nocb) {
    let opt = { content, fixed: true, type: 2 }

    if (typeof title === 'function') {
      opt.yes = title
      if (typeof yescb === 'function') {
        opt.no = yescb
      }
    } else {
      if (title) {
        opt.title = title + ''
      }
      if (yescb && typeof yescb === 'function') {
        opt.yes = yescb
      }
      if (nocb && typeof nocb === 'function') {
        opt.no = nocb
      }
    }
    return _layer.open(opt)
  },
  frame(url, extra = {}) {
    let opt = {
      content: `<iframe ref="frame" class="frame-box" src="${url}"></iframe>`,
      menubar: false,
      maskClose: true,
      type: 4,
      ...extra
    }
    return _layer.open(opt)
  },
  toast(txt, type = 'info', timeout = 2500) {
    if (typeof type === 'number') {
      timeout = type
      type = 'info'
    }
    switch (type) {
      case 'info':
        break
      case 'warn':
        break
      case 'error':
        type = 'deny'
        break
      default:
        type = 'info'
    }

    let opt = {
      content: `
      <mark class="toast-box style-${type}">
        <i class="do-icon-${type}"></i>
        ${txt}
      </mark>`,
      menubar: false,
      mask: false,
      type: 7,
      shift: 'tc',
      timeout,
      offset: [50, 'auto'],
      fixed: true,
      toast: true // toast模式
    }

    return _layer.open(opt)
  },
  load(style, container, cb) {
    style = style >>> 0
    style = style < 1 ? 1 : style > 4 ? 4 : style

    if (typeof container === 'function') {
      cb = container
      container = null
    } else {
      if (!(container instanceof HTMLElement)) {
        container = null
      }
      if (typeof cb !== 'function') {
        cb = Anot.noop
      }
    }
    return _layer.open({
      container,
      type: 6,
      load: style,
      yes: cb,
      menubar: false,
      background: 'none',
      shift: 'ct',
      fixed: true
    })
  },
  tips(content, container, opt = {}) {
    if (!(container instanceof HTMLElement)) {
      return Anot.error(lang.NEED_CONTAINER)
    }

    if (!opt.background) {
      opt.background = 'rgba(0,0,0,.5)'
    }
    if (!opt.color) {
      opt.color = '#fff'
    }
    Object.assign(opt, {
      container,
      content,
      type: 5,
      fixed: true,
      mask: false,
      menubar: false,
      timeout: 0
    })
    return _layer.open(opt)
  },
  prompt(title, yescb) {
    if (typeof yescb !== 'function') {
      return console.error(
        'argument [callback] requires a function, but ' +
          typeof yescb +
          ' given'
      )
    }
    let opt = {
      type: 3,
      prompt: '',
      title,
      content: `<input class="prompt-value" data-duplex-focus :class="{alert: !prompt}" :duplex="prompt" />`,
      fixed: true,
      yes: yescb
    }
    return _layer.open(opt)
  },
  close: close,
  open(opt) {
    if (typeof opt === 'string') {
      opt = 'layerwrap-' + opt
      if (!layerObj[opt]) {
        throw new Error(lang.ERROR)
      } else {
        //只能显示一个实例
        if (layerObj[opt].show) {
          return opt
        }
        layerObj[opt].show = true

        layerObj[opt].parentElem.appendChild(layerDom[opt][0])
        layerDom[opt][0]
          .querySelector('.layer-content')
          .appendChild(layerObj[opt].wrap)
        layerObj[opt].wrap.style.display = ''

        if (!Anot.vmodels[opt]) {
          Anot(layerObj[opt].obj.init)
        }
        layerObj[opt].obj.show()
        return opt
      }
    } else {
      return new __layer__(opt).init.$id
    }
  },
  version: Anot.ui.layer
}

Anot.directive('layer', {
  priority: 8090,
  init: function(binding) {
    // 去掉:layer属性,避免二次扫描
    binding.element.removeAttribute(binding.name)
    if (!binding.param || binding.param !== 'tips') {
      binding.param = '' // 去掉param,保证之后的逻辑处理正常
      binding.element.style.display = 'none'
    }
  },
  update: function(val) {
    if (!val) {
      console.error(this)
      return console.error(
        `SyntaxError: Unexpected [${this.name}=${this.expr}]`
      )
    }

    let state = Object.assign({ type: 7, wrap: true }, this.element.dataset)

    if (!this.param) {
      let init = { $id: 'layerwrap-' + val, state, props: {} }

      if (state.hasOwnProperty('area')) {
        state.area = state.area.split(',')
      }
      if (state.hasOwnProperty('offset')) {
        state.offset = state.offset.split(',')
      }
      if (state.hasOwnProperty('btns')) {
        state.btns = state.btns.split(',')
      }

      if (!state.hasOwnProperty('menubar')) {
        state.menubar = false
      }

      let tmp = new __layer__().__init__(init)

      //去掉data-*属性
      for (let i in this.element.dataset) {
        delete this.element.dataset[i]
      }

      layerObj[tmp.init.$id] = {
        obj: tmp,
        parentElem: this.element.parentNode,
        wrap: this.element,
        show: false
      }
      layerDom[tmp.init.$id] = tmp.create()
    } else if (this.param === 'tips') {
      let tips = document.createElement('div')
      let cont = document.createElement('span')
      let arrow = document.createElement('i')
      tips.className = 'do-layer__tips'
      cont.className = 'layer-content'
      arrow.className = 'arrow'
      cont.textContent = val
      tips.appendChild(cont)
      tips.appendChild(arrow)
      this.element.appendChild(tips)

      if (state.color) {
        style.color = state.color
      }
      if (state.color) {
        style.background = state.background
      }

      let style = {}
      let css = getComputedStyle(tips)
      let $container = Anot(this.element)
      let cw = $container.innerWidth()
      let ch = $container.innerHeight()
      let ol = $container.offset().left - $doc.scrollLeft()
      let ot = $container.offset().top - $doc.scrollTop()

      let layw = parseInt(css.width)
      let layh = parseInt(css.height)
      let arrowOffset = ['top']

      Anot(tips).css(style)

      $container.bind('mouseenter', ev => {
        let tmpStyle = { visibility: 'visible' }
        ol = $container.offset().left - $doc.scrollLeft()
        ot = $container.offset().top - $doc.scrollTop()

        if (ot + 18 < layh) {
          arrowOffset[0] = 'bottom'
          arrow.style.borderBottomColor = state.background
          tmpStyle.top = ot + ch + 8
        } else {
          arrow.style.borderTopColor = state.background
          tmpStyle.top = ot - layh - 8
        }

        if (ol + cw * 0.7 + layw > window.innerWidth) {
          tmpStyle.left = ol + cw * 0.3 - layw
          arrowOffset[1] = 'left'
        } else {
          tmpStyle.left = ol + cw * 0.7
        }

        arrow.classList.add('offset-' + arrowOffset.join('-'))
        Anot(tips).css(tmpStyle)
      })
      $container.bind('mouseleave', () => {
        setTimeout(() => {
          arrow.classList.remove('offset-' + arrowOffset.join('-'))
          arrowOffset = ['top']
          arrow.style.borderBottomColor = ''
          arrow.style.borderTopColor = ''
          tips.style.visibility = 'hidden'
        }, 100)
      })
    }
  }
})

window.layer = _layer

export default _layer
