/**
 *
 * @authors yutent (yutent.io@gmail.com)
 * @date    2017-04-17 16:37:12
 *
 */

'use strict'

import '../prism/base'
import '../marked/index'
import addon from './addon/base'
import 'css/meditor.scss'

const LANGUAGES = {
  en: {
    NAME: 'Open Source Markdown Editor',
    TOOLBAR: {
      PIPE: '',
      H1: 'Header',
      QUOTE: 'Quote text',
      BOLD: 'Font-bold',
      ITALIC: 'Font-italic',
      THROUGH: 'Font-through',
      UNORDERED: 'Unordered list',
      ORDERED: 'Ordered list',
      LINK: 'Hyperlink',
      HR: 'Line',
      TIME: 'Insert current time',
      FACE: 'Face',
      TABLE: 'Insert table',
      IMAGE: 'Upload Pictures',
      FILE: 'Upload Files',
      INLINECODE: 'Inline code',
      BLOCKCODE: 'Block code',
      PREVIEW: 'Preview',
      FULLSCREEN: 'Fullscreen',
      ABOUT: 'About MEditor'
    },
    HEADERS: {
      H1: '#{1}',
      H2: '#{2}',
      H3: '#{3}',
      H4: '#{4}',
      H5: '#{5}',
      H6: '#{6}'
    },
    PLACEHOLDER: 'Type here',
    LINK: {
      ALT: 'Link text',
      URL: 'Link address',
      ERROR: 'Link address and text can not be null'
    },
    IMAGE: {
      ALT: 'Image alt text',
      URL: 'Image address'
    },
    TARGET: {
      BLANK: 'New window open',
      SELF: 'Current window open'
    },
    BTN: {
      YES: 'OK'
    },
    TABLE: {
      ROW: 'row',
      COLUMN: 'column',
      THEAD: 'thead'
    },
    LAYER: {
      FACE_TITLE: 'Insert Face',
      ABOUT_TITLE: 'About MEditor'
    },
    CODE: {
      OTHER: 'Other language'
    }
  },
  zh: {
    NAME: '开源在线Markdown编辑器',
    TOOLBAR: {
      PIPE: '',
      H1: '标题',
      QUOTE: '引用文本',
      BOLD: '粗体',
      ITALIC: '斜体',
      THROUGH: '删除线',
      UNORDERED: '无序列表',
      ORDERED: '有序列表',
      LINK: '超链接',
      HR: '横线',
      TIME: '插入当前时间',
      FACE: '表情',
      TABLE: '插入表格',
      IMAGE: '插入图片',
      FILE: '插入附件',
      INLINECODE: '行内代码',
      BLOCKCODE: '代码块',
      PREVIEW: '预览',
      FULLSCREEN: '全屏',
      ABOUT: '关于编辑器'
    },
    HEADERS: {
      H1: '一级标题',
      H2: '二级标题',
      H3: '三级标题',
      H4: '四级标题',
      H5: '五级标题',
      H6: '六级标题'
    },
    PLACEHOLDER: '在此输入文本',
    LINK: {
      ALT: '链接文字',
      URL: '链接地址',
      ERROR: '链接文字和地址不能为空'
    },
    IMAGE: {
      ALT: '图片描述',
      URL: '图片地址'
    },
    TARGET: {
      BLANK: '新窗口打开',
      SELF: '本窗口打开'
    },
    BTN: {
      YES: '确定'
    },
    TABLE: {
      ROW: '行',
      COLUMN: '列',
      THEAD: '表头'
    },
    LAYER: {
      FACE_TITLE: '插入表情',
      ABOUT_TITLE: '关于编辑器'
    },
    CODE: {
      OTHER: '其他语言'
    }
  }
}
LANGUAGES['zh-CN'] = LANGUAGES.zh
LANGUAGES['zh-TW'] = LANGUAGES.zh
const lang =
  LANGUAGES[window.__ENV_LANG__ || navigator.language] || LANGUAGES.en

marked.setOptions({
  highlight: function(code, lang) {
    return Prism.highlight(code, Prism.languages[lang])
  }
})
if (!String.prototype.repeat) {
  String.prototype.repeat = function(num) {
    let result = ''
    while (num > 0) {
      result += this
      num--
    }
    return result
  }
}

