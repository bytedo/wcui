/**
 * 各种表单元素组件
 * @authors yutent (yutent@doui.cc)
 * @date    2018-06-12 13:08:41
 * @version $Id$
 */

import './style.scss'
const log = console.log

export default Anot.component('button', {
  construct(props, state) {
    log(props)
    state.text = this.textContent
    state.style = { 'border-radius': props.radius }
    this.classList.add('do-fn-noselect')
    this.classList.add('do-button')
    this.setAttribute(':click', 'onClick')
  },
  render() {
    let icon = ''
    if (this.props.icon) {
      icon = `<i class="do-button__icon do-icon-${this.props.icon}"></i>`
    }
    return `${icon}<span class="do-button__text" :text="text"></span>`
  },
  state: {
    state: '',
    disabled: false,
    foo: true,
    style: {}
  },
  props: {
    click: Anot.PropsTypes.isFunction()
  },
  skip: ['style'],
  componentDidMount() {
    Anot(this.$elem).css(this.style)
  },
  watch: {},
  methods: {
    onClick() {
      // log(this)
      if (this.disabled) {
        return
      }
      log('hello world, button')
    }
  }
})
