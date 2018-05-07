/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-21 01:36:29
 *
 */

'use strict'

import 'drag/index'
import './skin/default.scss'

Anot.ui.layer = '1.0.0-base'

let layerDom = {}
let layerObj = {}
let unique = null // 储存当前打开的1/2/3类型的弹窗
let lid = 0
let defconf = {
  type: 1, // 弹窗类型
  skin: 'default', // 默认主题
  background: '#fff',
  mask: true, // 遮罩
  maskClose: false, // 遮罩点击关闭弹窗
  radius: '0px', // 弹窗圆角半径
  area: ['auto', 'auto'],
  title: '提示', // 弹窗主标题(在工具栏上的)
  menubar: true, // 是否显示菜单栏
  content: '', // 弹窗的内容
  fixed: false, // 是否固定不可拖拽
  shift: 'cc', // 弹窗出来的初始位置,用于出场动画
  offset: [], // 弹窗出来后的坐标, 为数组,可有4个值,依次是 上右下左
  btns: ['确定', '取消'] // 弹窗的2个按钮的文字
}
const uuid = function() {
  return 'layer-' + lid++
}
const close = function(id) {
  if (typeof id !== 'string' && typeof id !== 'number') {
    return Anot.error('要关闭的layer实例不存在')
  }
  if (/^\$wrap\-/.test(id) || layerObj['$wrap-' + id]) {
    try {
      id = (layerObj['$wrap-' + id] ? '$wrap-' : '') + id
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
      setTimeout(_ => {
        document.body.removeChild(layerDom[id][0])
        delete layerDom[id]
        delete Anot.vmodels[id]
      }, 200)
    } catch (err) {}
  }
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
      2: 1,
      3: 5,
      4: 5,
      5: 9
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
        'skin',
        'mask',
        'maskClose',
        'container',
        'follow'
      ],
      methods: {
        onMaskClick: function() {
          if (this.type < 4 && !this.maskClose) {
            this.$refs.layer.classList.add('scale')
            setTimeout(() => {
              this.$refs.layer.classList.remove('scale')
            }, 100)
          } else {
            this.maskClose && this.close()
          }
        },
        handleConfirm: function() {
          if (this.type === 3) {
            if (!this.prompt) {
              return
            }
          }
          if (typeof this.props.yes === 'function') {
            this.props.yes.call(this, this.prompt, this.$id)
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
        if (typeof this.success === 'function') {
          this.success(_id)
        }
      }
    }

    //base版没有iframe类型
    if (this.init.state.type === 4) {
      this.init.state.type = 7
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
    }

    layBox.classList.add('layer-box')
    layBox.classList.add('skin-' + state.skin)

    if (typeof state.shift === 'string') {
      layBox.classList.add('__' + state.shift)
    } else {
      for (let k in state.shift) {
        layBox.style.cssText += `${k}: ${state.shift[k]};`
      }
    }

    if (state.type === 5) {
      layBox.classList.add('active')
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
      arrow += `<i class="arrow" style="border-top-color: ${
        state.background
      };"></i>`
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
            style === 1
              ? '<i class="do-icon-loading"></i>'
              : style === 2 ? '<i class="do-icon-app2"></i>' : '<i></i>',
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
        <a href="javascript:;" class="action-yes"
          :click="handleConfirm"
          tabindex="-1"
          :text="btns[0]"
          ></a>
        `
      if (type > 1) {
        btns =
          `
        <a href="javascript:;" class="action-no"
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
    let { state, $id, container } = this.init
    // 如果有已经打开的弹窗,则关闭
    if (unique) {
      close(unique)
    }
    if (state.type < 4) {
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
    let { state, $id, follow } = this.init

    setTimeout(function() {
      let style = { background: state.background }
      let css = getComputedStyle(layerDom[$id][1])

      // tips类型, 弹层的定位要在指定的容器上
      if (state.type === 5) {
        // only type[tips] can define `color`
        style.color = state.color

        let $follow = Anot(follow)
        let ew = $follow.innerWidth()
        let ol = $follow.offset().left - document.body.scrollLeft
        let ot = $follow.offset().top - document.body.scrollTop

        style.left = ol + ew * 0.7
        style.top = ot - parseInt(css.height) - 8
        style.opacity = 1
        Anot(layerDom[$id][1]).css(style)
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
            this.vm.props.yes($id)
          }
        }, state.timeout)
      } else if (state.type === 6) {
        // loading类型, 非自动关闭时, 主动触发回调
        this.vm.props.yes($id)
      }
    }
  }
}

