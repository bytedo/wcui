/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-17 21:41:48
 *
 */

'use strict'
import 'layer/index'

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
    let wrap = this.selection(true) || '在此输入文本'
    layer.open({
      type: 7,
      menubar: false,
      maskClose: true,
      maskColor: 'rgba(255,255,255,0)',
      fixed: true,
      insert: function(level) {
        wrap = wrap.replace(/^(#{1,6} )?/, '#'.repeat(level) + ' ')
        that.insert(wrap, true)
        this.close()
      },
      offset: [
        offset.top + 40 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
      <ul class="do-meditor-h1 do-fn-noselect do-meditor__font">
        <li :click="insert(1)" class="h1"><i class="do-meditor__icon icon-h1"></i>一级标题</li>
        <li :click="insert(2)" class="h2"><i class="do-meditor__icon icon-h2"></i>二级标题</li>
        <li :click="insert(3)" class="h3"><i class="do-meditor__icon icon-h3"></i>三级标题</li>
        <li :click="insert(4)" class="h4"><i class="do-meditor__icon icon-h4"></i>四级标题</li>
        <li :click="insert(5)" class="h5"><i class="do-meditor__icon icon-h5"></i>五级标题</li>
        <li :click="insert(6)" class="h6"><i class="do-meditor__icon icon-h6"></i>六级标题</li>
      </ul>`
    })
  },
  quote: function(elem) {
    let wrap = this.selection() || '在此输入文本'
    wrap = '> ' + wrap

    this.insert(wrap, true)
  },
  bold: function(elem) {
    let wrap = this.selection() || '在此输入文本'
    let wraped = trim(wrap, '\\*\\*')

    wrap = wrap === wraped ? '**' + wrap + '**' : wraped

    this.insert(wrap, true)
  },
  italic: function(elem) {
    let wrap = this.selection() || '在此输入文本'
    let wraped = trim(wrap, '_')

    wrap = wrap === wraped ? '_' + wrap + '_' : wraped

    this.insert(wrap, true)
  },
  through: function(elem) {
    let wrap = this.selection() || '在此输入文本'
    let wraped = trim(wrap, '~~')

    wrap = wrap === wraped ? '~~' + wrap + '~~' : wraped

    this.insert(wrap, true)
  },
  unordered: function(elem) {
    let wrap = this.selection() || '在此输入文本'
    wrap = '* ' + wrap

    this.insert(wrap, false)
  },
  ordered: function(elem) {
    let wrap = this.selection() || '在此输入文本'
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
      maskColor: 'rgba(255,255,255,0)',
      fixed: true,
      link: '',
      linkName: wrap,
      linkTarget: 1,
      insert: function() {
        if (!this.link || !this.linkName) {
          return layer.toast('链接文字和地址不能为空', 'error')
        }
        let val = `[${this.linkName}](${this.link} ${
          this.linkTarget === 1 ? ' "target=_blank"' : ''
        })`

        that.insert(val, false)
        this.close()
      },
      offset: [
        offset.top + 40 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
      <div class="do-meditor-common do-meditor__font">
        <section>
          <input class="txt" :duplex="linkName" placeholder="链接文字"/>
        </section>
        <section>
          <input class="txt" :duplex="link" placeholder="链接地址"/>
        </section>
        <section>
          <label class="label">
            <input 
              name="link" 
              type="radio" 
              class="radio" 
              :duplex-number="linkTarget" 
              value="1"/>
            新窗口打开
          </label>
          <label class="label">
            <input 
              name="link" 
              type="radio" 
              class="radio" 
              :duplex-number="linkTarget" 
              value="2"/>
            本窗口打开
          </label>
        </section>
        <section>
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="insert">确定</a>
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
      title: '插入表情',
      fixed: true,
      maskClose: true,
      maskColor: 'rgba(255,255,255,0)',
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
        offset.top + 40 - $doc.scrollTop(),
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
          <li class="item" :repeat="arr">
            <span :html="el" :click="insert(el)"></span>
          </li>
        </ul>`,
      insert: function(val) {
        that.insert(val, false)
        this.close()
      }
    })
  },
  table: function(elem) {
    let that = this
    let offset = Anot(elem).offset()

    layer.open({
      type: 7,
      title: '0行 x 0列',
      fixed: true,
      maskClose: true,
      maskColor: 'rgba(255,255,255,0)',
      offset: [
        offset.top + 40 - $doc.scrollTop(),
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
        <li :repeat="matrix">
          <span 
            :repeat-o="el" 
            :class="{active: o.v}" 
            :data="{x: $index, y: $outer.$index}"></span>
        </li>
      </ul>`,
      success: function() {
        let tb = this.$refs.table
        let lastx, lasty

        Anot(tb).bind('mousemove', ev => {
          if (ev.target.nodeName === 'SPAN') {
            let x = ev.target.dataset.x - 0
            let y = ev.target.dataset.y - 0
            if (x === lastx && y === lasty) {
              return
            }
            lastx = x
            lasty = y
            this.title = y + 1 + '行 x ' + (x + 1) + '列'
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
          this.title = '0行 x 0列'
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

            let thead = `\n\n${'| 表头 '.repeat(x)}|\n`
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
      maskColor: 'rgba(255,255,255,0)',
      fixed: true,
      img: '',
      imgAlt: wrap,
      insert: function() {
        if (!this.img || !this.imgAlt) {
          return layer.toast('链接文字和地址不能为空', 'error')
        }
        let val = `![${this.imgAlt}](${this.img})`

        that.insert(val, false)
        this.close()
      },
      offset: [
        offset.top + 40 - $doc.scrollTop(),
        'auto',
        'auto',
        offset.left - $doc.scrollLeft()
      ],
      shift: {
        top: offset.top - $doc.scrollTop(),
        left: offset.left - $doc.scrollLeft()
      },
      content: `
      <div class="do-meditor-common do-meditor__font">
        <section>
          <input class="txt" :duplex="imgAlt" placeholder="图片描述"/>
        </section>
        <section>
          <input class="txt" :duplex="img" placeholder="图片地址"/>
        </section>
        <section>
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="insert">确定</a>
        </section>
      </div>
      `
    })
  },
  attach: function(elem) {
    this.addon.link.call(this, elem)
  },
  inlinecode: function(elem) {
    let wrap = this.selection() || '在此输入文本'
    let wraped = trim(wrap, '`')

    wrap = wrap === wraped ? '`' + wrap + '`' : wraped
    this.insert(wrap, true)
  },
  blockcode: function(elem) {
    let that = this
    layer.open({
      type: 7,
      title: '添加代码块',
      $lang: [
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
        { id: 'other', name: '其他语言' }
      ],
      lang: 'javascript',
      code: '',
      maskClose: true,
      insert: function() {
        let val = `\n\`\`\`${this.lang}\n${this.code ||
          '// 在此输入代码'}\n\`\`\`\n`
        that.insert(val, false)
        this.close()
      },
      content: `
      <div class="do-meditor-codeblock do-meditor__font">
        <section class="do-fn-cl">
          <span class="label">语言类型</span>
          <select :duplex="lang">
            <option :repeat="$lang" :attr-value="el.id">{{el.name || el.id}}</option>
          </select>
        </section>
        <section>
          <textarea :duplex="code" placeholder="在这里输入/粘贴代码"></textarea>
        </section>
        <section class="do-fn-cl">
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="insert">确定</a>
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
      title: '关于编辑器',
      maskClose: true,
      maskColor: 'rgba(255,255,255,0)',
      offset: [offset.top + 37 - $doc.scrollTop()],
      shift: { top: offset.top - $doc.scrollTop() },
      content:
        '<div class="do-meditor-about do-meditor__font">' +
        '<pre>' +
        ' __  __ _____    _ _ _\n' +
        '|  \\/  | ____|__| (_) |_ ___  _ __\n' +
        "| |\\/| |  _| / _` | | __/ _ \\| '__|\n" +
        '| |  | | |__| (_| | | || (_) | |\n' +
        '|_|  |_|_____\\__,_|_|\\__\\___/|_|    ' +
        'v' +
        Anot.ui.meditor +
        '</pre>' +
        '<p>开源在线Markdown编辑器</p>' +
        '<p><a target="_blank" href="https://doui.cc/product/meditor">https://doui.cc/product/meditor</a></p>' +
        '<p>Copyright © 2017 Yutent, The MIT License.</p>' +
        '</div>'
    })
  }
}

export default addon
