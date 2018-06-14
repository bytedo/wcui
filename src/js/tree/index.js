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

function format(arr, { id, parent, label, children }) {
  let tmp = {}
  let farr = []
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
    parentItem[children] = parentItem[children] || []
    parentItem[children].push(it)
  })
  return farr
}

export default Anot.component('tree', {
  render: function() {
    if (!this.list.size()) {
      return null
    }
    return `
    <ul class="do-tree" :if="list.size()">
      <li :repeat="list" :class="{open: el.open, dir: el[props.children]}">
        <em 
          :class="{
            'do-icon-txt': !el.open && !el[props.children],
            'do-icon-folder-close': el[props.children] && !el.open,
            'do-icon-folder-open': el[props.children] && el.open,
          }" 
          :click="__toggle(el)"></em>
        <span
          class="checkbox"
          :class="{'do-icon-get': el.__checked__}"
          :if="multiCheck"
          :click="__check(el, null, $event)"></span>
        <span
          :click="__select(el)"
          :class="{active: el[props.id] === currItem}"
          :text="el[props.label]"></span>
        <template
          name="tree"
          :attr="{
            'multi-check': multiCheck,
            list: el[props.children],
            '@onActive': props.onActive,
            '@onPick': __check,
            id: props.id,
            label: props.label,
            parent: props.parent,
            children: props.children,
          }"></template>
      </li>
    </ul>
    `
  },
  __init__: function(props, state, next) {
    props.id = props.id || 'id'
    props.label = props.label || 'label'
    props.parent = props.parent || 'parent'
    props.children = props.children || 'children'
    state.list = format(props.list || [], props)
    state.multiCheck = !!props.multiCheck
    delete props.list
    delete props.multiCheck
    next()
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
    list: [],
    multiCheck: false,
    currItem: -1,
    checkedItems: {}
  },
  skip: ['checkedItems'],
  props: {
    id: '',
    label: '',
    parent: '',
    children: '',
    created: Anot.PropsTypes.isFunction(),
    onActive: Anot.PropsTypes.isFunction(),
    onPick: Anot.PropsTypes.isFunction()
  },
  methods: {
    // 子目录的开关
    __toggle: function(obj) {
      if (!obj[this.props.children]) {
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
      let vm, id, onPick, checkedItems

      if (this.props) {
        vm = this
        id = this.props.id
        onPick = this.props.onPick
        checkedItems = this.checkedItems
      } else {
        vm = this.$up
        id = vm.props.id
        onPick = vm.props.onPick
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
      if (typeof onPick === 'function') {
        onPick(item, arr)
      }
    },
    // 单个条目的点击选择
    __select: function(el) {
      let { id, onActive } = this.props
      this.currItem = el[id]
      if (typeof onActive === 'function') {
        onActive(el.$model)
      }
    },
    // 以给定的列表重置组件渲染
    resetWith: function(arr) {
      this.checked = {}
      this.list.clear()
      this.list.pushArray(format(arr || []))
    }
  }
})
