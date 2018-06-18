'use strict'

import './main.scss'

Anot.ui.pager = '1.0.0'
//计算页码列表
function calculate({ currPage, maxPageShow, totalPage }) {
  let arr = []
  let fixNum = 0
  let halfPage =
    currPage < maxPageShow / 2
      ? maxPageShow - currPage
      : Math.floor(maxPageShow / 2)

  if (totalPage < 2) {
    return arr
  }
  if (currPage - halfPage > 1) {
    arr.push('...')
  }
  if (totalPage - currPage < halfPage) {
    fixNum = halfPage - totalPage + currPage
  }
  for (
    let i = currPage - halfPage - fixNum;
    i < currPage + halfPage + 1 && i <= totalPage;
    i++
  ) {
    if (i > 0) {
      arr.push(i)
    }
  }
  if (currPage + halfPage < totalPage) {
    arr.push('...')
  }
  return arr
}
// 更新组件
function update(currPage, vm) {
  const {
    totalPage,
    props: { maxPageShow }
  } = vm
  vm.currPage = vm.inputPage = currPage
  if (typeof vm.props.onPageChange === 'function') {
    vm.props.onPageChange(currPage)
  }
  vm.pageList.clear()
  if (totalPage > 1) {
    vm.pageList.pushArray(calculate({ currPage, totalPage, maxPageShow }))
  } else {
    vm.pageList.pushArray([1])
  }
}

const tmpls = {
  home: `<button class="do-icon-dbl-left button"
    :css="{'border-radius': props.radius}"
    :attr-disabled="currPage === 1"
    :data="{to: parseUrl(1)}"
    :click="setPage(1, $event)"></button>`,
  end: `<button class="do-icon-dbl-right button"
    :css="{'border-radius': props.radius}"
    :attr-disabled="currPage === totalPage"
    :data="{to: parseUrl(totalPage)}"
    :click="setPage(totalPage, $event)"></button>`,
  prev: `<button class="do-icon-left button"
    :css="{'border-radius': props.radius}"
    :attr-disabled="{disabled: currPage < 2}"
    :data="{to: parseUrl(currPage - 1)}"
    :click="setPage(currPage - 1, $event)"></button>`,
  next: `<button class="do-icon-right button"
    :css="{'border-radius': props.radius}"
    :attr-disabled="{disabled: currPage >= totalPage}"
    :data="{to: parseUrl(currPage + 1)}"
    :click="setPage(currPage + 1, $event)"></button>`,
  pager: `<button class="page"
    :repeat="pageList"
    :css="{'border-radius': props.radius}"
    :attr-disabled="{disabled: '...' === el || currPage === el}"
    :data="{to: parseUrl(el)}"
    :class="{disabled: '...' === el, curr: currPage === el}"
    :text="el"
    :click="setPage(el, $event)"></button>`,
  curr: `<button class="page curr" :text="currPage"></button>`,
  total: `<span class="total-box">共 {{totalPage}} 页 {{totalItem}} 条</span>`,
  jumper: `<div class="input-box">前往
      <input type="text" :duplex="inputPage" :keyup="setPage(null, $event)"> 页
    </div>`,
  slot: ''
}

export default Anot.component('pager', {
  __init__: function(props, state, next) {
    this.classList.add('do-pager')
    this.classList.add('do-fn-noselect')
    this.setAttribute(':class', "{{classList.join(' ')}}")
    props.theme = +props.theme || 1
    if (props.simpleMode) {
      props.theme = 1
    }

    state.classList = state.classList.concat(
      'skin-' + props.theme,
      props.color || 'plain',
      props.size || 'mini'
    )

    if (props.total) {
      state.totalItem = +props.total
    }
    if (props.pageSize) {
      state.pageSize = +props.pageSize
    }

    if (!props.layout) {
      props.layout = 'total,home,prev,pager,next,end,jumper'
    }

    if (props.theme === 2) {
      props.radius = null
    }

    delete props.total
    delete props.pageSize
    delete props.color
    delete props.size
    next()
  },
  render: function(slots) {
    let { layout, theme, simpleMode } = this.props
    if (simpleMode) {
      layout = ['prev', 'curr', 'next']
    } else {
      layout = layout.replace(/\s/g, '')
      if (theme === 2) {
        layout = layout.replace(/total|jumper/g, '')
      }
      layout = layout.split(',')
    }
    layout = layout.map(it => {
      if (it === 'slot') {
        if (slots && slots.extra) {
          return slots.extra[0]
        }
      } else {
        return tmpls[it] || ''
      }
    })
    return layout.join('\n')
  },
  componentWillMount: function() {
    const { currPage, totalPage, props } = this
    this.pageList.clear()
    this.pageList.pushArray(
      calculate({ currPage, totalPage, maxPageShow: props.maxPageShow })
    )
  },
  componentDidMount: function() {
    if (typeof this.props.created === 'function') {
      this.props.created(this)
    }
  },
  state: {
    classList: [],
    currPage: 1,
    totalItem: 1,
    pageSize: 20,
    inputPage: 1,
    pageList: []
  },
  computed: {
    totalPage: function() {
      return Math.ceil(this.totalItem / this.pageSize)
    }
  },
  props: {
    url: null,
    maxPageShow: 5,
    simpleMode: !1,
    radius: 3,
    onPageChange: Anot.PropsTypes.isFunction(),
    created: Anot.PropsTypes.isFunction()
  },
  skip: ['classList'],
  methods: {
    // 格式化页码的URL
    parseUrl: function(val) {
      val = val >>> 0
      if (val < 1 || !this.props.url || this.currPage === val) {
        return ''
      }
      return this.props.url.replace('{id}', val)
    },
    // 设置页码
    setPage: function(val, ev) {
      let { inputPage, totalPage, currPage } = this
      let elem = (ev && ev.target) || null
      if ((elem && elem.disabled) || currPage === val) {
        return
      }
      if (val && elem) {
        if (val !== '...') {
          let link = elem.dataset.to

          if (link) {
            location.href = link
          } else {
            val = val >>> 0
          }
          update(val, this)
        }
      } else {
        if (val === null) {
          inputPage = inputPage >>> 0

          if (ev && ev.keyCode === 13) {
            if (inputPage < 1 || currPage === inputPage) {
              return (this.inputPage = currPage)
            }
            if (inputPage > totalPage) {
              inputPage = totalPage
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
      this.totalItem = +num
      update(1, this)
    }
  }
})
