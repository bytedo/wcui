/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-02-14 13:58:39
 *
 */
'use strict'

import 'css/datepicker.scss'

/**************** 公共函数 *****************/
//计算日历数组
function getCalendarTable({ year, month, max, min }, last) {
  let nums = getTotalDays(year, month)
  let numsFixed = 1 - getFirstDay(year, month)
  let isLimitYM = isLimited({ max, min }, { year, month })
  let list = []

  for (let i = numsFixed; i <= nums; i++) {
    let day = {
      weekend: !1,
      day: i < 1 ? '' : i,
      selected: !1,
      disabled: !0
    }
    if (i > 0) {
      let week = getFirstDay(year, month, i)
      day.weekend = week === 0 || week === 6
      day.selected = isSelected({ year, month, day: i }, last)
      day.disabled = disabledDay({ max, min }, i, isLimitYM)
    }
    list.push(day)
  }
  return list
}

//判断当前年/月是否超出限制
function isLimited({ max, min }, { year, month }) {
  let result = ''

  if ((!max.year && !min.year) || (!max.month && !min.month) || !year) {
    return false
  }

  if ((min.year && year < min.year) || (max.year && year > max.year)) {
    return true
  }

  if (month) {
    if (year === min.year) {
      if (min.month && month < min.month) {
        return true
      }

      if (month == min.month) {
        result += '-'
      }
    }

    if (year === max.year) {
      if (max.month && month > max.month) {
        return true
      }

      if (month == max.month) {
        result += '+'
      }
    }
  }
  return result
}

//判断指定天数是否有效
function disabledDay({ max, min }, day, limitedYM) {
  if (limitedYM === '-') {
    return day < min.day
  }

  if (limitedYM === '+') {
    return max.day && day > max.day
  }

  if (limitedYM === '-+') {
    return day < min.day || (max.day && day > max.day)
  }

  return limitedYM
}

//判断指定天数是否被选中
function isSelected({ year, month, day }, last) {
  return !(last.year !== year || last.month !== month || last.day !== day)
}

//修改当前选中日期的样式
function changeStyle(calendar, day) {
  calendar.list.forEach(function(item) {
    if (item.day != day) {
      item.selected = !1
    } else {
      item.selected = !0
    }
  })
}

//获取今年的年份/月份，返回的是数组
function getThisYearMonth() {
  var oDate = new Date()
  return [oDate.getFullYear(), oDate.getMonth() + 1]
}

//根据年份获取指定月份天数
function getTotalDays(year, month) {
  return new Date(year, month, 0).getDate()
}

//判断指定年月第一天是星期几
function getFirstDay(year, month, day) {
  return new Date(year, month - 1, day || 1).getDay()
}

Anot.ui.datepicker = '1.0.0'

