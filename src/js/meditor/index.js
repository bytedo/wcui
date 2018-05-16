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
let editorVM = []
Anot.ui.meditor = '1.0.0'
const log = console.log
//存放编辑器公共静态资源
window.ME = {
  version: Anot.ui.meditor,
  // 工具栏title
  toolbar: {
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
  },
  addon, // 已有插件
  // 往文本框中插入内容
  insert: function(dom, val, isSelect) {
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
  },
  /**
   * [selection 获取选中的文本]
   * @param  {[type]} dom  [要操作的元素]
   * @param  {[type]} line [是否强制选取整行]
   */
  selection: function(dom, line) {
    if (document.selection) {
      return document.selection.createRange().text
    } else {
      let startPos = dom.selectionStart
      let endPos = dom.selectionEnd

      if (endPos) {
        //强制选择整行
        if (line) {
          startPos = dom.value.slice(0, startPos).lastIndexOf('\n')

          let tmpEnd = dom.value.slice(endPos).indexOf('\n')
          tmpEnd = tmpEnd < 0 ? 0 : tmpEnd

          startPos += 1 //把\n加上
          endPos += tmpEnd

          dom.selectionStart = startPos
          dom.selectionEnd = endPos
        }
      } else {
        //强制选择整行
        if (line) {
          endPos = dom.value.indexOf('\n')
          endPos = endPos < 0 ? dom.value.length : endPos
          dom.selectionEnd = endPos
        }
      }
      return dom.value.slice(startPos, endPos)
    }
  },
  repeat: function(str, num) {
    if (String.prototype.repeat) {
      return str.repeat(num)
    } else {
      var result = ''
      while (num > 0) {
        result += str
        num--
      }
      return result
    }
  },
  get: function(id) {
    if (id === void 0) {
      id = editorVM.length - 1
    }
    var vm = editorVM[id]
    if (vm) {
      return {
        id: vm.$id,
        getVal: function() {
          return vm.plainTxt.trim()
        },
        getHtml: function() {
          return vm.$htmlTxt
        },
        setVal: function(txt) {
          vm.plainTxt = txt || ''
        },
        show: function() {
          vm.editorVisible = true
        },
        hide: function() {
          vm.editorVisible = false
        }
      }
    }
    return null
  },
  doc: Anot(document)
}
//获取真实的引用路径,避免因为不同的目录结构导致加载失败的情况
for (var i in Anot.modules) {
  if (/meditor/.test(i)) {
    ME.path = i.slice(0, i.lastIndexOf('/'))
    break
  }
}
var elems = {
  p: function(str, attr, inner) {
    return inner ? '\n' + inner + '\n' : ''
  },
  br: '\n',
  'h([1-6])': function(str, level, attr, inner) {
    var h = ME.repeat('#', level)
    return '\n' + h + ' ' + inner + '\n'
  },
  hr: '\n\n___\n\n',
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
  }
}

