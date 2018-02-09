/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-21 01:36:29
 *
 */

'use strict'

import 'drag/index'
import './skin/def.scss'

Anot.ui.layer = '1.0.0-base'
let layerDom = {}
let layerObj = {}
let unique = null //储存当前打开的1/2/3类型的弹窗
let lid = 0
let defconf = {
  type: 1, // 弹窗类型
  skin: 'def', //默认主题
  icon: 1, //图标类型
  background: '#fff',
  mask: true, //遮罩
  maskClose: false, //遮罩点击关闭弹窗
  radius: '0px', //弹窗圆角半径
  area: ['auto', 'auto'],
  title: '提示', //弹窗主标题(在工具栏上的)
  menubar: true, //是否显示菜单栏
  content: '', // 弹窗的内容
  fixed: false, //是否固定不可拖拽
  offset: null, //弹窗出来时的坐标, 为数组,可有4个值,依次是 上右下左
  btns: ['确定', '取消'] //弹窗的2个按钮的文字
}
const uuid = function() {
  return 'layer-' + ++lid
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
    try {
      // document.body.removeChild(layerDom[id][1])
      document.body.removeChild(layerDom[id][0])
      unique = null
    } catch (err) {}

    delete layerDom[id]
    delete Anot.vmodels[id]
  }
}

