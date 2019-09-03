/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-21 01:36:29
 *
 */

'use strict'

import layer from './core'
const log = console.log

/* Anot.directive('layer', {
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
      if (state.hasOwnProperty('shift')) {
        state.shift = fixOffset(new Function(`return ${state.shift}`)())
      }

      if (state.hasOwnProperty('offset')) {
        state.offset = fixOffset(new Function(`return ${state.offset}`)())
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
      let $container = Anot(this.element)
      let { position } = getComputedStyle(this.element)

      tips.className = 'do-layer__tips'
      cont.className = 'layer-content'
      arrow.className = 'arrow'
      cont.textContent = val
      tips.appendChild(cont)
      tips.appendChild(arrow)

      if (position === 'static') {
        this.element.style.position = 'relative'
      }
      this.element.appendChild(tips)

      let style = {}

      if (state.color) {
        style.color = state.color
      }
      if (state.color) {
        style.background = state.background
      }

      let cw = $container.innerWidth()
      let ch = $container.innerHeight()

      let arrowOffset = ['top']

      // log(tips, layw, layh)
      Anot(tips).css(style)

      $container.bind('mouseenter', ev => {
        let tmpStyle = { visibility: 'visible' }
        let layw = tips.clientWidth
        let layh = tips.clientHeight
        let { left, top } = $container.offset()
        let ol = left - $doc.scrollLeft()
        let ot = top - $doc.scrollTop()

        // 判断位置是以确定出现 在上还是在下
        if (ot < layh + 8) {
          arrowOffset[0] = 'bottom'
          arrow.style.borderBottomColor = state.background
          tmpStyle.bottom = ''
          tmpStyle.top = ch + 8
        } else {
          arrow.style.borderTopColor = state.background
          tmpStyle.top = ''
          tmpStyle.bottom = ch + 8
        }

        if (ol + cw * 0.7 + layw > window.innerWidth) {
          tmpStyle.left = cw * 0.3 - layw
          arrowOffset[1] = 'left'
        } else {
          tmpStyle.left = cw * 0.7
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
}) */

export default layer
