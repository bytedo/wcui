'use strict'
import tpl from './main.htm'
import './main.scss'

Anot.ui.pages = '1.0.0'
//计算页码列表
function calculate({ currPage, maxPageShow, totalPages }) {
  let arr = []
  let fixNum = 0
  let halfPage =
    currPage < maxPageShow / 2
      ? maxPageShow - currPage
      : Math.floor(maxPageShow / 2)

  if (totalPages < 2) {
    return arr
  }
  if (currPage - halfPage > 1) {
    arr.push('...')
  }
  if (totalPages - currPage < halfPage) {
    fixNum = halfPage - totalPages + currPage
  }
  for (
    let i = currPage - halfPage - fixNum;
    i < currPage + halfPage + 1 && i <= totalPages;
    i++
  ) {
    if (i > 0) {
      arr.push(i)
    }
  }
  if (currPage + halfPage < totalPages) {
    arr.push('...')
  }
  return arr
}
// 更新组件
function update(currPage, vm) {
  const { totalPages, props } = vm
  vm.currPage = vm.inputPage = currPage
  vm.props.onPageChange.call(null, currPage)
  if (totalPages < 2) {
    return
  }
  vm.pageList.clear()
  vm.pageList.pushArray(
    calculate({ currPage, totalPages, maxPageShow: props.maxPageShow })
  )
}

export default Anot.component('pages', {
  construct: function(props, state, next) {
    props.className =
      'skin-' + (props.theme || 1) + ' ' + (props.color || 'plain')
    delete props.theme
    delete props.color
    next(props, state)
  },
  render: function() {
    return tpl
  },
  componentWillMount: function() {
    const { currPage, totalPages, props } = this
    this.pageList.clear()
    this.pageList.pushArray(
      calculate({ currPage, totalPages, maxPageShow: props.maxPageShow })
    )
  },
  componentDidMount: function() {
    this.props.onSuccess.call(null, this)
  },
  state: {
    currPage: 1,
    totalItems: 1,
    pageSize: 20,
    inputPage: 1,
    pageList: []
  },
  computed: {
    totalPages: function() {
      return Math.ceil(this.totalItems / this.pageSize)
    }
  },
  skip: ['currPage', 'totalItems', 'pageSize'],
  props: {
    url: null,
    btns: {
      prev: '<<',
      next: '>>',
      home: '首页',
      end: '末页'
    },
    maxPageShow: 5,
    className: '',
    simpleMode: !1,
    onPageChange: Anot.noop,
    onSuccess: Anot.noop
  },
  methods: {
    // 格式化页码的URL
    parseUrl: function(val) {
      val = val >>> 0
      if (val < 1 || !this.props.url || this.currPage === val) {
        return 'javascript:;'
      }
      return this.props.url.replace('{id}', val)
    },
    // 设置页码
    setPage: function(val, ev) {
      if (this.currPage === val) {
        return
      }
      let elem = (ev && ev.target) || null
      if (val && elem) {
        if (val && val !== '...') {
          let link =
            (elem && elem.getAttribute('href')) ||
            elem.getAttribute('xlink:href')

          if ('javascript:;' !== link) {
            location.href = link
          } else {
            val = val >> 0
            update(val, this)
          }
        }
      } else {
        if (val === null) {
          let { inputPage, totalPages, currPage } = this
          inputPage = inputPage >>> 0

          if (ev && ev.keyCode === 13) {
            if (inputPage < 1 || currPage === inputPage) {
              return (this.inputPage = currPage)
            }
            if (inputPage > totalPages) {
              inputPage = totalPages
            }
            this.inputPage = inputPage
            update(inputPage, this)
          }
        } else {
          val = val >>> 0
          update(val, this)
        }
      }
    },
    setPageSize: function(num) {
      this.pageSize = +num
      update(1, this)
    },
    setTotalItems: function(num) {
      console.log(this, num)
      this.totalItems = +num
      update(1, this)
    }
  }
})
