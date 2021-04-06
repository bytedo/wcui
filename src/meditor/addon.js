/**
 * 基础拓展
 * @author yutent<yutent.io@gmail.com>
 * @date 2020/10/14 17:52:44
 */

import $ from '../utils'

var placeholder = '在此输入文本'

function trim(str, sign) {
  return str.replace(new RegExp('^' + sign + '|' + sign + '$', 'g'), '')
}

function docScroll(k = 'X') {
  return window[`page${k.toUpperCase()}Offset`]
}

// 通用的弹层触发
function showDialog(dialog, elem) {
  var { left, top } = $.offset(elem)
  left -= docScroll('X')
  top += 29 - docScroll('Y')
  left += 'px'
  top += 'px'
  dialog.moveTo({ top, left })
  dialog.show()
  return Promise.resolve(dialog)
}

export default {
  header(elem) {
    showDialog(this.__HEADER_ADDON__, elem)
  },

  h(level) {
    var wrap = this.selection(true) || placeholder
    wrap = wrap.replace(/^(#+ )?/, '#'.repeat(level) + ' ')
    this.insert(wrap, true)
  },

  quote(elem) {
    var wrap = this.selection(true) || placeholder
    wrap = wrap.replace(/^(>+ )?/, '> ')

    this.insert(wrap, true)
  },

  bold(elem) {
    var wrap = this.selection() || placeholder
    var unwrap = trim(wrap, '\\*\\*')
    wrap = wrap === unwrap ? `**${wrap}**` : unwrap
    this.insert(wrap, true)
  },

  italic(elem) {
    var wrap = this.selection() || placeholder
    var unwrap = trim(wrap, '_')
    wrap = wrap === unwrap ? `_${wrap}_` : unwrap
    this.insert(wrap, true)
  },

  through(elem) {
    var wrap = this.selection() || placeholder
    var unwrap = trim(wrap, '~~')
    wrap = wrap === unwrap ? `~~${wrap}~~` : unwrap
    this.insert(wrap, true)
  },

  list(elem) {
    var wrap = this.selection(true) || placeholder

    wrap = wrap.replace(/^([+\-*] )?/, '+ ')
    this.insert(wrap, true)
  },

  order(elem) {
    var wrap = this.selection(true) || placeholder

    wrap = wrap.replace(/^(\d+\. )?/, '1. ')
    this.insert(wrap, true)
  },

  line(elem) {
    this.insert('\n\n---\n\n', false)
  },

  code(elem) {
    var wrap = this.selection() || placeholder
    var unwrap = trim(wrap, '`')
    wrap = wrap === unwrap ? `\`${wrap}\`` : unwrap
    this.insert(wrap, true)
  },

  codeblock(elem) {
    this.insert('\n```language\n\n```\n')
  },

  table(elem) {
    showDialog(this.__TABLE_ADDON__, elem)
  },

  link(elem) {
    showDialog(this.__LINK_ADDON__, elem).then(dialog => {
      var wrap = this.selection() || placeholder
      dialog.__txt__.value = wrap
    })
  },

  image(elem) {
    this._attach = 'image'
    showDialog(this.__ATTACH_ADDON__, elem)
  },

  attach(elem) {
    this._attach = 'file'
    showDialog(this.__ATTACH_ADDON__, elem)
  },

  fullscreen(elem) {
    //
    this.props.fullscreen = !this.props.fullscreen
    if (this.props.fullscreen) {
      this.setAttribute('fullscreen', '')
    } else {
      this.removeAttribute('fullscreen')
    }
    elem.classList.toggle('active', this.props.fullscreen)
  },
  preview(elem) {
    this.props.preview = !this.props.preview
    this.__VIEW__.classList.toggle('active', this.props.preview)
    elem.classList.toggle('active', this.props.preview)
  }
}
