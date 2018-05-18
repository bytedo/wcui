/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-17 16:37:12
 *
 */

'use strict'

import 'prism/base'
import 'marked/index'
import addon from './addon/base'
import './skin/main.scss'

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

Anot.ui.meditor = '1.0.0'
const log = console.log
// 工具栏title
const TOOLBAR = {
  pipe: '',
  h1: '标题',
  quote: '引用文本',
  bold: '粗体',
  italic: '斜体',
  through: '删除线',
  unordered: '无序列表',
  ordered: '有序列表',
  link: '超链接',
  hr: '横线',
  time: '插入当前时间',
  face: '表情',
  table: '插入表格',
  image: '插入图片',
  file: '插入附件',
  inlinecode: '行内代码',
  blockcode: '代码块',
  preview: '预览',
  fullscreen: '全屏',
  about: '关于编辑器'
}
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
  code: function(str, attr, inner) {
    return (inner && '`' + inner + '`') || ''
  },
  pre: function(str, attr, inner) {
    return '\n\n```\n' + inner + '\n```\n'
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

  str = str.replace(/\t/g, '  ').replace(/<meta [^>]*>/, '')
  str = str
    .replace(attrExp('class', 'g'), '')
    .replace(attrExp('style', 'g'), '')
  str = str
    .replace(
      /<(div|span|header|footer|nav|dl|dd|dt|table|tr|td|thead|tbody|i|em|b|strong|h[1-6]|ul|ol|li|p|pre) [^>]*>/g,
      '<$1>'
    )
    .replace(/<svg [^>]*>.*?<\/svg>/g, '{invalid image}')

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
  let event = name === 'pipe' ? '' : `:click="onToolClick('${name}', $event)"`
  let title = TOOLBAR[name]
  return `
  <span title="${title}" class="do-meditor__icon icon-${name}" ${event}></span>`
}

class MEObject {
  constructor(vm) {
    this.vm = vm
    this.id = vm.$id
  }

  getVal() {
    return this.vm.plainTxt.trim()
  }
  getHtml() {
    return this.vm.__tmp__
  }
  setVal(txt) {
    this.vm.plainTxt = txt || ''
  }
  show() {
    this.vm.editorVisible = true
  }
  hide() {
    this.vm.editorVisible = false
  }
  extends(addon) {
    Object.assign(this.vm.addon, addon)
  }
}

Anot.component('meditor', {
  construct: function(props, state) {
    if (props.hasOwnProperty('$show')) {
      state.editorVisible = props.$show
      delete props.$show
    }
  },
  render: function() {
    let toolbar = (this.toolbar || DEFAULT_TOOLBAR).map(it => tool(it)).join('')

    delete this.toolbar

    return `
    <div 
      class="do-meditor do-meditor__font" 
      :visible="editorVisible"
      :class="{fullscreen: fullscreen, preview: preview}">
      <div class="tool-bar do-fn-noselect">${toolbar}</div>
      <textarea 
        ref="editor"
        class="editor-body" 
        spellcheck="false" 
        :attr="{disabled: disabled}"
        :duplex="plainTxt"
        :on-paste="onPaste($event)"></textarea>
      <content
        ref="preview"
        class="md-preview do-marked-theme" 
        :visible="preview" 
        :html="htmlTxt"></content>
    </div>
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

    $editor.bind('scroll', ev => {
      let syncTop =
        ev.target.scrollTop / ev.target.scrollHeight * preview.scrollHeight

      preview.scrollTop = syncTop
    })
    //编辑器成功加载的回调
    if (typeof this.props.onCreated === 'function') {
      this.props.onCreated(new MEObject(this))
    }
  },
  watch: {
    plainTxt: function(val) {
      this.compile()
      //只有开启实时预览,才会赋值给htmlTxt
      if (this.preview) {
        this.htmlTxt = this.__tmp__
      }
      if (typeof this.props.onUpdate === 'function') {
        this.props.onUpdate(this.plainTxt, this.__tmp__)
      }
    }
  },
  state: {
    disabled: false, //禁用编辑器
    fullscreen: false, //是否全屏
    preview: true, //是否显示预览
    editorVisible: true,
    htmlTxt: '', //用于预览渲染
    plainTxt: '', //纯md文本
    addon // 已有插件
  },
  props: {
    safelyCompile: true,
    onSuccess: Anot.PropsTypes.isFunction(),
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
      this.plainTxt = dom.value
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
    onToolClick: function(name, ev) {
      if (this.addon[name]) {
        this.addon[name].call(this, ev.target)
      } else {
        console.log('%c没有对应的插件%c[%s]', 'color:#f00;', '', name)
      }
    },
    onPaste: function(ev) {
      ev.preventDefault()
      let txt = ev.clipboardData.getData('text/plain').trim()
      let html = ev.clipboardData.getData('text/html').trim()

      html = html2md(html)

      if (html) {
        this.insert(html)
      } else if (txt) {
        this.insert(txt)
      }
      this.plainTxt = this.$refs.editor.value
    },
    compile: function() {
      let txt = this.plainTxt.trim()

      if (this.props.safelyCompile) {
        txt = txt
          .replace(/<script([^>]*?)>/g, '&lt;script$1&gt;')
          .replace(/<\/script>/g, '&lt;/script&gt;')
      }
      //只解析,不渲染
      this.__tmp__ = marked(txt)
    }
  }
})
