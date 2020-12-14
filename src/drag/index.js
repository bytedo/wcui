/**
 * 拖拽指令 :drag
 * @authors yutent (yutent.io@gmail.com)
 * @date    2017-03-29 18:39:35
 *
 */

import Drag from './core'

Anot.directive('drag', {
  priority: 1500,
  init: function(binding) {
    binding.expr = '"' + binding.expr + '"'

    //默认允许溢出可视区
    binding.overflow = true

    //方向,x轴, y轴, xy轴
    binding.axis = 'xy'
    if (!!binding.element.dataset.axis) {
      binding.axis = binding.element.dataset.axis
      delete binding.element.dataset.axis
    }

    //默认不限制拖拽区域
    binding.limit = false
    if (!!binding.element.dataset.limit) {
      binding.limit = binding.element.dataset.limit
      //这里,只要不为空,除parent外,其他值都默认为window, 故"可溢出"为false
      binding.overflow = false
      delete binding.element.dataset.limit
    }
  },
  update: function(val) {
    var target = this.element

    // val值不为空时, 获取真正的拖动元素
    // 仅从父级上找
    if (val) {
      target = this.element.parentNode
      while (target) {
        if (!target.classList) {
          Anot.error(`${this.name}=${this.expr}, 解析异常[元素不存在]`)
        }
        if (target.tagName === 'WC-LAYER' && val === 'layer') {
          target = target.root.children[1]
          break
        }

        if (target.classList.contains(val) || target.id === val) {
          break
        } else {
          target = target.parentNode
        }
      }
    }

    new Drag(target).by(this.element, {
      limit: this.limit,
      axis: this.axis,
      overflow: this.overflow
    })
  }
})
