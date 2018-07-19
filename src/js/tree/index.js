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
const log = console.log

function format(arr, { id, parent, label }) {
  let tmp = {}
  let farr = []
  arr = Anot.deepCopy(arr)
  arr.sort(function(a, b) {
    return a[parent] === b[parent] ? a.sort - b.sort : a[parent] - b[parent]
  })
  arr.forEach(function(it) {
    // Anot.hideProperty(it, '__checked__', !!it.__checked__)
    it.__checked__ = !!it.__checked__
    it.open = !!it.open
    // console.log(it.hasOwnProperty('__checked__'), it.__checked__)
    tmp[it[id]] = it
    var parentItem = tmp[it[parent]]

    if (!parentItem) {
      return farr.push(tmp[it[id]])
    }
    parentItem.children = parentItem.children || []
    parentItem.children.push(it)
  })
  return farr
}

export default Anot.component('tree', {
  __init__: function(props, state, next) {
    this.classList.add('do-tree')
    // this.setAttribute(':visible', 'list.size()')

    if (props.list) {
      for (let it of props.list) {
        state.__LIST__.push(it)
        state.__LIST_DICT__[it[props.id]] = it
      }
    }
    state.value = state.value || []
    state.list = format(props.list || [], props)
    state.multiCheck = props.hasOwnProperty('multiCheck')
    delete props.list
    delete props.multiCheck
    next()
  },
  render: function() {
    let { multiCheck } = this

    return `
    <section class="do-tree__item" :repeat="list" :class="{open: el.open, dir: el.children}">
      <em 
        :class="{
          'do-icon-txt': !el.children,
          'do-icon-folder-close': el.children && !el.open,
          'do-icon-folder-open': el.children && el.open,
        }" 
        :click="__toggle(el)"></em>
      <span
        class="checkbox"
        :class="{'do-icon-get': value.includes(el[props.id])}"
        :if="multiCheck"
        :click="__check(el, null, $event)"></span>
      <span
        :click="__select(el)"
        :class="{active: el[props.id] === currItem}"
        :text="el[props.label]"></span>

      <div class="sub-tree" :if-loop="el.children">
        <anot-tree ${multiCheck ? 'multi-check' : ''}
          :value="value"
          :attr="{
            list: el.children,
            '@itemClick': props.itemClick,
            '@itemPicked': __check,
            id: props.id,
            label: props.label,
            parent: props.parent,
          }"></anot-tree>
      </div>
    </section>
    `
  },

  componentDidMount: function() {
    this.list.forEach(it => {
      if (it.__checked__) {
        this.checkedItems[it[this.props.id]] = it.$model
      }
    })
    if (typeof this.props.created === 'function') {
      this.props.created(this)
    }
  },
  state: {
    __LIST__: [],
    __LIST_DICT__: {},
    list: [],
    value: [],
    multiCheck: false,
    currItem: -1,
    checkedItems: {}
  },
  skip: ['checkedItems', '__LIST__', '__LIST_DICT__'],
  props: {
    id: 'id',
    label: 'label',
    parent: 'parent',
    created: Anot.PropsTypes.isFunction(),
    itemClick: Anot.PropsTypes.isFunction(),
    itemPicked: Anot.PropsTypes.isFunction()
  },
  methods: {
    // 子目录的开关
    __toggle: function(obj) {
      if (!obj.children) {
        return
      }
      obj.open = !obj.open
    },
    // 选中条目, 并将选中的列表向上冒泡, 直到最外层将结果通过回调返回给外部
    __check: function(el, itemsFromChild, ev) {
      if (ev) {
        Anot(ev.target).toggleClass('do-icon-get')
      }

      // return
      let item = null
      let arr = []
      let vm, id, itemPicked, checkedItems

      if (this.props) {
        vm = this
        id = this.props.id
        itemPicked = this.props.itemPicked
        checkedItems = this.checkedItems
      } else {
        vm = this.$up
        id = vm.props.id
        itemPicked = vm.props.itemPicked
        checkedItems = vm.checkedItems
      }

      if (itemsFromChild) {
        item = el
        Object.assign(checkedItems, itemsFromChild)
      } else {
        el.__checked__ = !el.__checked__
        // Anot.hideProperty(el, '__checked__', !el.__checked__)
        item = el.$model
        checkedItems[item[id]] = el.__checked__ ? item : null
      }

      if (vm.$up) {
        arr = checkedItems
      } else {
        // 冒泡到最高一层时, 将对象转为数组
        for (let i in checkedItems) {
          if (checkedItems[i]) {
            arr.push(checkedItems[i])
          } else {
            delete checkedItems[i]
          }
        }
      }
      if (typeof itemPicked === 'function') {
        itemPicked(item, arr)
      }
    },
    // 单个条目的点击选择
    __select: function(el) {
      let { id, itemClick } = this.props
      this.currItem = el[id]
      if (typeof itemClick === 'function') {
        itemClick(this.__LIST_DICT__[el[id]])
        // itemClick(el.$model)
      }
    },
    // 以给定的列表重置组件渲染
    resetWith: function(arr = []) {
      this.checked = {}
      this.list.clear()
      for (let it of arr) {
        this.__LIST__.push(it)
        this.__LIST_DICT__[it[this.props.id]] = it
      }
      this.list.pushArray(format(arr || [], this.props))
    }
  }
})
