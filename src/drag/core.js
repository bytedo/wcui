/**
 * 拖拽插件的核心部分
 * @author yutent<yutent@doui.cc>
 * @date 2019/08/23 19:41:21
 */

'use strict'

import { bind, unbind } from '../utils'

const DEF_OPT = {
  axis: '', // x | y | xy 拖拽方向
  limit: false, // false | window | parent 拖拽范围
  overflow: true // 是否可拖拽出可视区外
}

export default class Drag {
  constructor(elem) {
    this.$elem = elem

    this._init()
  }

  _init() {
    this.$elem.style.transform = ''
    var { x, y } = this.$elem.getBoundingClientRect()
    // _x, _y是位移,用于数据修正
    this.pos = { x, y, _x: 0, _y: 0 }
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
    node.style.cursor = 'move'

    this._handleResize = bind(window, 'resize', this._init.bind(this))

    // let
    this._handleMousedown = bind(node, 'mousedown', ev => {
      if (this.disabled) {
        return
      }
      var bcr = this.$elem.getBoundingClientRect()

      /* 修正由于页面有滚动距离,导致拖拽位移计算不正确的情况 */
      if (bcr.x - this.pos._x !== this.pos.x) {
        this.pos.x = bcr.x - this.pos._x
      }
      if (bcr.y - this.pos._y !== this.pos.y) {
        this.pos.y = bcr.y - this.pos._y
      }

      let mx = ev.pageX
      let my = ev.pageY

      let ww = document.documentElement.clientWidth
      let wh = document.documentElement.clientHeight

      let tw = bcr.width
      let th = bcr.height

      //限制区域, 4个值依次是: 上, 右, 下, 左
      let limit = [0, ww - tw, wh - th, 0]
      if (this.opt.limit === 'parent') {
        let pbcr = this.$elem.parentNode.getBoundingClientRect()
        limit = [pbcr.top, pbcr.right - tw, pbcr.bottom - th, pbcr.left]
      }

      let handleMove = bind(document, 'mousemove', ev => {
        // 防止拖动到边缘时导致页面滚动
        ev.preventDefault()

        let _x = ev.pageX - mx + (bcr.x - this.pos.x)
        let _y = ev.pageY - my + (bcr.y - this.pos.y)

        // 将另外一个方向的值清零来实现单向拖拽
        if (this.opt.axis === 'x') {
          _y = 0
        }
        if (this.opt.axis === 'y') {
          _x = 0
        }

        // 限制不可拖拽出指定区域(可视区或者父容器)
        if (this.opt.overflow === false) {
          if (_x < limit[3] - this.pos.x) {
            _x = limit[3] - this.pos.x
          } else if (_x > limit[1] - this.pos.x) {
            _x = limit[1] - this.pos.x
          }

          if (_y < limit[0] - this.pos.y) {
            _y = limit[0] - this.pos.y
          } else if (_y > limit[2] - this.pos.y) {
            _y = limit[2] - this.pos.y
          }
        }
        this.pos._x = _x
        this.pos._y = _y
        this.$elem.dispatchEvent(
          new CustomEvent('dragging', {
            detail: {
              offset: {
                x: this.pos.x + _x,
                y: this.pos.y + _y
              },
              move: { x: _x, y: _y }
            }
          })
        )
        this.$elem.style.transform = `translate(${_x}px, ${_y}px)`
      })

      let handleUp = bind(document, 'mouseup', ev => {
        this.$elem.dispatchEvent(
          new CustomEvent('dragged', {
            detail: {
              offset: {
                x: this.pos.x + this.pos._x,
                y: this.pos.y + this.pos._y
              },
              move: { x: this.pos._x, y: this.pos._y }
            }
          })
        )
        unbind(document, 'mousemove', handleMove)
        unbind(document, 'mouseup', handleUp)
      })
    })

    return this
  }

  on(name, cb) {
    if (!name || typeof cb !== 'function') {
      return
    }
    return bind(this, name, cb)
  }

  off(name, cb) {
    unbind(this, name, cb)
  }

  destroy() {
    unbind(window, 'resize', this._handleResize)
    unbind(this.$drag, 'mousedown', this._handleMousedown)

    delete this.$elem
    delete this.$drag
  }
}
