'use strict'
import 'Anot'
import tpl from 'text!./main.htm'
import 'css!./main.css'

Anot.ui.pages = '1.0.0'
var colors = { plain: 1, green: 1, blue: 1, red: 1, orange: 1, grey: 1 },
  themes = ['skin-1 ', 'skin-2 ']
//计算页码列表
function calculate({ currPage, maxPageShow, totalPages }) {
  let arr = []
  let midPage =
    currPage < maxPageShow / 2
      ? maxPageShow - currPage
      : Math.floor(maxPageShow / 2)

  if (currPage - midPage > 1) {
    arr.push('...')
  }
  for (
    var i = currPage - midPage;
    i < currPage + midPage + 1 && i <= totalPages;
    i++
  ) {
    if (i > 0) {
      arr.push(i)
    }
  }
  if (currPage + midPage < totalPages) {
    arr.push('...')
  }
  return arr
}

function update(pid, vm) {
  if (pid < 1) {
    pid = vm.input = 1
  }
  if (pid > vm.total) {
    pid = vm.input = vm.total
  }
  if (pid !== vm.curr) {
    vm.curr = vm.input = pid
    vm.$onJump(pid)
  }
}

export default Anot.component('pages', {
  construct: function(props, next) {
    // console.log(props, this)
    next(props)
  },
  render: function() {
    return tpl
  },
  componentWillMount: function(vm) {
    if (this.totalPages < 2) {
      return
    }
    const { currPage, totalPages, props } = this
    this.pageList.clear()
    this.pageList.pushArray(
      calculate({ currPage, totalPages, maxPageShow: props.maxPageShow })
    )
  },
  componentDidMount: function() {
    this.props.onSuccess(this)
  },
  state: {
    currPage: 1,
    totalItems: 100,
    perPage: 20,
    inputJump: !1,
    simpleMode: !1,
    inputPage: 1,
    pageList: []
  },
  computed: {
    totalPages: function() {
      return Math.ceil(this.totalItems / this.perPage)
    }
  },
  props: {
    url: 'javascript:;',
    btns: {
      prev: '<<',
      next: '>>',
      home: '首页',
      end: '末页'
    },
    maxPageShow: 5,
    theme: 'skin-2 red',
    onPageChange: Anot.noop,
    onSuccess: Anot.noop
  },
  watch: {
    curr: function(val, old) {
      val = val >>> 0 || 1
      old = old >>> 0
      if (val !== old) {
        calculate(vm)
      }
    },
    total: function(val, old) {
      val = val >>> 0 || 1
      old = old >>> 0
      if (val !== old) {
        calculate(vm)
      }
    }
  },
  methods: {
    $setUrl: function(val) {
      if (
        !this.props.url ||
        '...' === val ||
        this.curr === val ||
        val > this.total ||
        1 > val
      ) {
        return 'javascript:;'
      } else {
        return this.props.url.replace('{id}', val)
      }
    },
    $jump: function(ev, val) {
      if ('...' !== val) {
        var link = this.getAttribute('href') || this.getAttribute('xlink:href')

        if (val !== void 0) {
          if ('javascript:;' !== link) {
            location.href = link
          }
          var pid = val >> 0
          update(pid, this)
        } else {
          this.input = this.input >>> 0 || 1
          if (13 == ev.keyCode) {
            update(this.input, this)
          }
        }
      }
    },
    $onJump: Anot.noop,
    $onSuccess: Anot.noop,
    $forceReset: function() {
      this.curr = 1
      calculate(this)
    }
  }
})