function attrExp(field) {
  return new RegExp(field + '\\s?=\\s?["\']?([^"\']*)["\']?', 'i')
}
function tagExp(tag, open) {
  var exp = ''
  if (['br', 'hr', 'img'].indexOf(tag) > -1) {
    exp = '<' + tag + '([^>]*)\\/?>'
  } else {
    exp = '<' + tag + '([^>]*)>([\\s\\S]*?)<\\/' + tag + '>'
  }
  return new RegExp(exp, 'gi')
}
function html2md(str) {
  try {
    str = decodeURIComponent(str)
  } catch (err) {}

  str = str.replace(/\t/g, '  ').replace(/<meta [^>]*>/, '')
  str = str.replace(
    /<(div|span|dl|dd|dt|table|tr|td|thead|tbody|i|em|strong|h[1-6]|ul|ol|li) [^>]*>/g,
    '<$1>'
  )

  for (var i in elems) {
    var cb = elems[i],
      exp = tagExp(i)

    if (i === 'blockquote') {
      while (str.match(exp)) {
        str = str.replace(exp, cb)
      }
    } else {
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
  var liExp = /<(ul|ol)[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi
  while (str.match(liExp)) {
    str = str.replace(liExp, function(match) {
      match = match.replace(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi, function(
        m,
        t,
        inner
      ) {
        var li = inner.split('</li>')
        li.pop()

        for (var i = 0, len = li.length; i < len; i++) {
          var pre = t === 'ol' ? i + 1 + '. ' : '* '
          li[i] =
            pre +
            li[i]
              .replace(/\s*<li[^>]*>([\s\S]*)/i, function(m, n) {
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

var defaultToolbar = [
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
  ],
  extraAddons = []

function tool(name) {
  name = (name + '').trim().toLowerCase()
  name = '|' === name ? 'pipe' : name
  return (
    '<span title="' +
    ME.toolbar[name] +
    '" class="do-meditor__icon icon-' +
    name +
    '" ' +
    (name !== 'pipe' ? ':click="onToolClick(\'' + name + '\', $event)"' : '') +
    '></span>'
  )
}

Anot.component('meditor', {
  render: function() {
    let toolbar = (this.toolbar || defaultToolbar).map(it => tool(it)).join('')

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
        class="md-preview do-marked-theme" 
        :visible="preview" 
        :html="htmlTxt"></content>
    </div>
    `
  },

  construct: function(props, state) {
    // Anot.mix(base, opt, attr)
    // if (base.$addons && Array.isArray(base.$addons)) {
    //   extraAddons = base.$addons.map(function(name) {
    //     return ME.path + '/addon/' + name
    //   })
    //   delete base.$addons
    // }
    if (props.hasOwnProperty('$show')) {
      state.editorVisible = props.$show
      delete props.$show
    }
  },
  componentWillMount: function(vm) {},
  componentDidMount: function(vm, elem) {
    console.log(this)
    // vm.$editor = elem.children[1]

    // editorVM.push(vm)
    // //自动加载额外的插件
    // require(extraAddons, function() {
    //   var args = Array.prototype.slice.call(arguments, 0)
    //   args.forEach(function(addon) {
    //     addon && addon(vm)
    //   })
    // })

    // Anot(vm.$editor).bind('keydown', function(ev) {
    //   var wrap = ME.selection(vm.$editor) || '',
    //     select = !!wrap
    //   //tab键改为插入2个空格,阻止默认事件,防止焦点失去
    //   if (ev.keyCode === 9) {
    //     wrap = wrap
    //       .split('\n')
    //       .map(function(it) {
    //         return ev.shiftKey ? it.replace(/^\s\s/, '') : '  ' + it
    //       })
    //       .join('\n')
    //     ME.insert(this, wrap, select)
    //     ev.preventDefault()
    //   }
    //   //修复按退格键删除选中文本时,选中的状态不更新的bug
    //   if (ev.keyCode === 8) {
    //     if (select) {
    //       ME.insert(this, '', select)
    //       ev.preventDefault()
    //     }
    //   }
    // })
    // //编辑器成功加载的回调
    // vm.$onSuccess(ME.get(), vm)
  },
  watch: {
    plainTxt: function(val) {
      this.compile()
      //只有开启实时预览,才会赋值给htmlTxt
      if (this.preview) {
        this.htmlTxt = this.$htmlTxt
      }
      if (typeof this.props.onUpdate === 'function') {
        this.props.onUpdate(this.plainTxt, this.$htmlTxt)
      }
    }
  },
  state: {
    disabled: false, //禁用编辑器
    fullscreen: false, //是否全屏
    preview: false, //是否显示预览
    // $editor: null, //编辑器元素
    editorVisible: true,
    $htmlTxt: '', //临时储存html文本
    htmlTxt: '', //用于预览渲染
    plainTxt: '', //纯md文本
    $safelyCompile: true
  },
  props: {
    onSuccess: Anot.PropsTypes.isFunction(),
    onUpdate: Anot.PropsTypes.isFunction(),
    onFullscreen: Anot.PropsTypes.isFunction()
  },
  methods: {
    onToolClick: function(name, ev) {
      if (ME.addon[name]) {
        ME.addon[name].call(ME, ev.target, this)
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
        ME.insert(ev.target, html)
      } else if (txt) {
        ME.insert(ev.target, txt)
      }
      log(ev.target.value)
      this.plainTxt = this.$refs.editor.value
    },
    compile: function() {
      log(this)
      var txt = this.plainTxt.trim()

      if (this.$safelyCompile) {
        txt = txt
          .replace(/<script([^>]*?)>/g, '&lt;script$1&gt;')
          .replace(/<\/script>/g, '&lt;/script&gt;')
      }
      //只解析,不渲染
      this.$htmlTxt = marked(txt)
    }
  }
})
