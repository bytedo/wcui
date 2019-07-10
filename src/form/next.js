/**
 * 未来版表单组件
 * @author yutent<yutent@doui.cc>
 * @date 2019/07/04 12:03:09
 */

'use strict'

export default class DoInput extends HTMLElement {
  constructor() {
    super()

    console.log('0000')
    this.root = this.attachShadow({ mode: 'open' })
    this.root.innerHTML = `
    <style>
    :host {
      box-sizing: border-box;
      display:flex;
      border: 1px solid #e7e8eb;
      border-radius: 4px;
    }
    input {flex:1;padding:0 8px;border: 0;border-radius: 4px;outline:none}
    </style>
    <input type="text">
    `
  }

  static get observedAttributes() {
    return ['type']
  }

  get value() {
    return this.__INPUT__.value
  }

  set value(val) {
    this.__INPUT__.value = val
  }

  set type(val) {
    // console.log('type', val)
    this.__INPUT__.setAttribute('type', val)
    this.setAttribute('type', val)
  }

  connectedCallback() {
    // console.log('----------', this, this.root.children)
    this.__INPUT__ = this.root.children[1]
  }

  attributeChangedCallback(...args) {
    // console.log('======', args)
  }
}

customElements.define('do-input', DoInput)
