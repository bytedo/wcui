/**
 * 各种表单元素组件
 * @authors yutent (yutent@doui.cc)
 * @date    2018-06-12 13:08:41
 * @version $Id$
 */

import 'css/form.scss'
const log = console.log

Anot.ui.form = '0.1.0'

// 单选按钮
Anot.component('radio', {
  __init__(props, state, next) {
    if (props.hasOwnProperty('disabled')) {
      state.disabled = true
    }
    if (props.hasOwnProperty('checked')) {
      if (state.value === null) {
        state.value = props.label
      }
    }

    state.text = this.text()
    state.checked = state.value === props.label

    this.classList.add('do-radio')
    this.classList.add('do-fn-noselect')
    this.classList.add(props.color || 'grey')
    this.setAttribute(':class', '{disabled: disabled, checked: checked}')
    this.setAttribute(':click', 'onClick')

    delete props.disabled
    delete props.color

    next()
  },
  render() {
    return `
      <span class="do-radio__box"></span>
      <span class="do-radio__text" :text="text"></span>
    `
  },
  state: {
    value: null,
    text: '',
    checked: false,
    disabled: false
  },
  props: {
    label: ''
  },
  watch: {
    value(val) {
      this.checked = this.props.label === val
    }
  },
  methods: {
    onClick() {
      if (this.disabled) {
        return
      }
      if (!this.checked) {
        this.checked = true
        this.value = this.props.label
      }
    }
  }
})

// 多选
Anot.component('checkbox', {
  __init__(props, state, next) {
    if (!Array.isArray(state.value)) {
      this.parentNode.removeChild(this)
      Anot.error('多选框的传入值必须一个数组', TypeError)
    }
    if (props.hasOwnProperty('disabled')) {
      state.disabled = true
    }
    if (props.hasOwnProperty('checked')) {
      Anot.Array.ensure(state.value, props.label)
    }

    state.text = this.text()
    state.checked = state.value.indexOf(props.label) > -1

    this.classList.add('do-checkbox')
    this.classList.add('do-fn-noselect')
    this.classList.add(props.color || 'grey')
    this.setAttribute(':class', '{disabled: disabled, checked: checked}')
    this.setAttribute(':click', 'onClick')

    delete props.disabled
    delete props.color
    next()
  },
  render() {
    return `
      <span class="do-checkbox__box">
        <i class="do-icon-get" :visible="checked"></i>
      </span>
      <span class="do-checkbox__text" :text="text"></span>
    `
  },
  state: {
    value: [],
    text: '',
    checked: false,
    disabled: false
  },
  props: {
    label: ''
  },
  watch: {
    'value.*'(val, old, k, kk) {
      this.checked = this.value.indexOf(this.props.label) > -1
    },
    'value.length'(val, old, k, kk) {
      this.checked = this.value.indexOf(this.props.label) > -1
    },
    value(val, old, k, kk) {
      this.checked = this.value.indexOf(this.props.label) > -1
    }
  },
  methods: {
    onClick() {
      if (this.disabled) {
        return
      }
      let { label } = this.props
      let list = this.value.$model
      for (let i in list) {
        if (list[i] === label) {
          this.checked = false
          this.value.removeAt.call(this.value, i)
          return
        }
      }
      this.checked = true
      this.value.push(label)
    }
  }
})

export default Anot
