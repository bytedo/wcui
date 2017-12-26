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

var box = '<ul>{li}</ul>',
  ul = '<ul :class="{open: {it}.open}">{li}</ul>',
  li =
    '<li :class="{open: {it}.open, dir: {it}.children}">' +
    '<em :click="toggle({it})"></em>' +
    '<span :click="$select({it})" :class="{active: {it}.id === currItem}" :text="{it}.name"></span>' +
    '{child}</li>'
var keyPath = {}

function repeat(arr, name) {
  var html = ''
  arr.forEach(function(it, i) {
    var from = name + '[' + i + ']',
      child = ''
    html += li.replace(/\{it\}/g, from)

    if (it.children) {
      child += repeat(it.children, from + '.children')
      child = ul.replace('{li}', child).replace('{it}', from)
    }
    html = html.replace(/\{child\}/, child)
  })

  return html
}

function format(arr) {
  var tmp = {},
    farr = []
  arr.sort(function(a, b) {
    return a.pid === b.pid ? a.sort - b.sort : a.pid - b.pid
  })
  arr.forEach(function(it) {
    tmp[it.id] = it
    keyPath[it.id] = ''
    var parentItem = tmp[it.pid]

    if (!parentItem) {
      return farr.push(tmp[it.id])
    }
    keyPath[it.id] += keyPath[parentItem.id] + parentItem.id + ','
    parentItem.open = !!parentItem.open
    parentItem.children = parentItem.children || []
    parentItem.children.push(it)
  })
  return farr
}

export default Anot.component('tree', {
  render: function() {
    // return '<div class="do-tree" :class="{{props.className}}" :html="treeHTML"></div>'
    return `
    <ul class="do-tree" :class="{{props.className}}" :if="list.size()">
      <li :repeat="list" :class="{open: el.open, dir: el.children}">
        <em :click="toggle(el)"></em>
        <span :click="select(el)" :class="{active: el.id === currItem}" :text="el.name"></span>
        <template name="tree" :attr="{list: el.children}"></template>
      </li>
    </ul>
    `
  },
  construct: function(props, state, next) {
    props.className = 'skin-' + (props.theme || 'def')
    state.list = format(props.list || [])

    delete props.list
    delete props.theme
    next(props, state)
  },
  componentWillMount: function() {
    // this.$reset(this.props.arr)
  },
  componentDidMount: function() {
    if (typeof this.props.created === 'function') {
      this.props.created.call(null, this)
    }
  },
  state: {
    treeHTML: '',
    list: [],
    currItem: -1
  },
  props: {
    className: '',
    created: Anot.PropsTypes.isFunction(),
    componentWillMount: Anot.PropsTypes.isFunction()
  },
  methods: {
    toggle: function(obj) {
      obj.open = !obj.open
    },
    select: function(obj) {
      this.currItem = obj.id
      console.log(obj, this.props.componentWillMount)
      if (typeof this.props.componentWillMount === 'function') {
        this.props.componentWillMount(obj)
      }
    },
    $update: function(id, obj) {
      var path = keyPath[id],
        tmpid = null,
        tmpobj = null

      path += id
      path = path.split(',')

      while ((tmpid = +path.shift())) {
        if (!tmpobj) {
          tmpobj = this.treeArr
        } else {
          tmpobj = tmpobj.children
        }

        for (var i = 0, it; (it = tmpobj[i++]); ) {
          if (it.id === tmpid) {
            tmpobj = it
            break
          }
        }
      }
      for (var j in obj) {
        tmpobj[j] = obj[j]
      }
    },
    $reset: function(arr) {
      this.treeArr.clear()
      this.treeHTML = ''

      this.treeArr.pushArray(format(arr))
      this.currItem = -1
      console.log(this.treeArr)
      /*      var tpl = repeat(this.treeArr.$model, 'treeArr')
      Anot.nextTick(() => {
        this.treeHTML = box.replace('{li}', tpl)
      })*/
    }
  }
})