const reapeat = function(str, num) {
  var idx = 0,
    result = ''
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
const __layer__ = function(conf) {
  if (conf) {
    let { yes, no, success } = conf
    delete conf.yes
    delete conf.no
    delete conf.success

    this.construct({
      state: { ...conf },
      props: { yes, no, success }
    })
      .append()
      .show()
  }
}

const _layer = {
  alert: function(content, title, cb) {
    let opt = { content, fixed: true, icon: 5 }

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
    let opt = { content, fixed: true, icon: 0, type: 2 }

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
  msg: function(msg, conf) {
    if (typeof conf !== 'object') {
      var tmp = conf
      conf = { timeout: 2500 }
      if (typeof tmp === 'number') {
        conf.icon = tmp
      }
    }

    if (!conf.hasOwnProperty('timeout')) {
      conf.timeout = 2500
    }

    conf.specialMode = true //特殊模式
    conf.content = '<p class="msg-box">' + msg + '</p>'
    conf.type = 7
    conf.fixed = true
    conf.shade = false
    conf.menubar = false
    conf.radius = '5px'
    return _layer.open(conf)
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
      fixed: true
    })
  },
  tips: function(content, container, conf) {
    if (!(container instanceof HTMLElement)) {
      return Anot.error('tips类型必须指定一个目标容器')
    }
    if (typeof conf !== 'object') {
      var tmp = conf
      conf = { timeout: 2500 }
      if (typeof tmp === 'number') {
        conf.icon = tmp
      }
    }
    if (!conf.hasOwnProperty('timeout')) {
      conf.timeout = 2500
    }
    if (!conf.background) {
      conf.background = 'rgba(0,0,0,.5)'
    }
    if (!conf.color) {
      conf.color = '#fff'
    }
    conf.container = container
    conf.content = content
    conf.type = 5
    conf.icon = 0
    conf.fixed = true
    conf.shade = false
    conf.menubar = false
    return _layer.open(conf)
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
  open: function(conf) {
    if (typeof conf === 'string') {
      /*conf = '$wrap-' + conf
      if (!layerObj[conf]) {
        throw new Error('layer实例不存在')
      } else {
        //只能显示一个实例
        if (layerObj[conf].show) {
          return conf
        }
        layerObj[conf].show = true

        if (!Anot.vmodels[conf]) {
          Anot(layerObj[conf].obj.init)
        }

        layerObj[conf].parentElem.appendChild(layerDom[conf][1])
        layerDom[conf][1]
          .querySelector('.detail')
          .appendChild(layerObj[conf].wrap)
        layerObj[conf].wrap.style.display = ''
        // Anot.scan(layerDom[conf][1])
        layerObj[conf].obj.show()
        return conf
      }*/
    } else {
      return new __layer__(conf).init.$id
    }
  },
  version: Anot.ui.layer
}

/*type: { // 弹窗类型对应的id值
        1: 'alert',
        2: 'confirm',
        3: 'prompt',
        4: 'iframe',
        5: 'tips',
        6: 'loading',
        7: 'msg',
    }*/
__layer__.prototype = {
  dot: {
    //loading的子元素数量
    1: 0,
    2: 0,
    3: 5,
    4: 5,
    5: 9
  },
  timeout: null,
  construct: function(conf) {
    let _id = conf.$id || uuid()
    this.init = {
      $id: _id,
      state: {
        ...defconf,
        ...conf.state
      },
      props: conf.props,
      skip: ['area', 'shift', 'skin', 'mask', 'maskClose', 'container'],
      methods: {
        onMaskClick: function() {
          if (this.type < 4 && !this.maskClose) {
            this.$refs.layer.classList.add('scale')
            setTimeout(() => {
              this.$refs.layer.classList.remove('scale')
            }, 100)
          } else {
            this.close()
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

    if (this.init.state.icon > 9) {
      this.init.state.icon = 9
    }
    //base版没有iframe类型
    if (this.init.state.type === 4) {
      this.init.state.type = 7
    }
    return this
  },
  create: function() {
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
    if (state.type === 5) {
      layBox.classList.add('active')
    }
    if (state.specialMode && state.type === 7) {
      layBox.classList.add('type-unspecial')
    } else {
      layBox.classList.add('type-' + state.type)
    }

    layBox.setAttribute('ref', 'layer')
    layBox.setAttribute(':click', 'cancelBubble')

    //暂时隐藏,避免修正定位时,能看到闪一下
    layBox.style.cssText +=
      'visibility:hidden; border-radius:' + state.radius + 'px'

    //没有菜单栏, 且未禁止拖拽,则加上可拖拽属性
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
      ${this.getMenubar()}
      <div
        class="layer-content do-fn-cl ${state.icon < 0 ? 'none-icon' : ''}"
        style="${boxcss}">

        ${this.getCont()}
      </div>
      ${this.getCtrl()}
      ${arrow}
    `
    delete state.wrap
    outerBox.appendChild(layBox)
    return [outerBox, layBox]
  },
  getCont: function() {
    let { state, $id } = this.init
    if (state.type === 6) {
      return this.getLoading(state.load)
    } else {
      return `
        ${this.getIcon()}
        <div class="detail" ${!state.wrap ? ':html="content"' : ''}></div>
      `
    }
  },
  getLoading: function(style) {
    return `
      <div class="loading style-${style}">
        <span class="dot-box">
          ${repeat('<i></i>', this.dot[style])}
        </span>
      </div>
    `
  },
  //获取窗口导航条
  getMenubar: function() {
    let { state, $id } = this.init
    let html = ''
    if (state.menubar) {
      html = `
        <div class="layer-title do-fn-noselect"
          :text="title"
          ${!state.fixed ? ':drag="layer-box" data-limit="window"' : ''}>
        </div>
      `
    }
    return html
  },
  //获取窗口内容的图标
  getIcon: function() {
    let { state, $id } = this.init
    if (state.type < 4 || state.type === 5 || state.specialMode) {
      return `<span class="do-ui-font msg-icon icon-${state.icon}"></span>`
    }
    return ''
  },
  // 获取窗口按钮
  getCtrl: function() {
    let { state, $id } = this.init
    if (state.type > 3) {
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
      if (state.type > 1) {
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
  },
  append: function() {
    let { state, $id } = this.init
    //如果有已经打开的弹窗,则关闭
    if (unique) {
      _layer.close(unique)
    }
    if (state.type < 4) {
      unique = $id
    }
    layerDom[$id] = this.create()

    delete state.specialMode

    document.body.appendChild(layerDom[$id][0])
    this.vm = Anot(this.init)
    return this
  },
  show: function() {
    let { state, $id, container } = this.init

    setTimeout(function() {
      var style = { visibility: '', background: state.background }
      let css = getComputedStyle(layerDom[$id][1])

      // tips类型, 弹层的定位要在指定的容器上
      if (state.type === 5) {
        // only type[tips] can define `color`
        style.color = state.color

        let $container = Anot(container)
        let ew = $container.innerWidth()
        let ol = $container.offset().left - document.body.scrollLeft
        let ot = $container.offset().top - document.body.scrollTop

        style.left = ol + ew * 0.7
        style.top = ot - parseInt(css.height) - 8
      } else {
        if (state.offset) {
          style.top = fixOffset(state.offset[0])
          style.right = fixOffset(state.offset[1])
          style.bottom = fixOffset(state.offset[2])
          style.left = fixOffset(state.offset[3])
          //左右都为auto时,改为居中
          if (style.left === 'auto' && style.right === 'auto') {
            style.left = '50%'
            style.marginLeft = -parseInt(css.width) / 2
          }
          //上下都为auto时,同样改为居中
          if (style.top === 'auto' && style.bottom === 'auto') {
            style.top = '50%'
            style.marginTop = -parseInt(css.height) / 2
          }
        } else {
          style = Anot.mix(style, {
            marginLeft: -parseInt(css.width) / 2,
            marginTop: -parseInt(css.height) / 2
          })
        }
      }

      Anot(layerDom[$id][1]).css(style)
    }, 4)

    // loading类型,回调需要自动触发
    if (state.type > 3) {
      //大于0自动触发超时关闭
      if (state.timeout > 0) {
        clearTimeout(this.timeout)
        this.timeout = setTimeout(function() {
          clearTimeout(_this.timeout)
          _layer.close($id)

          // 为loading类型时,自动关闭同时触发回调
          if (state.type === 6) {
            _this.vm.yes($id)
          }
        }, state.timeout)
      } else if (statetype === 6) {
        // loading类型, 非自动关闭时, 主动触发回调
        this.vm.yes($id)
      }
    }
  }
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
