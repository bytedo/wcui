/**
 * neditor
 * @author yutent<yutent@doui.cc>
 * @date 2019/07/05 13:44:10
 */

'use strict'

const log = console.log

import iconList from './icon'

const ACTTION = {
  bold: 'bold',
  italic: 'italic',
  under: 'underline',
  delete: 'strikeThrough',
  left: 'justifyLeft',
  center: 'justifyCenter',
  right: 'justifyRight',
  image: 'insertImage',
  font: 'fontSize',
  color: 'foreColor',
  link: 'createLink',
  ordered: 'insertOrderedList',
  unordered: 'insertUnorderedList'
}

const DEFAULT_TOOLS = [
  'font',
  'color',
  'bold',
  'italic',
  'under',
  'delete',
  'ordered',
  'unordered',
  'left',
  'center',
  'right',
  'link',
  'image'
]

export default class Nedtior extends HTMLElement {
  // 监听属性变化
  static get observedAttributes() {
    return ['toolbar', 'value']
  }

  constructor() {
    super()
    this.root = this.attachShadow({ mode: 'open' })

    this.render()
    this.__TOOLBAR__ = this.root.children[2]
    this.__FONT__ = this.root.children[3]
    this.__COLOR__ = this.root.children[4]
    this.__LINK__ = this.root.children[5]
    this.__LINK_BTN__ = this.__LINK__.querySelector('span')
    this.__EDITOR__ = this.root.lastElementChild
  }

