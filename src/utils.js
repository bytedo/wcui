/**
 * 公共方法库
 * @author yutent<yutent.io@gmail.com>
 * @date 2019/08/08 10:47:55
 */

function noop() {}

export default {
  /**
   * 异步回调
   */
  nextTick: (function() {
    let queue = []
    function callback() {
      let n = queue.length
      for (let i = 0; i < n; i++) {
        queue[i]()
      }
      queue = queue.slice(n)
    }

    let node = document.createTextNode('<!-- -->')
    new MutationObserver(callback).observe(node, { characterData: true })

    let bool = false
    return function(fn) {
      queue.push(fn)
      bool = !bool
      node.data = bool
    }
  })(),

  //取得距离页面左上角的坐标
  offset(node) {
    try {
      var rect = node.getBoundingClientRect()

      if (rect.width || rect.height || node.getClientRects().length) {
        var doc = node.ownerDocument
        var root = doc.documentElement
        var win = doc.defaultView
        return {
          top: rect.top + win.pageYOffset - root.clientTop,
          left: rect.left + win.pageXOffset - root.clientLeft
        }
      }
    } catch (e) {
      return {
        left: 0,
        top: 0
      }
    }
  },

  /**
   * 对象/数组遍历
   * 支持跳出
   */
  each(obj, fn) {
    if (obj) {
      if (Array.isArray(obj)) {
        for (let i = 0, it; (it = obj[i++]); ) {
          if (fn(it, i - 1) === false) {
            break
          }
        }
      } else {
        for (let i in obj) {
          if (obj.hasOwnProperty(i) && fn(obj[i], i) === false) {
            break
          }
        }
      }
    }
  },

  /**
   * 事件绑定
   */
  bind(dom, type, fn = noop, phase = false) {
    let events = type.split(',')
    this.each(events, function(t) {
      t = t.trim()
      dom.addEventListener(t, fn, phase)
    })
    return fn
  },

  /**
   * 事件绑定(默认不冒泡)
   */
  catch(dom, type, fn, phase) {
    function fn2(ev) {
      ev.stopPropagation()
      fn && fn(ev)
    }
    return this.bind(dom, type, fn2, phase)
  },

  /**
   * 解除事件绑定
   */
  unbind(dom, type, fn = noop, phase = false) {
    let events = type.split(',')
    this.each(events, function(t) {
      t = t.trim()
      dom.removeEventListener(t, fn, phase)
    })
  },

  // 指定节点外点击(最高不能超过body层)
  outside(dom, fn = noop) {
    return this.bind(document, 'mousedown', ev => {
      if (ev) {
        if (ev.path) {
          var path = ev.path.concat()
          while (path.length > 3) {
            if (path.shift() === dom) {
              return
            }
          }
        } else {
          var target = ev.explicitOriginalTarget || ev.target
          if (
            dom === target ||
            dom.contains(target) ||
            (dom.root && dom.root.contains(target))
          ) {
            return
          }
        }
      }
      fn(ev)
    })
  },

  clearOutside(fn = noop) {
    this.unbind(document, 'mousedown', fn)
  }
}