export default Anot.component('datepicker', {
  __init__: function(props, state, next) {
    this.classList.add('do-datepicker')
    this.classList.add('do-fn-noselect')
    this.classList.add(props.size || 'mini')
    this.setAttribute(
      ':css',
      "{width: props.width, height: props.height, 'line-height': props.height + 'px'}"
    )
    this.setAttribute(':click', 'cancelBubble')
    // 日期格式化, 不显示时间时, 默认会调用过滤器的格式'Y-m-d H:i:s'
    if (!props.showTime && !props.format) {
      props.format = 'Y-m-d'
    }

    //获取初始值
    let defVal = state.value || null

    if (props.minDate) {
      if (!Date.isDate(props.minDate)) {
        props.minDate = new Date(props.minDate)
      }
    }

    if (props.maxDate) {
      if (!Date.isDate(props.maxDate)) {
        props.maxDate = new Date(props.maxDate)
      }
    }

    if (defVal) {
      // 修正默认值, 如果不是Date对象, 则转为Date对象
      if (!Date.isDate(defVal)) {
        defVal = new Date(defVal)
      }
    } else {
      defVal = new Date()
      if (props.minDate && defVal < props.minDate) {
        defVal = props.minDate
      }
      if (props.maxDate && defVal > props.maxDate) {
        defVal = props.maxDate
      }
    }

    state.min.year = props.minDate.getFullYear()
    state.min.month = props.minDate.getMonth() + 1
    state.min.day = props.minDate.getDate()

    state.max.year = props.maxDate.getFullYear()
    state.max.month = props.maxDate.getMonth() + 1
    state.max.day = props.maxDate.getDate()

    state.last = {
      year: defVal.getFullYear(),
      month: defVal.getMonth() + 1,
      day: defVal.getDate()
    }
    state.value = defVal.format(props.format)

    state.calendar = {
      list: [1],
      year: defVal.getFullYear(),
      month: defVal.getMonth() + 1,
      day: defVal.getDate(),
      hour: defVal.getHours(),
      minute: defVal.getMinutes(),
      second: defVal.getSeconds()
    }
    state.disabled = !!props.disabled

    //移除部分属性
    delete props.minDate
    delete props.maxDate
    delete props.hostPush
    delete props.disabled
    next()
  },
  render: function() {
    return `
    <label class="date-input">
      <input
        class="input"
        type="text"
        readonly
        :duplex="value"
        :focus="onFocus"
        :css="{'border-radius': props.radius}"
        :attr-placeholder="props.placeholder || '请选择日期'"
        :attr-disabled="disabled">
      <i class="do-icon-calendar icon"></i>
    </label>

    <dl
      class="calendar-box"
      :css="{top: top, left: left}"
      :if="showCalendar">

      <dt class="contrl">
        <a class="do-icon-dbl-left" :click="turn(1, -1)"></a>
        <a class="do-icon-left prev-month" :click="turn(0, -1)"></a>
        <a class="do-icon-right next-month" :click="turn(0, 1)"></a>
        <a class="do-icon-dbl-right next-year" :click="turn(1, 1)"></a>
        <span 
          title="双击回到今天"
          :dblclick="back2today"
          :text="calendar.year + '-' + numberFormat(calendar.month)"></span>
      </dt>
      <dd class="table">
        <section class="thead">
          <span class="td">日</span>
          <span class="td">一</span>
          <span class="td">二</span>
          <span class="td">三</span>
          <span class="td">四</span>
          <span class="td">五</span>
          <span class="td">六</span>
        </section>
        <section class="tr do-fn-cl" :click="pick">
          <span class="td"
            :class="{weekend:el.weekend, disabled: el.disabled, selected: el.selected}"
            :for="calendar.list"
            :data-idx="$index"
            :text="el.day"></span>
        </section>
      </dd>
      <dd class="time" :if="props.showTime">
        <label>
          <input type="text" :duplex-number="calendar.hour"> 时
        </label>
        <label>
          <input type="text" :duplex-number="calendar.minute"> 分
        </label>
        <label>
          <input type="text" :duplex-number="calendar.second"> 秒
        </label>
        <a href="javascript:;" class="now" :click="now">现在</a>
      </dd>
      <dt class="confirm" :if="props.showTime">
        <a :click="close" class="cancel">取消</a>
        <a :click="confirmPick" class="ok">确定</a>
      </dt>
      <dd class="tips" :if="tips" :text="tips"></dd>
    </dl>`
  },
  componentWillMount: function() {
    this.resetCalendarTable()
    this.$fire('value', this.value)
  },
  componentDidMount: function() {
    if (typeof this.props.created === 'function') {
      this.props.created(this)
    }
    Anot(document).bind('click', () => {
      this.close()
    })
  },
  state: {
    showCalendar: false, //显示日历对话框
    disabled: false, //是否禁用
    last: { year: 0, month: 0, day: 1 },
    tips: '',
    timer: null,
    value: '', // 用于显示在输入框里的日期变量
    max: { year: 0, month: 0, day: 1 },
    min: { year: 0, month: 0, day: 1 },
    top: 0,
    left: 0,
    calendar: {
      // list: [1],
      // year: '',
      // month: '',
      // day: '',
      // hour: '',
      // minute: '',
      // second: ''
    }
  },
  props: {
    showTime: false, //对话框上显示时间
    radius: 3,
    height: null,
    width: null,
    size: 'mini', //默认规格,mini, medium, large
    format: '', // 日期显示格式
    created: Anot.PropsTypes.isFunction(),
    datePicked: Anot.PropsTypes.isFunction()
  },
  skip: ['max', 'min', 'last', 'timer'],
  watch: {
    tips: function(val) {
      if (!val) {
        return
      }
      this.timer = setTimeout(() => {
        clearTimeout(this.timer)
        this.tips = ''
      }, 1500)
    },
    'calendar.hour': function(val) {
      if (val > 23) {
        val = 23
      }
      this.calendar.hour = val
    },
    'calendar.minute': function(val) {
      if (val > 59) {
        val = 59
      }
      this.calendar.minute = val
    },
    'calendar.second': function(val) {
      if (val > 59) {
        val = 59
      }
      this.calendar.second = val
    }
  },
  methods: {
    // 重置日历表格
    resetCalendarTable: function() {
      let {
        max,
        min,
        calendar: { year, month },
        last
      } = this
      this.calendar.day = 0
      this.calendar.list.clear()
      this.calendar.list.pushArray(
        getCalendarTable({ max, min, year, month }, last)
      )
    },
    // 数字前面加0
    numberFormat: function(num) {
      num += ''
      if (num.length > 1) {
        return num
      }
      while (num.length < 2) {
        num = '0' + num
      }
      return num
    },
    // 输入框获取焦点时，显示日历
    onFocus: function(ev) {
      let { top, left } = Anot(ev.target).offset()
      this.top = top + 30
      this.left = left
      this.showCalendar = !0
    },
    back2today: function() {
      let today = new Date()
      this.calendar.year = today.getFullYear()
      this.calendar.month = today.getMonth() + 1
      this.resetCalendarTable()
    },
    // 切换上/下 年/月
    turn: function(isYear, step) {
      let {
        calendar: { year, month },
        max,
        min
      } = this

      if (isYear === 1) {
        year += step
      } else {
        month += step
        if (month < 1) {
          month = 12
          year--
        }
        if (month > 12) {
          month = 1
          year++
        }
      }
      if (isLimited({ max, min }, { year, month }) === true) {
        this.tips = '日期超出限制'
        return
      }
      this.calendar.year = year
      this.calendar.month = month
      this.resetCalendarTable()
    },
    pick: function(ev) {
      if (ev.target === ev.currentTarget) {
        return
      }
      let item = this.calendar.list[ev.target.dataset.idx]

      if (item.disabled) {
        return
      }

      this.calendar.day = item.day
      changeStyle(this.calendar, item.day)

      if (!this.props.showTime) {
        this.confirmPick()
      }
    },
    updateTime: function() {
      let { year, month, day, hour, minute, second } = this.calendar

      // day 小于1, 说明切换年/月之后, 没有选择具体日期
      if (day < 1) {
        return
      }

      this.last = { year, month, day }

      if (!this.props.showTime) {
        hour = 0
        minute = 0
        second = 0
      }
      this.last.pick = new Date(year, month - 1, day, hour, minute, second)
      this.value = this.last.pick.format(this.props.format)
    },
    now: function() {
      let now = new Date()
      this.calendar.hour = now.getHours()
      this.calendar.minute = now.getMinutes()
      this.calendar.second = now.getSeconds()
    },
    cancelBubble: function(ev) {
      ;(ev.stopPropagation && ev.stopPropagation()) || (ev.cancelBubble = true)
    },
    close: function() {
      this.showCalendar = false
    },
    confirmPick: function() {
      this.updateTime()
      this.close()
      if (
        this.calendar.day > 0 &&
        typeof this.props.datePicked === 'function'
      ) {
        // 返回一个格式化后的值和一个Date对象
        this.props.datePicked(this.value, this.last.pick, this.$elem)
      }
    }
  }
})
