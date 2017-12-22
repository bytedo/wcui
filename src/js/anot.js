/*==================================================
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-03-21 21:05:57
 * support IE10+ and other browsers
 * 
 ==================================================*/

/*********************************************************************
 *                    全局变量及方法                                   *
 **********************************************************************/

var expose = generateID()
//http://stackoverflow.com/questions/7290086/javascript-use-strict-and-nicks-find-global-function
var DOC = window.document
var head = DOC.head //HEAD元素
head.insertAdjacentHTML(
  'afterBegin',
  '<yua :skip class="yua-hide"><style id="yua-style">.yua-hide{ display: none!important } .do-rule-tips {position:absolute;z-index:65535;min-width:75px;height:30px;padding:7px 8px;line-height:16px;color:#333;background:#f9ca05;white-space:pre;} .do-rule-tips::before {position:absolute;left:5px;bottom:-8px;width:0;height:0;border:8px solid transparent;border-left:8px solid #f9ca05;content: " "}</style></yua>'
)
var ifGroup = head.firstChild

function log() {
  // http://stackoverflow.com/questions/8785624/how-to-safely-wrap-console-log
  console.log.apply(console, arguments)
}

/**
 * Creates a new object without a prototype. This object is useful for lookup without having to
 * guard against prototypically inherited properties via hasOwnProperty.
 *
 * Related micro-benchmarks:
 * - http://jsperf.com/object-create2
 * - http://jsperf.com/proto-map-lookup/2
 * - http://jsperf.com/for-in-vs-object-keys2
 */
function createMap() {
  return Object.create(null)
}

var subscribers = '$' + expose

var nullObject = {} //作用类似于noop，只用于代码防御，千万不要在它上面添加属性
var rword = /[^, ]+/g //切割字符串为一个个小块，以空格或豆号分开它们，结合replace实现字符串的forEach
var rw20g = /\w+/g
var rsvg = /^\[object SVG\w*Element\]$/
var oproto = Object.prototype
var ohasOwn = oproto.hasOwnProperty
var serialize = oproto.toString
var ap = Array.prototype
var aslice = ap.slice
var W3C = window.dispatchEvent
var root = DOC.documentElement
var yuaFragment = DOC.createDocumentFragment()
var cinerator = DOC.createElement('div')
var class2type = {
  '[object Boolean]': 'boolean',
  '[object Number]': 'number',
  '[object String]': 'string',
  '[object Function]': 'function',
  '[object Array]': 'array',
  '[object Date]': 'date',
  '[object RegExp]': 'regexp',
  '[object Object]': 'object',
  '[object Error]': 'error',
  '[object AsyncFunction]': 'asyncfunction',
  '[object Promise]': 'promise',
  '[object Generator]': 'generator',
  '[object GeneratorFunction]': 'generatorfunction'
}
var bindingID = 1024
var IEVersion = NaN
if (window.VBArray) {
  IEVersion = document.documentMode || (window.XMLHttpRequest ? 7 : 6)
}

function noop() {}
function scpCompile(array) {
  return Function.apply(noop, array)
}

function oneObject(array, val) {
  if (typeof array === 'string') {
    array = array.match(rword) || []
  }
  var result = {},
    value = val !== void 0 ? val : 1
  for (var i = 0, n = array.length; i < n; i++) {
    result[array[i]] = value
  }
  return result
}

function generateID(mark) {
  mark = (mark && mark + '-') || 'yua-'
  return (
    mark +
    Date.now().toString(16) +
    '-' +
    Math.random()
      .toString(16)
      .slice(2, 6)
  )
}

var yua = function(el) {
  //创建jQuery式的无new 实例化结构
  return new yua.init(el)
}

/*视浏览器情况采用最快的异步回调*/
yua.nextTick = new function() {
  // jshint ignore:line
  var tickImmediate = window.setImmediate
  var tickObserver = window.MutationObserver
  if (tickImmediate) {
    return tickImmediate.bind(window)
  }

  var queue = []
  function callback() {
    var n = queue.length
    for (var i = 0; i < n; i++) {
      queue[i]()
    }
    queue = queue.slice(n)
  }

  if (tickObserver) {
    var node = document.createTextNode('yua')
    new tickObserver(callback).observe(node, { characterData: true }) // jshint ignore:line
    var bool = false
    return function(fn) {
      queue.push(fn)
      bool = !bool
      node.data = bool
    }
  }

  return function(fn) {
    setTimeout(fn, 4)
  }
}() // jshint ignore:line

/*********************************************************************
 *                 yua的静态方法定义区                              *
 **********************************************************************/

yua.type = function(obj) {
  //取得目标的类型
  if (obj == null) {
    return String(obj)
  }
  // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
  return typeof obj === 'object' || typeof obj === 'function'
    ? class2type[serialize.call(obj)] || 'object'
    : typeof obj
}

/*判定是否是一个朴素的javascript对象（Object），不是DOM对象，不是BOM对象，不是自定义类的实例*/
yua.isPlainObject = function(obj) {
  // 简单的 typeof obj === "object"检测，会致使用isPlainObject(window)在opera下通不过
  return (
    serialize.call(obj) === '[object Object]' &&
    Object.getPrototypeOf(obj) === oproto
  )
}

var VMODELS = (yua.vmodels = {}) //所有vmodel都储存在这里
yua.init = function(source) {
  if (yua.isPlainObject(source)) {
    var $id = source.$id,
      vm
    if (!$id) {
      log('warning: vm必须指定$id')
    }
    vm = modelFactory(source)
    vm.$id = $id
    return (VMODELS[$id] = vm)
  } else {
    this[0] = this.element = source
  }
}
yua.fn = yua.prototype = yua.init.prototype

//与jQuery.extend方法，可用于浅拷贝，深拷贝
yua.mix = yua.fn.mix = function() {
  var options,
    name,
    src,
    copy,
    copyIsArray,
    clone,
    target = arguments[0] || {},
    i = 1,
    length = arguments.length,
    deep = false

  // 如果第一个参数为布尔,判定是否深拷贝
  if (typeof target === 'boolean') {
    deep = target
    target = arguments[1] || {}
    i++
  }

  //确保接受方为一个复杂的数据类型
  if (typeof target !== 'object' && yua.type(target) !== 'function') {
    target = {}
  }

  //如果只有一个参数，那么新成员添加于mix所在的对象上
  if (i === length) {
    target = this
    i--
  }

  for (; i < length; i++) {
    //只处理非空参数
    if ((options = arguments[i]) != null) {
      for (name in options) {
        src = target[name]
        copy = options[name]
        // 防止环引用
        if (target === copy) {
          continue
        }
        if (
          deep &&
          copy &&
          (yua.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))
        ) {
          if (copyIsArray) {
            copyIsArray = false
            clone = src && Array.isArray(src) ? src : []
          } else {
            clone = src && yua.isPlainObject(src) ? src : {}
          }

          target[name] = yua.mix(deep, clone, copy)
        } else if (copy !== void 0) {
          target[name] = copy
        }
      }
    }
  }
  return target
}

/*-----------------部分ES6的JS实现 start---------------*/

if (!Object.assign) {
  Object.defineProperty(Object, 'assign', {
    enumerable: false,
    value: function(target, first) {
      'use strict'
      if (target === undefined || target === null)
        throw new TypeError('Can not convert first argument to object')

      var to = Object(target)
      for (var i = 0, len = arguments.length; i < len; i++) {
        var next = arguments[i]
        if (next === undefined || next === null) continue

        var keys = Object.keys(Object(next))
        for (var j = 0, n = keys.length; j < n; j++) {
          var key = keys[j]
          var desc = Object.getOwnPropertyDescriptor(next, key)
          if (desc !== undefined && desc.enumerable) to[key] = next[key]
        }
      }
      return to
    }
  })
}

if (!Array.from) {
  Object.defineProperty(Array, 'from', {
    enumerable: false,
    value: (function() {
      var toStr = Object.prototype.toString
      var isCallable = function(fn) {
        return (
          typeof fn === 'function' || toStr.call(fn) === '[object Function]'
        )
      }

      var toInt = function(val) {
        var num = val - 0
        if (isNaN(num)) return 0

        if (num === 0 || isFinite(num)) return num

        return (num > 0 ? 1 : -1) * Math.floor(Math.abs(num))
      }
      var maxInt = Math.pow(2, 53) - 1
      var toLen = function(val) {
        var len = toInt(val)
        return Math.min(Math.max(len, 0), maxInt)
      }

      return function(arrLike) {
        var _this = this
        var items = Object(arrLike)
        if (arrLike === null)
          throw new TypeError(
            'Array.from requires an array-like object - not null or undefined'
          )

        var mapFn = arguments.length > 1 ? arguments[1] : undefined
        var other
        if (mapFn !== undefined) {
          if (!isCallable(mapFn))
            throw new TypeError(
              'Array.from: when provided, the second argument must be a function'
            )

          if (arguments.length > 2) other = arguments[2]
        }

        var len = toLen(items.length)
        var arr = isCallable(_this) ? Object(new _this(len)) : new Array(len)
        var k = 0
        var kVal
        while (k < len) {
          kVal = items[k]
          if (mapFn)
            arr[k] =
              other === 'undefined'
                ? mapFn(kVal, k)
                : mapFn.call(other, kVal, k)
          else arr[k] = kVal

          k++
        }
        arr.length = len
        return arr
      }
    })()
  })
}

// 判断数组是否包含指定元素
if (!Array.prototype.includes) {
  Object.defineProperty(Array.prototype, 'includes', {
    value: function(val) {
      for (var i in this) {
        if (this[i] === val) return true
      }
      return false
    },
    enumerable: false
  })
}

//类似于Array 的splice方法
if (!String.prototype.splice) {
  Object.defineProperty(String.prototype, 'splice', {
    value: function(start, len, fill) {
      var length = this.length,
        argLen = arguments.length

      fill = fill === undefined ? '' : fill

      if (argLen < 1) {
        return this
      }

      //处理负数
      if (start < 0) {
        if (Math.abs(start) >= length) start = 0
        else start = length + start
      }

      if (argLen === 1) {
        return this.slice(0, start)
      } else {
        len -= 0

        var strl = this.slice(0, start),
          strr = this.slice(start + len)

        return strl + fill + strr
      }
    },
    enumerable: false
  })
}

if (!Date.prototype.getFullWeek) {
  //获取当天是本年度第几周
  Object.defineProperty(Date.prototype, 'getFullWeek', {
    value: function() {
      var thisYear = this.getFullYear(),
        that = new Date(thisYear, 0, 1),
        firstDay = that.getDay(),
        numsOfToday = (this - that) / 86400000
      return Math.ceil((numsOfToday + firstDay) / 7)
    },
    enumerable: false
  })

  //获取当天是本月第几周
  Object.defineProperty(Date.prototype, 'getWeek', {
    value: function() {
      var today = this.getDate(),
        thisMonth = this.getMonth(),
        thisYear = this.getFullYear(),
        firstDay = new Date(thisYear, thisMonth, 1).getDay()
      return Math.ceil((today + firstDay) / 7)
    },
    enumerable: false
  })
}

if (!Date.isDate) {
  Object.defineProperty(Date, 'isDate', {
    value: function(obj) {
      return typeof obj === 'object' && obj.getTime ? true : false
    },
    enumerable: false
  })
}

//时间格式化
if (!Date.prototype.format) {
  Object.defineProperty(Date.prototype, 'format', {
    value: function(str) {
      str = str || 'Y-m-d H:i:s'
      var week = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        dt = {
          fullyear: this.getFullYear(),
          year: this.getYear(),
          fullweek: this.getFullWeek(),
          week: this.getWeek(),
          month: this.getMonth() + 1,
          date: this.getDate(),
          day: week[this.getDay()],
          hours: this.getHours(),
          minutes: this.getMinutes(),
          seconds: this.getSeconds()
        },
        re

      dt.g = dt.hours > 12 ? dt.hours - 12 : dt.hours

      re = {
        Y: dt.fullyear,
        y: dt.year,
        m: dt.month < 10 ? '0' + dt.month : dt.month,
        n: dt.month,
        d: dt.date < 10 ? '0' + dt.date : dt.date,
        j: dt.date,
        H: dt.hours < 10 ? '0' + dt.hours : dt.hours,
        h: dt.g < 10 ? '0' + dt.g : dt.g,
        G: dt.hours,
        g: dt.g,
        i: dt.minutes < 10 ? '0' + dt.minutes : dt.minutes,
        s: dt.seconds < 10 ? '0' + dt.seconds : dt.seconds,
        W: dt.fullweek,
        w: dt.week,
        D: dt.day
      }

      for (var i in re) {
        str = str.replace(new RegExp(i, 'g'), re[i])
      }
      return str
    },
    enumerable: false
  })
}

/*-----------------部分ES6的JS实现 ending---------------*/

yua.mix({
  rword: rword,
  subscribers: subscribers,
  version: '1.0.0',
  log: log,
  ui: {}, //仅用于存放组件版本信息等
  slice: function(nodes, start, end) {
    return aslice.call(nodes, start, end)
  },
  noop: noop,
  /*如果不用Error对象封装一下，str在控制台下可能会乱码*/
  error: function(str, e) {
    throw new (e || Error)(str) // jshint ignore:line
  },
  /* yua.range(10)
     => [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
     yua.range(1, 11)
     => [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
     yua.range(0, 30, 5)
     => [0, 5, 10, 15, 20, 25]
     yua.range(0, -10, -1)
     => [0, -1, -2, -3, -4, -5, -6, -7, -8, -9]
     yua.range(0)
     => []*/
  range: function(start, end, step) {
    // 用于生成整数数组
    step || (step = 1)
    if (end == null) {
      end = start || 0
      start = 0
    }
    var index = -1,
      length = Math.max(0, Math.ceil((end - start) / step)),
      result = new Array(length)
    while (++index < length) {
      result[index] = start
      start += step
    }
    return result
  },
  deepCopy: toJson,
  eventHooks: {},
  /*绑定事件*/
  bind: function(el, type, fn, phase) {
    var hooks = yua.eventHooks
    type = type.split(',')
    yua.each(type, function(i, t) {
      t = t.trim()
      var hook = hooks[t]
      if (typeof hook === 'object') {
        type = hook.type || type
        phase = hook.phase || !!phase
        fn = hook.fix ? hook.fix(el, fn) : fn
      }
      el.addEventListener(t, fn, phase)
    })
    return fn
  },
  /*卸载事件*/
  unbind: function(el, type, fn, phase) {
    var hooks = yua.eventHooks
    type = type.split(',')
    fn = fn || noop
    yua.each(type, function(i, t) {
      t = t.trim()
      var hook = hooks[t]
      if (typeof hook === 'object') {
        type = hook.type || type
        phase = hook.phase || !!phase
      }
      el.removeEventListener(t, fn, phase)
    })
  },
  /*读写删除元素节点的样式*/
  css: function(node, name, value) {
    if (node instanceof yua) {
      node = node[0]
    }
    var prop = /[_-]/.test(name) ? camelize(name) : name,
      fn
    name = yua.cssName(prop) || prop
    if (value === void 0 || typeof value === 'boolean') {
      //获取样式
      fn = cssHooks[prop + ':get'] || cssHooks['@:get']
      if (name === 'background') {
        name = 'backgroundColor'
      }
      var val = fn(node, name)
      return value === true ? parseFloat(val) || 0 : val
    } else if (value === '') {
      //请除样式
      node.style[name] = ''
    } else {
      //设置样式
      if (value == null || value !== value) {
        return
      }
      if (isFinite(value) && !yua.cssNumber[prop]) {
        value += 'px'
      }
      fn = cssHooks[prop + ':set'] || cssHooks['@:set']
      fn(node, name, value)
    }
  },
  /*遍历数组与对象,回调的第一个参数为索引或键名,第二个或元素或键值*/
  each: function(obj, fn) {
    if (obj) {
      //排除null, undefined
      var i = 0
      if (isArrayLike(obj)) {
        for (var n = obj.length; i < n; i++) {
          if (fn(i, obj[i]) === false) break
        }
      } else {
        for (i in obj) {
          if (obj.hasOwnProperty(i) && fn(i, obj[i]) === false) {
            break
          }
        }
      }
    }
  },
  Array: {
    /*只有当前数组不存在此元素时只添加它*/
    ensure: function(target, item) {
      if (target.indexOf(item) === -1) {
        return target.push(item)
      }
    },
    /*移除数组中指定位置的元素，返回布尔表示成功与否*/
    removeAt: function(target, index) {
      return !!target.splice(index, 1).length
    },
    /*移除数组中第一个匹配传参的那个元素，返回布尔表示成功与否*/
    remove: function(target, item) {
      var index = target.indexOf(item)
      if (~index) return yua.Array.removeAt(target, index)
      return false
    }
  },
  /**
   * [ls localStorage操作]
   * @param  {[type]} name  [键名]
   * @param  {[type]} val [键值，为空时删除]
   * @return
   */
  ls: function(name, val) {
    if (!window.localStorage) return log('该浏览器不支持本地储存localStorage')

    if (this.type(name) === 'object') {
      for (var i in name) {
        localStorage.setItem(i, name[i])
      }
      return
    }
    switch (arguments.length) {
      case 1:
        return localStorage.getItem(name)
      default:
        if ((this.type(val) == 'string' && val.trim() === '') || val === null) {
          localStorage.removeItem(name)
          return
        }
        if (this.type(val) !== 'object' && this.type(val) !== 'array') {
          localStorage.setItem(name, val.toString())
        } else {
          localStorage.setItem(name, JSON.stringify(val))
        }
    }
  },
  /**
   * [cookie cookie 操作 ]
   * @param  name  [cookie名]
   * @param  value [cookie值]
   * @param  {[json]} opt   [有效期，域名，路径等]
   * @return {[boolean]}       [读取时返回对应的值，写入时返回true]
   */
  cookie: function(name, value, opt) {
    if (arguments.length > 1) {
      if (!name) return

      //设置默认的参数
      opt = opt || {}
      opt = this.mix(
        {
          expires: '',
          path: '/',
          domain: document.domain,
          secure: ''
        },
        opt
      )

      if (!value) {
        document.cookie =
          encodeURIComponent(name) +
          '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; domain=' +
          opt.domain +
          '; path=' +
          opt.path
        return true
      }
      if (opt.expires) {
        switch (opt.expires.constructor) {
          case Number:
            opt.expires =
              opt.expires === Infinity
                ? '; expires=Fri, 31 Dec 9999 23:59:59 GMT'
                : '; max-age=' + opt.expires
            break
          case String:
            opt.expires = '; expires=' + opt.expires
            break
          case Date:
            opt.expires = '; expires=' + opt.expires.toUTCString()
            break
        }
      }
      document.cookie =
        encodeURIComponent(name) +
        '=' +
        encodeURIComponent(value) +
        opt.expires +
        '; domain=' +
        opt.domain +
        '; path=' +
        opt.path +
        '; ' +
        opt.secure
      return true
    } else {
      if (!name) {
        var keys = document.cookie
          .replace(
            /((?:^|\s*;)[^\=]+)(?=;|$)|^\s*|\s*(?:\=[^;]*)?(?:\1|$)/g,
            ''
          )
          .split(/\s*(?:\=[^;]*)?;\s*/)
        for (var i = 0, len = keys.length; i < len; i++) {
          keys[i] = decodeURIComponent(keys[i])
        }
        return keys
      }
      return (
        decodeURIComponent(
          document.cookie.replace(
            new RegExp(
              '(?:(?:^|.*;)\\s*' +
                encodeURIComponent(name).replace(/[\-\.\+\*]/g, '\\$&') +
                '\\s*\\=\\s*([^;]*).*$)|^.*$'
            ),
            '$1'
          )
        ) || null
      )
    }
  },
  //获取url的参数
  search: function(key) {
    key += ''
    var uri = location.search

    if (!key || !uri) return null

    uri = uri.slice(1)
    uri = uri.split('&')

    var obj = {}
    for (var i = 0, item; (item = uri[i++]); ) {
      var tmp = item.split('=')
      tmp[1] = tmp.length < 2 ? null : tmp[1]
      tmp[1] = decodeURIComponent(tmp[1])
      if (obj.hasOwnProperty(tmp[0])) {
        if (typeof obj[tmp[0]] === 'object') {
          obj[tmp[0]].push(tmp[1])
        } else {
          obj[tmp[0]] = [obj[tmp[0]]]
          obj[tmp[0]].push(tmp[1])
        }
      } else {
        obj[tmp[0]] = tmp[1]
      }
    }
    return obj.hasOwnProperty(key) ? obj[key] : null
  },
  //复制文本到粘贴板
  copy: function(txt) {
    if (!DOC.queryCommandSupported || !DOC.queryCommandSupported('copy'))
      return log('该浏览器不支持复制到粘贴板')

    var ta = DOC.createElement('textarea')
    ta.textContent = txt
    ta.style.position = 'fixed'
    ta.style.bottom = '-1000px'
    DOC.body.appendChild(ta)
    ta.select()
    try {
      DOC.execCommand('copy')
    } catch (err) {
      log('复制到粘贴板失败')
    }
    DOC.body.removeChild(ta)
  }
})

var bindingHandlers = (yua.bindingHandlers = {})
var bindingExecutors = (yua.bindingExecutors = {})

var directives = (yua.directives = {})
yua.directive = function(name, obj) {
  bindingHandlers[name] = obj.init = obj.init || noop
  bindingExecutors[name] = obj.update = obj.update || noop
  return (directives[name] = obj)
}

/*判定是否类数组，如节点集合，纯数组，arguments与拥有非负整数的length属性的纯JS对象*/
function isArrayLike(obj) {
  if (obj && typeof obj === 'object') {
    var n = obj.length,
      str = serialize.call(obj)
    if (/(Array|List|Collection|Map|Arguments)\]$/.test(str)) {
      return true
    } else if (str === '[object Object]' && n === n >>> 0) {
      return true //由于ecma262v5能修改对象属性的enumerable，因此不能用propertyIsEnumerable来判定了
    }
  }
  return false
}

