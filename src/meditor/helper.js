/**
 * 一些公共的东西
 * @author yutent<yutent.io@gmail.com>
 * @date 2020/10/12 18:23:23
 */

import ICONS from './svg'

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
  hr: '\n\n---\n\n'
}

const DEFAULT_TOOLS = [
  'header',
  'quote',
  'bold',
  'italic',
  'through',
  'list',
  'order',
  'line',
  'code',
  'codeblock',
  'table',
  'link',
  'image',
  'attach',
  'fullscreen',
  'preview'
]

export const TOOL_TITLE = {
  header: '插入标题',
  h1: '一级标题',
  h2: '二级标题',
  h3: '三级标题',
  h4: '四级标题',
  h5: '五级标题',
  h6: '六级标题',
  quote: '引用文本',
  bold: '粗体',
  italic: '斜体',
  through: '横线',
  list: '无序列表',
  order: '有序列表',
  line: '分割线',
  code: '行内代码',
  codeblock: '插入代码块',
  table: '插入表格',
  link: '插入连接',
  image: '上传图片',
  attach: '上传附件',
  fullscreen: '全屏编辑',
  preview: '预览'
}

export const IMAGE_EXP = /image\/(jpeg|gif|png|webp|bmp|vnd\.microsoft\.icon|svg\+xml)/

const LI_EXP = /<(ul|ol)>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi

// html标签的属性正则
function attrExp(field, flag = 'i') {
  return new RegExp(field + '\\s?=\\s?["\']?([^"\']*)["\']?', flag)
}

// 生成html标签的正则
function tagExp(tag, open) {
  var exp = ''
  if (['br', 'hr', 'img'].indexOf(tag) > -1) {
    exp = '<' + tag + '([^>]*?)\\/?>'
  } else {
    exp = '<' + tag + '([^>]*?)>([\\s\\S]*?)<\\/' + tag + '>'
  }
  return new RegExp(exp, 'gi')
}

/**
 * 渲染工具栏图标
 */
export function renderToolbar(list, tag = 'span', dict = {}, showText = false) {
  return (list || DEFAULT_TOOLS)
    .map(it => {
      var title = showText ? '' : `title="${dict[it] || ''}"`
      var text = showText ? dict[it] || '' : ''

      return `<${tag} data-act="${it}" ${title}><svg class="icon" viewBox="0 0 1024 1024"><path d="${
        ICONS[it]
      }"/></svg>${text}</${tag}>`
    })
    .join('')
}

/**
 * html转成md
 */
export function html2md(str) {
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

  while (str.match(LI_EXP)) {
    str = str.replace(LI_EXP, function(match) {
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
