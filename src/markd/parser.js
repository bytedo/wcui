/**
 * markdown解析器
 * @author yutent<yutent@doui.cc>
 * @date 2020/02/07 17:14:19
 */

'use strict'
const HR_LIST = ['=', '-', '_', '*']
const log = console.log

const Helper = {
  // 是否分割线
  isHr(str) {
    var s = str[0]
    if (HR_LIST.includes(s)) {
      return str.startsWith(s.repeat(3))
    }
    return false
  }
}

const Tool = {
  // 初始化字符串, 处理多余换行等
  init(str) {
    // 去掉\r, 将\t转为空格(2个)
    str = str.replace(/\r/g, '').replace(/\t/g, '  ')
    var list = []
    var lines = str.split('\n')
    var isCodeBlock = false // 是否代码块
    var emptyLineLength = 0 //连续空行的数量

    for (let it of lines) {
      let tmp = it.trim()
      // 空行
      if (!tmp) {
        if (list.length === 0 || (!isCodeBlock && emptyLineLength > 0)) {
          continue
        }
        emptyLineLength++
        list.push(tmp)
      } else {
        emptyLineLength = 0
        if (tmp.startsWith('```')) {
          if (isCodeBlock) {
            list.push('</wc-code>')
          } else {
            list.push(tmp.replace(/^```([\w\#\-]*?)$/, '<wc-code lang="$1">'))
          }
          isCodeBlock = !isCodeBlock
        } else {
          list.push(it)
        }
      }
    }
    log(list)
    this.list = list
    return this
  },

  parse() {
    var html = ''
    var isCodeBlock = false // 是否代码块
    var emptyLineLength = 0 //连续空行的数量
    var isBlockquote = false
    var blockquoteLevel = 0
    var isParagraph = false

    //
    for (let it of this.list) {
      // 空行
      if (!it) {
        // 如果是在代码中, 直接拼接, 并加上换行
        if (isCodeBlock) {
          html += it + '\n'
        } else {
          emptyLineLength++

          // 引用结束
          if (isBlockquote) {
            isBlockquote = false
            html += ''
            if (emptyLineLength > 0) {
              while (blockquoteLevel > 0) {
                emptyLineLength = 0
                blockquoteLevel--
                html += '</blockquote>'
              }
            }
            continue
          }

          //
          if (isParagraph) {
            isParagraph = false
            html += '</p>'
          } /* else {
            html += '<br>'
          } */
        }
      } else {
        // wc-code标签直接拼接
        if (~it.indexOf('wc-code')) {
          html += it
          isCodeBlock = !isCodeBlock
        } else {
          // 同上代码块的处理
          if (isCodeBlock) {
            html += it + '\n'
            continue
          }

          it = it
            .replace(/`(.*?)`/g, '<code class="inline">$1</code>')
            .replace(/(\-\-|\*\*)(.*?)\1/g, '<strong>$2</strong>')
            .replace(/(\-|\*)(.*?)\1/g, '<em>$2</em>')
            .replace(/\!\[([^]*?)\]\(([^)]*?)\)/g, '<img src="$2" alt="$1">')
            .replace(/\[([^]*?)\]\(([^)]*?)\)/g, '<a href="$2">$1</a>')

          //
          if (it.startsWith('>')) {
            html += it.replace(/^(>+) /, m => {
              let len = m.trim().length
              let tmp = ''
              if (isBlockquote) {
                // 若之前已经有一个未闭合的引用, 需要减去已有缩进级别, 避免产生新的引用标签
                len = len - blockquoteLevel
              } else {
                blockquoteLevel = len
              }
              log('bq: ', blockquoteLevel, it)
              while (len > 0) {
                len--
                tmp += '<blockquote class="md-quote">'
              }
              return tmp
            })

            if (isBlockquote) {
              html += '<br>'
            }
            isParagraph = false
            isBlockquote = true
            continue
          }

          if (isBlockquote) {
            html += it
            continue
          }

          //
          if (it.startsWith('#')) {
            isParagraph = false
            let end = ''
            html += it.replace(/^#{1,6} /, m => {
              let level = m.trim().length
              end = `</a></h${level}>`
              return `<h${level}><a href="#">`
            })
            html += end

            continue
          }

          // log('it => ', isParagraph, it)
          if (isParagraph) {
            html += `${it}<br>`
          } else {
            html += `<p>${it}<br>`
          }
          isParagraph = true
        }
      }
    }
    return html
  }
}

export default function(str) {
  return Tool.init(str).parse()
}