// https://github.com/rsms/js-lru
var Cache = new function() {
  // jshint ignore:line
  function LRU(maxLength) {
    this.size = 0
    this.limit = maxLength
    this.head = this.tail = void 0
    this._keymap = {}
  }

  var p = LRU.prototype

  p.put = function(key, value) {
    var entry = {
      key: key,
      value: value
    }
    this._keymap[key] = entry
    if (this.tail) {
      this.tail.newer = entry
      entry.older = this.tail
    } else {
      this.head = entry
    }
    this.tail = entry
    if (this.size === this.limit) {
      this.shift()
    } else {
      this.size++
    }
    return value
  }

  p.shift = function() {
    var entry = this.head
    if (entry) {
      this.head = this.head.newer
      this.head.older = entry.newer = entry.older = this._keymap[
        entry.key
      ] = void 0
      delete this._keymap[entry.key] //#1029
    }
  }
  p.get = function(key) {
    var entry = this._keymap[key]
    if (entry === void 0) return
    if (entry === this.tail) {
      return entry.value
    }
    // HEAD--------------TAIL
    //   <.older   .newer>
    //  <--- add direction --
    //   A  B  C  <D>  E
    if (entry.newer) {
      if (entry === this.head) {
        this.head = entry.newer
      }
      entry.newer.older = entry.older // C <-- E.
    }
    if (entry.older) {
      entry.older.newer = entry.newer // C. --> E
    }
    entry.newer = void 0 // D --x
    entry.older = this.tail // D. --> E
    if (this.tail) {
      this.tail.newer = entry // E. <-- D
    }
    this.tail = entry
    return entry.value
  }
  return LRU
}() // jshint ignore:line

/*********************************************************************
 *                           DOM 底层补丁                             *
 **********************************************************************/

//safari5+是把contains方法放在Element.prototype上而不是Node.prototype
if (!DOC.contains) {
  Node.prototype.contains = function(arg) {
    return !!(this.compareDocumentPosition(arg) & 16)
  }
}
yua.contains = function(root, el) {
  try {
    while ((el = el.parentNode)) if (el === root) return true
    return false
  } catch (e) {
    return false
  }
}

if (window.SVGElement) {
  var svgns = 'http://www.w3.org/2000/svg'
  var svg = DOC.createElementNS(svgns, 'svg')
  svg.innerHTML = '<circle cx="50" cy="50" r="40" fill="red" />'
  if (!rsvg.test(svg.firstChild)) {
    // #409
    /* jshint ignore:start */
    function enumerateNode(node, targetNode) {
      if (node && node.childNodes) {
        var nodes = node.childNodes
        for (var i = 0, el; (el = nodes[i++]); ) {
          if (el.tagName) {
            var svg = DOC.createElementNS(svgns, el.tagName.toLowerCase())
            // copy attrs
            ap.forEach.call(el.attributes, function(attr) {
              svg.setAttribute(attr.name, attr.value)
            })
            // 递归处理子节点
            enumerateNode(el, svg)
            targetNode.appendChild(svg)
          }
        }
      }
    }
    /* jshint ignore:end */
    Object.defineProperties(SVGElement.prototype, {
      outerHTML: {
        //IE9-11,firefox不支持SVG元素的innerHTML,outerHTML属性
        enumerable: true,
        configurable: true,
        get: function() {
          return new XMLSerializer().serializeToString(this)
        },
        set: function(html) {
          var tagName = this.tagName.toLowerCase(),
            par = this.parentNode,
            frag = yua.parseHTML(html)
          // 操作的svg，直接插入
          if (tagName === 'svg') {
            par.insertBefore(frag, this)
            // svg节点的子节点类似
          } else {
            var newFrag = DOC.createDocumentFragment()
            enumerateNode(frag, newFrag)
            par.insertBefore(newFrag, this)
          }
          par.removeChild(this)
        }
      },
      innerHTML: {
        enumerable: true,
        configurable: true,
        get: function() {
          var s = this.outerHTML
          var ropen = new RegExp(
            '<' + this.nodeName + '\\b(?:(["\'])[^"]*?(\\1)|[^>])*>',
            'i'
          )
          var rclose = new RegExp('</' + this.nodeName + '>$', 'i')
          return s.replace(ropen, '').replace(rclose, '')
        },
        set: function(html) {
          if (yua.clearHTML) {
            yua.clearHTML(this)
            var frag = yua.parseHTML(html)
            enumerateNode(frag, this)
          }
        }
      }
    })
  }
}

//========================= event binding ====================

var eventHooks = yua.eventHooks

//针对firefox, chrome修正mouseenter, mouseleave(chrome30+)
if (!('onmouseenter' in root)) {
  yua.each(
    {
      mouseenter: 'mouseover',
      mouseleave: 'mouseout'
    },
    function(origType, fixType) {
      eventHooks[origType] = {
        type: fixType,
        fix: function(elem, fn) {
          return function(e) {
            var t = e.relatedTarget
            if (!t || (t !== elem && !(elem.compareDocumentPosition(t) & 16))) {
              delete e.type
              e.type = origType
              return fn.call(elem, e)
            }
          }
        }
      }
    }
  )
}

//针对IE9+, w3c修正animationend
yua.each(
  {
    AnimationEvent: 'animationend',
    WebKitAnimationEvent: 'webkitAnimationEnd'
  },
  function(construct, fixType) {
    if (window[construct] && !eventHooks.animationend) {
      eventHooks.animationend = {
        type: fixType
      }
    }
  }
)

if (DOC.onmousewheel === void 0) {
  /* IE6-11 chrome mousewheel wheelDetla 下 -120 上 120
     firefox DOMMouseScroll detail 下3 上-3
     firefox wheel detlaY 下3 上-3
     IE9-11 wheel deltaY 下40 上-40
     chrome wheel deltaY 下100 上-100 */
  eventHooks.mousewheel = {
    type: 'wheel',
    fix: function(elem, fn) {
      return function(e) {
        e.wheelDeltaY = e.wheelDelta = e.deltaY > 0 ? -120 : 120
        e.wheelDeltaX = 0
        Object.defineProperty(e, 'type', {
          value: 'mousewheel'
        })
        fn.call(elem, e)
      }
    }
  }
}

/*********************************************************************
 *                           配置系统                                 *
 **********************************************************************/

function kernel(settings) {
  for (var p in settings) {
    if (!ohasOwn.call(settings, p)) continue
    var val = settings[p]
    if (typeof kernel.plugins[p] === 'function') {
      kernel.plugins[p](val)
    } else if (typeof kernel[p] === 'object') {
      yua.mix(kernel[p], val)
    } else {
      kernel[p] = val
    }
  }
  return this
}
yua.config = kernel

var openTag,
  closeTag,
  rexpr,
  rexprg,
  rbind,
  rregexp = /[-.*+?^${}()|[\]\/\\]/g

function escapeRegExp(target) {
  //http://stevenlevithan.com/regex/xregexp/
  //将字符串安全格式化为正则表达式的源码
  return (target + '').replace(rregexp, '\\$&')
}

var plugins = {
  interpolate: function(array) {
    openTag = array[0]
    closeTag = array[1]
    if (openTag === closeTag) {
      throw new SyntaxError('openTag!==closeTag')
      var test = openTag + 'test' + closeTag
      cinerator.innerHTML = test
      if (
        cinerator.innerHTML !== test &&
        cinerator.innerHTML.indexOf('&lt;') > -1
      ) {
        throw new SyntaxError('此定界符不合法')
      }
      cinerator.innerHTML = ''
    }
    kernel.openTag = openTag
    kernel.closeTag = closeTag
    var o = escapeRegExp(openTag),
      c = escapeRegExp(closeTag)
    rexpr = new RegExp(o + '([\\s\\S]*)' + c)
    rexprg = new RegExp(o + '([\\s\\S]*)' + c, 'g')
    rbind = new RegExp(o + '[\\s\\S]*' + c + '|\\s:') //此处有疑问
  }
}
kernel.plugins = plugins
kernel.plugins['interpolate'](['{{', '}}'])

kernel.async = true
kernel.paths = {}
kernel.shim = {}
kernel.maxRepeatSize = 100

function $watch(expr, binding) {
  var $events = this.$events || (this.$events = {}),
    queue = $events[expr] || ($events[expr] = [])

  if (typeof binding === 'function') {
    var backup = binding
    backup.uuid = '_' + ++bindingID
    binding = {
      element: root,
      type: 'user-watcher',
      handler: noop,
      vmodels: [this],
      expr: expr,
      uuid: backup.uuid
    }
    binding.wildcard = /\*/.test(expr)
  }

  if (!binding.update) {
    if (/\w\.*\B/.test(expr) || expr === '*') {
      binding.getter = noop
      var host = this
      binding.update = function() {
        var args = this.fireArgs || []
        if (args[2]) binding.handler.apply(host, args)
        delete this.fireArgs
      }
      queue.sync = true
      yua.Array.ensure(queue, binding)
    } else {
      yua.injectBinding(binding)
    }
    if (backup) {
      binding.handler = backup
    }
  } else if (!binding.oneTime) {
    yua.Array.ensure(queue, binding)
  }

  return function() {
    binding.update = binding.getter = binding.handler = noop
    binding.element = DOC.createElement('a')
  }
}

function $emit(key, args) {
  var event = this.$events
  if (event && event[key]) {
    if (args) {
      args[2] = key
    }
    var arr = event[key]
    notifySubscribers(arr, args)
    if (args && event['*'] && !/\./.test(key)) {
      for (var sub, k = 0; (sub = event['*'][k++]); ) {
        try {
          sub.handler.apply(this, args)
        } catch (e) {}
      }
    }
    var parent = this.$up
    if (parent) {
      if (this.$pathname) {
        $emit.call(parent, this.$pathname + '.' + key, args) //以确切的值往上冒泡
      }
      $emit.call(parent, '*.' + key, args) //以模糊的值往上冒泡
    }
  } else {
    parent = this.$up
    if (this.$ups) {
      for (var i in this.$ups) {
        $emit.call(this.$ups[i], i + '.' + key, args) //以确切的值往上冒泡
      }
      return
    }
    if (parent) {
      var p = this.$pathname
      if (p === '') p = '*'
      var path = p + '.' + key
      arr = path.split('.')

      args = (args && args.concat([path, key])) || [path, key]

      if (arr.indexOf('*') === -1) {
        $emit.call(parent, path, args) //以确切的值往上冒泡
        arr[1] = '*'
        $emit.call(parent, arr.join('.'), args) //以模糊的值往上冒泡
      } else {
        $emit.call(parent, path, args) //以确切的值往上冒泡
      }
    }
  }
}

function collectDependency(el, key) {
  do {
    if (el.$watch) {
      var e = el.$events || (el.$events = {})
      var array = e[key] || (e[key] = [])
      dependencyDetection.collectDependency(array)
      return
    }
    el = el.$up
    if (el) {
      key = el.$pathname + '.' + key
    } else {
      break
    }
  } while (true)
}

function notifySubscribers(subs, args) {
  if (!subs) return
  if (new Date() - beginTime > 444 && typeof subs[0] === 'object') {
    rejectDisposeQueue()
  }
  var users = [],
    renders = []
  for (var i = 0, sub; (sub = subs[i++]); ) {
    if (sub.type === 'user-watcher') {
      users.push(sub)
    } else {
      renders.push(sub)
    }
  }
  if (kernel.async) {
    buffer.render() //1
    for (i = 0; (sub = renders[i++]); ) {
      if (sub.update) {
        sub.uuid = sub.uuid || '_' + ++bindingID
        var uuid = sub.uuid
        if (!buffer.queue[uuid]) {
          buffer.queue[uuid] = '__'
          buffer.queue.push(sub)
        }
      }
    }
  } else {
    for (i = 0; (sub = renders[i++]); ) {
      if (sub.update) {
        sub.update() //最小化刷新DOM树
      }
    }
  }
  for (i = 0; (sub = users[i++]); ) {
    if ((args && args[2] === sub.expr) || sub.wildcard) {
      sub.fireArgs = args
    }
    sub.update()
  }
}

//一些不需要被监听的属性
var $$skipArray = oneObject(
  '$id,$watch,$fire,$events,$model,$skipArray,$active,$pathname,$up,$ups,$track,$accessors'
)

//如果浏览器不支持ecma262v5的Object.defineProperties或者存在BUG，比如IE8
//标准浏览器使用__defineGetter__, __defineSetter__实现

function modelFactory(source, options) {
  options = options || {}
  options.watch = true
  return observeObject(source, options)
}

//监听对象属性值的变化(注意,数组元素不是数组的属性),通过对劫持当前对象的访问器实现
//监听对象或数组的结构变化, 对对象的键值对进行增删重排, 或对数组的进行增删重排,都属于这范畴
//   通过比较前后代理VM顺序实现
function Component() {}

function observeObject(source, options) {
  if (
    !source ||
    (source.$id && source.$accessors) ||
    (source.nodeName && source.nodeType > 0)
  ) {
    return source
  }
  //source为原对象,不能是元素节点或null
  //options,可选,配置对象,里面有old, force, watch这三个属性
  options = options || nullObject
  var force = options.force || nullObject
  var old = options.old
  var oldAccessors = (old && old.$accessors) || nullObject
  var $vmodel = new Component() //要返回的对象, 它在IE6-8下可能被偷龙转凤
  var accessors = {} //监控属性
  var hasOwn = {}
  var skip = []
  var simple = []
  var $skipArray = {}
  if (source.$skipArray) {
    $skipArray = oneObject(source.$skipArray)
    delete source.$skipArray
  }
  //处理计算属性
  var computed = source.$computed
  if (computed) {
    delete source.$computed
    for (var name in computed) {
      hasOwn[name] = true
      ;(function(key, value) {
        var old
        if (typeof value === 'function') {
          value = { get: value, set: noop }
        }
        if (typeof value.set !== 'function') {
          value.set = noop
        }
        accessors[key] = {
          get: function() {
            return (old = value.get.call(this))
          },
          set: function(x) {
            var older = old,
              newer
            value.set.call(this, x)
            newer = this[key]
            if (this.$fire && newer !== older) {
              this.$fire(key, newer, older)
            }
          },
          enumerable: true,
          configurable: true
        }
      })(name, computed[name]) // jshint ignore:line
    }
  }

  for (name in source) {
    var value = source[name]
    if (!$$skipArray[name]) hasOwn[name] = true
    if (
      typeof value === 'function' ||
      (value && value.nodeName && value.nodeType > 0) ||
      (!force[name] &&
        (name.charAt(0) === '$' || $$skipArray[name] || $skipArray[name]))
    ) {
      skip.push(name)
    } else if (isComputed(value)) {
      log('warning:计算属性建议放在$computed对象中统一定义')
      ;(function(key, value) {
        var old
        if (typeof value === 'function') {
          value = { get: value, set: noop }
        }
        if (typeof value.set !== 'function') {
          value.set = noop
        }
        accessors[key] = {
          get: function() {
            return (old = value.get.call(this))
          },
          set: function(x) {
            var older = old,
              newer
            value.set.call(this, x)
            newer = this[key]
            if (this.$fire && newer !== older) {
              this.$fire(key, newer, older)
            }
          },
          enumerable: true,
          configurable: true
        }
      })(name, value) // jshint ignore:line
    } else {
      simple.push(name)
      if (oldAccessors[name]) {
        accessors[name] = oldAccessors[name]
      } else {
        accessors[name] = makeGetSet(name, value)
      }
    }
  }

  accessors['$model'] = $modelDescriptor
  $vmodel = Object.defineProperties($vmodel, accessors, source)
  function trackBy(name) {
    return hasOwn[name] === true
  }
  skip.forEach(function(name) {
    $vmodel[name] = source[name]
  })

  /* jshint ignore:start */
  hideProperty($vmodel, '$ups', null)
  hideProperty($vmodel, '$id', 'anonymous')
  hideProperty($vmodel, '$up', old ? old.$up : null)
  hideProperty($vmodel, '$track', Object.keys(hasOwn))
  hideProperty($vmodel, '$active', false)
  hideProperty($vmodel, '$pathname', old ? old.$pathname : '')
  hideProperty($vmodel, '$accessors', accessors)
  hideProperty($vmodel, 'hasOwnProperty', trackBy)
  if (options.watch) {
    hideProperty($vmodel, '$watch', function() {
      return $watch.apply($vmodel, arguments)
    })
    hideProperty($vmodel, '$fire', function(path, a) {
      if (path.indexOf('all!') === 0) {
        var ee = path.slice(4)
        for (var i in yua.vmodels) {
          var v = yua.vmodels[i]
          v.$fire && v.$fire.apply(v, [ee, a])
        }
      } else {
        $emit.call($vmodel, path, [a])
      }
    })
  }
  /* jshint ignore:end */

  //必须设置了$active,$events
  simple.forEach(function(name) {
    var oldVal = old && old[name]
    var val = ($vmodel[name] = source[name])
    if (val && typeof val === 'object') {
      val.$up = $vmodel
      val.$pathname = name
    }
    $emit.call($vmodel, name, [val, oldVal])
  })
  for (name in computed) {
    value = $vmodel[name]
  }
  $vmodel.$active = true

  return $vmodel
}

/*
 新的VM拥有如下私有属性
 $id: vm.id
 $events: 放置$watch回调与绑定对象
 $watch: 增强版$watch
 $fire: 触发$watch回调
 $track:一个数组,里面包含用户定义的所有键名
 $active:boolean,false时防止依赖收集
 $model:返回一个纯净的JS对象
 $accessors:放置所有读写器的数据描述对象
 $up:返回其上级对象
 $pathname:返回此对象在上级对象的名字,注意,数组元素的$pathname为空字符串
 =============================
 $skipArray:用于指定不可监听的属性,但VM生成是没有此属性的
 */
function isComputed(val) {
  //speed up!
  if (val && typeof val === 'object') {
    for (var i in val) {
      if (i !== 'get' && i !== 'set') {
        return false
      }
    }
    return typeof val.get === 'function'
  }
}
function makeGetSet(key, value) {
  var childVm,
    value = NaN
  return {
    get: function() {
      if (this.$active) {
        collectDependency(this, key)
      }
      return value
    },
    set: function(newVal) {
      if (value === newVal) return
      var oldValue = value
      childVm = observe(newVal, value)
      if (childVm) {
        value = childVm
      } else {
        childVm = void 0
        value = newVal
      }

      if (Object(childVm) === childVm) {
        childVm.$pathname = key
        childVm.$up = this
      }
      if (this.$active) {
        $emit.call(this, key, [value, oldValue])
      }
    },
    enumerable: true,
    configurable: true
  }
}

function observe(obj, old, hasReturn, watch) {
  if (Array.isArray(obj)) {
    return observeArray(obj, old, watch)
  } else if (yua.isPlainObject(obj)) {
    if (old && typeof old === 'object') {
      var keys = Object.keys(obj)
      var keys2 = Object.keys(old)
      if (keys.join(';') === keys2.join(';')) {
        for (var i in obj) {
          if (obj.hasOwnProperty(i)) {
            old[i] = obj[i]
          }
        }
        return old
      }
      old.$active = false
    }
    return observeObject(obj, {
      old: old,
      watch: watch
    })
  }
  if (hasReturn) {
    return obj
  }
}

function observeArray(array, old, watch) {
  if (old && old.splice) {
    var args = [0, old.length].concat(array)
    old.splice.apply(old, args)
    return old
  } else {
    for (var i in newProto) {
      array[i] = newProto[i]
    }
    hideProperty(array, '$up', null)
    hideProperty(array, '$pathname', '')
    hideProperty(array, '$track', createTrack(array.length))

    array._ = observeObject(
      {
        length: NaN
      },
      {
        watch: true
      }
    )
    array._.length = array.length
    array._.$watch('length', function(a, b) {
      $emit.call(array.$up, array.$pathname + '.length', [a, b])
    })
    if (watch) {
      hideProperty(array, '$watch', function() {
        return $watch.apply(array, arguments)
      })
    }

    Object.defineProperty(array, '$model', $modelDescriptor)

    for (var j = 0, n = array.length; j < n; j++) {
      var el = (array[j] = observe(array[j], 0, 1, 1))
      if (Object(el) === el) {
        //#1077
        el.$up = array
      }
    }

    return array
  }
}

function hideProperty(host, name, value) {
  Object.defineProperty(host, name, {
    value: value,
    writable: true,
    enumerable: false,
    configurable: true
  })
}

function toJson(val) {
  var xtype = yua.type(val)
  if (xtype === 'array') {
    var array = []
    for (var i = 0; i < val.length; i++) {
      array[i] = toJson(val[i])
    }
    return array
  } else if (xtype === 'object') {
    var obj = {}
    for (i in val) {
      if (val.hasOwnProperty(i)) {
        var value = val[i]
        obj[i] = value && value.nodeType ? value : toJson(value)
      }
    }
    return obj
  }
  return val
}

var $modelDescriptor = {
  get: function() {
    return toJson(this)
  },
  set: noop,
  enumerable: false,
  configurable: true
}

/*********************************************************************
 *          监控数组（:repeat配合使用）                     *
 **********************************************************************/

var arrayMethods = ['push', 'pop', 'shift', 'unshift', 'splice']
var arrayProto = Array.prototype
var newProto = {
  notify: function() {
    $emit.call(this.$up, this.$pathname)
  },
  set: function(index, val) {
    if (index >>> 0 === index && this[index] !== val) {
      if (index > this.length) {
        throw Error(index + 'set方法的第一个参数不能大于原数组长度')
      }
      $emit.call(this.$up, this.$pathname + '.*', [val, this[index]])
      this.splice(index, 1, val)
    }
  },
  contains: function(el) {
    //判定是否包含
    return this.indexOf(el) !== -1
  },
  ensure: function(el) {
    if (!this.contains(el)) {
      //只有不存在才push
      this.push(el)
    }
    return this
  },
  pushArray: function(arr) {
    return this.push.apply(this, arr)
  },
  remove: function(el) {
    //移除第一个等于给定值的元素
    return this.removeAt(this.indexOf(el))
  },
  removeAt: function(index) {
    //移除指定索引上的元素
    if (index >>> 0 === index) {
      return this.splice(index, 1)
    }
    return []
  },
  size: function() {
    //取得数组长度，这个函数可以同步视图，length不能
    return this._.length
  },
  removeAll: function(all) {
    //移除N个元素
    if (Array.isArray(all)) {
      for (var i = this.length - 1; i >= 0; i--) {
        if (all.indexOf(this[i]) !== -1) {
          _splice.call(this.$track, i, 1)
          _splice.call(this, i, 1)
        }
      }
    } else if (typeof all === 'function') {
      for (i = this.length - 1; i >= 0; i--) {
        var el = this[i]
        if (all(el, i)) {
          _splice.call(this.$track, i, 1)
          _splice.call(this, i, 1)
        }
      }
    } else {
      _splice.call(this.$track, 0, this.length)
      _splice.call(this, 0, this.length)
    }
    if (!W3C) {
      this.$model = toJson(this)
    }
    this.notify()
    this._.length = this.length
  },
  clear: function() {
    this.removeAll()
  }
}

