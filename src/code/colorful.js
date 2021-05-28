/**
 * 简单的代码着色 (html, css, js)
 * @author yutent<yutent.io@gmail.com>
 * @date 2021/01/30 14:00:12
 */

const DOCTYPE_EXP = /<\!DOCTYPE html>/
const TAG_START_EXP = /<([\w\-]+)([\w\W]*?)>/g
const TAG_END_EXP = /<\/([\w\-]+)>/g
const TAG_ATTR_EXP = /[@a-zA-Z\-.]+=(["'])[^"]+\1|[@a-zA-Z\-.]+=[a-zA-Z0-9]+|[@a-zA-Z\-.]+/g
const TAG_CM_EXP = /<!--([\w\W]*?)-->/g
const SCRIPT_TAG = /(<script[^>]*?>)([\w\W]*?)(<\/script>)/g
const KEYWOWRD1 = /\b(var|const|let|function|for|switch|with|if|else|export|import|async|await|break|continue|return|class|try|catch|throw|new|while|this|super|default|case|debugger|delete|do|goto|in|static|get|set|public|private|protected|package|typeof|void)\b/g
const KEYWOWRD2 = /\b\s(=|-|\+|\/|\*|<|>|%)\s\b/g
const KEYWOWRD3 = /(\+\=|-=|\/=|\*=|--|\+\+|==|===)/g
const BUILDIN1 = /\b(null|undefined|true|false|NaN|Infinity)\b/g
const BUILDIN2 = /\b(Object|String|Array|Boolean|Number|Function|class)\b/g
const STR = /(['"`])(.*?)\1/g
const NUM = /\b(\d+)\b/g
const FN = /([\.\s])([a-zA-Z$][\da-zA-Z_]*)(\(.*?\))/g
const CM = /(?=\s)?([ ]*\/\/.*)|(^\/\/.*)/g
const INLINE = {
  code: /`([^`]*?[^`\\\s])`/g,
  codeBlock: /^```(.*?)$/gm,
  strong: [/__([\s\S]*?[^\s\\])__(?!_)/g, /\*\*([\s\S]*?[^\s\\])\*\*(?!\*)/g],
  em: [/_([\s\S]*?[^\s\\_])_(?!_)/g, /\*([\s\S]*?[^\s\\*])\*(?!\*)/g],
  del: /~~([\s\S]*?[^\s\\~])~~/g,
  qlinkVar: /^\[(\d+)\]: ([\S]+)\s*?((['"])[\s\S]*?\4)?\s*?$/gm, // 引用声明
  qlink: /\[([^\]]*?)\]\[(\d*?)\]/g, // 引用链接
  img: /\!\[([^\]]*?)\]\(([^)]*?)\)/g,
  a: /\[([^\]]*?)\]\(([^)]*?)(\s+"([\s\S]*?)")*?\)/g,
  head: /^(#{1,6} )(.*)$/gm,
  quote: /^(>{1,} )(.*)$/gm,
  task: /^([\-\+\*]) \[( |x)\] (.*)$/gm,
  list: /^([ \t]*?([\-\+\*]|\d+\.) )(.*)$/gm,
  br: /^([\-\*_=]{3})(.*?)$/gm
}

function parseJs(code) {
  return code
    .replace(FN, '$1[fn]$2[/fn]$3')
    .replace(KEYWOWRD1, '[key]$1[/key]')
    .replace(KEYWOWRD2, '[key] $1 [/key]')
    .replace(KEYWOWRD3, '[key]$1[/key]')
    .replace(BUILDIN1, '[num]<em>$1</em>[/num]')
    .replace(BUILDIN2, '[type]<strong><em>$1</em></strong>[/type]')
    .replace(NUM, '[num]$1[/num]')
    .replace(STR, (m, q, str) => {
      str = str.replace(/\[(\w+)\](.*?)\[\/\1\]/g, '$2')
      return `[str]${q}${str}${q}[/str]`
    })
    .replace(CM, (m, str) => {
      str = str.replace(/\[(\w+)\](.*?)\[\/\1\]/g, '$2')
      return `[cm]${str}[/cm]`
    })
}

function rebuild(code) {
  return code
    .replace(/\[(\/?)tag\]/g, (m, s) => (s ? '</i>' : '<i class="r">'))
    .replace(/\[(\/?)attr\]/g, (m, s) => (s ? '</i>' : '<i class="b">'))
    .replace(/\[(\/?)str\]/g, (m, s) => (s ? '</i>' : '<i class="g">'))
    .replace(/\[(\/?)key\]/g, (m, s) => (s ? '</i>' : '<i class="r">'))
    .replace(/\[(\/?)str\]/g, (m, s) => (s ? '</i>' : '<i class="g">'))
    .replace(/\[(\/?)num\]/g, (m, s) => (s ? '</i>' : '<i class="pp">'))
    .replace(/\[(\/?)fn\]/g, (m, s) => (s ? '</i>' : '<i class="b">'))
    .replace(/\[(\/?)cm\]/g, (m, s) => (s ? '</i>' : '<i class="gr">'))
    .replace(/\[(\/?)type\]/g, (m, s) => (s ? '</i>' : '<i class="o">'))
    .replace(/\[(\/?)link\]/g, (m, s) => (s ? '</i>' : '<i class="link">'))
}

export function colorMd(code) {
  code = code
    .replace(INLINE.head, '[cm]$1[/cm][tag]<strong>$2</strong>[/tag]')
    .replace(INLINE.br, '[cm]$1[/cm][tag]$2[/tag]')
    .replace(INLINE.quote, '[cm]$1[/cm]<em>$2</em>')
    .replace(
      INLINE.task,
      '[cm]$1 [[/cm][attr]$2[/attr][cm]][/cm] <strong>$3</strong>'
    )
    .replace(INLINE.list, '[cm]$1[/cm]<strong>$3</strong>')
    .replace(INLINE.code, '[cm]`[/cm][tag]$1[/tag][cm]`[/cm]')
    .replace(INLINE.codeBlock, '[cm]```[/cm][tag]$1[/tag]')
    .replace(INLINE.strong[0], '[cm]__[/cm]<strong>$1</strong>[cm]__[/cm]')
    .replace(INLINE.strong[1], '[cm]**[/cm]<strong>$1</strong>[cm]**[/cm]')
    .replace(INLINE.em[0], '[cm]_[/cm]<em>$1</em>[cm]_[/cm]')
    .replace(INLINE.em[1], '[cm]*[/cm]<em>$1</em>[cm]*[/cm]')
    .replace(INLINE.del, '[cm]~~[/cm]<del>$1</del>[cm]~~[/cm]')
    .replace(
      INLINE.qlinkVar,
      '[[attr]$1[/attr]]: [link]$2[/link] [tag]$3[/tag]'
    )
    .replace(INLINE.qlink, '[[attr]$1[/attr]][[link]$2[/link]]')
    .replace(INLINE.img, '![[attr]$1[/attr]]([link]$2[/link])')
    .replace(INLINE.a, (m1, txt, link, m2, attr = '') => {
      if (attr) {
        attr = ` "[tag]${attr}[/tag]"`
      }
      return `[[attr]${txt}[/attr]]([link]${link}[/link]${attr})`
    })
  return rebuild(code)
}

export function colorHtml(code) {
  code = code
    .replace(DOCTYPE_EXP, '[tag]&lt;!DOCTYPE [attr]html[/attr]&gt;[/tag]')
    .replace(SCRIPT_TAG, (m, tag1, txt, tag2) => {
      return tag1 + parseJs(txt) + tag2
    })
    .replace(TAG_START_EXP, (m, tag, attr) => {
      if (attr) {
        attr = attr.replace(TAG_ATTR_EXP, function(t) {
          if (~t.indexOf('=')) {
            t = t.split('=')
            let a = t.shift()
            let b = t.join('=').replace(/(\n+)/g, '[/str]\n[str]')
            return `[attr]${a}[/attr]=[str]${b}[/str]`
          } else {
            return `[attr]${t}[/attr]`
          }
        })
      }

      return `[tag]&lt;${tag}[/tag]${attr}[tag]&gt;[/tag]`
    })
    .replace(TAG_END_EXP, (m, tag) => {
      return `[tag]&lt;/${tag}&gt;[/tag]`
    })
    .replace(TAG_CM_EXP, '[cm]&lt;!--$1--&gt;[/cm]')
  return rebuild(code)
}

export function colorCss(code) {
  code = code
    .replace(
      /:(hover|after|active|last\-child|first\-child)/g,
      '<i class="o">:$1</i>'
    )
    .replace(/([\.#])([\w\-]+)/g, '<i class="gr">$1</i><i class="o">$2</i>')
    .replace(
      /([a-zA-Z\-]+):\s?([^;\n]+);?/g,
      '<b class="gr">$1: </b><i class="b">$2</i><i class="gr">;</i>'
    )
    .replace(/([,\{\}])/g, '<i class="gr">$1</i>')
    .replace(/&/g, '<i class="r">&</i>')
  return code
}

export function colorJs(code) {
  return rebuild(parseJs(code))
}
