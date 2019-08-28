/**
 * 公共方法库
 * @author yutent<yutent@doui.cc>
 * @date 2019/08/08 10:47:55
 */

function noop() {}

/**
 * 异步回调
 */
export const nextTick = (function() {
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
})()

/**
 * 对象/数组遍历
 * 支持跳出
 */
export const each = function(obj, fn) {
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
}

/**
 * 事件绑定
 */
export const bind = function(dom, type, fn = noop, phase = false) {
  let events = type.split(',')
  each(events, function(t) {
    t = t.trim()
    dom.addEventListener(t, fn, phase)
  })
  return fn
}

/**
 * 事件绑定(默认不冒泡)
 */
export const ebind = function(dom, type, fn, phase) {
  function fn2(ev) {
    ev.stopPropagation()
    fn && fn(ev)
  }
  return bind(dom, type, fn2, phase)
}

/**
 * 解除事件绑定
 */
export const unbind = function(dom, type, fn = noop, phase = false) {
  let events = type.split(',')
  each(events, function(t) {
    t = t.trim()
    dom.removeEventListener(t, fn, phase)
  })
}

// 指定节点外点击(最高不能超过body层)
export const clickOutside = function(dom, fn = noop) {
  return bind(document, 'mousedown', ev => {
    if (ev) {
      if (ev.path) {
        var path = ev.path.concat()
        while (path.length > 3) {
          if (path.shift() === dom) {
            return
          }
        }
      } else {
        var target = ev.originalTarget || ev.target
        console.log(target, typeof target, target.__proto__)
        if (dom === target || dom.contains(target)) {
          return
        }
      }
    }
    fn(ev)
  })
}
