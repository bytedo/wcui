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
const KEYWOWRD1 = /\b(var|const|let|function|for|switch|with|if|else|export|import|async|await|break|continue|return|class|try|catch|throw|new|while|this|super|default|case|debugger|delete|do|goto|in|public|private|protected|package|typeof)\b/g
const KEYWOWRD2 = /\b\s(=|-|\+|\/|\*|<|>|%)\s\b/g
const KEYWOWRD3 = /(\+\=|-=|\/=|\*=|--|\+\+|==|===)/g
const STR = /(['"`])(.*?)\1/g
const NUM = /\b(\d+)\b/g
const FN = /([\.\s])([a-zA-Z$][\da-zA-Z_]*)(\(.*?\))/g
const CM = /(?=\s)([ ]*\/\/.*)|(^\/\/.*)/g

function parseJs(code) {
  return code
    .replace(FN, '$1[fn]$2[/fn]$3')
    .replace(KEYWOWRD1, '[key]$1[/key]')
    .replace(KEYWOWRD2, '[key] $1 [/key]')
    .replace(KEYWOWRD3, '[key]$1[/key]')
    .replace(NUM, '[num]$1[/num]')
    .replace(STR, (m, q, str) => {
      return `[str]${q}${str.replace(/\[\/?num\]/g, '')}${q}[/str]`
    })
    .replace(CM, '[cm]$1[/cm]')
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