var _splice = arrayProto.splice
arrayMethods.forEach(function(method) {
  var original = arrayProto[method]
  newProto[method] = function() {
    // 继续尝试劫持数组元素的属性
    var args = []
    for (var i = 0, n = arguments.length; i < n; i++) {
      args[i] = observe(arguments[i], 0, 1, 1)
    }
    var result = original.apply(this, args)
    addTrack(this.$track, method, args)
    if (!W3C) {
      this.$model = toJson(this)
    }
    this.notify()
    this._.length = this.length
    return result
  }
})

'sort,reverse'.replace(rword, function(method) {
  newProto[method] = function() {
    var oldArray = this.concat() //保持原来状态的旧数组
    var newArray = this
    var mask = Math.random()
    var indexes = []
    var hasSort = false
    arrayProto[method].apply(newArray, arguments) //排序
    for (var i = 0, n = oldArray.length; i < n; i++) {
      var neo = newArray[i]
      var old = oldArray[i]
      if (neo === old) {
        indexes.push(i)
      } else {
        var index = oldArray.indexOf(neo)
        indexes.push(index) //得到新数组的每个元素在旧数组对应的位置
        oldArray[index] = mask //屏蔽已经找过的元素
        hasSort = true
      }
    }
    if (hasSort) {
      sortByIndex(this.$track, indexes)
      if (!W3C) {
        this.$model = toJson(this)
      }
      this.notify()
    }
    return this
  }
})

function sortByIndex(array, indexes) {
  var map = {}
  for (var i = 0, n = indexes.length; i < n; i++) {
    map[i] = array[i]
    var j = indexes[i]
    if (j in map) {
      array[i] = map[j]
      delete map[j]
    } else {
      array[i] = array[j]
    }
  }
}

function createTrack(n) {
  var ret = []
  for (var i = 0; i < n; i++) {
    ret[i] = generateID('$proxy$each')
  }
  return ret
}

function addTrack(track, method, args) {
  switch (method) {
    case 'push':
    case 'unshift':
      args = createTrack(args.length)
      break
    case 'splice':
      if (args.length > 2) {
        // 0, 5, a, b, c --> 0, 2, 0
        // 0, 5, a, b, c, d, e, f, g--> 0, 0, 3
        var del = args[1]
        var add = args.length - 2
        // args = [args[0], Math.max(del - add, 0)].concat(createTrack(Math.max(add - del, 0)))
        args = [args[0], args[1]].concat(createTrack(args.length - 2))
      }
      break
  }
  Array.prototype[method].apply(track, args)
}

/*********************************************************************
 *                           依赖调度系统                              *
 **********************************************************************/

//检测两个对象间的依赖关系
var dependencyDetection = (function() {
  var outerFrames = []
  var currentFrame
  return {
    begin: function(binding) {
      //accessorObject为一个拥有callback的对象
      outerFrames.push(currentFrame)
      currentFrame = binding
    },
    end: function() {
      currentFrame = outerFrames.pop()
    },
    collectDependency: function(array) {
      if (currentFrame) {
        //被dependencyDetection.begin调用
        currentFrame.callback(array)
      }
    }
  }
})()

//将绑定对象注入到其依赖项的订阅数组中
var roneval = /^on$/

function returnRandom() {
  return new Date() - 0
}

yua.injectBinding = function(binding) {
  binding.handler = binding.handler || directives[binding.type].update || noop
  binding.update = function() {
    var begin = false
    if (!binding.getter) {
      begin = true
      dependencyDetection.begin({
        callback: function(array) {
          injectDependency(array, binding)
        }
      })
      binding.getter = parseExpr(binding.expr, binding.vmodels, binding)
      binding.observers.forEach(function(a) {
        a.v.$watch(a.p, binding)
      })
      delete binding.observers
    }
    try {
      var args = binding.fireArgs,
        a,
        b
      delete binding.fireArgs
      if (!args) {
        if (binding.type === 'on') {
          a = binding.getter + ''
        } else {
          try {
            a = binding.getter.apply(0, binding.args)
          } catch (e) {
            a = null
          }
        }
      } else {
        a = args[0]
        b = args[1]
      }
      b = typeof b === 'undefined' ? binding.oldValue : b
      if (binding._filters) {
        a = filters.$filter.apply(0, [a].concat(binding._filters))
      }
      if (binding.signature) {
        var xtype = yua.type(a)
        if (xtype !== 'array' && xtype !== 'object') {
          throw Error('warning:' + binding.expr + '只能是对象或数组')
        }
        binding.xtype = xtype
        var vtrack = getProxyIds(binding.proxies || [], xtype)
        var mtrack =
          a.$track ||
          (xtype === 'array' ? createTrack(a.length) : Object.keys(a))
        binding.track = mtrack
        if (vtrack !== mtrack.join(';')) {
          binding.handler(a, b)
          binding.oldValue = 1
        }
      } else if (Array.isArray(a) ? a.length !== (b && b.length) : false) {
        binding.handler(a, b)
        binding.oldValue = a.concat()
      } else if (!('oldValue' in binding) || a !== b) {
        binding.handler(a, b)
        binding.oldValue = Array.isArray(a) ? a.concat() : a
      }
    } catch (e) {
      delete binding.getter
      log('warning:exception throwed in [yua.injectBinding] ', e)
      var node = binding.element
      if (node && node.nodeType === 3) {
        node.nodeValue =
          openTag + (binding.oneTime ? '::' : '') + binding.expr + closeTag
      }
    } finally {
      begin && dependencyDetection.end()
    }
  }
  binding.update()
}

//将依赖项(比它高层的访问器或构建视图刷新函数的绑定对象)注入到订阅者数组
function injectDependency(list, binding) {
  if (binding.oneTime) return
  if (list && yua.Array.ensure(list, binding) && binding.element) {
    injectDisposeQueue(binding, list)
    if (new Date() - beginTime > 444) {
      rejectDisposeQueue()
    }
  }
}

function getProxyIds(a, isArray) {
  var ret = []
  for (var i = 0, el; (el = a[i++]); ) {
    ret.push(isArray ? el.$id : el.$key)
  }
  return ret.join(';')
}

/*********************************************************************
 *                     定时GC回收机制 (基于1.6基于频率的GC)                *
 **********************************************************************/

var disposeQueue = (yua.$$subscribers = [])
var beginTime = new Date()

//添加到回收列队中
function injectDisposeQueue(data, list) {
  data.list = list
  data.i = ~~data.i
  if (!data.uuid) {
    data.uuid = '_' + ++bindingID
  }
  if (!disposeQueue[data.uuid]) {
    disposeQueue[data.uuid] = '__'
    disposeQueue.push(data)
  }
}

var lastGCIndex = 0
function rejectDisposeQueue(data) {
  var i = lastGCIndex || disposeQueue.length
  var threshold = 0
  while ((data = disposeQueue[--i])) {
    if (data.i < 7) {
      if (data.element === null) {
        disposeQueue.splice(i, 1)
        if (data.list) {
          yua.Array.remove(data.list, data)
          delete disposeQueue[data.uuid]
        }
        continue
      }
      if (shouldDispose(data.element)) {
        //如果它的虚拟DOM不在VTree上或其属性不在VM上
        disposeQueue.splice(i, 1)
        yua.Array.remove(data.list, data)
        disposeData(data)
        //yua会在每次全量更新时,比较上次执行时间,
        //假若距离上次有半秒,就会发起一次GC,并且只检测当中的500个绑定
        //而一个正常的页面不会超过2000个绑定(500即取其4分之一)
        //用户频繁操作页面,那么2,3秒内就把所有绑定检测一遍,将无效的绑定移除
        if (threshold++ > 500) {
          lastGCIndex = i
          break
        }
        continue
      }
      data.i++
      //基于检测频率，如果检测过7次，可以认为其是长久存在的节点，那么以后每7次才检测一次
      if (data.i === 7) {
        data.i = 14
      }
    } else {
      data.i--
    }
  }
  beginTime = new Date()
}

function disposeData(data) {
  delete disposeQueue[data.uuid] // 先清除，不然无法回收了
  data.element = null
  data.rollback && data.rollback()
  for (var key in data) {
    data[key] = null
  }
}

function shouldDispose(el) {
  try {
    //IE下，如果文本节点脱离DOM树，访问parentNode会报错
    var fireError = el.parentNode.nodeType
  } catch (e) {
    return true
  }
  if (el.ifRemove) {
    // 如果节点被放到ifGroup，才移除
    if (!root.contains(el.ifRemove) && ifGroup === el.parentNode) {
      el.parentNode && el.parentNode.removeChild(el)
      return true
    }
  }
  return el.msRetain
    ? 0
    : el.nodeType === 1 ? !root.contains(el) : !yua.contains(root, el)
}

/************************************************************************
 *              HTML处理(parseHTML, innerHTML, clearHTML)                *
 *************************************************************************/

//parseHTML的辅助变量
var tagHooks = new function() {
  // jshint ignore:line
  yua.mix(this, {
    option: DOC.createElement('select'),
    thead: DOC.createElement('table'),
    td: DOC.createElement('tr'),
    area: DOC.createElement('map'),
    tr: DOC.createElement('tbody'),
    col: DOC.createElement('colgroup'),
    legend: DOC.createElement('fieldset'),
    _default: DOC.createElement('div'),
    g: DOC.createElementNS('http://www.w3.org/2000/svg', 'svg')
  })
  this.optgroup = this.option
  this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
  this.th = this.td
}() // jshint ignore:line
String(
  'circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use'
).replace(rword, function(tag) {
  tagHooks[tag] = tagHooks.g //处理SVG
})

var rtagName = /<([\w:]+)/
var rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/gi
var scriptTypes = oneObject([
  '',
  'text/javascript',
  'text/ecmascript',
  'application/ecmascript',
  'application/javascript'
])
var script = DOC.createElement('script')
var rhtml = /<|&#?\w+;/

yua.parseHTML = function(html) {
  var fragment = yuaFragment.cloneNode(false)
  if (typeof html !== 'string') {
    return fragment
  }
  if (!rhtml.test(html)) {
    fragment.appendChild(DOC.createTextNode(html))
    return fragment
  }
  html = html.replace(rxhtml, '<$1></$2>').trim()
  var tag = (rtagName.exec(html) || ['', ''])[1].toLowerCase(),
    //取得其标签名
    wrapper = tagHooks[tag] || tagHooks._default,
    firstChild
  wrapper.innerHTML = html
  var els = wrapper.getElementsByTagName('script')
  if (els.length) {
    //使用innerHTML生成的script节点不会发出请求与执行text属性
    for (var i = 0, el; (el = els[i++]); ) {
      if (scriptTypes[el.type]) {
        var neo = script.cloneNode(false) //FF不能省略参数
        ap.forEach.call(el.attributes, function(attr) {
          neo.setAttribute(attr.name, attr.value)
        }) // jshint ignore:line
        neo.text = el.text
        el.parentNode.replaceChild(neo, el)
      }
    }
  }

  while ((firstChild = wrapper.firstChild)) {
    // 将wrapper上的节点转移到文档碎片上！
    fragment.appendChild(firstChild)
  }
  return fragment
}

yua.innerHTML = function(node, html) {
  var a = this.parseHTML(html)
  this.clearHTML(node).appendChild(a)
}

yua.clearHTML = function(node) {
  node.textContent = ''
  while (node.firstChild) {
    node.removeChild(node.firstChild)
  }
  return node
}

/*********************************************************************
 *                        yua的原型方法定义区                       *
 **********************************************************************/

function hyphen(target) {
  //转换为连字符线风格
  return target.replace(/([a-z\d])([A-Z]+)/g, '$1-$2').toLowerCase()
}

function camelize(target) {
  //转换为驼峰风格
  if (target.indexOf('-') < 0 && target.indexOf('_') < 0) {
    return target //提前判断，提高getStyle等的效率
  }
  return target.replace(/[-_][^-_]/g, function(match) {
    return match.charAt(1).toUpperCase()
  })
}

'add,remove'.replace(rword, function(method) {
  yua.fn[method + 'Class'] = function(cls) {
    var el = this[0]
    //https://developer.mozilla.org/zh-CN/docs/Mozilla/Firefox/Releases/26
    if (cls && typeof cls === 'string' && el && el.nodeType === 1) {
      cls.replace(/\S+/g, function(c) {
        el.classList[method](c)
      })
    }
    return this
  }
})

yua.fn.mix({
  hasClass: function(cls) {
    var el = this[0] || {} //IE10+, chrome8+, firefox3.6+, safari5.1+,opera11.5+支持classList,chrome24+,firefox26+支持classList2.0
    return el.nodeType === 1 && el.classList.contains(cls)
  },
  toggleClass: function(value, stateVal) {
    var className,
      i = 0
    var classNames = String(value).match(/\S+/g) || []
    var isBool = typeof stateVal === 'boolean'
    while ((className = classNames[i++])) {
      var state = isBool ? stateVal : !this.hasClass(className)
      this[state ? 'addClass' : 'removeClass'](className)
    }
    return this
  },
  attr: function(name, value) {
    if (arguments.length === 2) {
      this[0].setAttribute(name, value)
      return this
    } else {
      return this[0].getAttribute(name)
    }
  },
  data: function(name, value) {
    name = 'data-' + hyphen(name || '')
    switch (arguments.length) {
      case 2:
        this.attr(name, value)
        return this
      case 1:
        var val = this.attr(name)
        return parseData(val)
      case 0:
        var ret = {}
        ap.forEach.call(this[0].attributes, function(attr) {
          if (attr) {
            name = attr.name
            if (!name.indexOf('data-')) {
              name = camelize(name.slice(5))
              ret[name] = parseData(attr.value)
            }
          }
        })
        return ret
    }
  },
  removeData: function(name) {
    name = 'data-' + hyphen(name)
    this[0].removeAttribute(name)
    return this
  },
  css: function(name, value) {
    if (yua.isPlainObject(name)) {
      for (var i in name) {
        yua.css(this, i, name[i])
      }
    } else {
      var ret = yua.css(this, name, value)
    }
    return ret !== void 0 ? ret : this
  },
  position: function() {
    var offsetParent,
      offset,
      elem = this[0],
      parentOffset = {
        top: 0,
        left: 0
      }
    if (!elem) {
      return
    }
    if (this.css('position') === 'fixed') {
      offset = elem.getBoundingClientRect()
    } else {
      offsetParent = this.offsetParent() //得到真正的offsetParent
      offset = this.offset() // 得到正确的offsetParent
      if (offsetParent[0].tagName !== 'HTML') {
        parentOffset = offsetParent.offset()
      }
      parentOffset.top += yua.css(offsetParent[0], 'borderTopWidth', true)
      parentOffset.left += yua.css(offsetParent[0], 'borderLeftWidth', true)
      // Subtract offsetParent scroll positions
      parentOffset.top -= offsetParent.scrollTop()
      parentOffset.left -= offsetParent.scrollLeft()
    }
    return {
      top: offset.top - parentOffset.top - yua.css(elem, 'marginTop', true),
      left: offset.left - parentOffset.left - yua.css(elem, 'marginLeft', true)
    }
  },
  offsetParent: function() {
    var offsetParent = this[0].offsetParent
    while (offsetParent && yua.css(offsetParent, 'position') === 'static') {
      offsetParent = offsetParent.offsetParent
    }
    return yua(offsetParent || root)
  },
  bind: function(type, fn, phase) {
    if (this[0]) {
      //此方法不会链
      return yua.bind(this[0], type, fn, phase)
    }
  },
  unbind: function(type, fn, phase) {
    if (this[0]) {
      yua.unbind(this[0], type, fn, phase)
    }
    return this
  },
  val: function(value) {
    var node = this[0]
    if (node && node.nodeType === 1) {
      var get = arguments.length === 0
      var access = get ? ':get' : ':set'
      var fn = valHooks[getValType(node) + access]
      if (fn) {
        var val = fn(node, value)
      } else if (get) {
        return (node.value || '').replace(/\r/g, '')
      } else {
        node.value = value
      }
    }
    return get ? val : this
  }
})

if (root.dataset) {
  yua.fn.data = function(name, val) {
    name = name && camelize(name)
    var dataset = this[0].dataset
    switch (arguments.length) {
      case 2:
        dataset[name] = val
        return this
      case 1:
        val = dataset[name]
        return parseData(val)
      case 0:
        var ret = createMap()
        for (name in dataset) {
          ret[name] = parseData(dataset[name])
        }
        return ret
    }
  }
}

yua.parseJSON = JSON.parse

var rbrace = /(?:\{[\s\S]*\}|\[[\s\S]*\])$/
function parseData(data) {
  try {
    if (typeof data === 'object') return data
    data =
      data === 'true'
        ? true
        : data === 'false'
          ? false
          : data === 'null'
            ? null
            : +data + '' === data
              ? +data
              : rbrace.test(data) ? JSON.parse(data) : data
  } catch (e) {}
  return data
}

yua.fireDom = function(elem, type, opts) {
  var hackEvent = DOC.createEvent('Events')
  hackEvent.initEvent(type, true, true)
  yua.mix(hackEvent, opts)
  elem.dispatchEvent(hackEvent)
}

yua.each(
  {
    scrollLeft: 'pageXOffset',
    scrollTop: 'pageYOffset'
  },
  function(method, prop) {
    yua.fn[method] = function(val) {
      var node = this[0] || {},
        win = getWindow(node),
        top = method === 'scrollTop'
      if (!arguments.length) {
        return win ? win[prop] : node[method]
      } else {
        if (win) {
          win.scrollTo(!top ? val : win[prop], top ? val : win[prop])
        } else {
          node[method] = val
        }
      }
    }
  }
)

function getWindow(node) {
  return node.window && node.document
    ? node
    : node.nodeType === 9 ? node.defaultView : false
}

//=============================css相关==================================

var cssHooks = (yua.cssHooks = createMap())
var prefixes = ['', '-webkit-', '-moz-', '-ms-'] //去掉opera-15的支持
var cssMap = {
  float: 'cssFloat'
}

yua.cssNumber = oneObject(
  'animationIterationCount,animationIterationCount,columnCount,order,flex,flexGrow,flexShrink,fillOpacity,fontWeight,lineHeight,opacity,orphans,widows,zIndex,zoom'
)

yua.cssName = function(name, host, camelCase) {
  if (cssMap[name]) {
    return cssMap[name]
  }
  host = host || root.style
  for (var i = 0, n = prefixes.length; i < n; i++) {
    camelCase = camelize(prefixes[i] + name)
    if (camelCase in host) {
      return (cssMap[name] = camelCase)
    }
  }
  return null
}

cssHooks['@:set'] = function(node, name, value) {
  node.style[name] = value
}

cssHooks['@:get'] = function(node, name) {
  if (!node || !node.style) {
    throw new Error('getComputedStyle要求传入一个节点 ' + node)
  }
  var ret,
    computed = getComputedStyle(node)
  if (computed) {
    ret = name === 'filter' ? computed.getPropertyValue(name) : computed[name]
    if (ret === '') {
      ret = node.style[name] //其他浏览器需要我们手动取内联样式
    }
  }
  return ret
}
cssHooks['opacity:get'] = function(node) {
  var ret = cssHooks['@:get'](node, 'opacity')
  return ret === '' ? '1' : ret
}

'top,left'.replace(rword, function(name) {
  cssHooks[name + ':get'] = function(node) {
    var computed = cssHooks['@:get'](node, name)
    return /px$/.test(computed) ? computed : yua(node).position()[name] + 'px'
  }
})

var cssShow = {
  position: 'absolute',
  visibility: 'hidden',
  display: 'block'
}
var rdisplayswap = /^(none|table(?!-c[ea]).+)/
function showHidden(node, array) {
  //http://www.cnblogs.com/rubylouvre/archive/2012/10/27/2742529.html
  if (node.offsetWidth <= 0) {
    //opera.offsetWidth可能小于0
    var styles = getComputedStyle(node, null)
    if (rdisplayswap.test(styles['display'])) {
      var obj = {
        node: node
      }
      for (var name in cssShow) {
        obj[name] = styles[name]
        node.style[name] = cssShow[name]
      }
      array.push(obj)
    }
    var parent = node.parentNode
    if (parent && parent.nodeType === 1) {
      showHidden(parent, array)
    }
  }
}

'Width,Height'.replace(rword, function(name) {
  //fix 481
  var method = name.toLowerCase(),
    clientProp = 'client' + name,
    scrollProp = 'scroll' + name,
    offsetProp = 'offset' + name
  cssHooks[method + ':get'] = function(node, which, override) {
    var boxSizing = -4
    if (typeof override === 'number') {
      boxSizing = override
    }
    which = name === 'Width' ? ['Left', 'Right'] : ['Top', 'Bottom']
    var ret = node[offsetProp] // border-box 0
    if (boxSizing === 2) {
      // margin-box 2
      return (
        ret +
        yua.css(node, 'margin' + which[0], true) +
        yua.css(node, 'margin' + which[1], true)
      )
    }
    if (boxSizing < 0) {
      // padding-box  -2
      ret =
        ret -
        yua.css(node, 'border' + which[0] + 'Width', true) -
        yua.css(node, 'border' + which[1] + 'Width', true)
    }
    if (boxSizing === -4) {
      // content-box -4
      ret =
        ret -
        yua.css(node, 'padding' + which[0], true) -
        yua.css(node, 'padding' + which[1], true)
    }
    return ret
  }
  cssHooks[method + '&get'] = function(node) {
    var hidden = []
    showHidden(node, hidden)
    var val = cssHooks[method + ':get'](node)
    for (var i = 0, obj; (obj = hidden[i++]); ) {
      node = obj.node
      for (var n in obj) {
        if (typeof obj[n] === 'string') {
          node.style[n] = obj[n]
        }
      }
    }
    return val
  }
  yua.fn[method] = function(value) {
    //会忽视其display
    var node = this[0]
    if (arguments.length === 0) {
      if (node.setTimeout) {
        //取得窗口尺寸,IE9后可以用node.innerWidth /innerHeight代替
        return node['inner' + name]
      }
      if (node.nodeType === 9) {
        //取得页面尺寸
        var doc = node.documentElement
        //FF chrome    html.scrollHeight< body.scrollHeight
        //IE 标准模式 : html.scrollHeight> body.scrollHeight
        //IE 怪异模式 : html.scrollHeight 最大等于可视窗口多一点？
        return Math.max(
          node.body[scrollProp],
          doc[scrollProp],
          node.body[offsetProp],
          doc[offsetProp],
          doc[clientProp]
        )
      }
      return cssHooks[method + '&get'](node)
    } else {
      return this.css(method, value)
    }
  }
  yua.fn['inner' + name] = function() {
    return cssHooks[method + ':get'](this[0], void 0, -2)
  }
  yua.fn['outer' + name] = function(includeMargin) {
    return cssHooks[method + ':get'](
      this[0],
      void 0,
      includeMargin === true ? 2 : 0
    )
  }
})

