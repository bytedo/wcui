/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-03-29 18:39:35
 *
 */

'use strict'

function getBindingCallback(elem, name, vmodels) {
  var callback = elem.getAttribute(name)
  if (callback) {
    for (var i = 0, vm; (vm = vmodels[i++]); ) {
      if (vm.hasOwnProperty(callback) && typeof vm[callback] === 'function') {
        return vm[callback]
      }
    }
  }
}
Anot.ui.drag = '1.0.0'
// 元素拖动
Anot.directive('drag', {
  priority: 1500,
  init: function(binding) {
    binding.expr = '"' + binding.expr + '"'
    let ico = document.documentMode ? 'move' : 'grab'

    if (window.sidebar) {
      ico = '-moz-' + ico
    } else if (window.chrome) {
      ico = '-webkit-' + ico
    }
    Anot(binding.element).css('cursor', ico)
    //取得拖动的3种状态回调
    //按下,且拖拽之前
    binding.beforedrag = getBindingCallback(
      binding.element,
      'data-beforedrag',
      binding.vmodels
    )
    //拖拽过程
    binding.dragging = getBindingCallback(
      binding.element,
      'data-dragging',
      binding.vmodels
    )
    // 拖拽结束,且释放鼠标
    binding.dragged = getBindingCallback(
      binding.element,
      'data-dragged',
      binding.vmodels
    )

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

    delete binding.element.dataset.beforedrag
    delete binding.element.dataset.dragging
    delete binding.element.dataset.dragged
  },
  update: function(val) {
    let _this = this
    let target = val ? this.element.parentNode : this.element
    let $drag = Anot(this.element)
    let $doc = Anot(document)
    let $target = null
    let parentElem = null

    // val值不为空时, 获取真正的拖动元素
    // 仅从父级上找
    while (val && target) {
      if (!target.classList) {
        Anot.error(`${this.name}=${this.expr}, 解析异常[元素不存在]`)
      }
      if (target.classList.contains(val) || target.id === val) {
        break
      } else {
        target = target.parentNode
      }
    }
    $target = Anot(target)
    // 限制范围为parent时,获取父级元素
    if (this.limit === 'parent') {
      parentElem = target.parentNode
    }

    let dx, dy, mx, my, ox, oy, fox, foy, tw, th, ww, wh, bst, bsl
    let cssTransition
    $drag.bind('mousedown', function(ev) {
      let gcs = getComputedStyle(target)
      let cst = gcs.transform.replace(/matrix\((.*)\)/, '$1')
      let offset = $target.offset()

      if (gcs.transitionDuration !== '0s') {
        cssTransition = gcs.transitionDuration
        target.style.transitionDuration = '0s'
      }

      cst = cst !== 'none' ? cst.split(', ') : [1, 0, 0, 1, 0, 0]
      cst[4] -= 0
      cst[5] -= 0

      //记录初始的transform位移
      dx = cst[4]
      dy = cst[5]

      //滚动条的偏移
      bst = $doc.scrollTop()
      bsl = $doc.scrollLeft()

      // 计算元素的offset值, 需要修正
      ox = offset.left - dx - bsl
      oy = offset.top - dy - bst

      mx = ev.pageX //按下鼠标的的坐标值
      my = ev.pageY //按下鼠标的的坐标值

      // 在按下时才获取窗口大小, 是为了防止人为的改变窗口大小,导致计算不准备
      // 同时减少不必要的事件监听(页面上可能会很多可拖动元素)
      ww = window.innerWidth
      wh = window.innerHeight

      // 同样,在点击之后获取元素的宽高,可保证获取到的是真实的值
      tw = target.clientWidth
      th = target.clientHeight

      //拖拽前回调
      if (_this.beforedrag) {
        let result = _this.beforedrag.call(
          _this.vmodels,
          target,
          ox + dx,
          oy + dy
        )
        if (result === false) {
          return
        }
      }

      //限制区域, 4个值依次是: 上, 下, 左, 右
      let limit = [0, wh - th, 0, ww - tw]

      if (_this.limit === 'parent') {
        let pgcs = getComputedStyle(parentElem)
        let pcst = pgcs.transform.replace(/matrix\((.*)\)/, '$1')
        let poffset = Anot(parentElem).offset()

        pcst = pcst !== 'none' ? pcst.split(', ') : [1, 0, 0, 1, 0, 0]

        let pox = poffset.left - pcst[4] - bsl
        let poy = poffset.top - pcst[5] - bst

        limit = [
          poy,
          poy + parentElem.clientHeight - th,
          pox,
          pox + parentElem.clientWidth - tw
        ]
      }

      let mvfn = $doc.bind('mousemove', function(ev) {
        // 防止拖动到边缘时导致页面滚动
        ev.preventDefault()

        //坐标轴限制
        if (_this.axis !== 'y') {
          cst[4] = ev.pageX - mx + dx
        }
        if (_this.axis !== 'x') {
          cst[5] = ev.pageY - my + dy
        }

        fox = ox + cst[4] //修正的offset
        foy = oy + cst[5] //修正的offset

        //如果不允许溢出可视区
        if (!_this.overflow) {
          if (_this.axis !== 'y') {
            if (fox <= limit[2]) {
              fox = limit[2]
              //修正矩阵
              cst[4] = fox - ox
            }
            if (fox >= limit[3]) {
              fox = limit[3]
              //修正矩阵
              cst[4] = fox - ox
            }
          }

          if (_this.axis !== 'x') {
            if (foy <= limit[0]) {
              foy = limit[0]
              //修正矩阵
              cst[5] = foy - oy
            }
            if (foy >= limit[1]) {
              foy = limit[1]
              //修正矩阵
              cst[5] = foy - oy
            }
          }
        }

        $target.css({
          transform: 'matrix(' + cst.join(', ') + ')'
        })

        //拖拽过程的回调
        if (_this.dragging) {
          _this.dragging.call(_this.vmodels, target, fox, foy)
        }
      })
      let upfn = $doc.bind('mouseup', function(ev) {
        $doc.unbind('mousemove', mvfn)
        $doc.unbind('mouseup', upfn)

        target.style.transitionDuration = cssTransition
        //结束回调
        if (_this.dragged) {
          _this.dragged.call(_this.vmodels, target, fox, foy)
        }
      })
    })
  }
})