const _layer = {
  alert: function(content, title, cb) {
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
  confirm: function(content, title, yescb, nocb) {
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
  toast: function(txt, type = 'info', timeout = 2500) {
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
  loading: function(style, time, cb) {
    style = style >>> 0

    if (typeof time === 'function') {
      cb = time
      time = 0
    } else {
      time = time >>> 0
      if (typeof cb !== 'function') {
        cb = Anot.noop
      }
    }
    return _layer.open({
      type: 6,
      load: style,
      yes: cb,
      timeout: time,
      menubar: false,
      background: 'none',
      shift: 'ct',
      fixed: true
    })
  },
  tips: function(content, container, opt = {}) {
    if (!(container instanceof HTMLElement)) {
      return Anot.error('tips类型必须指定一个目标容器')
    }
    if (!opt.hasOwnProperty('timeout')) {
      opt.timeout = 2500
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
      menubar: false
    })
    return _layer.open(opt)
  },
  prompt: function(title, yescb) {
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
      content:
        '<input class="prompt-value" data-duplex-focus :class="{alert: !prompt}" :duplex="prompt" />',
      fixed: true,
      yes: yescb
    }
    return _layer.open(opt)
  },
  use: function(skin, callback) {
    require(['css!./skin/' + skin], callback)
  },
  close: close,
  open: function(opt) {
    console.log(opt)
    if (typeof opt === 'string') {
      /*opt = '$wrap-' + opt
      if (!layerObj[opt]) {
        throw new Error('layer实例不存在')
      } else {
        //只能显示一个实例
        if (layerObj[opt].show) {
          return opt
        }
        layerObj[opt].show = true

        if (!Anot.vmodels[opt]) {
          Anot(layerObj[opt].obj.init)
        }

        layerObj[opt].parentElem.appendChild(layerDom[opt][1])
        layerDom[opt][1]
          .querySelector('.detail')
          .appendChild(layerObj[opt].wrap)
        layerObj[opt].wrap.style.display = ''
        // Anot.scan(layerDom[opt][1])
        layerObj[opt].obj.show()
        return opt
      }*/
    } else {
      return new __layer__(opt).init.$id
    }
  },
  version: Anot.ui.layer
}

Anot.directive('layer', {
  priority: 1400,
  init: function(binding) {
    if (!binding.param || binding.param !== 'tips') {
      binding.param = '' //去掉param,保证之后的逻辑处理正常
      // 去掉:layer属性,避免二次扫描
      binding.element.removeAttribute(binding.name)
      binding.element.style.display = 'none'
    }
  },
  update: function(val) {
    if (!val) {
      return Anot.error(
        ':layer指令格式不正确或无效属性. [' +
          this.name +
          '="' +
          this.expr +
          '"]'
      )
    }

    var _this = this,
      init = Object.assign({}, this.element.dataset)

    if (init.hasOwnProperty('area')) {
      init.area = init.area.split(',')
    }
    if (init.hasOwnProperty('offset')) {
      init.offset = init.offset.split(',')
    }
    if (init.hasOwnProperty('btns')) {
      init.btns = init.btns.split(',')
    }

    if (!this.param) {
      init.wrap = true
      init.type = 7
      init.$id = '$wrap-' + val
      if (!init.hasOwnProperty('menubar')) {
        init.menubar = false
      }

      var tmp = new __layer__().construct(init)

      //去掉data-*属性
      for (var i in this.element.dataset) {
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
      var $elem = Anot(this.element),
        ew = $elem.innerWidth(),
        ol = $elem.offset().left - document.body.scrollLeft,
        ot = $elem.offset().top - document.body.scrollTop,
        tipsBox = document.createElement('div'),
        tipsArrow = document.createElement('i'),
        tipsCont = document.createElement('div')

      tipsBox.className = 'do-layer skin-' + (init.skin || 'def') + ' type-5'
      tipsBox.style.left = ol + ew * 0.7 + 'px'
      if (init.background) {
        tipsBox.style.background = init.background
        tipsArrow.style.borderTopColor = init.background
      }
      if (init.color) {
        tipsBox.style.color = init.color
      }
      tipsCont.className = 'layer-content'
      tipsCont.textContent = val
      tipsArrow.className = 'arrow'
      tipsBox.appendChild(tipsCont)
      tipsBox.appendChild(tipsArrow)

      Anot(document).bind('scroll', function() {
        ol = $elem.offset().left - document.body.scrollLeft
        ot = $elem.offset().top - document.body.scrollTop

        tipsBox.style.left = ol + ew * 0.7 + 'px'
        tipsBox.style.top = ot - tipsBox.offsetHeight - 8 + 'px'
      })

      $elem.bind('mouseenter', function(ev) {
        _this.element.parentNode.appendChild(tipsBox)
        clearTimeout(_this.showTime)
        clearTimeout(_this.hideTime)
        _this.showTime = setTimeout(function() {
          tipsBox.style.top = ot - tipsBox.offsetHeight - 8 + 'px'
          tipsBox.classList.add('active')
        }, 4)
      })
      $elem.bind('mouseleave', function() {
        _this.hideTime = setTimeout(function() {
          clearTimeout(_this.hideTime)
          try {
            _this.element.parentNode.removeChild(tipsBox)
          } catch (err) {}
        }, 150)
      })
    }
  }
})

window.layer = _layer

export default _layer