  render() {
    this.root.innerHTML = `
    <style>
    * {box-sizing: border-box;}
    :host {
      position: relative;
      display:flex;
      flex-flow: column wrap;
      min-width: 200px;
      min-height: 100px;
      border: 1px solid #e7e8eb;
      border-radius: 4px;
      font-size: 14px;
    }
    .tool-bar {
      display: flex;
      height: 34px;
      padding: 5px;
      line-height: 24px;
      border-bottom: 1px solid #e7e8eb;
    }
    .tool-bar span {
      position: relative;
      overflow: hidden;
      display: flex;
      justify-content: center;
      align-items: center;
      width: 24px;
      height: 24px;
      margin: 0 3px;
      border-radius: 3px;
    }
    .tool-bar span:hover {background: #f7f8fb}
    .tool-bar span input {position: absolute;width: 100%;
      height: 100%;opacity:0}

    .tool-bar .icon {
      overflow: hidden;
      width: 70%;
      height: 70%;
      fill: currentColor;
      color: #62778d
    }

    .editor {
      flex: 1;
      overflow:hidden;
      overflow-y: auto;
      max-height:360px;
      padding:5px 8px;
      font-size: 14px;
      outline: none;
    }
    .editor img {max-width: 100%;}

    .font-layer, .color-layer, .link-layer {
      visibility: hidden;
      position: absolute; 
      left: 0;
      top: 0;
      z-index:99;
      width: 80px;
      padding: 5px 0;
      line-height:25px;
      background: #fff;
      box-shadow: 0 0 8px rgba(0,0,0,.2);
      font-size: 13px;
      user-select: none;
      opacity: 0;
      transition:all ease-in-out .2s;
    }
    .font-layer.fadein {visibility: visible;top: 34px;opacity: 1;}
    .font-layer span {display: block;padding:0 8px;}
    .font-layer span:hover {background: #f7f8fb;}

    .color-layer {display: flex;flex-flow:row wrap;left: 30px;;width: 96px;}
    .color-layer.fadein {visibility: visible;top: 34px;opacity: 1;}
    .color-layer span {width:20px;height:20px;margin:2px;background: #f30;}
    .color-layer span:nth-child(1){background: #f3f5fb}
    .color-layer span:nth-child(2){background: #dae1e9}
    .color-layer span:nth-child(3){background: #62778d}
    .color-layer span:nth-child(4){background: #58d68d}
    .color-layer span:nth-child(5){background: #3fc2a7}
    .color-layer span:nth-child(6){background: #52a3de}
    .color-layer span:nth-child(7){background: #ac61ce}
    .color-layer span:nth-child(8){background: #ffb618}
    .color-layer span:nth-child(9){background: #e67e22}
    .color-layer span:nth-child(10){background: #ff5061}
    .color-layer span:nth-child(11){background: #ff0000}
    .color-layer span:nth-child(12){background: #000000}

    .link-layer {display:flex;align-items:center;left:330px;width:180px;padding:8px;}
    .link-layer input {width:120px;height:20px;margin-right: 8px;padding:0 5px;border: 1px solid #e7e8eb;outline: none;}
    .link-layer span {height:20px;padding:0 5px;;line-height:20px;border-radius:4px;background:#dae1e9;text-align: center;font-size: 12px;}

    .link-layer.fadein {visibility: visible;top: 34px;opacity: 1;}
   
    </style>
    <svg aria-hidden="true" style="overflow:hidden;position: absolute;width:0;height:0">
    ${iconList
      .map(
        _ =>
          `<symbol id="icon-${_.key}" viewBox="0 0 1024 1024"><path d="${
            _.path
          }" /></symbol>`
      )
      .join('')}
    </svg>

    <section class="tool-bar">
    ${this._parseTools()}
    </section>
    <div class="font-layer">
      <span data-size="6">大号字体</span>
      <span data-size="5">中号字体</span>
      <span data-size="3">小号字体</span>
    </div>
    <div class="color-layer">
      <span data-color="#f3f5fb"></span>
      <span data-color="#dae1e9"></span>
      <span data-color="#62778d"></span>
      <span data-color="#58d68d"></span>
      <span data-color="#3fc2a7"></span>
      <span data-color="#52a3de"></span>
      <span data-color="#ac61ce"></span>
      <span data-color="#ffb618"></span>
      <span data-color="#e67e22"></span>
      <span data-color="#ff5061"></span>
      <span data-color="#ff0000"></span>
      <span data-color="#000000"></span>
    </div>
    <div class="link-layer">
      <input placeholder="请输入链接地址">
      <span>插入</span>
    </div>
    <div contenteditable="true" class="editor" spellcheck="false"></div>
  `
  }

  // 解析工具栏
  _parseTools() {
    const tools = this.tools || DEFAULT_TOOLS

    return tools
      .map(
        it =>
          `<span data-act="${it}"><svg class="icon" aria-hidden="true"><use xlink:href="#icon-${it}"/></svg>${
            it === 'image' ? '<input type="file">' : ''
          }</span>`
      )
      .join('')
  }

  get value() {
    return this.__EDITOR__.innerHTML
  }

  set value(val) {
    if (this.__EDITOR__ && this.__EDITOR__.innerHTML !== val) {
      this.__EDITOR__.innerHTML = val
    }
  }

  set toolbar(val) {
    if (val && Array.isArray(val)) {
      this.tools = val
      if (this.__TOOLBAR__) {
        if (this.tools.length) {
          this.__TOOLBAR__.style.display = 'flex'
          this.__TOOLBAR__.innerHTML = this._parseTools()
        } else {
          this.__TOOLBAR__.style.display = 'none'
        }
      }
    }
  }

  // 保存选中
  saveSelection() {
    var gs = this.root.getSelection()
    if (gs.getRangeAt && gs.rangeCount) {
      this.__SELECT__ = gs.getRangeAt(0)
    }
  }

  //  清除选中并重置选中
  restoreSelection() {
    var gs = this.root.getSelection()
    if (this.__SELECT__) {
      try {
        gs.removeAllRanges()
      } catch (err) {}
      gs.addRange(this.__SELECT__)
    }
  }

  // 执行命令
  exec(cmd, val = '') {
    document.execCommand(cmd, false, val)
  }

  // 处理图片
  _handleImage(file) {
    this.dispatchEvent(
      new CustomEvent('upload', {
        detail: {
          file,
          send: link => {
            this.__EDITOR__.focus()
            this.restoreSelection()
            this.exec(ACTTION.image, link)
            this.saveSelection()
            //  修正插入的图片,宽度不得超出容器
            this.__EDITOR__.querySelectorAll('img').forEach(_ => {
              _.style.maxWidth = '100%'
            })
          }
        }
      })
    )
  }

  connectedCallback() {
    const LINK_INPUT = this.__LINK__.querySelector('input')
    const FILE_INPUT = this.__TOOLBAR__.querySelector('input')

    document.execCommand('styleWithCSS', null, true)

    // 这里有一个彩蛋
    if (FILE_INPUT) {
      FILE_INPUT.addEventListener(
        'change',
        ev => {
          this._handleImage(FILE_INPUT.files[0])
        },
        false
      )
    }

    // 工具栏点击事件
    this.__toolFn = ev => {
      if (ev.target === ev.currentTarget) {
        return
      }
      let target = ev.target
      while (target.tagName !== 'SPAN') {
        target = target.parentNode
      }
      var act = target.dataset.act
      var val = ''

      switch (act) {
        case 'font':
          this.__COLOR__.classList.remove('fadein')
          this.__LINK__.classList.remove('fadein')

          if (this.__FONT__.classList.contains('fadein')) {
            this.__FONT__.classList.remove('fadein')
          } else {
            this.__FONT__.classList.add('fadein')
          }
          break

        case 'color':
          this.__LINK__.classList.remove('fadein')
          this.__FONT__.classList.remove('fadein')
          if (this.__COLOR__.classList.contains('fadein')) {
            this.__COLOR__.classList.remove('fadein')
          } else {
            this.__COLOR__.classList.add('fadein')
          }
          break

        case 'link':
          this.__COLOR__.classList.remove('fadein')
          this.__FONT__.classList.remove('fadein')
          if (this.__LINK__.classList.contains('fadein')) {
            this.__LINK__.classList.remove('fadein')
          } else {
            this.__LINK__.classList.add('fadein')
          }
          break

        case 'image':
          // 这里不作任何处理
          break

        default:
          this.__EDITOR__.focus()
          this.restoreSelection()
          this.exec(ACTTION[act])
          this.saveSelection()
      }
    }

    // 字体大小设置
    this.__fontFn = ev => {
      if (ev.target === ev.currentTarget) {
        return
      }
      this.__FONT__.classList.remove('fadein')
      this.__EDITOR__.focus()
      this.restoreSelection()
      this.exec(ACTTION.font, ev.target.dataset.size)
      this.saveSelection()
    }

    // 颜色
    this.__colorFn = ev => {
      if (ev.target === ev.currentTarget) {
        return
      }
      this.__COLOR__.classList.remove('fadein')
      this.__EDITOR__.focus()
      this.restoreSelection()
      this.exec(ACTTION.color, ev.target.dataset.color)
      this.saveSelection()
    }

    // 超链接
    this.__linkFn = ev => {
      if (LINK_INPUT.value) {
        this.__LINK__.classList.remove('fadein')
        this.__EDITOR__.focus()
        this.restoreSelection()
        this.exec(ACTTION.link, LINK_INPUT.value)
        this.saveSelection()
        LINK_INPUT.value = ''
      }
    }

    //监听鼠标事件的,以缓存选中状态
    this.__mouseFn = ev => {
      this.__FONT__.classList.remove('fadein')
      this.__COLOR__.classList.remove('fadein')
      this.__LINK__.classList.remove('fadein')
      this.saveSelection()
    }

    //  粘贴板事件
    this.__pasteFn = ev => {
      ev.preventDefault()

      var txt = ev.clipboardData.getData('text/plain')
      var items = ev.clipboardData.items

      if (txt) {
        return this.exec('insertText', txt)
      }

      if (items && items.length) {
        let blob = null
        for (let it of items) {
          if (it.type.indexOf('image') > -1) {
            blob = it.getAsFile()
          }
        }
        this._handleImage(blob)
      }
    }

    this.__TOOLBAR__.addEventListener('click', this.__toolFn, false)
    this.__FONT__.addEventListener('click', this.__fontFn, false)
    this.__COLOR__.addEventListener('click', this.__colorFn, false)
    this.__LINK_BTN__.addEventListener('click', this.__linkFn, false)
    this.__EDITOR__.addEventListener('mouseup', this.__mouseFn, false)
    this.__EDITOR__.addEventListener('paste', this.__pasteFn, false)

    this.__observer = new MutationObserver(_ => {
      this.dispatchEvent(
        new CustomEvent('updated', {
          detail: this.value
        })
      )
    })

    this.__observer.observe(this.__EDITOR__, {
      childList: true,
      subtree: true,
      characterData: true
    })
  }

  disconnectedCallback() {
    this.__TOOLBAR__.removeEventListener('click', this.__toolFn)
    this.__FONT__.removeEventListener('click', this.__fontFn)
    this.__COLOR__.removeEventListener('click', this.__colorFn)
    this.__LINK_BTN__.removeEventListener('click', this.__linkFn)
    this.__EDITOR__.removeEventListener('mouseup', this.__mouseFn)
    this.__EDITOR__.removeEventListener('paste', this.__pasteFn)

    this.__observer.disconnect()
  }

  attributeChangedCallback(name, old, val) {
    switch (name) {
      case 'toolbar':
        if (typeof val === 'string') {
          try {
            val = val.split(',')
          } catch (err) {}
        }
        this.toolbar = val
        break

      case 'value':
        this.value = val
        break

      default:
        break
    }
  }
}

customElements.define('do-neditor', Nedtior)