Anot.ui.meditor = { version: '1.0.0', author: 'yutent', lang }
const log = console.log

const DEFAULT_TOOLBAR = [
  'h1',
  'quote',
  '|',
  'bold',
  'italic',
  'through',
  '|',
  'unordered',
  'ordered',
  '|',
  'hr',
  'link',
  'time',
  'face',
  '|',
  'table',
  'image',
  'attach',
  'inlinecode',
  'blockcode',
  '|',
  'preview',
  'fullscreen',
  '|',
  'about'
]

const ELEMS = {
  a: function(str, attr, inner) {
    let href = attr.match(attrExp('href'))
    let title = attr.match(attrExp('title'))
    let tar = attr.match(attrExp('target'))
    let attrs = ''

    href = (href && href[1]) || null
    title = (title && title[1]) || null
    tar = (tar && tar[1]) || '_self'

    if (!href) {
      return inner || href
    }

    href = href.replace('viod(0)', '')
    attrs = `target=${tar}`
    attrs += title ? `;title=${title}` : ''

    return `[${inner || href}](${href} "${attrs}")`
  },
  em: function(str, attr, inner) {
    return (inner && '_' + inner + '_') || ''
  },
  strong: function(str, attr, inner) {
    return (inner && '**' + inner + '**') || ''
  },
  pre: function(str, attr, inner) {
    inner = inner.replace(/<[/]?code>/g, '')
    return '\n\n```\n' + inner + '\n```\n'
  },
  code: function(str, attr, inner) {
    return (inner && '`' + inner + '`') || ''
  },
  blockquote: function(str, attr, inner) {
    return '> ' + inner.trim()
  },
  img: function(str, attr, inner) {
    var src = attr.match(attrExp('src')),
      alt = attr.match(attrExp('alt'))

    src = (src && src[1]) || ''
    alt = (alt && alt[1]) || ''

    return '![' + alt + '](' + src + ')'
  },
  p: function(str, attr, inner) {
    return inner ? '\n' + inner : ''
  },
  br: '\n',
  'h([1-6])': function(str, level, attr, inner) {
    let h = '#'.repeat(level)
    return '\n' + h + ' ' + inner + '\n'
  },
  hr: '\n\n___\n\n'
}

function attrExp(field, flag = 'i') {
  return new RegExp(field + '\\s?=\\s?["\']?([^"\']*)["\']?', flag)
}
function tagExp(tag, open) {
  var exp = ''
  if (['br', 'hr', 'img'].indexOf(tag) > -1) {
    exp = '<' + tag + '([^>]*?)\\/?>'
  } else {
    exp = '<' + tag + '([^>]*?)>([\\s\\S]*?)<\\/' + tag + '>'
  }
  return new RegExp(exp, 'gi')
}
function html2md(str) {
  try {
    str = decodeURIComponent(str)
  } catch (err) {}

  str = str
    .replace(/\t/g, '  ')
    .replace(/<meta [^>]*>/, '')
    .replace(attrExp('class', 'g'), '')
    .replace(attrExp('style', 'g'), '')
    .replace(/<(?!a |img )(\w+) [^>]*>/g, '<$1>')
    .replace(/<svg[^>]*>.*?<\/svg>/g, '{invalid image}')

  // log(str)
  for (let i in ELEMS) {
    let cb = ELEMS[i]
    let exp = tagExp(i)

    if (i === 'blockquote') {
      while (str.match(exp)) {
        str = str.replace(exp, cb)
      }
    } else {
      str = str.replace(exp, cb)
    }

    // 对另外3种同类标签做一次处理
    if (i === 'p') {
      exp = tagExp('div')
      str = str.replace(exp, cb)
    }
    if (i === 'em') {
      exp = tagExp('i')
      str = str.replace(exp, cb)
    }
    if (i === 'strong') {
      exp = tagExp('b')
      str = str.replace(exp, cb)
    }
  }
  let liExp = /<(ul|ol)>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi
  while (str.match(liExp)) {
    str = str.replace(liExp, function(match) {
      match = match.replace(/<(ul|ol)>([\s\S]*?)<\/\1>/gi, function(
        m,
        t,
        inner
      ) {
        let li = inner.split('</li>')
        li.pop()

        for (let i = 0, len = li.length; i < len; i++) {
          let pre = t === 'ol' ? i + 1 + '. ' : '* '
          li[i] =
            pre +
            li[i]
              .replace(/\s*<li>([\s\S]*)/i, function(m, n) {
                n = n.trim().replace(/\n/g, '\n  ')
                return n
              })
              .replace(/<[\/]?[\w]*[^>]*>/g, '')
        }
        return li.join('\n')
      })
      return '\n' + match.trim()
    })
  }
  str = str

    .replace(/<[\/]?[\w]*[^>]*>/g, '')
    .replace(/```([\w\W]*)```/g, function(str, inner) {
      inner = inner
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
      return '```' + inner + '```'
    })
  return str
}

