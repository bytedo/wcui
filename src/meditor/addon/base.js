/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-17 21:41:48
 *
 */

'use strict'
import '../../layer/index'

function objArr(num) {
  let arr = []
  while (num > 0) {
    arr.push({ v: 0 })
    num--
  }
  return arr
}
function trim(str, sign) {
  return str.replace(new RegExp('^' + sign + '|' + sign + '$', 'g'), '')
}

const $doc = Anot(document)
const addon = {
  h1: function(elem) {
    let that = this
    let offset = Anot(elem).offset()
    let wrap = this.selection(true) || Anot.ui.meditor.lang.PLACEHOLDER
    layer.open({
      type: 7,
      menubar: false,
      maskClose: true,
      fixed: true,
      insert: function(level) {
        wrap = wrap.replace(/^(#{1,6} )?/, '#'.repeat(level) + ' ')
        that.insert(wrap, true)
        this.close()
      },
      offset: [
        offset.top + 35 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
      <ul class="do-meditor-h1 do-fn-noselect">
        <li :click="insert(1)" class="h1"><i class="do-meditor__icon icon-h1"></i>${
          Anot.ui.meditor.lang.HEADERS.H1
        }</li>
        <li :click="insert(2)" class="h2"><i class="do-meditor__icon icon-h2"></i>${
          Anot.ui.meditor.lang.HEADERS.H2
        }</li>
        <li :click="insert(3)" class="h3"><i class="do-meditor__icon icon-h3"></i>${
          Anot.ui.meditor.lang.HEADERS.H3
        }</li>
        <li :click="insert(4)" class="h4"><i class="do-meditor__icon icon-h4"></i>${
          Anot.ui.meditor.lang.HEADERS.H4
        }</li>
        <li :click="insert(5)" class="h5"><i class="do-meditor__icon icon-h5"></i>${
          Anot.ui.meditor.lang.HEADERS.H5
        }</li>
        <li :click="insert(6)" class="h6"><i class="do-meditor__icon icon-h6"></i>${
          Anot.ui.meditor.lang.HEADERS.H6
        }</li>
      </ul>`
    })
  },
  quote: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    wrap = '> ' + wrap

    this.insert(wrap, true)
  },
  bold: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    let wraped = trim(wrap, '\\*\\*')

    wrap = wrap === wraped ? '**' + wrap + '**' : wraped

    this.insert(wrap, true)
  },
  italic: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    let wraped = trim(wrap, '_')

    wrap = wrap === wraped ? '_' + wrap + '_' : wraped

    this.insert(wrap, true)
  },
  through: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    let wraped = trim(wrap, '~~')

    wrap = wrap === wraped ? '~~' + wrap + '~~' : wraped

    this.insert(wrap, true)
  },
  unordered: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    wrap = '* ' + wrap

    this.insert(wrap, false)
  },
  ordered: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    wrap = '1. ' + wrap

    this.insert(wrap, false)
  },
  hr: function(elem) {
    this.insert('\n\n---\n\n', false)
  },
  link: function(elem) {
    let that = this
    let offset = Anot(elem).offset()
    let wrap = this.selection() || ''

    layer.open({
      type: 7,
      menubar: false,
      maskClose: true,
      fixed: true,
      link: '',
      linkName: wrap,
      linkTarget: 1,
      insert: function() {
        if (!this.link || !this.linkName) {
          return layer.toast(Anot.ui.meditor.lang.LINK.ERROR, 'error')
        }
        let val = `[${this.linkName}](${this.link} ${
          this.linkTarget === 1 ? ' "target=_blank"' : ''
        })`

        that.insert(val, false)
        this.close()
      },
      offset: [
        offset.top + 35 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
      <div class="do-meditor-common">
        <section>
          <input class="do-meditor__input" :duplex="linkName" placeholder="${
            Anot.ui.meditor.lang.LINK.ALT
          }"/>
        </section>
        <section>
          <input class="do-meditor__input" :duplex="link" placeholder="${
            Anot.ui.meditor.lang.LINK.URL
          }"/>
        </section>
        <section>
          <label class="label">
            <input 
              name="link" 
              type="radio" 
              class="radio" 
              :duplex-number="linkTarget" 
              value="1"/>
            ${Anot.ui.meditor.lang.TARGET.BLANK}
          </label>
          <label class="label">
            <input 
              name="link" 
              type="radio" 
              class="radio" 
              :duplex-number="linkTarget" 
              value="2"/>
            ${Anot.ui.meditor.lang.TARGET.SELF}
          </label>
        </section>
        <section>
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="insert">${Anot.ui.meditor.lang.BTN.YES}</a>
        </section>
      </div>`
    })
  },
  time: function(elem) {
    this.insert(new Date().format(), false)
  },
  face: function(elem) {
    let that = this
    let offset = Anot(elem).offset()

    layer.open({
      type: 7,
      title: Anot.ui.meditor.lang.LAYER.FACE_TITLE,
      fixed: true,
      maskClose: true,
      arr: [
        '😀',
        '😅',
        '😂',
        '🤣',
        '😇',
        '😉',
        '😍',
        '😗',
        '😋',
        '😛',
        '😜',
        '🤨',
        '🧐',
        '🤓',
        '😎',
        '😞',
        '😔',
        '😭',
        '😤',
        '😡',
        '😱',
        '😰',
        '😓',
        '😬',
        '🙄',
        '😴',
        '😪',
        '🤮',
        '😷',
        '💩',
        '👻',
        '💀',
        '🤝',
        '👎',
        '👍',
        '🙏'
      ],
      offset: [
        offset.top + 35 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
        <ul class="do-meditor-face">
          <li class="item" :for="arr">
            <span :html="el" :click="insert(el)"></span>
          </li>
        </ul>`,
      insert: function(val) {
        that.insert(val, false)
      }
    })
  },
  table: function(elem) {
    let that = this
    let offset = Anot(elem).offset()

    layer.open({
      type: 7,
      title: `0 ${Anot.ui.meditor.lang.TABLE.ROW} x 0 ${
        Anot.ui.meditor.lang.TABLE.COLUMN
      }`,
      fixed: true,
      maskClose: true,
      offset: [
        offset.top + 35 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      matrix: objArr(10).map(function() {
        return objArr(10)
      }),
      content: `
      <ul class="do-meditor-table" ref="table">
        <li :for="matrix">
          <span 
            :for="o in el" 
            :class="{active: o.v}" 
            :data="{x: $index, y: $outer.$index}"></span>
        </li>
      </ul>`,
      success: function() {
        let tb = this.$refs.table
        let lastx, lasty
        let { lang } = Anot.ui.meditor

        Anot(tb).bind('mousemove', ev => {
          if (ev.target.nodeName === 'SPAN') {
            let x = ev.target.dataset.x - 0
            let y = ev.target.dataset.y - 0
            if (x === lastx && y === lasty) {
              return
            }
            lastx = x
            lasty = y
            this.title = `${y + 1} ${lang.TABLE.ROW} x ${x + 1} ${
              lang.TABLE.COLUMN
            }`
            for (let i = 0; i <= 9; i++) {
              for (let j = 0; j <= 9; j++) {
                this.matrix[i][j].v = i <= y && j <= x ? 1 : 0
              }
            }
          }
        })
        Anot(tb).bind('mouseleave', ev => {
          lastx = -1
          lasty = -1
          this.title = `0 ${lang.TABLE.ROW} x 0 ${lang.TABLE.COLUMN}`
          for (let i = 0; i <= 9; i++) {
            for (let j = 0; j <= 9; j++) {
              this.matrix[i][j].v = 0
            }
          }
        })
        Anot(tb).bind('click', ev => {
          if (ev.target.nodeName === 'SPAN') {
            let x = ev.target.dataset.x - 0 + 1
            let y = ev.target.dataset.y - 0 + 1

            let thead = `\n\n${('| ' + lang.TABLE.THEAD + ' ').repeat(x)}|\n`
            let pipe = `${'| -- '.repeat(x)}|\n`
            let tbody = ('|    '.repeat(x) + '|\n').repeat(y)

            that.insert(thead + pipe + tbody, false)
            this.close()
          }
        })
      }
    })
  },
  image: function(elem) {
    let that = this
    let offset = Anot(elem).offset()
    let wrap = this.selection() || ''

    layer.open({
      type: 7,
      menubar: false,
      maskClose: true,
      fixed: true,
      img: '',
      imgAlt: wrap,
      insert: function() {
        if (!this.img || !this.imgAlt) {
          return layer.toast(Anot.ui.meditor.lang.LINK.ERROR, 'error')
        }
        let val = `![${this.imgAlt}](${this.img})`

        that.insert(val, false)
        this.close()
      },
      offset: [
        offset.top + 35 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
      <div class="do-meditor-common">
        <section>
          <input class="do-meditor__input" :duplex="imgAlt" placeholder="${
            Anot.ui.meditor.lang.IMAGE.ALT
          }"/>
        </section>
        <section>
          <input class="do-meditor__input" :duplex="img" placeholder="${
            Anot.ui.meditor.lang.IMAGE.URL
          }"/>
        </section>
        <section>
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="insert">${Anot.ui.meditor.lang.BTN.YES}</a>
        </section>
      </div>
      `
    })
  },
  attach: function(elem) {
    this.addon.link.call(this, elem)
  },
  inlinecode: function(elem) {
    let wrap = this.selection() || Anot.ui.meditor.lang.PLACEHOLDER
    let wraped = trim(wrap, '`')

    wrap = wrap === wraped ? '`' + wrap + '`' : wraped
    this.insert(wrap, true)
  },
  blockcode: function(elem) {
    let that = this
    let offset = Anot(elem).offset()
    layer.open({
      type: 7,
      menubar: false,
      fixed: true,
      __lang__: [
        { id: 'asp' },
        { id: 'actionscript', name: 'ActionScript(3.0)/Flash/Flex' },
        { id: 'bash', name: 'Bash/Shell/Bat' },
        { id: 'css' },
        { id: 'c', name: 'C' },
        { id: 'cpp', name: 'C++' },
        { id: 'csharp', name: 'C#' },
        { id: 'coffeescript', name: 'CoffeeScript' },
        { id: 'd', name: 'D' },
        { id: 'dart' },
        { id: 'delphi', name: 'Delphi/Pascal' },
        { id: 'erlang' },
        { id: 'go', name: 'Golang' },
        { id: 'html' },
        { id: 'java' },
        { id: 'javascript' },
        { id: 'json' },
        { id: 'lua' },
        { id: 'less' },
        { id: 'markdown' },
        { id: 'nginx' },
        { id: 'objective-c' },
        { id: 'php' },
        { id: 'perl' },
        { id: 'python' },
        { id: 'r', name: 'R' },
        { id: 'ruby' },
        { id: 'sql' },
        { id: 'sass', name: 'SASS/SCSS' },
        { id: 'swift' },
        { id: 'typescript' },
        { id: 'xml' },
        { id: 'yaml' },
        { id: 'other', name: Anot.ui.meditor.lang.CODE.OTHER }
      ],
      lang: 'javascript',
      code: '',
      maskClose: true,
      offset: [offset.top + 35 - $doc.scrollTop()],
      shift: { top: offset.top - $doc.scrollTop() },
      insert: function() {
        let val = `\n\`\`\`${this.lang}\n${this.code ||
          '// ' + Anot.ui.meditor.lang.PLACEHOLDER}\n\`\`\`\n`
        that.insert(val, false)
        this.close()
      },
      content: `
      <div class="do-meditor-codeblock">
        <section class="do-fn-cl">
          <div class="select">
            <select :duplex="lang">
              <option :for="__lang__" :attr-value="el.id">{{el.name || el.id}}</option>
            </select>
            <span class="trigon">
              <i class="do-icon-trigon-up"></i>
              <i class="do-icon-trigon-down"></i>
            </span>
          </div>
        </section>
        <section>
          <textarea class="do-meditor__input area" :duplex="code" placeholder="${
            Anot.ui.meditor.lang.PLACEHOLDER
          }"></textarea>
        </section>
        <section class="do-fn-cl">
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="insert">${Anot.ui.meditor.lang.BTN.YES}</a>
        </section>
      </div>
      `
    })
  },
  preview: function() {
    this.preview = !this.preview
    if (this.preview) {
      this.htmlTxt = this.__tmp__
    }
  },
  fullscreen: function() {
    this.fullscreen = !this.fullscreen
    if (this.fullscreen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    if (typeof this.props.onFullscreen === 'function') {
      this.props.onFullscreen(this.fullscreen)
    }
  },
  about: function(elem) {
    let offset = Anot(elem).offset()
    layer.open({
      type: 7,
      title: Anot.ui.meditor.lang.LAYER.ABOUT_TITLE,
      maskClose: true,
      offset: [offset.top + 35 - $doc.scrollTop()],
      shift: { top: offset.top - $doc.scrollTop() },
      content: `<div class="do-meditor-about">
        <pre>
 __  __ _____    _ _ _
|  \\/  | ____|__| (_) |_ ___  _ __
| |\\/| |  _| / _\` | | __/ _ \\| '__|
| |  | | |__| (_| | | || (_) | |
|_|  |_|_____\\__,_|_|\\__\\___/|_|    v${Anot.ui.meditor.version}</pre>
        <p>${Anot.ui.meditor.lang.NAME}</p>
        <p><a target="_blank" href="https://doui.cc/product/meditor">https://doui.cc/product/meditor</a></p>
        <p>Copyright © 2017 Yutent, The MIT License.</p>
        </div>`
    })
  }
}

export default addon
