/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-02-14 13:58:39
 *
 */
'use strict'

import tpl from './main.htm'
import './style.css'

/**************** 公共函数 *****************/
//计算日历数组
function getCalendarTable({ year, month, max, min }, last) {
  let nums = getTotalDays(year, month)
  let numsFixed = 1 - getFirstDay(year, month)
  let isLimitYM = isLimited({ max, min }, { year, month })
  let list = []

  for (let i = numsFixed; i <= nums; i++) {
    let day = {
      weeken: !1,
      day: i < 1 ? '' : i,
      selected: !1,
      disabled: !0
    }
    if (i > 0) {
      let week = getFirstDay(year, month, i)
      day.weeken = week === 0 || week === 6
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
  render: function() {
    return tpl
  },
  construct: function(props, state) {
    if (!props.hasOwnProperty('key')) {
      return Anot.error('日历组件必须设置key属性')
    }

    // 日期格式化, 不显示时间时, 默认会调用过滤器的格式'Y-m-d H:i:s'
    if (!props.showTime && !props.format) {
      props.format = 'Y-m-d'
    }

    //获取初始值
    let defVal = props.value
    if (!defVal) {
      if (props.minDate) {
        defVal = props.minDate
      } else if (props.maxDate) {
        defVal = props.maxDate
      }
    }
    // 修正默认值, 如果不是Date对象, 则转为Date对象
    if (defVal && !Date.isDate(defVal)) {
      defVal += ' GMT+8000'
      defVal = new Date(defVal)
    } else {
      defVal = new Date()
    }

    if (props.minDate) {
      if (!Date.isDate(props.minDate)) {
        props.minDate += ' GMT+8000'
        props.minDate = new Date(props.minDate)
      }
      if (defVal <= props.minDate) {
        defVal = props.minDate
      }
      state.min.year = props.minDate.getFullYear()
      state.min.month = props.minDate.getMonth() + 1
      state.min.day = props.minDate.getDate()
    }

    if (props.maxDate) {
      if (!Date.isDate(props.maxDate)) {
        props.maxDate += ' GMT+8000'
        props.maxDate = new Date(props.maxDate)
      }
      if (defVal >= props.maxDate) {
        defVal = props.maxDate
      }
      state.max.year = props.maxDate.getFullYear()
      state.max.month = props.maxDate.getMonth() + 1
      state.max.day = props.maxDate.getDate()
    }
    if (props.value) {
      state.last = {
        year: defVal.getFullYear(),
        month: defVal.getMonth() + 1,
        day: defVal.getDate()
      }
      state.value = defVal.format(props.format)
    }

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
    delete props.value
    delete props.disabled
  },
  componentWillMount: function() {
    this.resetCalendarTable()
  },
  componentDidMount: function() {
    if (typeof this.props.onCreated === 'function') {
      this.props.onCreated(this)
    }

    document.addEventListener('click', () => {
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
    format: '', // 日期显示格式
    onCreated: Anot.PropsTypes.isFunction(),
    onDatePicked: Anot.PropsTypes.isFunction()
  },
  skip: ['max', 'min', 'last', 'timer'],
  watch: {
    tips: function(val) {
      clearTimeout(this.timer)
      if (!val) {
        return
      }
      this.timer = setTimeout(() => {
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
      let { max, min, calendar: { year, month }, last } = this

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
    onFocus: function() {
      this.showCalendar = !0
    },
    // 切换上/下 年/月
    turn: function(isYear, step) {
      let { calendar: { year, month }, max, min } = this

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
    pick: function(item) {
      if (item.disabled) {
        return
      }

      this.calendar.day = item.day
      changeStyle(this.calendar, item.day)
    },
    updateTime: function() {
      let { year, month, day, hour, minute, second } = this.calendar

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
    onConfirm: function() {
      this.updateTime()
      this.close()
      if (typeof this.props.onDatePicked === 'function') {
        this.props.onDatePicked(this.value, this.last.pick)
      }
    }
  }
})
