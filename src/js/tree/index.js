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
    return a.pid === b.pid ? a.sort - b.sort : a.pid - b.pid
  })
  arr.forEach(function(it) {
    it.checked = !!it.checked
    it.open = !!it.open
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
    <ul class="do-tree" :class="{{props.className}}" :if="list.size()">
      <li :repeat="list" :class="{open: el.open, dir: el[props.children]}">
        <em class="ui-font" :click="toggle(el)"></em>
        <span
          class="checkbox ui-font"
          :if="multiCheck"
          :class="{checked: el.checked}"
          :click="onChecked(el)"></span>
        <span
          :click="onSelected(el)"
          :class="{active: el[props.id] === currItem}"
          :text="el[props.label]"></span>
        <template
          name="tree"
          :attr="{
            'multi-check': multiCheck,
            list: el[props.children],
            onSelected: props.onSelected,
            onChecked: onChecked,
            id: props.id,
            label: props.label,
            parent: props.parent,
            children: props.children,
          }"></template>
      </li>
    </ul>
    `
  },
  construct: function(props, state) {
    props.className = 'skin-' + (props.theme || 'def')
    props.id = props.id || 'id'
    props.label = props.label || 'label'
    props.parent = props.parent || 'parent'
    props.children = props.children || 'children'
    state.list = format(props.list || [], props)
    state.multiCheck = !!props.multiCheck
    delete props.list
    delete props.theme
    delete props.multiCheck
  },
  componentDidMount: function() {
    if (typeof this.props.onCreated === 'function') {
      this.props.onCreated.call(null, this)
    }
  },
  state: {
    list: [],
    multiCheck: false,
    currItem: -1,
    checked: {}
  },
  skip: ['checked'],
  props: {
    className: '',
    id: '',
    label: '',
    parent: '',
    children: '',
    onCreated: Anot.PropsTypes.isFunction(),
    onSelected: Anot.PropsTypes.isFunction(),
    onChecked: Anot.PropsTypes.isFunction()
  },
  methods: {
    toggle: function(obj) {
      obj.open = !obj.open
    },
    onChecked: function(el, childChecked) {
      let item = null
      let arr = []
      let { id, onChecked } = this.props

      if (!childChecked) {
        el.checked = !el.checked
        item = el.$model
        this.checked[item[id]] = el.checked ? item : null
      } else {
        item = el
        Object.assign(this.checked, childChecked)
      }

      if (!this.$up) {
        for (let i in this.checked) {
          if (!this.checked[i]) {
            delete this.checked[i]
          } else {
            arr.push(this.checked[i])
          }
        }
      } else {
        arr = this.checked
      }

      if (typeof onChecked === 'function') {
        onChecked.call(this.$up, item, arr)
      }
    },
    onSelected: function(el) {
      let { id, onSelected } = this.props
      this.currItem = el[id]
      if (typeof onSelected === 'function') {
        onSelected(el.$model)
      }
    },
    reset: function(arr) {
      this.checked = {}
      this.list.clear()
      this.list.pushArray(format(arr || []))
    }
  }
})