function tool(name) {
  name = (name + '').trim().toLowerCase()
  name = '|' === name ? 'pipe' : name

  let title = lang.TOOLBAR[name.toUpperCase()]
  let extra = ''
  switch (name) {
    case 'preview':
      extra = ':class="{active: preview}"'
      break
    case 'fullscreen':
      extra = ':class="{active: fullscreen}"'
      break
    default:
      break
  }
  return `
  <span title="${title}" class="do-meditor__icon icon-${name}" data-name="${name}" ${extra}></span>`
}

class MEObject {
  constructor(vm) {
    this.vm = vm
    this.id = vm.$id
  }

  getVal() {
    return this.vm.value.trim()
  }
  getHtml() {
    return this.vm.__tmp__
  }
  setVal(txt) {
    this.vm.value = txt || ''
  }
}

Anot.component('meditor', {
  __init__: function(props, state, next) {
    this.classList.add('do-meditor')

    this.setAttribute(':css', '{height: height}')
    this.setAttribute(
      ':class',
      '{fullscreen: fullscreen, preview: preview, disabled: disabled}'
    )

    if (props.hasOwnProperty('disabled')) {
      state.disabled = true
      delete props.disabled
    }
    if (props.height) {
      if (
        (isFinite(props.height) && props.height > 180) ||
        /%$/.test(props.height)
      ) {
        state.height = props.height
      }
      delete props.height
    }
    next()
  },
  render: function() {
    let toolbar = (this.props.toolbar || DEFAULT_TOOLBAR)
      .map(it => tool(it))
      .join('')

    delete this.props.toolbar

    return `
    <div class="tool-bar do-fn-noselect" :click="onToolClick">${toolbar}</div>
    <textarea 
      ref="editor"
      class="editor-body" 
      spellcheck="false" 
      :attr="{disabled: disabled}"
      :css="{'padding-bottom': padding}"
      :duplex="value"></textarea>
    <content
      ref="preview"
      class="md-preview do-marked-theme" 
      :css="{'padding-bottom': padding}"
      :visible="preview" 
      :html="htmlTxt"></content>
    `
  },
  componentDidMount: function(vm, elem) {
    let $editor = Anot(this.$refs.editor)
    let preview = this.$refs.preview
    $editor.bind('keydown', ev => {
      let wrap = this.selection() || ''
      let select = !!wrap
      //tab键改为插入2个空格,阻止默认事件,防止焦点失去
      if (ev.keyCode === 9) {
        ev.preventDefault()
        wrap = wrap
          .split('\n')
          .map(function(it) {
            return ev.shiftKey ? it.replace(/^\s\s/, '') : '  ' + it
          })
          .join('\n')
        this.insert(wrap, select)
      }
      //修复按退格键删除选中文本时,选中的状态不更新的bug
      if (ev.keyCode === 8) {
        if (select) {
          ev.preventDefault()
          this.insert('', select)
        }
      }
    })

    $editor.bind('paste', ev => {
      ev.preventDefault()
      let txt = ev.clipboardData.getData('text/plain').trim()
      let html = ev.clipboardData.getData('text/html').trim()

      html = html2md(html)

      if (html) {
        this.insert(html)
      } else if (txt) {
        this.insert(txt)
      }
      this.value = this.$refs.editor.value
    })

    $editor.bind('scroll', ev => {
      let st = ev.target.scrollTop
      let sh = ev.target.scrollHeight
      let ch = ev.target.clientHeight
      let psh = preview.scrollHeight
      let syncTop = (st / (sh - ch)) * (psh - ch)
      preview.scrollTop = syncTop
    })
    //编辑器成功加载的回调
    if (typeof this.props.created === 'function') {
      this.props.created(new MEObject(this))
    }
    this.padding = (this.$elem.clientHeight / 2) >>> 0
    this.compile()
    if (this.preview) {
      this.htmlTxt = this.__tmp__
    }
  },
  watch: {
    value: function(val) {
      this.compile()
      //只有开启实时预览,才会赋值给htmlTxt
      if (this.preview) {
        this.htmlTxt = this.__tmp__
      }
      if (typeof this.props.onUpdate === 'function') {
        this.props.onUpdate(this.value, this.__tmp__)
      }
    }
  },
  state: {
    padding: 90,
    height: 180,
    disabled: false, //禁用编辑器
    fullscreen: false, //是否全屏
    preview: window.innerWidth > 768, //是否显示预览
    htmlTxt: '', //用于预览渲染
    value: '', //纯md文本
    addon // 已有插件
  },
  props: {
    safeMode: true,
    revise: Anot.PropsTypes.isFunction(),
    created: Anot.PropsTypes.isFunction(),
    onUpdate: Anot.PropsTypes.isFunction(),
    onFullscreen: Anot.PropsTypes.isFunction()
  },
  skip: ['addon', 'insert', 'selection'],
  methods: {
    // 往文本框中插入内容
    insert(val, isSelect) {
      let dom = this.$refs.editor
      if (document.selection) {
        dom.focus()
        let range = document.selection.createRange()
        range.text = val
        dom.focus()
        range.moveStart('character', -1)
      } else if (dom.selectionStart || dom.selectionStart === 0) {
        let startPos = dom.selectionStart
        let endPos = dom.selectionEnd
        let scrollTop = dom.scrollTop

        dom.value =
          dom.value.slice(0, startPos) +
          val +
          dom.value.slice(endPos, dom.value.length)

        dom.selectionStart = isSelect ? startPos : startPos + val.length
        dom.selectionEnd = startPos + val.length
        dom.scrollTop = scrollTop
        dom.focus()
      } else {
        dom.value += val
        dom.focus()
      }
      this.value = dom.value
    },
    /**
     * [selection 获取选中的文本]
     * @param  {[type]} dom  [要操作的元素]
     * @param  {[type]} forceHoleLine [是否强制光标所在的整行文本]
     */
    selection(forceHoleLine) {
      let dom = this.$refs.editor
      if (document.selection) {
        return document.selection.createRange().text
      } else {
        let startPos = dom.selectionStart
        let endPos = dom.selectionEnd

        if (endPos) {
          //强制选择整行
          if (forceHoleLine) {
            startPos = dom.value.slice(0, startPos).lastIndexOf('\n')

            let tmpEnd = dom.value.slice(endPos).indexOf('\n')
            tmpEnd = tmpEnd < 0 ? dom.value.slice(endPos).length : tmpEnd

            startPos += 1 // 把\n加上
            endPos += tmpEnd

            dom.selectionStart = startPos
            dom.selectionEnd = endPos
          }
        } else {
          //强制选择整行
          if (forceHoleLine) {
            endPos = dom.value.indexOf('\n')
            endPos = endPos < 0 ? dom.value.length : endPos
            dom.selectionEnd = endPos
          }
        }
        dom.focus()
        return dom.value.slice(startPos, endPos)
      }
    },
    onToolClick: function(ev) {
      if (ev.target.tagName.toLowerCase() !== 'span') {
        return
      }
      let name = ev.target.dataset.name
      if (this.disabled || name === 'pipe') {
        return
      }
      if (this.addon[name]) {
        this.addon[name].call(this, ev.target)
      } else {
        console.log('%c没有对应的插件%c[%s]', 'color:#f00;', '', name)
      }
    },

    compile: function() {
      let txt = this.value.trim()

      if (this.props.safeMode) {
        txt = txt
          .replace(/<script([^>]*?)>/g, '&lt;script$1&gt;')
          .replace(/<\/script>/g, '&lt;/script&gt;')
      }
      //只解析,不渲染
      this.__tmp__ = marked(txt)
      if (typeof this.props.revise === 'function') {
        this.__tmp__ = this.props.revise(this.__tmp__)
      }
    }
  }
})
