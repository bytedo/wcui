/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-14 21:04:50
 *
 */

'use strict'

import './main.scss'

//储存版本信息
Anot.ui.tree = '1.0.0'

function format(arr, expand, { id, parent, label } = {}) {
  let tmp = {}
  let farr = []
  this.__path__ = {}
  arr = Anot.deepCopy(arr)
  arr.sort(function(a, b) {
    return a[parent] === b[parent] ? a.sort - b.sort : a[parent] - b[parent]
  })
  arr.forEach(it => {
    this.__path__[it[id]] = []
    tmp[it[id]] = it
    let parentItem = tmp[it[parent]]

    if (!parentItem) {
      return farr.push(tmp[it[id]])
    }
    this.__path__[it[id]] = this.__path__[parentItem[id]].concat(parentItem[id])
    parentItem.__open__ =
      typeof expand === 'boolean' ? expand : expand.includes(parentItem[id])
    parentItem.children = parentItem.children || []
    parentItem.children.push(it)
  })
  return farr
}

export default Anot.component('tree', {
  __init__: function(props, state, next) {
    this.classList.add('do-tree')
    this.setAttribute(':visible', 'list.size()')

    if (props.hasOwnProperty('expand')) {
      if (Array.isArray(props.expand)) {
        state.expand = props.expand
      } else {
        state.expand = true
      }
    }

    if (props.list) {
      for (let it of props.list) {
        state.__LIST_DICT__[it[props.id]] = it
      }
    }
    state.list = format.call(this, props.list || [], state.expand, props)
    state.multiCheck = props.hasOwnProperty('multiCheck')

    delete props.list
    delete props.multiCheck
    delete props.expand
    next()
  },
  render: function() {
    let { multiCheck } = this

    return `
    <section class="do-tree__item" :repeat="list" :class="{open: el.__open__, dir: el.children}">
      <em 
        :class="{
          'do-icon-txt': !el.children,
          'do-icon-folder-close': el.children && !el.__open__,
          'do-icon-folder-open': el.children && el.__open__,
        }" 
        :click="__toggle(el)"></em>
      <span
        class="checkbox"
        :class="{'do-icon-get': __isChecked(el)}"
        :if="multiCheck"
        :click="__check(el, $event)"></span>
      <span class="label"
        :click="__pick(el)"
        :class="{active: el[props.id] === value}"
        :text="el[props.label]"></span>

      <div class="sub-tree" :if-loop="el.children">
        <anot-tree ${multiCheck ? 'multi-check' : ''}
          :value="value"
          :attr="{
            list: el.children,
            expand: expand,
            id: props.id,
            label: props.label,
            parent: props.parent,
          }"></anot-tree>
      </div>
    </section>
    `
  },

  componentDidMount: function() {
    if (typeof this.props.created === 'function') {
      this.props.created(this)
    }
  },
  state: {
    __LIST_DICT__: {},
    list: [],
    value: null,
    multiCheck: false
  },
  skip: ['__LIST_DICT__'],
  props: {
    id: 'id',
    label: 'label',
    parent: 'parent',
    checked: [],
    created: Anot.PropsTypes.isFunction(),
    itemClick: Anot.PropsTypes.isFunction(),
    itemCheck: Anot.PropsTypes.isFunction()
  },
  methods: {
    // 子目录的开关
    __toggle: function(item) {
      if (!item.children) {
        return
      }
      item.__open__ = !item.__open__
    },
    __isChecked(item) {
      let vm = this
      if (vm.$up) {
        vm = vm.$up
      }
      let { checked, id } = vm.props
      return checked.includes(item[id])
    },
    // 选中条目, 并将选中的列表向上冒泡, 直到最外层将结果通过回调返回给外部
    __check: function(item, ev) {
      Anot(ev.target).toggleClass('do-icon-get')

      let vm = this
      if (vm.$up) {
        vm = vm.$up
      }
      let {
        props: { checked, id, itemCheck },
        __LIST_DICT__
      } = vm
      if (checked.includes(item[id])) {
        Anot.Array.remove(checked, item[id])
      } else {
        checked.push(item[id])
      }
      if (typeof itemCheck === 'function') {
        itemCheck(__LIST_DICT__[item[id]], checked)
      }
    },
    // 单个条目的点击选择
    __pick: function(el) {
      let vm = this
      let id = this.props.id
      // 只取最顶层的VM的字典, 因为子VM的字典已经被污染了
      if (vm.$up) {
        vm = vm.$up
      }
      let {
        __LIST_DICT__,
        props: { itemClick }
      } = vm
      this.value = el[id]
      if (typeof itemClick === 'function') {
        itemClick(__LIST_DICT__[el[id]])
      }
    },
    update(itemId, data) {
      let vm = this
      let path = this.$elem.__path__[itemId]
      let { id } = this.props
      // 主键ID不可修改
      delete data[id]

      if (path.length) {
        for (let tmp of vm.$components) {
          if (tmp.__LIST_DICT__[itemId]) {
            vm = tmp
            break
          }
        }
      }

      for (let it of vm.list) {
        if (it[id] === itemId) {
          Object.assign(it, data)
        }
      }
    },
    // 以给定的列表重置组件渲染
    resetWith: function(arr = []) {
      this.list.clear()
      for (let it of arr) {
        this.__LIST_DICT__[it[this.props.id]] = it
      }
      this.list.pushArray(
        format.call(this.$elem, arr || [], this.expand, this.props)
      )
    }
  }
})