yua.fn.offset = function() {
  //取得距离页面左右角的坐标
  var node = this[0]
  try {
    var rect = node.getBoundingClientRect()
    // Make sure element is not hidden (display: none) or disconnected
    // https://github.com/jquery/jquery/pull/2043/files#r23981494
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
}

//=============================val相关=======================

function getValType(elem) {
  var ret = elem.tagName.toLowerCase()
  return ret === 'input' && /checkbox|radio/.test(elem.type) ? 'checked' : ret
}

var valHooks = {
  'select:get': function(node, value) {
    var option,
      options = node.options,
      index = node.selectedIndex,
      one = node.type === 'select-one' || index < 0,
      values = one ? null : [],
      max = one ? index + 1 : options.length,
      i = index < 0 ? max : one ? index : 0
    for (; i < max; i++) {
      option = options[i]
      //旧式IE在reset后不会改变selected，需要改用i === index判定
      //我们过滤所有disabled的option元素，但在safari5下，如果设置select为disable，那么其所有孩子都disable
      //因此当一个元素为disable，需要检测其是否显式设置了disable及其父节点的disable情况
      if ((option.selected || i === index) && !option.disabled) {
        value = option.value
        if (one) {
          return value
        }
        //收集所有selected值组成数组返回
        values.push(value)
      }
    }
    return values
  },
  'select:set': function(node, values, optionSet) {
    values = [].concat(values) //强制转换为数组
    for (var i = 0, el; (el = node.options[i++]); ) {
      if ((el.selected = values.indexOf(el.value) > -1)) {
        optionSet = true
      }
    }
    if (!optionSet) {
      node.selectedIndex = -1
    }
  }
}

var keyMap = {}
var keys = [
  'break,case,catch,continue,debugger,default,delete,do,else,false',
  'finally,for,function,if,in,instanceof,new,null,return,switch,this',
  'throw,true,try,typeof,var,void,while,with' /* 关键字*/,
  'abstract,boolean,byte,char,class,const,double,enum,export,extends',
  'final,float,goto,implements,import,int,interface,long,native',
  'package,private,protected,public,short,static,super,synchronized',
  'throws,transient,volatile' /*保留字*/,
  'arguments,let,yield,undefined'
].join(',')
keys.replace(/\w+/g, function(a) {
  keyMap[a] = true
})

var ridentStart = /[a-z_$]/i
var rwhiteSpace = /[\s\uFEFF\xA0]/
function getIdent(input, lastIndex) {
  var result = []
  var subroutine = !!lastIndex
  lastIndex = lastIndex || 0
  //将表达式中的标识符抽取出来
  var state = 'unknown'
  var variable = ''
  for (var i = 0; i < input.length; i++) {
    var c = input.charAt(i)
    if (c === "'" || c === '"') {
      //字符串开始
      if (state === 'unknown') {
        state = c
      } else if (state === c) {
        //字符串结束
        state = 'unknown'
      }
    } else if (c === '\\') {
      if (state === "'" || state === '"') {
        i++
      }
    } else if (ridentStart.test(c)) {
      //碰到标识符
      if (state === 'unknown') {
        state = 'variable'
        variable = c
      } else if (state === 'maybePath') {
        variable = result.pop()
        variable += '.' + c
        state = 'variable'
      } else if (state === 'variable') {
        variable += c
      }
    } else if (/\w/.test(c)) {
      if (state === 'variable') {
        variable += c
      }
    } else if (c === '.') {
      if (state === 'variable') {
        if (variable) {
          result.push(variable)
          variable = ''
          state = 'maybePath'
        }
      }
    } else if (c === '[') {
      if (state === 'variable' || state === 'maybePath') {
        if (variable) {
          //如果前面存在变量,收集它
          result.push(variable)
          variable = ''
        }
        var lastLength = result.length
        var last = result[lastLength - 1]
        var innerResult = getIdent(input.slice(i), i)
        if (innerResult.length) {
          //如果括号中存在变量,那么这里添加通配符
          result[lastLength - 1] = last + '.*'
          result = innerResult.concat(result)
        } else {
          //如果括号中的东西是确定的,直接转换为其子属性
          var content = input.slice(i + 1, innerResult.i)
          try {
            var text = scpCompile(['return ' + content])()
            result[lastLength - 1] = last + '.' + text
          } catch (e) {}
        }
        state = 'maybePath' //]后面可能还接东西
        i = innerResult.i
      }
    } else if (c === ']') {
      if (subroutine) {
        result.i = i + lastIndex
        addVar(result, variable)
        return result
      }
    } else if (rwhiteSpace.test(c) && c !== '\r' && c !== '\n') {
      if (state === 'variable') {
        if (addVar(result, variable)) {
          state = 'maybePath' // aaa . bbb 这样的情况
        }
        variable = ''
      }
    } else {
      addVar(result, variable)
      state = 'unknown'
      variable = ''
    }
  }
  addVar(result, variable)
  return result
}

function addVar(array, element) {
  if (element && !keyMap[element]) {
    array.push(element)
    return true
  }
}

function addAssign(vars, vmodel, name, binding) {
  var ret = [],
    prefix = ' = ' + name + '.'
  for (var i = vars.length, prop; (prop = vars[--i]); ) {
    var arr = prop.split('.'),
      a
    var first = arr[0]
    while ((a = arr.shift())) {
      if (vmodel.hasOwnProperty(a)) {
        ret.push(first + prefix + first)
        binding.observers.push({
          v: vmodel,
          p: prop
        })
        vars.splice(i, 1)
      } else {
        break
      }
    }
  }
  return ret
}

var rproxy = /(\$proxy\$[a-z]+)\-[\-0-9a-f]+$/
var variablePool = new Cache(218)
//缓存求值函数，以便多次利用
var evaluatorPool = new Cache(128)

function getVars(expr) {
  expr = expr.trim()
  var ret = variablePool.get(expr)
  if (ret) {
    return ret.concat()
  }
  var array = getIdent(expr)
  var uniq = {}
  var result = []
  for (var i = 0, el; (el = array[i++]); ) {
    if (!uniq[el]) {
      uniq[el] = 1
      result.push(el)
    }
  }
  return variablePool.put(expr, result).concat()
}

function parseExpr(expr, vmodels, binding) {
  var filters = binding.filters
  if (typeof filters === 'string' && filters.trim() && !binding._filters) {
    binding._filters = parseFilter(filters.trim())
  }

  var vars = getVars(expr)
  var expose = new Date() - 0
  var assigns = []
  var names = []
  var args = []
  binding.observers = []
  for (var i = 0, sn = vmodels.length; i < sn; i++) {
    if (vars.length) {
      var name = 'vm' + expose + '_' + i
      names.push(name)
      args.push(vmodels[i])
      assigns.push.apply(assigns, addAssign(vars, vmodels[i], name, binding))
    }
  }
  binding.args = args
  var dataType = binding.type
  var exprId =
    vmodels.map(function(el) {
      return String(el.$id).replace(rproxy, '$1')
    }) +
    expr +
    dataType
  var getter = evaluatorPool.get(exprId) //直接从缓存，免得重复生成
  if (getter) {
    if (dataType === 'duplex') {
      var setter = evaluatorPool.get(exprId + 'setter')
      binding.setter = setter.apply(setter, binding.args)
    }
    return (binding.getter = getter)
  }

  if (!assigns.length) {
    assigns.push('fix' + expose)
  }

  if (dataType === 'duplex') {
    var nameOne = {}
    assigns.forEach(function(a) {
      var arr = a.split('=')
      nameOne[arr[0].trim()] = arr[1].trim()
    })
    expr = expr.replace(/[\$\w]+/, function(a) {
      return nameOne[a] ? nameOne[a] : a
    })
    /* jshint ignore:start */
    var fn2 = scpCompile(
      names.concat(
        "'use strict';" + 'return function(vvv){' + expr + ' = vvv\n}\n'
      )
    )
    /* jshint ignore:end */
    evaluatorPool.put(exprId + 'setter', fn2)
    binding.setter = fn2.apply(fn2, binding.args)
  }

  if (dataType === 'on') {
    //事件绑定
    if (expr.indexOf('(') === -1) {
      expr += '.call(this, $event)'
    } else {
      expr = expr.replace('(', '.call(this,')
    }
    names.push('$event')
    expr = '\nreturn ' + expr + ';' //IE全家 Function("return ")出错，需要Function("return ;")
    var lastIndex = expr.lastIndexOf('\nreturn')
    var header = expr.slice(0, lastIndex)
    var footer = expr.slice(lastIndex)
    expr = header + '\n' + footer
  } else {
    expr = '\nreturn ' + expr + ';' //IE全家 Function("return ")出错，需要Function("return ;")
  }
  /* jshint ignore:start */
  getter = scpCompile(
    names.concat("'use strict';\nvar " + assigns.join(',\n') + expr)
  )
  /* jshint ignore:end */

  return evaluatorPool.put(exprId, getter)
}

function normalizeExpr(code) {
  var hasExpr = rexpr.test(code) //比如:class="width{{w}}"的情况
  if (hasExpr) {
    var array = scanExpr(code)
    if (array.length === 1) {
      return array[0].expr
    }
    return array
      .map(function(el) {
        return el.type ? '(' + el.expr + ')' : quote(el.expr)
      })
      .join(' + ')
  } else {
    return code
  }
}

yua.normalizeExpr = normalizeExpr
yua.parseExprProxy = parseExpr

var rthimRightParentheses = /\)\s*$/
var rthimOtherParentheses = /\)\s*\|/g
var rquoteFilterName = /\|\s*([$\w]+)/g
var rpatchBracket = /"\s*\["/g
var rthimLeftParentheses = /"\s*\(/g
function parseFilter(filters) {
  filters =
    filters
      .replace(rthimRightParentheses, '') //处理最后的小括号
      .replace(rthimOtherParentheses, function() {
        //处理其他小括号
        return '],|'
      })
      .replace(rquoteFilterName, function(a, b) {
        //处理|及它后面的过滤器的名字
        return '[' + quote(b)
      })
      .replace(rpatchBracket, function() {
        return '"],["'
      })
      .replace(rthimLeftParentheses, function() {
        return '",'
      }) + ']'
  /* jshint ignore:start */
  return scpCompile(['return [' + filters + ']'])()
  /* jshint ignore:end */
}

/*********************************************************************
 *                          编译系统                                  *
 **********************************************************************/

var quote = JSON.stringify

/*********************************************************************
 *                           扫描系统                                 *
 **********************************************************************/

yua.scan = function(elem, vmodel) {
  elem = elem || root
  var vmodels = vmodel ? [].concat(vmodel) : []
  scanTag(elem, vmodels)
}

//http://www.w3.org/TR/html5/syntax.html#void-elements
var stopScan = oneObject(
  'area,base,basefont,br,col,command,embed,hr,img,input,link,meta,param,source,track,wbr,noscript,script,style,textarea'.toUpperCase()
)

function checkScan(elem, callback, innerHTML) {
  var id = setTimeout(function() {
    var currHTML = elem.innerHTML
    clearTimeout(id)
    if (currHTML === innerHTML) {
      callback()
    } else {
      checkScan(elem, callback, currHTML)
    }
  })
}

function createSignalTower(elem, vmodel) {
  var id = elem.getAttribute('yuactrl') || vmodel.$id
  elem.setAttribute('yuactrl', id)
  if (vmodel.$events) {
    vmodel.$events.expr = elem.tagName + '[yuactrl="' + id + '"]'
  }
}

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

function executeBindings(bindings, vmodels) {
  for (var i = 0, binding; (binding = bindings[i++]); ) {
    binding.vmodels = vmodels
    directives[binding.type].init(binding)

    yua.injectBinding(binding)
    if (binding.getter && binding.element.nodeType === 1) {
      //移除数据绑定，防止被二次解析
      //chrome使用removeAttributeNode移除不存在的特性节点时会报错 https://github.com/RubyLouvre/yua/issues/99
      binding.element.removeAttribute(binding.name)
    }
  }
  bindings.length = 0
}

//https://github.com/RubyLouvre/yua/issues/636
var mergeTextNodes =
  IEVersion && window.MutationObserver
    ? function(elem) {
        var node = elem.firstChild,
          text
        while (node) {
          var aaa = node.nextSibling
          if (node.nodeType === 3) {
            if (text) {
              text.nodeValue += node.nodeValue
              elem.removeChild(node)
            } else {
              text = node
            }
          } else {
            text = null
          }
          node = aaa
        }
      }
    : 0
var roneTime = /^\s*::/
var rmsAttr = /:(\w+)-?(.*)/

var events = oneObject(
  'animationend,blur,change,input,click,dblclick,focus,keydown,keypress,keyup,mousedown,mouseenter,mouseleave,mousemove,mouseout,mouseover,mouseup,scan,scroll,submit'
)
var obsoleteAttrs = oneObject(
  'value,title,alt,checked,selected,disabled,readonly,enabled,href,src'
)
function bindingSorter(a, b) {
  return a.priority - b.priority
}

var rnoCollect = /^(:\S+|data-\S+|on[a-z]+|id|style|class)$/
var ronattr = /^on\-[\w-]+$/
function getOptionsFromTag(elem, vmodels) {
  var attributes = elem.attributes
  var ret = {}
  for (var i = 0, attr; (attr = attributes[i++]); ) {
    var name = attr.name
    if (attr.specified && !rnoCollect.test(name)) {
      var camelizeName = camelize(attr.name)
      if (/^on\-[\w-]+$/.test(name)) {
        ret[camelizeName] = getBindingCallback(elem, name, vmodels)
      } else {
        ret[camelizeName] = parseData(attr.value)
      }
    }
  }
  return ret
}

function scanAttr(elem, vmodels, match) {
  var scanNode = true
  if (vmodels.length) {
    var attributes = elem.attributes
    var bindings = []
    var uniq = {}
    for (var i = 0, attr; (attr = attributes[i++]); ) {
      var name = attr.name
      if (uniq[name]) {
        //IE8下:repeat,:with BUG
        continue
      }
      uniq[name] = 1
      if (attr.specified) {
        if ((match = name.match(rmsAttr))) {
          //如果是以指定前缀命名的
          var type = match[1]
          var param = match[2] || ''
          var value = attr.value
          if (events[type]) {
            param = type
            type = 'on'
          } else if (obsoleteAttrs[type]) {
            param = type
            type = 'attr'
            name = ':' + type + '-' + param
            log('warning!请改用' + name + '代替' + attr.name + '!')
          }
          if (directives[type]) {
            var newValue = value.replace(roneTime, '')
            var oneTime = value !== newValue
            var binding = {
              type: type,
              param: param,
              element: elem,
              name: name,
              expr: newValue,
              oneTime: oneTime,
              uuid: '_' + ++bindingID,
              priority:
                (directives[type].priority || type.charCodeAt(0) * 10) +
                (Number(param.replace(/\D/g, '')) || 0)
            }
            if (type === 'html' || type === 'text' || type === 'attr') {
              var filters = getToken(value).filters
              binding.expr = binding.expr.replace(filters, '')
              binding.filters = filters
                .replace(rhasHtml, function() {
                  binding.type = 'html'
                  binding.group = 1
                  return ''
                })
                .trim() // jshint ignore:line
            } else if (type === 'duplex') {
              var hasDuplex = name
            } else if (name === ':if-loop') {
              binding.priority += 100
            } else if (name === ':attr-value') {
              var hasAttrValue = name
            }
            bindings.push(binding)
          }
        }
      }
    }
    if (bindings.length) {
      bindings.sort(bindingSorter)

      if (hasDuplex && hasAttrValue && elem.type === 'text') {
        log('warning!一个控件不能同时定义:attr-value与' + hasDuplex)
      }

      for (i = 0; (binding = bindings[i]); i++) {
        type = binding.type
        if (rnoscanAttrBinding.test(type)) {
          return executeBindings(bindings.slice(0, i + 1), vmodels)
        } else if (scanNode) {
          scanNode = !rnoscanNodeBinding.test(type)
        }
      }
      executeBindings(bindings, vmodels)
    }
  }
  if (
    scanNode &&
    !stopScan[elem.tagName] &&
    (isWidget(elem) ? elem.msResolved : 1)
  ) {
    mergeTextNodes && mergeTextNodes(elem)
    scanNodeList(elem, vmodels) //扫描子孙元素
  }
}

var rnoscanAttrBinding = /^if|widget|repeat$/
var rnoscanNodeBinding = /^html|include$/

function scanNodeList(elem, vmodels) {
  var nodes = yua.slice(elem.childNodes)
  scanNodeArray(nodes, vmodels)
}

function scanNodeArray(nodes, vmodels) {
  function _delay_component(name) {
    setTimeout(function() {
      yua.component(name)
    })
  }
  for (var i = 0, node; (node = nodes[i++]); ) {
    switch (node.nodeType) {
      case 1:
        var elem = node
        if (
          !elem.msResolved &&
          elem.parentNode &&
          elem.parentNode.nodeType === 1
        ) {
          var widget = isWidget(elem)

          if (widget) {
            componentQueue.push({
              element: elem,
              vmodels: vmodels,
              name: widget
            })
            if (yua.components[widget]) {
              // log(widget, yua.components)
              //确保所有:attr-name扫描完再处理
              _delay_component(widget)
            }
          }
        }

        scanTag(node, vmodels) //扫描元素节点

        if (node.msHasEvent) {
          yua.fireDom(node, 'datasetchanged', {
            bubble: node.msHasEvent
          })
        }

        break
      case 3:
        if (rexpr.test(node.nodeValue)) {
          scanText(node, vmodels, i) //扫描文本节点
        }
        break
    }
  }
}

