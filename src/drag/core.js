/**
 * 拖拽插件
 * @author yutent<yutent@doui.cc>
 * @date 2019/08/21 17:28:40
 */

'use strict'

import { bind, unbind } from '../utils'

const log = console.log

const DEF_OPT = {
  axis: '', // x | y | xy 拖拽方向
  limit: false, // false | window | parent 拖拽范围
  overflow: true // 是否可拖拽出可视区外
}

export default class Drag {
  constructor(elem) {
    this.$elem = elem
  }

  // drag by
  by(node, opt = {}) {
    this.$drag = node
    this.opt = Object.assign(Object.create(null), DEF_OPT, opt)

    //
    if (this.opt.limit !== false) {
      this.opt.overflow = false
    }

    // 鼠标状态图标
    var ico = document.documentMode ? 'move' : 'grab'
    if (window.sidebar) {
      ico = '-moz-' + ico
    } else {
      ico = '-webkit-' + ico
    }
    this.$drag.style.cursor = ico

    bind(this.$drag, 'mousedown', ev => {
      var bcr = this.$elem.getBoundingClientRect()
      log(bcr)
    })

    return this
  }
}