function scanTag(elem, vmodels, node) {
  //扫描顺序  :skip(0) --> :important(1) --> :controller(2) --> :if(10) --> :repeat(100)
  //--> :if-loop(110) --> :attr(970) ...--> :each(1400)-->:with(1500)--〉:duplex(2000)垫后
  var a = elem.getAttribute(':skip')
  var b = elem.getAttributeNode(':important')
  var c = elem.getAttributeNode(':controller')
  if (typeof a === 'string') {
    return
  } else if ((node = b || c)) {
    var newVmodel = yua.vmodels[node.value]

    if (!newVmodel) {
      return
    }

    //把父级VM补上
    newVmodel.$up = vmodels[0]
    hideProperty(newVmodel, '$up', null)
    //:important不包含父VM，:controller相反
    vmodels = node === b ? [newVmodel] : [newVmodel].concat(vmodels)

    elem.removeAttribute(node.name) //removeAttributeNode不会刷新[:controller]样式规则
    elem.classList.remove(node.name)
    createSignalTower(elem, newVmodel)
  }
  scanAttr(elem, vmodels) //扫描特性节点

  if (newVmodel) {
    setTimeout(function() {
      newVmodel.$fire(':scan-end', elem)
    })
  }
}
var rhasHtml = /\|\s*html(?:\b|$)/,
  r11a = /\|\|/g,
  rlt = /&lt;/g,
  rgt = /&gt;/g,
  rstringLiteral = /(['"])(\\\1|.)+?\1/g,
  rline = /\r?\n/g
function getToken(value) {
  if (value.indexOf('|') > 0) {
    var scapegoat = value.replace(rstringLiteral, function(_) {
      return Array(_.length + 1).join('1') // jshint ignore:line
    })
    var index = scapegoat.replace(r11a, '\u1122\u3344').indexOf('|') //干掉所有短路或
    if (index > -1) {
      return {
        type: 'text',
        filters: value.slice(index).trim(),
        expr: value.slice(0, index)
      }
    }
  }
  return {
    type: 'text',
    expr: value,
    filters: ''
  }
}

function scanExpr(str) {
  var tokens = [],
    value,
    start = 0,
    stop
  do {
    stop = str.indexOf(openTag, start)
    if (stop === -1) {
      break
    }
    value = str.slice(start, stop)
    if (value) {
      // {{ 左边的文本
      tokens.push({
        expr: value
      })
    }
    start = stop + openTag.length
    stop = str.indexOf(closeTag, start)
    if (stop === -1) {
      break
    }
    value = str.slice(start, stop)
    if (value) {
      //处理{{ }}插值表达式
      tokens.push(getToken(value.replace(rline, '')))
    }
    start = stop + closeTag.length
  } while (1)
  value = str.slice(start)
  if (value) {
    //}} 右边的文本
    tokens.push({
      expr: value
    })
  }
  return tokens
}

function scanText(textNode, vmodels, index) {
  var bindings = [],
    tokens = scanExpr(textNode.data)
  if (tokens.length) {
    for (var i = 0, token; (token = tokens[i++]); ) {
      var node = DOC.createTextNode(token.expr) //将文本转换为文本节点，并替换原来的文本节点
      if (token.type) {
        token.expr = token.expr.replace(roneTime, function() {
          token.oneTime = true
          return ''
        }) // jshint ignore:line
        token.element = node
        token.filters = token.filters.replace(rhasHtml, function() {
          token.type = 'html'
          return ''
        }) // jshint ignore:line
        token.pos = index * 1000 + i
        bindings.push(token) //收集带有插值表达式的文本
      }
      yuaFragment.appendChild(node)
    }
    textNode.parentNode.replaceChild(yuaFragment, textNode)
    if (bindings.length) executeBindings(bindings, vmodels)
  }
}

//使用来自游戏界的双缓冲技术,减少对视图的冗余刷新
var Buffer = function() {
  this.queue = []
}
Buffer.prototype = {
  render: function(isAnimate) {
    if (!this.locked) {
      this.locked = isAnimate ? root.offsetHeight + 10 : 1
      var me = this
      yua.nextTick(function() {
        me.flush()
      })
    }
  },
  flush: function() {
    for (var i = 0, sub; (sub = this.queue[i++]); ) {
      sub.update && sub.update()
    }
    this.locked = 0
    this.queue = []
  }
}

var buffer = new Buffer()

var componentQueue = []
var widgetList = []
var componentHooks = {
  $construct: function() {
    return yua.mix.apply(null, arguments)
  },
  $ready: noop,
  $init: noop,
  $dispose: noop,
  $container: null,
  $childReady: noop,
  $$template: function(str) {
    return str
  }
}

yua.components = {}
yua.component = function(name, opts) {
  if (opts) {
    yua.components[name] = yua.mix({}, componentHooks, opts)
  }
  for (var i = 0, obj; (obj = componentQueue[i]); i++) {
    if (name === obj.name) {
      componentQueue.splice(i, 1)
      i--
      ;(function(host, hooks, elem, widget) {
        //如果elem已从Document里移除,直接返回
        if (!yua.contains(DOC, elem) || elem.msResolved) {
          yua.Array.remove(componentQueue, host)
          return
        }

        var dependencies = 1
        var global = componentHooks

        //===========收集各种配置=======
        if (elem.getAttribute(':attr-identifier')) {
          //如果还没有解析完,就延迟一下 #1155
          return
        }
        var elemOpts = getOptionsFromTag(elem, host.vmodels)
        var vmOpts = getOptionsFromVM(
          host.vmodels,
          elemOpts.config || host.name
        )
        var $id = elemOpts.$id || elemOpts.identifier || generateID(widget)
        delete elemOpts.config
        delete elemOpts.$id
        delete elemOpts.identifier
        var componentDefinition = {
          $up: host.vmodels[0],
          $ups: host.vmodels
        }

        yua.mix(true, componentDefinition, hooks)

        componentDefinition = yua.components[name].$construct.call(
          elem,
          componentDefinition,
          vmOpts,
          elemOpts
        )

        componentDefinition.$refs = {}
        componentDefinition.$id = $id

        //==========构建VM=========
        var keepContainer = componentDefinition.$container
        var keepTemplate = componentDefinition.$template
        delete componentDefinition.$up
        delete componentDefinition.$ups
        delete componentDefinition.$slot
        delete componentDefinition.$replace
        delete componentDefinition.$container
        delete componentDefinition.$construct

        var vmodel = yua(componentDefinition) || {}
        vmodel.$ups = host.vmodels
        vmodel.$up = host.vmodels[0]
        elem.msResolved = 1 //防止二进扫描此元素
        vmodel.$init(vmodel, elem)
        global.$init(vmodel, elem)
        var nodes = elem.childNodes

        if (vmodel.$$template) {
          yua.clearHTML(elem)
          elem.innerHTML = vmodel.$$template(keepTemplate)
        }

        // 组件所使用的标签是temlate,所以必须要要用子元素替换掉
        var child = elem.content.firstChild

        if (!child || serialize.call(child) === '[object Text]') {
          var tmpDom = document.createElement('div')
          if (child) {
            tmpDom.appendChild(child)
          }
          child = tmpDom
          tmpDom = null
        }

        elem.parentNode.replaceChild(child, elem)

        child.msResolved = 1
        var cssText = elem.style.cssText
        var className = elem.className
        elem = host.element = child
        elem.style.cssText += ';' + cssText

        if (className) {
          yua(elem).addClass(className)
        }
        //指定了组件的容器的话,则把组件节点转过去
        if (keepContainer) {
          keepContainer.appendChild(elem)
        }
        yua.fireDom(elem, 'datasetchanged', {
          vm: vmodel,
          childReady: 1
        })
        var children = 0
        var removeFn = yua.bind(elem, 'datasetchanged', function(e) {
          if (e.childReady) {
            dependencies += e.childReady
            if (vmodel !== e.vm) {
              vmodel.$refs[e.vm.$id] = e.vm
              if (e.childReady === -1) {
                children++
                vmodel.$childReady(vmodel, elem, e)
              }
              e.stopPropagation()
            }
          }
          if (dependencies === 0) {
            var id1 = setTimeout(function() {
              clearTimeout(id1)

              vmodel.$ready(vmodel, elem, host.vmodels)
              global.$ready(vmodel, elem, host.vmodels)
            }, children ? Math.max(children * 17, 100) : 17)
            yua.unbind(elem, 'datasetchanged', removeFn)
            //==================
            host.rollback = function() {
              try {
                vmodel.$dispose(vmodel, elem)
                global.$dispose(vmodel, elem)
              } catch (e) {}
              delete yua.vmodels[vmodel.$id]
            }
            injectDisposeQueue(host, widgetList)
            if (window.chrome) {
              elem.addEventListener('DOMNodeRemovedFromDocument', function() {
                setTimeout(rejectDisposeQueue)
              })
            }
          }
        })
        scanTag(elem, [vmodel].concat(host.vmodels))
        yua.vmodels[vmodel.$id] = vmodel
        if (!elem.childNodes.length) {
          yua.fireDom(elem, 'datasetchanged', {
            vm: vmodel,
            childReady: -1
          })
        } else {
          var id2 = setTimeout(function() {
            clearTimeout(id2)
            yua.fireDom(elem, 'datasetchanged', {
              vm: vmodel,
              childReady: -1
            })
          }, 17)
        }
      })(obj, yua.components[name], obj.element, obj.name) // jshint ignore:line
    }
  }
}

function getOptionsFromVM(vmodels, pre) {
  if (pre) {
    for (var i = 0, v; (v = vmodels[i++]); ) {
      if (v.hasOwnProperty(pre) && typeof v[pre] === 'object') {
        var vmOptions = v[pre]
        return vmOptions.$model || vmOptions
        break
      }
    }
  }
  return {}
}

function isWidget(el) {
  //如果是组件,则返回组件的名字
  var name = el.nodeName.toLowerCase()
  if (name === 'template' && el.getAttribute('name')) {
    return el.getAttribute('name')
  }
  return null
}

var bools = [
  'autofocus,autoplay,async,allowTransparency,checked,controls',
  'declare,disabled,defer,defaultChecked,defaultSelected',
  'contentEditable,isMap,loop,multiple,noHref,noResize,noShade',
  'open,readOnly,selected'
].join(',')
var boolMap = {}
bools.replace(rword, function(name) {
  boolMap[name.toLowerCase()] = name
})

var propMap = {
  //属性名映射
  'accept-charset': 'acceptCharset',
  char: 'ch',
  charoff: 'chOff',
  class: 'className',
  for: 'htmlFor',
  'http-equiv': 'httpEquiv'
}

var anomaly = [
  'accessKey,bgColor,cellPadding,cellSpacing,codeBase,codeType,colSpan',
  'dateTime,defaultValue,frameBorder,longDesc,maxLength,marginWidth,marginHeight',
  'rowSpan,tabIndex,useMap,vSpace,valueType,vAlign'
].join(',')
anomaly.replace(rword, function(name) {
  propMap[name.toLowerCase()] = name
})

var attrDir = yua.directive('attr', {
  init: function(binding) {
    //{{aaa}} --> aaa
    //{{aaa}}/bbb.html --> (aaa) + "/bbb.html"
    binding.expr = normalizeExpr(binding.expr.trim())
    if (binding.type === 'include') {
      var elem = binding.element
      effectBinding(elem, binding)
      binding.includeRendered = getBindingCallback(
        elem,
        'data-include-rendered',
        binding.vmodels
      )
      binding.includeLoaded = getBindingCallback(
        elem,
        'data-include-loaded',
        binding.vmodels
      )
      var outer = (binding.includeReplace = !!yua(elem).data('includeReplace'))
      if (yua(elem).data('includeCache')) {
        binding.templateCache = {}
      }
      binding.start = DOC.createComment(':include')
      binding.end = DOC.createComment(':include-end')
      if (outer) {
        binding.element = binding.end
        binding._element = elem
        elem.parentNode.insertBefore(binding.start, elem)
        elem.parentNode.insertBefore(binding.end, elem.nextSibling)
      } else {
        elem.insertBefore(binding.start, elem.firstChild)
        elem.appendChild(binding.end)
      }
    }
  },
  update: function(val) {
    var elem = this.element
    var obj = val

    if (typeof obj === 'object' && obj !== null) {
      if (!yua.isPlainObject(obj)) obj = obj.$model
    } else {
      if (!this.param) return

      obj = {}
      obj[this.param] = val
    }

    for (var i in obj) {
      if (i === 'style') {
        console.error('设置style样式, 请改用 :css指令')
        continue
      }
      if (i === 'href' || i === 'src') {
        //处理IE67自动转义的问题
        if (!root.hasAttribute) obj[i] = obj[i].replace(/&amp;/g, '&')

        elem[i] = obj[i]

        //chrome v37- 下embed标签动态设置的src，无法发起请求
        if (window.chrome && elem.tagName === 'EMBED') {
          var parent = elem.parentNode
          var com = document.createComment(':src')
          parent.replaceChild(com, elem)
          parent.replaceChild(elem, com)
        }
      } else {
        var k = i
        //古董IE下，部分属性名字要进行映射
        if (!W3C && propMap[k]) k = propMap[k]

        if (typeof elem[boolMap[k]] === 'boolean') {
          //布尔属性必须使用el.xxx = true|false方式设值
          elem[boolMap[k]] = !!obj[i]

          //如果为false, IE全系列下相当于setAttribute(xxx, ''),会影响到样式,需要进一步处理
          if (!obj[i]) obj[i] = !!obj[i]
        }
        if (obj[i] === false || obj[i] === null || obj[i] === undefined)
          return elem.removeAttribute(k)

        //SVG只能使用setAttribute(xxx, yyy), VML只能使用elem.xxx = yyy ,HTML的固有属性必须elem.xxx = yyy
        var isInnate = rsvg.test(elem)
          ? false
          : DOC.namespaces && isVML(elem) ? true : k in elem.cloneNode(false)
        if (isInnate) {
          elem[k] = obj[i]
        } else {
          elem.setAttribute(k, obj[i])
        }
      }
    }
  }
})

//这几个指令都可以使用插值表达式，如:src="aaa/{{b}}/{{c}}.html"
'title,alt,src,value,css,include,href,data'.replace(rword, function(name) {
  directives[name] = attrDir
})

//类名定义， :class="xx:yy"  :class="{xx: yy}" :class="xx" :class="{{xx}}"
yua.directive('class', {
  init: function(binding) {
    var expr = []
    if (!/^\{.*\}$/.test(binding.expr)) {
      expr = binding.expr.split(':')
      expr[1] = (expr[1] && expr[1].trim()) || 'true'
      var arr = expr[0].split(/\s+/)
      binding.expr =
        '{' +
        arr
          .map(function(it) {
            return it + ': ' + expr[1]
          })
          .join(', ') +
        '}'
    } else if (/^\{\{.*\}\}$/.test(binding.expr)) {
      binding.expr = binding.expr.slice(2, -2)
    }

    if (binding.type === 'hover' || binding.type === 'active') {
      //确保只绑定一次
      if (!binding.hasBindEvent) {
        var elem = binding.element
        var $elem = yua(elem)
        var activate = 'mouseenter' //在移出移入时切换类名
        var abandon = 'mouseleave'
        if (binding.type === 'active') {
          //在聚焦失焦中切换类名
          elem.tabIndex = elem.tabIndex || -1
          activate = 'mousedown'
          abandon = 'mouseup'
          var fn0 = $elem.bind('mouseleave', function() {
            $elem.removeClass(expr[0])
          })
        }
      }

      var fn1 = $elem.bind(activate, function() {
        $elem.addClass(expr[0])
      })
      var fn2 = $elem.bind(abandon, function() {
        $elem.removeClass(expr[0])
      })
      binding.rollback = function() {
        $elem.unbind('mouseleave', fn0)
        $elem.unbind(activate, fn1)
        $elem.unbind(abandon, fn2)
      }
      binding.hasBindEvent = true
    }
  },
  update: function(val) {
    if (this.type !== 'class') {
      return
    }
    var obj = val
    if (!obj || this.param)
      return log(
        'class指令语法错误 %c %s="%s"',
        'color:#f00',
        this.name,
        this.expr
      )

    if (typeof obj === 'string') {
      obj = {}
      obj[val] = true
    }

    if (!yua.isPlainObject(obj)) {
      obj = obj.$model
    }

    var $elem = yua(this.element)
    for (var i in obj) {
      $elem.toggleClass(i, !!obj[i])
    }
  }
})

'hover,active'.replace(rword, function(name) {
  directives[name] = directives['class']
})

//样式定义 :css-width="200"
//:css="{width: 200}"
yua.directive('css', {
  init: directives.attr.init,
  update: function(val) {
    var $elem = yua(this.element)
    if (!this.param) {
      var obj = val
      try {
        if (typeof val === 'object') {
          if (!yua.isPlainObject(val)) obj = val.$model
        } else {
          obj = new Function('return ' + val)()
        }
        for (var i in obj) {
          $elem.css(i, obj[i])
        }
      } catch (err) {
        log('样式格式错误 %c %s="%s"', 'color:#f00', this.name, this.expr)
      }
    } else {
      $elem.css(this.param, val)
    }
  }
})

//兼容2种写法 :data-xx="yy", :data="{xx: yy}"
yua.directive('data', {
  priority: 100,
  update: function(val) {
    var obj = val
    if (typeof obj === 'object' && obj !== null) {
      if (!yua.isPlainObject(obj)) obj = val.$model

      for (var i in obj) {
        this.element.setAttribute('data-' + i, obj[i])
      }
    } else {
      if (!this.param) return

      this.element.setAttribute('data-' + this.param, obj)
    }
  }
})

/*------ 表单验证 -------*/
var __rules = {}
yua.validate = function(key) {
  return (
    !__rules[key] ||
    __rules[key].every(function(it) {
      return it.checked
    })
  )
}
yua.directive('rule', {
  priority: 2010,
  init: function(binding) {
    if (binding.param && !__rules[binding.param]) {
      __rules[binding.param] = []
    }
    binding.target = __rules[binding.param]
  },
  update: function(obj) {
    var _this = this,
      elem = this.element,
      ruleID = -1

    if (!['INPUT', 'TEXTAREA'].includes(elem.nodeName)) return

    if (this.target) {
      ruleID = this.target.length
      this.target.push({ checked: true })
    }

    //如果父级元素没有定位属性,则加上相对定位
    if (getComputedStyle(elem.parentNode).position === 'static') {
      elem.parentNode.style.position = 'relative'
    }

    var $elem = yua(elem),
      ol = elem.offsetLeft + elem.offsetWidth - 50,
      ot = elem.offsetTop + elem.offsetHeight + 8,
      tips = document.createElement('div')

    tips.className = 'do-rule-tips'
    tips.style.left = ol + 'px'
    tips.style.bottom = ot + 'px'

    function checked(ev) {
      var txt = '',
        val = elem.value

      if (obj.require && (val === '' || val === null)) txt = '必填项'

      if (!txt && obj.isNumeric) txt = !isFinite(val) ? '必须为合法数字' : ''

      if (!txt && obj.isEmail)
        txt = !/^[\w\.\-]+@\w+([\.\-]\w+)*\.\w+$/.test(val)
          ? 'Email格式错误'
          : ''

      if (!txt && obj.isPhone)
        txt = !/^1[34578]\d{9}$/.test(val) ? '手机格式错误' : ''

      if (!txt && obj.isCN)
        txt = !/^[\u4e00-\u9fa5]+$/.test(val) ? '必须为纯中文' : ''

      if (!txt && obj.exp) txt = !obj.exp.test(val) ? obj.msg || '格式错误' : ''

      if (!txt && obj.maxLen)
        txt = val.length > obj.maxLen ? '长度不得超过' + obj.maxLen + '位' : ''

      if (!txt && obj.minLen)
        txt = val.length < obj.minLen ? '长度不得小于' + obj.minLen + '位' : ''

      if (!txt && obj.hasOwnProperty('max'))
        txt = val > obj.max ? '输入值不能大于' + obj.max : ''

      if (!txt && obj.hasOwnProperty('min'))
        txt = val < obj.min ? '输入值不能小于' + obj.min : ''

      if (!txt && obj.eq) {
        var eqEl = document.querySelector('#' + obj.eq)
        txt = val !== eqEl.value ? obj.msg || '2次值不一致' : ''
      }

      if (txt) {
        if (ev) {
          tips.textContent = txt
          elem.parentNode.appendChild(tips)
        }
        //必须是"必填项"才会更新验证状态
        if (_this.target && obj.require) {
          _this.target[ruleID].checked = false
        }
      } else {
        if (_this.target) {
          _this.target[ruleID].checked = true
        }
        try {
          elem.parentNode.removeChild(tips)
        } catch (err) {}
      }
    }

    $elem.bind('change,blur', checked)
    $elem.bind('focus', function(ev) {
      try {
        elem.parentNode.removeChild(tips)
      } catch (err) {}
    })

    checked()
  }
})

//双工绑定
var rduplexType = /^(?:checkbox|radio)$/
var rduplexParam = /^(?:radio|checked)$/
var rnoduplexInput = /^(file|button|reset|submit|checkbox|radio|range)$/
var duplexBinding = yua.directive('duplex', {
  priority: 2000,
  init: function(binding, hasCast) {
    var elem = binding.element
    var vmodels = binding.vmodels
    binding.changed =
      getBindingCallback(elem, 'data-duplex-changed', vmodels) || noop
    var params = []
    var casting = oneObject('string,number,boolean,checked')
    if (elem.type === 'radio' && binding.param === '') {
      binding.param = 'checked'
    }

    binding.param.replace(rw20g, function(name) {
      if (rduplexType.test(elem.type) && rduplexParam.test(name)) {
        if (name === 'radio') log(':duplex-radio已经更名为:duplex-checked')
        name = 'checked'
        binding.isChecked = true
        binding.xtype = 'radio'
      }
      if (name === 'bool') {
        name = 'boolean'
        log(':duplex-bool已经更名为:duplex-boolean')
      } else if (name === 'text') {
        name = 'string'
        log(':duplex-text已经更名为:duplex-string')
      }
      if (casting[name]) {
        hasCast = true
      }
      yua.Array.ensure(params, name)
    })
    if (!hasCast) {
      params.push('string')
    }
    binding.param = params.join('-')
    if (!binding.xtype) {
      binding.xtype =
        elem.tagName === 'SELECT'
          ? 'select'
          : elem.type === 'checkbox'
            ? 'checkbox'
            : elem.type === 'radio'
              ? 'radio'
              : /^change/.test(elem.getAttribute('data-duplex-event'))
                ? 'change'
                : 'input'
    }
    //===================绑定事件======================
    var bound = (binding.bound = function(type, callback) {
      elem.addEventListener(type, callback, false)
      var old = binding.rollback
      binding.rollback = function() {
        elem.yuaSetter = null
        yua.unbind(elem, type, callback)
        old && old()
      }
    })
    function callback(value) {
      binding.changed.call(this, value, binding)
    }
    var composing = false
    function compositionStart() {
      composing = true
    }
    function compositionEnd() {
      composing = false
      setTimeout(updateVModel)
    }
    var updateVModel = function(e) {
      var val = elem.value
      //防止递归调用形成死循环
      //处理中文输入法在minlengh下引发的BUG
      if (composing || val === binding.oldValue || binding.pipe === null) {
        return
      }

      var lastValue = binding.pipe(val, binding, 'get')
      binding.oldValue = val
      binding.setter(lastValue)

      callback.call(elem, lastValue)
      yua.fireDom(elem, 'change')
    }
    switch (binding.xtype) {
      case 'radio':
        bound('click', function() {
          var lastValue = binding.pipe(elem.value, binding, 'get')
          binding.setter(lastValue)
          callback.call(elem, lastValue)
        })
        break
      case 'checkbox':
        bound('change', function() {
          var method = elem.checked ? 'ensure' : 'remove'
          var array = binding.getter.apply(0, binding.vmodels)
          if (!Array.isArray(array)) {
            log(':duplex应用于checkbox上要对应一个数组')
            array = [array]
          }
          var val = binding.pipe(elem.value, binding, 'get')
          yua.Array[method](array, val)
          callback.call(elem, array)
        })
        break
      case 'change':
        bound('change', updateVModel)
        break
      case 'input':
        bound('input', updateVModel)
        bound('keyup', updateVModel)
        if (!IEVersion) {
          bound('compositionstart', compositionStart)
          bound('compositionend', compositionEnd)
          bound('DOMAutoComplete', updateVModel)
        }
        break
      case 'select':
        bound('change', function() {
          var val = yua(elem).val() //字符串或字符串数组
          if (Array.isArray(val)) {
            val = val.map(function(v) {
              return binding.pipe(v, binding, 'get')
            })
          } else {
            val = binding.pipe(val, binding, 'get')
          }
          if (val + '' !== binding.oldValue) {
            try {
              binding.setter(val)
            } catch (ex) {
              log(ex)
            }
          }
        })
        bound('datasetchanged', function(e) {
          if (e.bubble === 'selectDuplex') {
            var value = binding._value
            var curValue = Array.isArray(value) ? value.map(String) : value + ''
            yua(elem).val(curValue)
            elem.oldValue = curValue + ''
            callback.call(elem, curValue)
          }
        })
        break
    }
    if (binding.xtype === 'input' && !rnoduplexInput.test(elem.type)) {
      if (elem.type !== 'hidden') {
        bound('focus', function() {
          elem.msFocus = true
        })
        bound('blur', function() {
          elem.msFocus = false
        })
      }
      elem.yuaSetter = updateVModel //#765
      watchValueInTimer(function() {
        if (root.contains(elem)) {
          if (!elem.msFocus) {
            updateVModel()
          }
        } else if (!elem.msRetain) {
          return false
        }
      })
    }
  },
  update: function(value) {
    var elem = this.element,
      binding = this,
      curValue
    if (!this.init) {
      for (var i in yua.vmodels) {
        var v = yua.vmodels[i]
        v.$fire('yua-duplex-init', binding)
      }
      var cpipe = binding.pipe || (binding.pipe = pipe)
      cpipe(null, binding, 'init')
      this.init = 1
    }
    switch (this.xtype) {
      case 'input':
        elem.value = value
        break
      case 'change':
        curValue = this.pipe(value, this, 'set') //fix #673
        if (curValue !== this.oldValue) {
          var fixCaret = false
          if (elem.msFocus) {
            try {
              var start = elem.selectionStart
              var end = elem.selectionEnd
              if (start === end) {
                var pos = start
                fixCaret = true
              }
            } catch (e) {}
          }
          elem.value = this.oldValue = curValue
          if (fixCaret && !elem.readOnly) {
            elem.selectionStart = elem.selectionEnd = pos
          }
        }
        break
      case 'radio':
        curValue = binding.isChecked ? !!value : value + '' === elem.value
        elem.checked = curValue
        break
      case 'checkbox':
        var array = [].concat(value) //强制转换为数组
        curValue = this.pipe(elem.value, this, 'get')
        elem.checked = array.indexOf(curValue) > -1
        break
      case 'select':
        //必须变成字符串后才能比较
        binding._value = value
        if (!elem.msHasEvent) {
          elem.msHasEvent = 'selectDuplex'
          //必须等到其孩子准备好才触发
        } else {
          yua.fireDom(elem, 'datasetchanged', {
            bubble: elem.msHasEvent
          })
        }
        break
    }
  }
})

function fixNull(val) {
  return val == null ? '' : val
}
yua.duplexHooks = {
  checked: {
    get: function(val, binding) {
      return !binding.oldValue
    }
  },
  string: {
    get: function(val) {
      //同步到VM
      return val
    },
    set: fixNull
  },
  boolean: {
    get: function(val) {
      return val === 'true'
    },
    set: fixNull
  },
  number: {
    get: function(val, binding) {
      var number = val - 0
      if (-val === -number) {
        return number
      }
      var arr = /strong|medium|weak/.exec(
        binding.element.getAttribute('data-duplex-number')
      ) || ['medium']
      switch (arr[0]) {
        case 'strong':
          return 0
        case 'medium':
          return val === '' ? '' : 0
        case 'weak':
          return val
      }
    },
    set: fixNull
  }
}

function pipe(val, binding, action, e) {
  binding.param.replace(rw20g, function(name) {
    var hook = yua.duplexHooks[name]
    if (hook && typeof hook[action] === 'function') {
      val = hook[action](val, binding)
    }
  })
  return val
}

var TimerID,
  ribbon = []

yua.tick = function(fn) {
  if (ribbon.push(fn) === 1) {
    TimerID = setInterval(ticker, 60)
  }
}

function ticker() {
  for (var n = ribbon.length - 1; n >= 0; n--) {
    var el = ribbon[n]
    if (el() === false) {
      ribbon.splice(n, 1)
    }
  }
  if (!ribbon.length) {
    clearInterval(TimerID)
  }
}

var watchValueInTimer = noop
new function() {
  // jshint ignore:line
  try {
    //#272 IE9-IE11, firefox
    var setters = {}
    var aproto = HTMLInputElement.prototype
    var bproto = HTMLTextAreaElement.prototype
    function newSetter(value) {
      // jshint ignore:line
      setters[this.tagName].call(this, value)
      if (!this.msFocus && this.yuaSetter) {
        this.yuaSetter()
      }
    }
    var inputProto = HTMLInputElement.prototype
    Object.getOwnPropertyNames(inputProto) //故意引发IE6-8等浏览器报错
    setters['INPUT'] = Object.getOwnPropertyDescriptor(aproto, 'value').set

    Object.defineProperty(aproto, 'value', {
      set: newSetter
    })
    setters['TEXTAREA'] = Object.getOwnPropertyDescriptor(bproto, 'value').set
    Object.defineProperty(bproto, 'value', {
      set: newSetter
    })
  } catch (e) {
    //在chrome 43中 :duplex终于不需要使用定时器实现双向绑定了
    // http://updates.html5rocks.com/2015/04/DOM-attributes-now-on-the-prototype
    // https://docs.google.com/document/d/1jwA8mtClwxI-QJuHT7872Z0pxpZz8PBkf2bGAbsUtqs/edit?pli=1
    watchValueInTimer = yua.tick
  }
}() // jshint ignore:line

/*-------------动画------------*/

yua.directive('effect', {
  priority: 5,
  init: function(binding) {
    var text = binding.expr,
      className,
      rightExpr
    var colonIndex = text
      .replace(rexprg, function(a) {
        return a.replace(/./g, '0')
      })
      .indexOf(':') //取得第一个冒号的位置
    if (colonIndex === -1) {
      // 比如 :class/effect="aaa bbb ccc" 的情况
      className = text
      rightExpr = true
    } else {
      // 比如 :class/effect-1="ui-state-active:checked" 的情况
      className = text.slice(0, colonIndex)
      rightExpr = text.slice(colonIndex + 1)
    }
    if (!rexpr.test(text)) {
      className = quote(className)
    } else {
      className = normalizeExpr(className)
    }
    binding.expr = '[' + className + ',' + rightExpr + ']'
  },
  update: function(arr) {
    var name = arr[0]
    var elem = this.element
    if (elem.getAttribute('data-effect-name') === name) {
      return
    } else {
      elem.removeAttribute('data-effect-driver')
    }
    var inlineStyles = elem.style
    var computedStyles = window.getComputedStyle
      ? window.getComputedStyle(elem)
      : null
    var useAni = false
    if (computedStyles && (supportTransition || supportAnimation)) {
      //如果支持CSS动画
      var duration =
        inlineStyles[transitionDuration] || computedStyles[transitionDuration]
      if (duration && duration !== '0s') {
        elem.setAttribute('data-effect-driver', 't')
        useAni = true
      }

      if (!useAni) {
        duration =
          inlineStyles[animationDuration] || computedStyles[animationDuration]
        if (duration && duration !== '0s') {
          elem.setAttribute('data-effect-driver', 'a')
          useAni = true
        }
      }
    }

    if (!useAni) {
      if (yua.effects[name]) {
        elem.setAttribute('data-effect-driver', 'j')
        useAni = true
      }
    }
    if (useAni) {
      elem.setAttribute('data-effect-name', name)
    }
  }
})

yua.effects = {}
yua.effect = function(name, callbacks) {
  yua.effects[name] = callbacks
}

var supportTransition = false
var supportAnimation = false

var transitionEndEvent
var animationEndEvent
var transitionDuration = yua.cssName('transition-duration')
var animationDuration = yua.cssName('animation-duration')
new function() {
  // jshint ignore:line
  var checker = {
    TransitionEvent: 'transitionend',
    WebKitTransitionEvent: 'webkitTransitionEnd',
    OTransitionEvent: 'oTransitionEnd',
    otransitionEvent: 'otransitionEnd'
  }
  var tran
  //有的浏览器同时支持私有实现与标准写法，比如webkit支持前两种，Opera支持1、3、4
  for (var name in checker) {
    if (window[name]) {
      tran = checker[name]
      break
    }
    try {
      var a = document.createEvent(name)
      tran = checker[name]
      break
    } catch (e) {}
  }
  if (typeof tran === 'string') {
    supportTransition = true
    transitionEndEvent = tran
  }

  //大致上有两种选择
  //IE10+, Firefox 16+ & Opera 12.1+: animationend
  //Chrome/Safari: webkitAnimationEnd
  //http://blogs.msdn.com/b/davrous/archive/2011/12/06/introduction-to-css3-animat ions.aspx
  //IE10也可以使用MSAnimationEnd监听，但是回调里的事件 type依然为animationend
  //  el.addEventListener("MSAnimationEnd", function(e) {
  //     alert(e.type)// animationend！！！
  // })
  checker = {
    AnimationEvent: 'animationend',
    WebKitAnimationEvent: 'webkitAnimationEnd'
  }
  var ani
  for (name in checker) {
    if (window[name]) {
      ani = checker[name]
      break
    }
  }
  if (typeof ani === 'string') {
    supportTransition = true
    animationEndEvent = ani
  }
}()

var effectPool = [] //重复利用动画实例
function effectFactory(el, opts) {
  if (!el || el.nodeType !== 1) {
    return null
  }
  if (opts) {
    var name = opts.effectName
    var driver = opts.effectDriver
  } else {
    name = el.getAttribute('data-effect-name')
    driver = el.getAttribute('data-effect-driver')
  }
  if (!name || !driver) {
    return null
  }

  var instance = effectPool.pop() || new Effect()
  instance.el = el
  instance.driver = driver
  instance.useCss = driver !== 'j'
  if (instance.useCss) {
    opts && yua(el).addClass(opts.effectClass)
    instance.cssEvent = driver === 't' ? transitionEndEvent : animationEndEvent
  }
  instance.name = name
  instance.callbacks = yua.effects[name] || {}

  return instance
}

function effectBinding(elem, binding) {
  var name = elem.getAttribute('data-effect-name')
  if (name) {
    binding.effectName = name
    binding.effectDriver = elem.getAttribute('data-effect-driver')
    var stagger = +elem.getAttribute('data-effect-stagger')
    binding.effectLeaveStagger =
      +elem.getAttribute('data-effect-leave-stagger') || stagger
    binding.effectEnterStagger =
      +elem.getAttribute('data-effect-enter-stagger') || stagger
    binding.effectClass = elem.className || NaN
  }
}
function upperFirstChar(str) {
  return str.replace(/^[\S]/g, function(m) {
    return m.toUpperCase()
  })
}
var effectBuffer = new Buffer()
function Effect() {} //动画实例,做成类的形式,是为了共用所有原型方法

Effect.prototype = {
  contrustor: Effect,
  enterClass: function() {
    return getEffectClass(this, 'enter')
  },
  leaveClass: function() {
    return getEffectClass(this, 'leave')
  },
  // 共享一个函数
  actionFun: function(name, before, after) {
    if (document.hidden) {
      return
    }
    var me = this
    var el = me.el
    var isLeave = name === 'leave'
    name = isLeave ? 'leave' : 'enter'
    var oppositeName = isLeave ? 'enter' : 'leave'
    callEffectHook(me, 'abort' + upperFirstChar(oppositeName))
    callEffectHook(me, 'before' + upperFirstChar(name))
    if (!isLeave) before(el) //这里可能做插入DOM树的操作,因此必须在修改类名前执行
    var cssCallback = function(cancel) {
      el.removeEventListener(me.cssEvent, me.cssCallback)
      if (isLeave) {
        before(el) //这里可能做移出DOM树操作,因此必须位于动画之后
        yua(el).removeClass(me.cssClass)
      } else {
        if (me.driver === 'a') {
          yua(el).removeClass(me.cssClass)
        }
      }
      if (cancel !== true) {
        callEffectHook(me, 'after' + upperFirstChar(name))
        after && after(el)
      }
      me.dispose()
    }
    if (me.useCss) {
      if (me.cssCallback) {
        //如果leave动画还没有完成,立即完成
        me.cssCallback(true)
      }

      me.cssClass = getEffectClass(me, name)
      me.cssCallback = cssCallback

      me.update = function() {
        el.addEventListener(me.cssEvent, me.cssCallback)
        if (!isLeave && me.driver === 't') {
          //transtion延迟触发
          yua(el).removeClass(me.cssClass)
        }
      }
      yua(el).addClass(me.cssClass) //animation会立即触发

      effectBuffer.render(true)
      effectBuffer.queue.push(me)
    } else {
      callEffectHook(me, name, cssCallback)
    }
  },
  enter: function(before, after) {
    this.actionFun.apply(this, ['enter'].concat(yua.slice(arguments)))
  },
  leave: function(before, after) {
    this.actionFun.apply(this, ['leave'].concat(yua.slice(arguments)))
  },
  dispose: function() {
    //销毁与回收到池子中
    this.update = this.cssCallback = null
    if (effectPool.unshift(this) > 100) {
      effectPool.pop()
    }
  }
}

function getEffectClass(instance, type) {
  var a = instance.callbacks[type + 'Class']
  if (typeof a === 'string') return a
  if (typeof a === 'function') return a()
  return instance.name + '-' + type
}

function callEffectHook(effect, name, cb) {
  var hook = effect.callbacks[name]
  if (hook) {
    hook.call(effect, effect.el, cb)
  }
}

var applyEffect = function(el, dir /*[before, [after, [opts]]]*/) {
  var args = aslice.call(arguments, 0)
  if (typeof args[2] !== 'function') {
    args.splice(2, 0, noop)
  }
  if (typeof args[3] !== 'function') {
    args.splice(3, 0, noop)
  }
  var before = args[2]
  var after = args[3]
  var opts = args[4]
  var effect = effectFactory(el, opts)
  if (!effect) {
    before()
    after()
    return false
  } else {
    var method = dir ? 'enter' : 'leave'
    effect[method](before, after)
  }
}

yua.mix(yua.effect, {
  apply: applyEffect,
  append: function(el, parent, after, opts) {
    return applyEffect(
      el,
      1,
      function() {
        parent.appendChild(el)
      },
      after,
      opts
    )
  },
  before: function(el, target, after, opts) {
    return applyEffect(
      el,
      1,
      function() {
        target.parentNode.insertBefore(el, target)
      },
      after,
      opts
    )
  },
  remove: function(el, parent, after, opts) {
    return applyEffect(
      el,
      0,
      function() {
        if (el.parentNode === parent) parent.removeChild(el)
      },
      after,
      opts
    )
  }
})

yua.directive('html', {
  update: function(val) {
    var binding = this
    var elem = this.element
    var isHtmlFilter = elem.nodeType !== 1
    var parent = isHtmlFilter ? elem.parentNode : elem
    if (!parent) return
    val = val == null ? '' : val

    if (elem.nodeType === 3) {
      var signature = generateID('html')
      parent.insertBefore(DOC.createComment(signature), elem)
      binding.element = DOC.createComment(signature + ':end')
      parent.replaceChild(binding.element, elem)
      elem = binding.element
    }
    if (typeof val !== 'object') {
      //string, number, boolean
      var fragment = yua.parseHTML(String(val))
    } else if (val.nodeType === 11) {
      //将val转换为文档碎片
      fragment = val
    } else if (val.nodeType === 1 || val.item) {
      var nodes = val.nodeType === 1 ? val.childNodes : val.item
      fragment = yuaFragment.cloneNode(true)
      while (nodes[0]) {
        fragment.appendChild(nodes[0])
      }
    }

    nodes = yua.slice(fragment.childNodes)
    //插入占位符, 如果是过滤器,需要有节制地移除指定的数量,如果是html指令,直接清空
    if (isHtmlFilter) {
      var endValue = elem.nodeValue.slice(0, -4)
      while (true) {
        var node = elem.previousSibling
        if (!node || (node.nodeType === 8 && node.nodeValue === endValue)) {
          break
        } else {
          parent.removeChild(node)
        }
      }
      parent.insertBefore(fragment, elem)
    } else {
      yua.clearHTML(elem).appendChild(fragment)
    }
    scanNodeArray(nodes, binding.vmodels)
  }
})

yua.directive('if', {
  priority: 10,
  update: function(val) {
    var binding = this
    var elem = this.element
    var stamp = (binding.stamp = +new Date())
    var par
    var after = function() {
      if (stamp !== binding.stamp) return
      binding.recoverNode = null
    }
    if (binding.recoverNode) binding.recoverNode() // 还原现场，有移动节点的都需要还原现场
    try {
      if (!elem.parentNode) return
      par = elem.parentNode
    } catch (e) {
      return
    }
    if (val) {
      //插回DOM树
      function alway() {
        // jshint ignore:line
        if (elem.getAttribute(binding.name)) {
          elem.removeAttribute(binding.name)
          scanAttr(elem, binding.vmodels)
        }
        binding.rollback = null
      }
      if (elem.nodeType === 8) {
        var keep = binding.keep
        var hasEffect = yua.effect.apply(
          keep,
          1,
          function() {
            if (stamp !== binding.stamp) return
            elem.parentNode.replaceChild(keep, elem)
            elem = binding.element = keep //这时可能为null
            if (keep.getAttribute('_required')) {
              //#1044
              elem.required = true
              elem.removeAttribute('_required')
            }
            if (elem.querySelectorAll) {
              yua.each(elem.querySelectorAll('[_required=true]'), function(el) {
                el.required = true
                el.removeAttribute('_required')
              })
            }
            alway()
          },
          after
        )
        hasEffect = hasEffect === false
      }
      if (!hasEffect) alway()
    } else {
      //移出DOM树，并用注释节点占据原位置
      if (elem.nodeType === 1) {
        if (elem.required === true) {
          elem.required = false
          elem.setAttribute('_required', 'true')
        }
        try {
          //如果不支持querySelectorAll或:required,可以直接无视
          yua.each(elem.querySelectorAll(':required'), function(el) {
            elem.required = false
            el.setAttribute('_required', 'true')
          })
        } catch (e) {}

        var node = (binding.element = DOC.createComment(':if')),
          pos = elem.nextSibling
        binding.recoverNode = function() {
          binding.recoverNode = null
          if (node.parentNode !== par) {
            par.insertBefore(node, pos)
            binding.keep = elem
          }
        }

        yua.effect.apply(
          elem,
          0,
          function() {
            binding.recoverNode = null
            if (stamp !== binding.stamp) return
            elem.parentNode.replaceChild(node, elem)
            binding.keep = elem //元素节点
            ifGroup.appendChild(elem)
            binding.rollback = function() {
              if (elem.parentNode === ifGroup) {
                ifGroup.removeChild(elem)
              }
            }
          },
          after
        )
      }
    }
  }
})

//:important绑定已经在scanTag 方法中实现
var rnoscripts = /<noscript.*?>(?:[\s\S]+?)<\/noscript>/gim
var rnoscriptText = /<noscript.*?>([\s\S]+?)<\/noscript>/im

var getXHR = function() {
  return new window.XMLHttpRequest() // jshint ignore:line
}
//将所有远程加载的模板,以字符串形式存放到这里
var templatePool = (yua.templateCache = {})

function getTemplateContainer(binding, id, text) {
  var div = binding.templateCache && binding.templateCache[id]
  if (div) {
    var dom = DOC.createDocumentFragment(),
      firstChild
    while ((firstChild = div.firstChild)) {
      dom.appendChild(firstChild)
    }
    return dom
  }
  return yua.parseHTML(text)
}
function nodesToFrag(nodes) {
  var frag = DOC.createDocumentFragment()
  for (var i = 0, len = nodes.length; i < len; i++) {
    frag.appendChild(nodes[i])
  }
  return frag
}
yua.directive('include', {
  init: directives.attr.init,
  update: function(val) {
    var binding = this
    var elem = this.element
    var vmodels = binding.vmodels
    var rendered = binding.includeRendered
    var effectClass = binding.effectName && binding.effectClass // 是否开启动画
    var templateCache = binding.templateCache // 是否data-include-cache
    var outer = binding.includeReplace // 是否data-include-replace
    var loaded = binding.includeLoaded
    var target = outer ? elem.parentNode : elem
    var _ele = binding._element // data-include-replace binding.element === binding.end

    binding.recoverNodes = binding.recoverNodes || yua.noop

    var scanTemplate = function(text) {
      var _stamp = (binding._stamp = +new Date()) // 过滤掉频繁操作
      if (loaded) {
        var newText = loaded.apply(target, [text].concat(vmodels))
        if (typeof newText === 'string') text = newText
      }
      if (rendered) {
        checkScan(
          target,
          function() {
            rendered.call(target)
          },
          NaN
        )
      }
      var lastID = binding.includeLastID || '_default' // 默认

      binding.includeLastID = val
      var leaveEl =
        (templateCache && templateCache[lastID]) ||
        DOC.createElement(elem.tagName || binding._element.tagName) // 创建一个离场元素

      if (effectClass) {
        leaveEl.className = effectClass
        target.insertBefore(leaveEl, binding.start) // 插入到start之前，防止被错误的移动
      }

      // cache or animate，移动节点
      ;(templateCache || {})[lastID] = leaveEl
      var fragOnDom = binding.recoverNodes() // 恢复动画中的节点
      if (fragOnDom) {
        target.insertBefore(fragOnDom, binding.end)
      }
      while (true) {
        var node = binding.start.nextSibling
        if (node && node !== leaveEl && node !== binding.end) {
          leaveEl.appendChild(node)
        } else {
          break
        }
      }

      // 元素退场
      yua.effect.remove(
        leaveEl,
        target,
        function() {
          if (templateCache) {
            // write cache
            if (_stamp === binding._stamp) ifGroup.appendChild(leaveEl)
          }
        },
        binding
      )

      var enterEl = target,
        before = yua.noop,
        after = yua.noop

      var fragment = getTemplateContainer(binding, val, text)
      var nodes = yua.slice(fragment.childNodes)

      if (outer && effectClass) {
        enterEl = _ele
        enterEl.innerHTML = '' // 清空
        enterEl.setAttribute(':skip', 'true')
        target.insertBefore(enterEl, binding.end.nextSibling) // 插入到bingding.end之后避免被错误的移动
        before = function() {
          enterEl.insertBefore(fragment, null) // 插入节点
        }
        after = function() {
          binding.recoverNodes = yua.noop
          if (_stamp === binding._stamp) {
            fragment = nodesToFrag(nodes)
            target.insertBefore(fragment, binding.end) // 插入真实element
            scanNodeArray(nodes, vmodels)
          }
          if (enterEl.parentNode === target) target.removeChild(enterEl) // 移除入场动画元素
        }
        binding.recoverNodes = function() {
          binding.recoverNodes = yua.noop
          return nodesToFrag(nodes)
        }
      } else {
        before = function() {
          //新添加元素的动画
          target.insertBefore(fragment, binding.end)
          scanNodeArray(nodes, vmodels)
        }
      }

      yua.effect.apply(enterEl, 'enter', before, after)
    }

    if (!val) return

    var el = val

    if (typeof el === 'object') {
      if (el.nodeType !== 1) return log('include 不支持非DOM对象')
    } else {
      el = DOC.getElementById(val)
      if (!el) {
        if (typeof templatePool[val] === 'string') {
          yua.nextTick(function() {
            scanTemplate(templatePool[val])
          })
        } else if (Array.isArray(templatePool[val])) {
          //#805 防止在循环绑定中发出许多相同的请求
          templatePool[val].push(scanTemplate)
        } else {
          var xhr = getXHR()
          xhr.onload = function() {
            if (xhr.status !== 200)
              return log('获取网络资源出错, httpError[' + xhr.status + ']')

            var text = xhr.responseText
            for (var f = 0, fn; (fn = templatePool[val][f++]); ) {
              fn(text)
            }
            templatePool[val] = text
          }
          xhr.onerror = function() {
            log(':include load [' + val + '] error')
          }
          templatePool[val] = [scanTemplate]
          xhr.open('GET', val, true)
          if ('withCredentials' in xhr) {
            xhr.withCredentials = true
          }
          xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest')
          xhr.send(null)
        }
        return
      }
    }

    yua.nextTick(function() {
      scanTemplate(el.value || el.innerText || el.innerHTML)
    })
  }
})

var rdash = /\(([^)]*)\)/
var onDir = yua.directive('on', {
  priority: 3000,
  init: function(binding) {
    var value = binding.expr
    binding.type = 'on'
    var eventType = binding.param.replace(/-\d+$/, '') // :on-mousemove-10
    if (typeof onDir[eventType + 'Hook'] === 'function') {
      onDir[eventType + 'Hook'](binding)
    }
    if (value.indexOf('(') > 0 && value.indexOf(')') > -1) {
      var matched = (value.match(rdash) || ['', ''])[1].trim()
      if (matched === '' || matched === '$event') {
        // aaa() aaa($event)当成aaa处理
        value = value.replace(rdash, '')
      }
    }
    binding.expr = value
  },
  update: function(callback) {
    var binding = this
    var elem = this.element
    callback = function(e) {
      var fn = binding.getter || noop
      return fn.apply(this, binding.args.concat(e))
    }

    var eventType = binding.param.replace(/-\d+$/, '') // :on-mousemove-10
    if (eventType === 'scan') {
      callback.call(elem, {
        type: eventType
      })
    } else if (typeof binding.specialBind === 'function') {
      binding.specialBind(elem, callback)
    } else {
      var removeFn = yua.bind(elem, eventType, callback)
    }
    binding.rollback = function() {
      if (typeof binding.specialUnbind === 'function') {
        binding.specialUnbind()
      } else {
        yua.unbind(elem, eventType, removeFn)
      }
    }
  }
})

yua.directive('repeat', {
  priority: 90,
  init: function(binding) {
    var type = binding.type
    binding.cache = {} //用于存放代理VM
    binding.enterCount = 0

    var elem = binding.element
    if (elem.nodeType === 1) {
      elem.removeAttribute(binding.name)
      effectBinding(elem, binding)
      binding.param = binding.param || 'el'
      binding.sortedCallback = getBindingCallback(
        elem,
        'data-repeat-sortby',
        binding.vmodels
      )
      var rendered = getBindingCallback(
        elem,
        'data-repeat-rendered',
        binding.vmodels
      )

      var signature = generateID(type)
      var start = DOC.createComment(signature + ':start')
      var end = (binding.element = DOC.createComment(signature + ':end'))
      binding.signature = signature
      binding.start = start
      binding.template = yuaFragment.cloneNode(false)

      var parent = elem.parentNode
      parent.replaceChild(end, elem)
      parent.insertBefore(start, end)
      binding.template.appendChild(elem)

      binding.element = end

      if (rendered) {
        var removeFn = yua.bind(parent, 'datasetchanged', function() {
          rendered.apply(parent, parent.args)
          yua.unbind(parent, 'datasetchanged', removeFn)
          parent.msRendered = rendered
        })
      }
    }
  },
  update: function(value, oldValue) {
    var binding = this
    var xtype = this.xtype

    this.enterCount += 1
    var init = !oldValue
    if (init) {
      binding.$outer = {}
      var check0 = '$key'
      var check1 = '$val'
      if (xtype === 'array') {
        check0 = '$first'
        check1 = '$last'
      }
      for (var i = 0, v; (v = binding.vmodels[i++]); ) {
        if (v.hasOwnProperty(check0) && v.hasOwnProperty(check1)) {
          binding.$outer = v
          break
        }
      }
    }
    var track = this.track
    if (binding.sortedCallback) {
      //如果有回调，则让它们排序
      var keys2 = binding.sortedCallback.call(parent, track)
      if (keys2 && Array.isArray(keys2)) {
        track = keys2
      }
    }

    var action = 'move'
    binding.$repeat = value
    var fragments = []
    var transation = init && yuaFragment.cloneNode(false)
    var proxies = []
    var param = this.param
    var retain = yua.mix({}, this.cache)
    var elem = this.element
    var length = track.length

    var parent = elem.parentNode

    //检查新元素数量
    var newCount = 0
    for (i = 0; i < length; i++) {
      var keyOrId = track[i]
      if (!retain[keyOrId]) newCount++
    }
    var oldCount = 0
    for (i in retain) {
      oldCount++
    }
    var clear = (!length || newCount === length) && oldCount > 10 //当全部是新元素,且移除元素较多(10)时使用clear

    var kill = elem.previousSibling
    var start = binding.start

    /*log(kill === start, kill)
        while(kill !== start && kill.nodeName !== '#comment'){
            parent.removeChild(kill)
            kill = elem.previousSibling
        }*/
    if (clear) {
      while (kill !== start) {
        parent.removeChild(kill)
        kill = elem.previousSibling
      }
    }

    for (i = 0; i < length; i++) {
      keyOrId = track[i] //array为随机数, object 为keyName
      var proxy = retain[keyOrId]
      if (!proxy) {
        proxy = getProxyVM(this)
        proxy.$up = null
        if (xtype === 'array') {
          action = 'add'
          proxy.$id = keyOrId
          var valueItem = value[i]
          proxy[param] = valueItem //index
          if (Object(valueItem) === valueItem) {
            valueItem.$ups = valueItem.$ups || {}
            valueItem.$ups[param] = proxy
          }
        } else {
          action = 'append'
          proxy.$key = keyOrId
          proxy.$val = value[keyOrId] //key
          proxy[param] = { $key: proxy.$key, $val: proxy.$val }
        }
        this.cache[keyOrId] = proxy
        var node = proxy.$anchor || (proxy.$anchor = elem.cloneNode(false))
        node.nodeValue = this.signature
        shimController(
          binding,
          transation,
          proxy,
          fragments,
          init && !binding.effectDriver
        )
        decorateProxy(proxy, binding, xtype)
      } else {
        // if (xtype === "array") {
        //     proxy[param] = value[i]
        // }
        fragments.push({})
        retain[keyOrId] = true
      }

      //重写proxy
      if (this.enterCount === 1) {
        //防止多次进入,导致位置不对
        proxy.$active = false
        proxy.$oldIndex = proxy.$index
        proxy.$active = true
        proxy.$index = i
      }

      if (xtype === 'array') {
        proxy.$first = i === 0
        proxy.$last = i === length - 1
        // proxy[param] = value[i]
      } else {
        proxy.$val = toJson(value[keyOrId]) //这里是处理vm.object = newObject的情况
      }
      proxies.push(proxy)
    }
    this.proxies = proxies
    if (init && !binding.effectDriver) {
      parent.insertBefore(transation, elem)
      fragments.forEach(function(fragment) {
        scanNodeArray(fragment.nodes || [], fragment.vmodels)
        //if(fragment.vmodels.length > 2)
        fragment.nodes = fragment.vmodels = null
      }) // jshint ignore:line
    } else {
      var staggerIndex = (binding.staggerIndex = 0)
      for (keyOrId in retain) {
        if (retain[keyOrId] !== true) {
          action = 'del'
          !clear && removeItem(retain[keyOrId].$anchor, binding, true)
          // 相当于delete binding.cache[key]
          proxyRecycler(this.cache, keyOrId, param)
          retain[keyOrId] = null
        }
      }

      for (i = 0; i < length; i++) {
        proxy = proxies[i]
        keyOrId = xtype === 'array' ? proxy.$id : proxy.$key
        var pre = proxies[i - 1]
        var preEl = pre ? pre.$anchor : binding.start
        if (!retain[keyOrId]) {
          //如果还没有插入到DOM树,进行插入动画
          ;(function(fragment, preElement) {
            var nodes = fragment.nodes
            var vmodels = fragment.vmodels
            if (nodes) {
              staggerIndex = mayStaggerAnimate(
                binding.effectEnterStagger,
                function() {
                  parent.insertBefore(fragment.content, preElement.nextSibling)
                  scanNodeArray(nodes, vmodels)
                  !init && animateRepeat(nodes, 1, binding)
                },
                staggerIndex
              )
            }
            fragment.nodes = fragment.vmodels = null
          })(fragments[i], preEl) // jshint ignore:line
        } else if (proxy.$index !== proxy.$oldIndex) {
          //进行移动动画
          ;(function(proxy2, preElement) {
            staggerIndex = mayStaggerAnimate(
              binding.effectEnterStagger,
              function() {
                var curNode = removeItem(proxy2.$anchor)
                var inserted = yua.slice(curNode.childNodes)
                parent.insertBefore(curNode, preElement.nextSibling)
                animateRepeat(inserted, 1, binding)
              },
              staggerIndex
            )
          })(proxy, preEl) // jshint ignore:line
        }
      }
    }
    if (!value.$track) {
      //如果是非监控对象,那么就将其$events清空,阻止其持续监听
      for (keyOrId in this.cache) {
        proxyRecycler(this.cache, keyOrId, param)
      }
    }

    //repeat --> duplex
    ;(function(args) {
      parent.args = args
      if (parent.msRendered) {
        //第一次事件触发,以后直接调用
        parent.msRendered.apply(parent, args)
      }
    })(kernel.newWatch ? arguments : [action])
    var id = setTimeout(function() {
      clearTimeout(id)
      //触发上层的select回调及自己的rendered回调
      yua.fireDom(parent, 'datasetchanged', {
        bubble: parent.msHasEvent
      })
    })
    this.enterCount -= 1
  }
})

function animateRepeat(nodes, isEnter, binding) {
  for (var i = 0, node; (node = nodes[i++]); ) {
    if (node.className === binding.effectClass) {
      yua.effect.apply(node, isEnter, noop, noop, binding)
    }
  }
}

function mayStaggerAnimate(staggerTime, callback, index) {
  if (staggerTime) {
    setTimeout(callback, ++index * staggerTime)
  } else {
    callback()
  }
  return index
}

function removeItem(node, binding, flagRemove) {
  var fragment = yuaFragment.cloneNode(false)
  var last = node
  var breakText = last.nodeValue
  var staggerIndex = binding && Math.max(+binding.staggerIndex, 0)
  var nodes = yua.slice(last.parentNode.childNodes)
  var index = nodes.indexOf(last)
  while (true) {
    var pre = nodes[--index] //node.previousSibling
    if (!pre || String(pre.nodeValue).indexOf(breakText) === 0) {
      break
    }
    if (!flagRemove && binding && pre.className === binding.effectClass) {
      node = pre
      ;(function(cur) {
        binding.staggerIndex = mayStaggerAnimate(
          binding.effectLeaveStagger,
          function() {
            yua.effect.apply(
              cur,
              0,
              noop,
              function() {
                fragment.appendChild(cur)
              },
              binding
            )
          },
          staggerIndex
        )
      })(pre) // jshint ignore:line
    } else {
      fragment.insertBefore(pre, fragment.firstChild)
    }
  }
  fragment.appendChild(last)
  return fragment
}

function shimController(data, transation, proxy, fragments, init) {
  var content = data.template.cloneNode(true)
  var nodes = yua.slice(content.childNodes)
  content.appendChild(proxy.$anchor)
  init && transation.appendChild(content)
  var itemName = data.param || 'el'
  var valueItem = proxy[itemName],
    nv

  nv = [proxy].concat(data.vmodels)

  var fragment = {
    nodes: nodes,
    vmodels: nv,
    content: content
  }
  fragments.push(fragment)
}
// {}  -->  {xx: 0, yy: 1, zz: 2} add
// {xx: 0, yy: 1, zz: 2}  -->  {xx: 0, yy: 1, zz: 2, uu: 3}
// [xx: 0, yy: 1, zz: 2}  -->  {xx: 0, zz: 1, yy: 2}

function getProxyVM(binding) {
  var agent = binding.xtype === 'object' ? withProxyAgent : eachProxyAgent
  var proxy = agent(binding)
  var node = proxy.$anchor || (proxy.$anchor = binding.element.cloneNode(false))
  node.nodeValue = binding.signature
  proxy.$outer = binding.$outer
  return proxy
}

function decorateProxy(proxy, binding, type) {
  if (type === 'array') {
    proxy.$remove = function() {
      binding.$repeat.removeAt(proxy.$index)
    }
    var param = binding.param
    proxy.$watch(param, function(a) {
      var index = proxy.$index
      binding.$repeat[index] = a
    })
  } else {
    proxy.$watch('$val', function fn(a) {
      binding.$repeat[proxy.$key] = a
    })
  }
}

var eachProxyPool = []

function eachProxyAgent(data, proxy) {
  var itemName = data.param || 'el'
  for (var i = 0, n = eachProxyPool.length; i < n; i++) {
    var candidate = eachProxyPool[i]
    if (candidate && candidate.hasOwnProperty(itemName)) {
      eachProxyPool.splice(i, 1)
      proxy = candidate
      break
    }
  }
  if (!proxy) {
    proxy = eachProxyFactory(itemName)
  }
  return proxy
}

function eachProxyFactory(itemName) {
  var source = {
    $outer: {},
    $index: 0,
    $oldIndex: 0,
    $anchor: null,
    //-----
    $first: false,
    $last: false,
    $remove: yua.noop
  }
  source[itemName] = NaN
  var force = {
    $last: 1,
    $first: 1,
    $index: 1
  }
  force[itemName] = 1
  var proxy = modelFactory(source, {
    force: force
  })
  proxy.$id = generateID('$proxy$each')
  return proxy
}

var withProxyPool = []

function withProxyAgent(data) {
  var itemName = data.param || 'el'
  return withProxyPool.pop() || withProxyFactory(itemName)
}

function withProxyFactory(itemName) {
  var source = {
    $key: '',
    $val: NaN,
    $index: 0,
    $oldIndex: 0,
    $outer: {},
    $anchor: null
  }
  source[itemName] = NaN
  var force = {
    $key: 1,
    $val: 1,
    $index: 1
  }
  force[itemName] = 1
  var proxy = modelFactory(source, {
    force: force
  })
  proxy.$id = generateID('$proxy$with')
  return proxy
}

function proxyRecycler(cache, key, param) {
  var proxy = cache[key]
  if (proxy) {
    var proxyPool =
      proxy.$id.indexOf('$proxy$each') === 0 ? eachProxyPool : withProxyPool
    proxy.$outer = {}

    for (var i in proxy.$events) {
      var a = proxy.$events[i]
      if (Array.isArray(a)) {
        a.length = 0
        if (i === param) {
          proxy[param] = NaN
        } else if (i === '$val') {
          proxy.$val = NaN
        }
      }
    }

    if (proxyPool.unshift(proxy) > kernel.maxRepeatSize) {
      proxyPool.pop()
    }
    delete cache[key]
  }
}

/*********************************************************************
 *                         各种指令                                  *
 **********************************************************************/

//:skip绑定已经在scanTag 方法中实现
yua.directive('text', {
  update: function(val) {
    var elem = this.element
    val = val == null ? '' : val //不在页面上显示undefined null
    if (elem.nodeType === 3) {
      //绑定在文本节点上
      try {
        //IE对游离于DOM树外的节点赋值会报错
        elem.data = val
      } catch (e) {}
    } else {
      //绑定在特性节点上
      elem.textContent = val
    }
  }
})
function parseDisplay(nodeName, val) {
  //用于取得此类标签的默认display值
  var key = '_' + nodeName
  if (!parseDisplay[key]) {
    var node = DOC.createElement(nodeName)
    root.appendChild(node)
    if (W3C) {
      val = getComputedStyle(node, null).display
    } else {
      val = node.currentStyle.display
    }
    root.removeChild(node)
    parseDisplay[key] = val
  }
  return parseDisplay[key]
}

yua.parseDisplay = parseDisplay

yua.directive('visible', {
  init: function(binding) {
    effectBinding(binding.element, binding)
  },
  update: function(val) {
    var binding = this,
      elem = this.element,
      stamp
    var noEffect = !this.effectName
    if (!this.stamp) {
      stamp = this.stamp = +new Date()
      if (val) {
        elem.style.display = binding.display || ''
        if (yua(elem).css('display') === 'none') {
          elem.style.display = binding.display = parseDisplay(elem.nodeName)
        }
      } else {
        elem.style.display = 'none'
      }
      return
    }
    stamp = this.stamp = +new Date()
    if (val) {
      yua.effect.apply(elem, 1, function() {
        if (stamp !== binding.stamp) return
        var driver = elem.getAttribute('data-effect-driver') || 'a'

        if (noEffect) {
          //不用动画时走这里
          elem.style.display = binding.display || ''
        }
        // "a", "t"
        if (driver === 'a' || driver === 't') {
          if (yua(elem).css('display') === 'none') {
            elem.style.display = binding.display || parseDisplay(elem.nodeName)
          }
        }
      })
    } else {
      yua.effect.apply(elem, 0, function() {
        if (stamp !== binding.stamp) return
        elem.style.display = 'none'
      })
    }
  }
})

/*********************************************************************
 *                             自带过滤器                             *
 **********************************************************************/

var rscripts = /<script[^>]*>([\S\s]*?)<\/script\s*>/gim
var ron = /\s+(on[^=\s]+)(?:=("[^"]*"|'[^']*'|[^\s>]+))?/g
var ropen = /<\w+\b(?:(["'])[^"]*?(\1)|[^>])*>/gi
var rsanitize = {
  a: /\b(href)\=("javascript[^"]*"|'javascript[^']*')/gi,
  img: /\b(src)\=("javascript[^"]*"|'javascript[^']*')/gi,
  form: /\b(action)\=("javascript[^"]*"|'javascript[^']*')/gi
}
var rsurrogate = /[\uD800-\uDBFF][\uDC00-\uDFFF]/g
var rnoalphanumeric = /([^\#-~| |!])/g

function numberFormat(number, decimals, point, thousands) {
  //form http://phpjs.org/functions/number_format/
  //number 必需，要格式化的数字
  //decimals 可选，规定多少个小数位。
  //point 可选，规定用作小数点的字符串（默认为 . ）。
  //thousands 可选，规定用作千位分隔符的字符串（默认为 , ），如果设置了该参数，那么所有其他参数都是必需的。
  number = (number + '').replace(/[^0-9+\-Ee.]/g, '')
  var n = !isFinite(+number) ? 0 : +number,
    prec = !isFinite(+decimals) ? 3 : Math.abs(decimals),
    sep = thousands || ',',
    dec = point || '.',
    s = '',
    toFixedFix = function(n, prec) {
      var k = Math.pow(10, prec)
      return '' + (Math.round(n * k) / k).toFixed(prec)
    }
  // Fix for IE parseFloat(0.55).toFixed(0) = 0;
  s = (prec ? toFixedFix(n, prec) : '' + Math.round(n)).split('.')
  if (s[0].length > 3) {
    s[0] = s[0].replace(/\B(?=(?:\d{3})+(?!\d))/g, sep)
  }
  if ((s[1] || '').length < prec) {
    s[1] = s[1] || ''
    s[1] += new Array(prec - s[1].length + 1).join('0')
  }
  return s.join(dec)
}

var filters = (yua.filters = {
  uppercase: function(str) {
    return str.toUpperCase()
  },
  lowercase: function(str) {
    return str.toLowerCase()
  },
  //字符串截取，超过指定长度以mark标识接上
  truncate: function(str, len, mark) {
    len = len || 30
    mark = typeof mark === 'string' ? mark : '...'
    return str.slice(0, len) + (str.length <= len ? '' : mark)
  },
  //小值秒数转化为 时间格式
  time: function(str) {
    str = str >> 0
    var s = str % 60
    ;(m = Math.floor(str / 60)), (h = Math.floor(m / 60)), (m = m % 60)
    m = m < 10 ? '0' + m : m
    s = s < 10 ? '0' + s : s

    if (h > 0) {
      h = h < 10 ? '0' + h : h
      return h + ':' + m + ':' + s
    }
    return m + ':' + s
  },
  $filter: function(val) {
    for (var i = 1, n = arguments.length; i < n; i++) {
      var array = arguments[i]
      var fn = yua.filters[array[0]]
      if (typeof fn === 'function') {
        var arr = [val].concat(array.slice(1))
        val = fn.apply(null, arr)
      }
    }
    return val
  },
  camelize: camelize,
  //https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
  //    <a href="javasc&NewLine;ript&colon;alert('XSS')">chrome</a>
  //    <a href="data:text/html;base64, PGltZyBzcmM9eCBvbmVycm9yPWFsZXJ0KDEpPg==">chrome</a>
  //    <a href="jav  ascript:alert('XSS');">IE67chrome</a>
  //    <a href="jav&#x09;ascript:alert('XSS');">IE67chrome</a>
  //    <a href="jav&#x0A;ascript:alert('XSS');">IE67chrome</a>
  sanitize: function(str) {
    return str.replace(rscripts, '').replace(ropen, function(a, b) {
      var match = a.toLowerCase().match(/<(\w+)\s/)
      if (match) {
        //处理a标签的href属性，img标签的src属性，form标签的action属性
        var reg = rsanitize[match[1]]
        if (reg) {
          a = a.replace(reg, function(s, name, value) {
            var quote = value.charAt(0)
            return name + '=' + quote + 'javascript:void(0)' + quote // jshint ignore:line
          })
        }
      }
      return a.replace(ron, ' ').replace(/\s+/g, ' ') //移除onXXX事件
    })
  },
  escape: function(str) {
    //将字符串经过 str 转义得到适合在页面中显示的内容, 例如替换 < 为 &lt
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(rsurrogate, function(value) {
        var hi = value.charCodeAt(0)
        var low = value.charCodeAt(1)
        return '&#' + ((hi - 0xd800) * 0x400 + (low - 0xdc00) + 0x10000) + ';'
      })
      .replace(rnoalphanumeric, function(value) {
        return '&#' + value.charCodeAt(0) + ';'
      })
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
  },
  currency: function(amount, symbol, fractionSize) {
    return (
      (symbol || '\u00a5') +
      numberFormat(amount, isFinite(fractionSize) ? fractionSize : 2)
    )
  },
  number: numberFormat,
  //日期格式化，类似php的date函数，
  date: function(stamp, str, second) {
    second = second === undefined ? false : true
    var oDate
    if (!Date.isDate(stamp)) {
      if (!/[^\d]/.test(stamp)) {
        stamp -= 0
        if (second) {
          stamp *= 1000
        }
      }

      oDate = new Date(stamp)
      if (oDate + '' === 'Invalid Date') return 'Invalid Date'
    } else {
      oDate = stamp
    }
    return oDate.format(str)
  }
})

/*********************************************************************
 *                      AMD加载器                                     *
 **********************************************************************/

//https://www.devbridge.com/articles/understanding-amd-requirejs/
//http://maxogden.com/nested-dependencies.html
var modules = (yua.modules = {
  'domReady!': {
    exports: yua,
    state: 3
  },
  yua: {
    exports: yua,
    state: 4
  }
})
//Object(modules[id]).state拥有如下值
// undefined  没有定义
// 1(send)    已经发出请求
// 2(loading) 已经被执行但还没有执行完成，在这个阶段define方法会被执行
// 3(loaded)  执行完毕，通过onload/onreadystatechange回调判定，在这个阶段checkDeps方法会执行
// 4(execute)  其依赖也执行完毕, 值放到exports对象上，在这个阶段fireFactory方法会执行
modules.exports = modules.yua
var otherRequire = window.require
var otherDefine = window.define
var innerRequire
plugins.loader = function(builtin) {
  var flag = innerRequire && builtin
  window.require = flag ? innerRequire : otherRequire
  window.define = flag ? innerRequire.define : otherDefine
}
new function() {
  // jshint ignore:line
  var loadings = [] //正在加载中的模块列表
  var factorys = [] //放置define方法的factory函数
  var rjsext = /\.js$/i
  function makeRequest(name, config) {
    //1. 去掉资源前缀
    var res = 'js'
    name = name.replace(/^(\w+)\!/, function(a, b) {
      res = b
      return ''
    })
    if (res === 'ready') {
      log('ready!已经被废弃，请使用domReady!')
      res = 'domReady'
    }
    //2. 去掉querystring, hash
    var query = ''
    name = name.replace(rquery, function(a) {
      query = a
      return ''
    })
    //3. 去掉扩展名
    var suffix = '.' + res
    var ext = /js|css/.test(suffix) ? suffix : ''
    name = name.replace(/\.[a-z0-9]+$/g, function(a) {
      if (a === suffix) {
        ext = a
        return ''
      } else {
        return a
      }
    })
    //补上协议, 避免引入依赖时判断不正确
    if (/^\/\//.test(name)) {
      name = location.protocol + name
    }
    var req = yua.mix(
      {
        query: query,
        ext: ext,
        res: res,
        name: name,
        toUrl: toUrl
      },
      config
    )
    req.toUrl(name)
    return req
  }

  function fireRequest(req) {
    var name = req.name
    var res = req.res
    //1. 如果该模块已经发出请求，直接返回
    var module = modules[name]
    var urlNoQuery = name && req.urlNoQuery
    if (module && module.state >= 1) {
      return name
    }
    module = modules[urlNoQuery]
    if (module && module.state >= 3) {
      innerRequire(module.deps || [], module.factory, urlNoQuery)
      return urlNoQuery
    }
    if (name && !module) {
      module = modules[urlNoQuery] = {
        id: urlNoQuery,
        state: 1 //send
      }
      var wrap = function(obj) {
        resources[res] = obj
        obj.load(name, req, function(a) {
          if (arguments.length && a !== void 0) {
            module.exports = a
          }
          module.state = 4
          checkDeps()
        })
      }

      if (!resources[res]) {
        innerRequire([res], wrap)
      } else {
        wrap(resources[res])
      }
    }
    return name ? urlNoQuery : res + '!'
  }

  //核心API之一 require
  var requireQueue = []
  var isUserFirstRequire = false
  innerRequire = yua.require = function(
    array,
    factory,
    parentUrl,
    defineConfig
  ) {
    if (!isUserFirstRequire) {
      requireQueue.push(yua.slice(arguments))
      if (arguments.length <= 2) {
        isUserFirstRequire = true
        var queue = requireQueue.splice(0, requireQueue.length),
          args
        while ((args = queue.shift())) {
          innerRequire.apply(null, args)
        }
      }
      return
    }
    if (!Array.isArray(array)) {
      yua.error('require方法的第一个参数应为数组 ' + array)
    }
    var deps = [] // 放置所有依赖项的完整路径
    var uniq = createMap()
    var id = parentUrl || 'callback' + setTimeout('1') // jshint ignore:line

    defineConfig = defineConfig || createMap()
    defineConfig.baseUrl = kernel.baseUrl
    var isBuilt = !!defineConfig.built
    if (parentUrl) {
      defineConfig.parentUrl = parentUrl.substr(0, parentUrl.lastIndexOf('/'))
      defineConfig.mapUrl = parentUrl.replace(rjsext, '')
    }
    if (isBuilt) {
      var req = makeRequest(defineConfig.defineName, defineConfig)
      id = req.urlNoQuery
    } else {
      array.forEach(function(name) {
        if (!name) {
          return
        }
        var req = makeRequest(name, defineConfig)
        var url = fireRequest(req) //加载资源，并返回该资源的完整地址

        if (url) {
          if (!uniq[url]) {
            deps.push(url)
            uniq[url] = !0
          }
        }
      })
    }

    var module = modules[id]
    if (!module || module.state !== 4) {
      modules[id] = {
        id: id,
        deps: isBuilt ? array.concat() : deps,
        factory: factory || noop,
        state: 3
      }
    }
    if (!module) {
      //如果此模块是定义在另一个JS文件中, 那必须等该文件加载完毕, 才能放到检测列队中
      loadings.push(id)
    }
    checkDeps()
  }

  //核心API之二 require
  innerRequire.define = function(name, deps, factory) {
    //模块名,依赖列表,模块本身
    if (typeof name !== 'string') {
      factory = deps
      deps = name
      name = 'anonymous'
    }
    if (!Array.isArray(deps)) {
      factory = deps
      deps = []
    }
    var config = {
      built: !isUserFirstRequire, //用r.js打包后,所有define会放到requirejs之前
      defineName: name
    }
    var args = [deps, factory, config]
    factory.require = function(url) {
      args.splice(2, 0, url)
      if (modules[url]) {
        modules[url].state = 3 //loaded
        var isCycle = false
        try {
          isCycle = checkCycle(modules[url].deps, url)
        } catch (e) {}
        if (isCycle) {
          yua.error(
            url +
              '模块与之前的模块存在循环依赖，请不要直接用script标签引入' +
              url +
              '模块'
          )
        }
      }
      delete factory.require //释放内存
      innerRequire.apply(null, args) //0,1,2 --> 1,2,0
    }
    //根据标准,所有遵循W3C标准的浏览器,script标签会按标签的出现顺序执行。
    //老的浏览器中，加载也是按顺序的：一个文件下载完成后，才开始下载下一个文件。
    //较新的浏览器中（IE8+ 、FireFox3.5+ 、Chrome4+ 、Safari4+），为了减小请求时间以优化体验，
    //下载可以是并行的，但是执行顺序还是按照标签出现的顺序。
    //但如果script标签是动态插入的, 就未必按照先请求先执行的原则了,目测只有firefox遵守
    //唯一比较一致的是,IE10+及其他标准浏览器,一旦开始解析脚本, 就会一直堵在那里,直接脚本解析完毕
    //亦即，先进入loading阶段的script标签(模块)必然会先进入loaded阶段
    var url = config.built ? 'unknown' : getCurrentScript()
    if (url) {
      var module = modules[url]
      if (module) {
        module.state = 2
      }
      factory.require(url)
    } else {
      //合并前后的safari，合并后的IE6-9走此分支
      factorys.push(factory)
    }
  }
  //核心API之三 require.config(settings)
  innerRequire.config = kernel
  //核心API之四 define.amd 标识其符合AMD规范
  innerRequire.define.amd = modules

  //==========================对用户配置项进行再加工==========================
  var allpaths = (kernel['orig.paths'] = createMap())
  var allmaps = (kernel['orig.map'] = createMap())
  var allpackages = (kernel['packages'] = [])
  var allargs = (kernel['orig.args'] = createMap())
  yua.mix(plugins, {
    paths: function(hash) {
      yua.mix(allpaths, hash)
      kernel.paths = makeIndexArray(allpaths)
    },
    map: function(hash) {
      yua.mix(allmaps, hash)
      var list = makeIndexArray(allmaps, 1, 1)
      yua.each(list, function(_, item) {
        item.val = makeIndexArray(item.val)
      })
      kernel.map = list
    },
    packages: function(array) {
      array = array.concat(allpackages)
      var uniq = createMap()
      var ret = []
      for (var i = 0, pkg; (pkg = array[i++]); ) {
        pkg = typeof pkg === 'string' ? { name: pkg } : pkg
        var name = pkg.name
        if (!uniq[name]) {
          var url = joinPath(pkg.location || name, pkg.main || 'main')
          url = url.replace(rjsext, '')
          ret.push(pkg)
          uniq[name] = pkg.location = url
          pkg.reg = makeMatcher(name)
        }
      }
      kernel.packages = ret.sort()
    },
    urlArgs: function(hash) {
      if (typeof hash === 'string') {
        hash = { '*': hash }
      }
      yua.mix(allargs, hash)
      kernel.urlArgs = makeIndexArray(allargs, 1)
    },
    baseUrl: function(url) {
      if (!isAbsUrl(url)) {
        var baseElement = head.getElementsByTagName('base')[0]
        if (baseElement) {
          head.removeChild(baseElement)
        }
        var node = DOC.createElement('a')
        node.href = url
        url = node.href
        if (baseElement) {
          head.insertBefore(baseElement, head.firstChild)
        }
      }
      if (url.length > 3) kernel.baseUrl = url
    },
    shim: function(obj) {
      for (var i in obj) {
        var value = obj[i]
        if (Array.isArray(value)) {
          value = obj[i] = {
            deps: value
          }
        }
        if (!value.exportsFn && (value.exports || value.init)) {
          value.exportsFn = makeExports(value)
        }
      }
      kernel.shim = obj
    }
  })

  //==============================内部方法=================================
  function checkCycle(deps, nick) {
    //检测是否存在循环依赖
    for (var i = 0, id; (id = deps[i++]); ) {
      if (
        modules[id].state !== 4 &&
        (id === nick || checkCycle(modules[id].deps, nick))
      ) {
        return true
      }
    }
  }

  function checkFail(node, onError) {
    var id = trimQuery(node.src) //检测是否死链
    node.onload = node.onerror = null
    if (onError) {
      setTimeout(function() {
        head.removeChild(node)
        node = null // 处理旧式IE下的循环引用问题
      })
      log('加载 ' + id + ' 失败')
    } else {
      return true
    }
  }

  function checkDeps() {
    //检测此JS模块的依赖是否都已安装完毕,是则安装自身
    loop: for (var i = loadings.length, id; (id = loadings[--i]); ) {
      var obj = modules[id],
        deps = obj.deps

      if (!deps) continue
      for (var j = 0, key; (key = deps[j]); j++) {
        if (Object(modules[key]).state !== 4) {
          continue loop
        }
      }
      //如果deps是空对象或者其依赖的模块的状态都是4
      if (obj.state !== 4) {
        loadings.splice(i, 1) //必须先移除再安装，防止在IE下DOM树建完后手动刷新页面，会多次执行它
        fireFactory(obj.id, obj.deps, obj.factory)
        checkDeps() //如果成功,则再执行一次,以防有些模块就差本模块没有安装好
      }
    }
  }

  function loadJS(url, id, callback) {
    //通过script节点加载目标模块
    var node = DOC.createElement('script')
    node.className = subscribers //让getCurrentScript只处理类名为subscribers的script节点
    node.onload = function() {
      var factory = factorys.pop()
      factory && factory.require(id)
      if (callback) {
        callback()
      }
      id && loadings.push(id)
      checkDeps()
    }
    node.onerror = function() {
      checkFail(node, true)
    }

    head.insertBefore(node, head.firstChild) //chrome下第二个参数不能为null
    node.src = url //插入到head的第一个节点前，防止IE6下head标签没闭合前使用appendChild抛错,更重要的是IE6下可以收窄getCurrentScript的寻找范围
  }

  var resources = (innerRequire.plugins = {
    //三大常用资源插件 js!, css!, text!, domReady!
    domReady: {
      load: noop
    },
    js: {
      load: function(name, req, onLoad) {
        var url = req.url
        var id = req.urlNoQuery
        var shim = kernel.shim[name.replace(rjsext, '')]
        if (shim) {
          //shim机制
          innerRequire(shim.deps || [], function() {
            var args = yua.slice(arguments)
            loadJS(url, id, function() {
              onLoad(shim.exportsFn ? shim.exportsFn.apply(0, args) : void 0)
            })
          })
        } else {
          loadJS(url, id)
        }
      }
    },
    css: {
      load: function(name, req, onLoad) {
        var url = req.url
        head.insertAdjacentHTML(
          'afterBegin',
          '<link rel="stylesheet" href="' + url + '">'
        )
        onLoad()
      }
    },
    text: {
      load: function(name, req, onLoad) {
        var xhr = getXHR()
        xhr.onload = function() {
          var status = xhr.status
          if (status > 399 && status < 600) {
            yua.error(url + ' 对应资源不存在或没有开启 CORS')
          } else {
            onLoad(xhr.responseText)
          }
        }
        xhr.open('GET', req.url, true)
        xhr.send()
      }
    }
  })
  innerRequire.checkDeps = checkDeps

  var rquery = /(\?[^#]*)$/
  function trimQuery(url) {
    return (url || '').replace(rquery, '')
  }

  function isAbsUrl(path) {
    //http://stackoverflow.com/questions/10687099/how-to-test-if-a-url-string-is-absolute-or-relative
    return /^(?:[a-z\-]+:)?\/\//i.test(String(path))
  }

  function getCurrentScript() {
    // inspireb by https://github.com/samyk/jiagra/blob/master/jiagra.js
    var stack
    try {
      a.b.c() //强制报错,以便捕获e.stack
    } catch (e) {
      //safari5的sourceURL，firefox的fileName，它们的效果与e.stack不一样
      stack = e.stack
    }
    if (stack) {
      /**e.stack最后一行在所有支持的浏览器大致如下:
       *chrome23:
       * at http://113.93.50.63/data.js:4:1
       *firefox17:
       *@http://113.93.50.63/query.js:4
       *opera12:http://www.oldapps.com/opera.php?system=Windows_XP
       *@http://113.93.50.63/data.js:4
       *IE10:
       *  at Global code (http://113.93.50.63/data.js:4:1)
       *  //firefox4+ 可以用document.currentScript
       */
      stack = stack.split(/[@ ]/g).pop() //取得最后一行,最后一个空格或@之后的部分
      stack = stack[0] === '(' ? stack.slice(1, -1) : stack.replace(/\s/, '') //去掉换行符
      return trimQuery(stack.replace(/(:\d+)?:\d+$/i, '')) //去掉行号与或许存在的出错字符起始位置
    }
    var nodes = head.getElementsByTagName('script') //只在head标签中寻找
    for (var i = nodes.length, node; (node = nodes[--i]); ) {
      if (node.className === subscribers && node.readyState === 'interactive') {
        var url = node.src
        return (node.className = trimQuery(url))
      }
    }
  }

  var rcallback = /^callback\d+$/
  function fireFactory(id, deps, factory) {
    var module = Object(modules[id])
    module.state = 4
    for (var i = 0, array = [], d; (d = deps[i++]); ) {
      if (d === 'exports') {
        var obj = module.exports || (module.exports = createMap())
        array.push(obj)
      } else {
        array.push(modules[d].exports)
      }
    }
    try {
      var ret = factory.apply(window, array)
    } catch (e) {
      log('执行[' + id + ']模块的factory抛错： ', e)
    }
    if (ret !== void 0) {
      module.exports = ret
    }
    if (rcallback.test(id)) {
      delete modules[id]
    }
    delete module.factory
    return ret
  }
  function toUrl(id) {
    if (id.indexOf(this.res + '!') === 0) {
      id = id.slice(this.res.length + 1) //处理define("css!style",[], function(){})的情况
    }
    var url = id
    //1. 是否命中paths配置项
    var usePath = 0
    var baseUrl = this.baseUrl
    var rootUrl = this.parentUrl || baseUrl
    eachIndexArray(id, kernel.paths, function(value, key) {
      url = url.replace(key, value)
      usePath = 1
    })
    //2. 是否命中packages配置项
    if (!usePath) {
      eachIndexArray(id, kernel.packages, function(value, key, item) {
        url = url.replace(item.name, item.location)
      })
    }
    //3. 是否命中map配置项
    if (this.mapUrl) {
      eachIndexArray(this.mapUrl, kernel.map, function(array) {
        eachIndexArray(url, array, function(mdValue, mdKey) {
          url = url.replace(mdKey, mdValue)
          rootUrl = baseUrl
        })
      })
    }
    var ext = this.ext
    if (ext && usePath && url.slice(-ext.length) === ext) {
      url = url.slice(0, -ext.length)
    }
    //4. 转换为绝对路径
    if (!isAbsUrl(url)) {
      rootUrl = this.built || /^\w/.test(url) ? baseUrl : rootUrl
      url = joinPath(rootUrl, url)
    }
    //5. 还原扩展名，query
    var urlNoQuery = url + ext
    url = urlNoQuery + this.query
    urlNoQuery = url.replace(rquery, function(a) {
      this.query = a
      return ''
    })
    //6. 处理urlArgs
    eachIndexArray(id, kernel.urlArgs, function(value) {
      url += (url.indexOf('?') === -1 ? '?' : '&') + value
    })
    this.url = url
    return (this.urlNoQuery = urlNoQuery)
  }

  function makeIndexArray(hash, useStar, part) {
    //创建一个经过特殊算法排好序的数组
    var index = hash2array(hash, useStar, part)
    index.sort(descSorterByName)
    return index
  }

  function makeMatcher(prefix) {
    return new RegExp('^' + prefix + '(/|$)')
  }

  function makeExports(value) {
    return function() {
      var ret
      if (value.init) {
        ret = value.init.apply(window, arguments)
      }
      return ret || (value.exports && getGlobal(value.exports))
    }
  }

  function hash2array(hash, useStar, part) {
    var array = []
    for (var key in hash) {
      // if (hash.hasOwnProperty(key)) {//hash是由createMap创建没有hasOwnProperty
      var item = {
        name: key,
        val: hash[key]
      }
      array.push(item)
      item.reg = key === '*' && useStar ? /^/ : makeMatcher(key)
      if (part && key !== '*') {
        item.reg = new RegExp('/' + key.replace(/^\//, '') + '(/|$)')
      }
      //   }
    }
    return array
  }

  function eachIndexArray(moduleID, array, matcher) {
    array = array || []
    for (var i = 0, el; (el = array[i++]); ) {
      if (el.reg.test(moduleID)) {
        matcher(el.val, el.name, el)
        return false
      }
    }
  }
  // 根据元素的name项进行数组字符数逆序的排序函数
  function descSorterByName(a, b) {
    var aaa = a.name
    var bbb = b.name
    if (bbb === '*') {
      return -1
    }
    if (aaa === '*') {
      return 1
    }
    return bbb.length - aaa.length
  }

  var rdeuce = /\/\w+\/\.\./
  function joinPath(a, b) {
    if (a.charAt(a.length - 1) !== '/') {
      a += '/'
    }
    if (b.slice(0, 2) === './') {
      //相对于兄弟路径
      return a + b.slice(2)
    }
    if (b.slice(0, 2) === '..') {
      //相对于父路径
      a += b
      while (rdeuce.test(a)) {
        a = a.replace(rdeuce, '')
      }
      return a
    }
    if (b.slice(0, 1) === '/') {
      return a + b.slice(1)
    }
    return a + b
  }

  function getGlobal(value) {
    if (!value) {
      return value
    }
    var g = window
    value.split('.').forEach(function(part) {
      g = g[part]
    })
    return g
  }

  var mainNode = DOC.scripts[DOC.scripts.length - 1]
  var dataMain = mainNode.getAttribute('data-main')
  if (dataMain) {
    plugins.baseUrl(dataMain)
    var href = kernel.baseUrl
    kernel.baseUrl = href.slice(0, href.lastIndexOf('/') + 1)
    loadJS(href.replace(rjsext, '') + '.js')
  } else {
    var loaderUrl = trimQuery(mainNode.src)
    kernel.baseUrl = loaderUrl.slice(0, loaderUrl.lastIndexOf('/') + 1)
  }
}() // jshint ignore:line

/*********************************************************************
 *                    DOMReady                                       *
 **********************************************************************/

var readyList = [],
  isReady
var fireReady = function(fn) {
  isReady = true
  var require = yua.require
  if (require && require.checkDeps) {
    modules['domReady!'].state = 4
    require.checkDeps()
  }
  while ((fn = readyList.shift())) {
    fn(yua)
  }
}

if (DOC.readyState === 'complete') {
  setTimeout(fireReady) //如果在domReady之外加载
} else {
  DOC.addEventListener('DOMContentLoaded', fireReady)
}
window.addEventListener('load', fireReady)
yua.ready = function(fn) {
  if (!isReady) {
    readyList.push(fn)
  } else {
    fn(yua)
  }
}

yua.config({
  loader: true
})
yua.ready(function() {
  yua.scan(DOC.body)
})

if (typeof define === 'function' && define.amd) {
  define('yua', [], function() {
    return yua
  })
}
// Map over yua in case of overwrite
var _yua = window.yua
yua.noConflict = function(deep) {
  if (deep && window.yua === yua) {
    window.yua = _yua
  }
  return yua
}

window.yua = yua

