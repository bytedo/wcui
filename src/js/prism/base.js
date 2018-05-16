/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-08-02 21:50:34
 * @version $Id$
 */

import './highlight.scss'

var Prism = (function() {
  // Private helper vars
  var lang = /\blang(?:uage)?-(\w+)\b/i
  var uniqueId = 0

  var _ = (window.Prism = {
    manual: window.Prism && window.Prism.manual,
    util: {
      encode: function(tokens) {
        if (tokens instanceof Token) {
          return new Token(
            tokens.type,
            _.util.encode(tokens.content),
            tokens.alias
          )
        } else if (_.util.type(tokens) === 'Array') {
          return tokens.map(_.util.encode)
        } else {
          return tokens
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/\u00a0/g, ' ')
        }
      },

      type: function(o) {
        return Object.prototype.toString.call(o).match(/\[object (\w+)\]/)[1]
      },

      objId: function(obj) {
        if (!obj['__id']) {
          Object.defineProperty(obj, '__id', {
            value: ++uniqueId
          })
        }
        return obj['__id']
      },

      // Deep clone a language definition (e.g. to extend it)
      clone: function(o) {
        var type = _.util.type(o)

        switch (type) {
          case 'Object':
            var clone = {}

            for (var key in o) {
              if (o.hasOwnProperty(key)) {
                clone[key] = _.util.clone(o[key])
              }
            }
            return clone
          case 'Array':
            // Check for existence for IE8
            return (
              o.map &&
              o.map(function(v) {
                return _.util.clone(v)
              })
            )
        }

        return o
      }
    },

    languages: {
      extend: function(id, redef) {
        var lang = _.util.clone(_.languages[id])

        for (var key in redef) {
          lang[key] = redef[key]
        }

        return lang
      },
      insertBefore: function(inside, before, insert, root) {
        root = root || _.languages
        var grammar = root[inside]

        if (arguments.length == 2) {
          insert = arguments[1]

          for (var newToken in insert) {
            if (insert.hasOwnProperty(newToken)) {
              grammar[newToken] = insert[newToken]
            }
          }

          return grammar
        }

        var ret = {}

        for (var token in grammar) {
          if (grammar.hasOwnProperty(token)) {
            if (token == before) {
              for (var newToken in insert) {
                if (insert.hasOwnProperty(newToken)) {
                  ret[newToken] = insert[newToken]
                }
              }
            }

            ret[token] = grammar[token]
          }
        }

        // Update references in other language definitions
        _.languages.DFS(_.languages, function(key, value) {
          if (value === root[inside] && key != inside) {
            this[key] = ret
          }
        })

        return (root[inside] = ret)
      },

      // Traverse a language definition with Depth First Search
      DFS: function(o, callback, type, visited) {
        visited = visited || {}
        for (var i in o) {
          if (o.hasOwnProperty(i)) {
            callback.call(o, i, o[i], type || i)

            if (
              _.util.type(o[i]) === 'Object' &&
              !visited[_.util.objId(o[i])]
            ) {
              visited[_.util.objId(o[i])] = true
              _.languages.DFS(o[i], callback, null, visited)
            } else if (
              _.util.type(o[i]) === 'Array' &&
              !visited[_.util.objId(o[i])]
            ) {
              visited[_.util.objId(o[i])] = true
              _.languages.DFS(o[i], callback, i, visited)
            }
          }
        }
      }
    },
    plugins: {},

    highlightAll: function(async, callback) {
      var env = {
        callback: callback,
        selector:
          'code[class*="language-"], [class*="language-"] code, code[class*="lang-"], [class*="lang-"] code'
      }

      _.hooks.run('before-highlightall', env)

      var elements = env.elements || document.querySelectorAll(env.selector)

      for (var i = 0, element; (element = elements[i++]); ) {
        _.highlightElement(element, async === true, env.callback)
      }
    },

    highlightElement: function(element, async, callback) {
      // Find language
      var language,
        grammar,
        parent = element

      while (parent && !lang.test(parent.className)) {
        parent = parent.parentNode
      }

      if (parent) {
        language = (parent.className.match(lang) || [, ''])[1].toLowerCase()
        grammar = _.languages[language]
      }

      // Set language on the element, if not present
      element.className =
        element.className.replace(lang, '').replace(/\s+/g, ' ') +
        ' language-' +
        language

      // Set language on the parent, for styling
      parent = element.parentNode

      if (/pre/i.test(parent.nodeName)) {
        parent.className =
          parent.className.replace(lang, '').replace(/\s+/g, ' ') +
          ' language-' +
          language
      }

      var code = element.textContent

      var env = {
        element: element,
        language: language,
        grammar: grammar,
        code: code
      }

      _.hooks.run('before-sanity-check', env)

      if (!env.code || !env.grammar) {
        if (env.code) {
          env.element.textContent = env.code
        }
        _.hooks.run('complete', env)
        return
      }

      _.hooks.run('before-highlight', env)

      if (async && window.Worker) {
        var worker = new Worker(_.filename)

        worker.onmessage = function(evt) {
          env.highlightedCode = evt.data

          _.hooks.run('before-insert', env)

          env.element.innerHTML = env.highlightedCode

          callback && callback.call(env.element)
          _.hooks.run('after-highlight', env)
          _.hooks.run('complete', env)
        }

        worker.postMessage(
          JSON.stringify({
            language: env.language,
            code: env.code,
            immediateClose: true
          })
        )
      } else {
        env.highlightedCode = _.highlight(env.code, env.grammar, env.language)

        _.hooks.run('before-insert', env)

        env.element.innerHTML = env.highlightedCode

        callback && callback.call(element)

        _.hooks.run('after-highlight', env)
        _.hooks.run('complete', env)
      }
    },

    highlight: function(text, grammar, language) {
      var tokens = _.tokenize(text, grammar || Prism.languages.other)
      return Token.stringify(_.util.encode(tokens), language)
    },

    tokenize: function(text, grammar, language) {
      var Token = _.Token

      var strarr = [text]

      var rest = grammar.rest

      if (rest) {
        for (var token in rest) {
          grammar[token] = rest[token]
        }

        delete grammar.rest
      }

      tokenloop: for (var token in grammar) {
        if (!grammar.hasOwnProperty(token) || !grammar[token]) {
          continue
        }

        var patterns = grammar[token]
        patterns = _.util.type(patterns) === 'Array' ? patterns : [patterns]

        for (var j = 0; j < patterns.length; ++j) {
          var pattern = patterns[j],
            inside = pattern.inside,
            lookbehind = !!pattern.lookbehind,
            greedy = !!pattern.greedy,
            lookbehindLength = 0,
            alias = pattern.alias

          if (greedy && !pattern.pattern.global) {
            // Without the global flag, lastIndex won't work
            var flags = pattern.pattern.toString().match(/[imuy]*$/)[0]
            pattern.pattern = RegExp(pattern.pattern.source, flags + 'g')
          }

          pattern = pattern.pattern || pattern

          // Don’t cache length as it changes during the loop
          for (
            var i = 0, pos = 0;
            i < strarr.length;
            pos += strarr[i].length, ++i
          ) {
            var str = strarr[i]

            if (strarr.length > text.length) {
              // Something went terribly wrong, ABORT, ABORT!
              break tokenloop
            }

            if (str instanceof Token) {
              continue
            }

            pattern.lastIndex = 0

            var match = pattern.exec(str),
              delNum = 1

            // Greedy patterns can override/remove up to two previously matched tokens
            if (!match && greedy && i != strarr.length - 1) {
              pattern.lastIndex = pos
              match = pattern.exec(text)
              if (!match) {
                break
              }

              var from = match.index + (lookbehind ? match[1].length : 0),
                to = match.index + match[0].length,
                k = i,
                p = pos

              for (var len = strarr.length; k < len && p < to; ++k) {
                p += strarr[k].length
                // Move the index i to the element in strarr that is closest to from
                if (from >= p) {
                  ++i
                  pos = p
                }
              }

              if (strarr[i] instanceof Token || strarr[k - 1].greedy) {
                continue
              }

              // Number of tokens to delete and replace with the new match
              delNum = k - i
              str = text.slice(pos, p)
              match.index -= pos
            }

            if (!match) {
              continue
            }

            if (lookbehind) {
              lookbehindLength = match[1].length
            }

            var from = match.index + lookbehindLength,
              match = match[0].slice(lookbehindLength),
              to = from + match.length,
              before = str.slice(0, from),
              after = str.slice(to)

            var args = [i, delNum]

            if (before) {
              args.push(before)
            }

            var wrapped = new Token(
              token,
              inside ? _.tokenize(match, inside) : match,
              alias,
              match,
              greedy
            )

            args.push(wrapped)

            if (after) {
              args.push(after)
            }

            Array.prototype.splice.apply(strarr, args)
          }
        }
      }

      return strarr
    },

    hooks: {
      all: {},

      add: function(name, callback) {
        var hooks = _.hooks.all

        hooks[name] = hooks[name] || []

        hooks[name].push(callback)
      },

      run: function(name, env) {
        var callbacks = _.hooks.all[name]

        if (!callbacks || !callbacks.length) {
          return
        }

        for (var i = 0, callback; (callback = callbacks[i++]); ) {
          callback(env)
        }
      }
    }
  })

  var Token = (_.Token = function(type, content, alias, matchedStr, greedy) {
    this.type = type
    this.content = content
    this.alias = alias
    // Copy of the full string this token was created from
    this.length = (matchedStr || '').length | 0
    this.greedy = !!greedy
  })

  Token.stringify = function(o, language, parent) {
    if (typeof o == 'string') {
      return o
    }

    if (_.util.type(o) === 'Array') {
      return o
        .map(function(element) {
          return Token.stringify(element, language, o)
        })
        .join('')
    }

    var env = {
      type: o.type,
      content: Token.stringify(o.content, language, parent),
      tag: 'span',
      classes: ['c-' + o.type],
      attributes: {},
      language: language,
      parent: parent
    }

    if (o.alias) {
      var aliases = _.util.type(o.alias) === 'Array' ? o.alias : [o.alias]
      Array.prototype.push.apply(env.classes, aliases)
    }

    _.hooks.run('wrap', env)

    var attributes = Object.keys(env.attributes)
      .map(function(name) {
        return (
          name +
          '="' +
          (env.attributes[name] || '').replace(/"/g, '&quot;') +
          '"'
        )
      })
      .join(' ')

    return (
      '<' +
      env.tag +
      ' class="' +
      env.classes.join(' ') +
      '"' +
      (attributes ? ' ' + attributes : '') +
      '>' +
      env.content +
      '</' +
      env.tag +
      '>'
    )
  }

  if (!window.document) {
    if (!window.addEventListener) {
      // in Node.js
      return window.Prism
    }
    // In worker
    window.addEventListener(
      'message',
      function(evt) {
        var message = JSON.parse(evt.data),
          lang = message.language,
          code = message.code,
          immediateClose = message.immediateClose

        window.postMessage(_.highlight(code, _.languages[lang], lang))
        if (immediateClose) {
          window.close()
        }
      },
      false
    )

    return window.Prism
  }

  //Get current script and highlight
  var script =
    document.currentScript ||
    [].slice.call(document.getElementsByTagName('script')).pop()

  if (script) {
    _.filename = script.src

    if (
      document.addEventListener &&
      !_.manual &&
      !script.hasAttribute('data-manual')
    ) {
      if (document.readyState !== 'loading') {
        if (window.requestAnimationFrame) {
          window.requestAnimationFrame(_.highlightAll)
        } else {
          window.setTimeout(_.highlightAll, 16)
        }
      } else {
        document.addEventListener('DOMContentLoaded', _.highlightAll)
      }
    }
  }

  return window.Prism
})()

Prism.languages.markup = {
  smartyx: /<!--\{[\w\W]*?\}-->/,
  comment: /<!--[\w\W]*?-->/,
  prolog: /<\?[\w\W]+?\?>/,
  doctype: /<!DOCTYPE[\w\W]+?>/i,
  cdata: /<!\[CDATA\[[\w\W]*?]]>/i,
  tag: {
    pattern: /<\/?(?!\d)[^\s>\/=$<]+(?:\s+[^\s>\/=]+(?:=(?:("|')(?:\\\1|\\?(?!\1)[\w\W])*\1|[^\s'">=]+))?)*\s*\/?>/i,
    inside: {
      tag: {
        pattern: /^<\/?[^\s>\/]+/i,
        inside: {
          punctuation: /^<\/?/,
          namespace: /^[^\s>\/:]+:/
        }
      },
      'attr-value': {
        pattern: /=(?:('|")[\w\W]*?(\1)|[^\s>]+)/i,
        inside: {
          punctuation: /[=>"']/
        }
      },
      punctuation: /\/?>/,
      'attr-name': {
        pattern: /[^\s>\/]+/,
        inside: {
          namespace: /^[^\s>\/:]+:/
        }
      }
    }
  },
  entity: /&#?[\da-z]{1,8};/i
}

// Plugin to make entity title show the real entity, idea by Roman Komarov
Prism.hooks.add('wrap', function(env) {
  if (env.type === 'entity') {
    env.attributes['title'] = env.content.replace(/&amp;/, '&')
  }
})

Prism.languages.xml = Prism.languages.markup
Prism.languages.html = Prism.languages.markup
Prism.languages.mathml = Prism.languages.markup
Prism.languages.svg = Prism.languages.markup

Prism.languages.css = {
  comment: /\/\*[\w\W]*?\*\//,
  atrule: {
    pattern: /@[\w-]+?.*?(;|(?=\s*\{))/i,
    inside: {
      rule: /@[\w-]+/
      // See rest below
    }
  },
  url: /url\((?:(["'])(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1|.*?)\)/i,
  selector: /[^\{\}\s][^\{\};]*?(?=\s*\{)/,
  string: {
    pattern: /("|')(\\(?:\r\n|[\w\W])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  property: /(\b|\B)[\w-]+(?=\s*:)/i,
  important: /\B!important\b/i,
  function: /[-a-z0-9]+(?=\()/i,
  punctuation: /[(){};:]/
}

Prism.languages.css['atrule'].inside.rest = Prism.util.clone(
  Prism.languages.css
)

if (Prism.languages.markup) {
  Prism.languages.insertBefore('markup', 'tag', {
    style: {
      pattern: /(<style[\w\W]*?>)[\w\W]*?(?=<\/style>)/i,
      lookbehind: true,
      inside: Prism.languages.css,
      alias: 'language-css'
    }
  })

  Prism.languages.insertBefore(
    'inside',
    'attr-value',
    {
      'style-attr': {
        pattern: /\s*style=("|').*?\1/i,
        inside: {
          'attr-name': {
            pattern: /^\s*style/i,
            inside: Prism.languages.markup.tag.inside
          },
          punctuation: /^\s*=\s*['"]|['"]\s*$/,
          'attr-value': {
            pattern: /.+/i,
            inside: Prism.languages.css
          }
        },
        alias: 'language-css'
      }
    },
    Prism.languages.markup.tag
  )
}
Prism.languages.clike = {
  comment: [
    {
      pattern: /(^|[^\\])\/\*[\w\W]*?\*\//,
      lookbehind: true
    },
    {
      pattern: /(^|[^\\:])\/\/.*/,
      lookbehind: true
    }
  ],
  string: {
    pattern: /(["'])(\\(?:\r\n|[\s\S])|(?!\1)[^\\\r\n])*\1/,
    greedy: true
  },
  'class-name': {
    pattern: /((?:\b(?:class|interface|extends|implements|trait|instanceof|new)\s+)|(?:catch\s+\())[a-z0-9_\.\\]+/i,
    lookbehind: true,
    inside: {
      punctuation: /(\.|\\)/
    }
  },
  keyword: /\b(if|else|while|do|for|return|in|instanceof|function|new|try|throw|catch|finally|null|break|continue)\b/,
  boolean: /\b(true|false)\b/,
  function: /[a-z0-9_]+(?=\()/i,
  number: /\b-?(?:0x[\da-f]+|\d*\.?\d+(?:e[+-]?\d+)?)\b/i,
  operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*|\/|~|\^|%/,
  punctuation: /[{}[\];(),.:]/
}

Prism.languages.javascript = Prism.languages.extend('clike', {
  'build-in': /\b(Object|Array|console|Function|String|Global|window|Buffer|Audio|Video|Date|Math|process|EventEmitter|__dirname|__filename|module|export|exports|import|require|Promise)\b/,
  params: /(\(.*?\)|[A-Za-z$_][0-9A-Za-z$_]*)\s*=>/,
  keyword: /\b(as|async|await|break|case|catch|class|const|continue|debugger|default|delete|do|else|enum|export|extends|finally|for|from|function|get|if|implements|import|in|instanceof|interface|let|new|null|of|package|private|protected|public|return|set|static|super|switch|this|throw|try|typeof|var|void|while|with|yield)\b/,
  number: /\b-?(0x[\dA-Fa-f]+|0b[01]+|0o[0-7]+|\d*\.?\d+([Ee][+-]?\d+)?|NaN|Infinity)\b/,
  // Allow for all non-ASCII characters (See http://stackoverflow.com/a/2008444)
  function: /[_$a-zA-Z\xA0-\uFFFF][_$a-zA-Z0-9\xA0-\uFFFF]*(?=\()/i,
  operator: /--?|\+\+?|!=?=?|<=?|>=?|==?=?|&&?|\|\|?|\?|\*\*?|\/|~|\^|%|\.{3}/
})

Prism.languages.insertBefore('javascript', 'keyword', {
  regex: {
    pattern: /(^|[^/])\/(?!\/)(\[.+?]|\\.|[^/\\\r\n])+\/[gimyu]{0,5}(?=\s*($|[\r\n,.;})]))/,
    lookbehind: true,
    greedy: true
  }
})

Prism.languages.insertBefore('javascript', 'string', {
  'template-string': {
    pattern: /`(?:\\\\|\\?[^\\])*?`/,
    greedy: true,
    inside: {
      interpolation: {
        pattern: /\$\{[^}]+\}/,
        inside: {
          'interpolation-punctuation': {
            pattern: /^\$\{|\}$/,
            alias: 'punctuation'
          },
          rest: Prism.languages.javascript
        }
      },
      string: /[\s\S]+/
    }
  }
})

if (Prism.languages.markup) {
  Prism.languages.insertBefore('markup', 'tag', {
    script: {
      pattern: /(<script[\w\W]*?>)[\w\W]*?(?=<\/script>)/i,
      lookbehind: true,
      inside: Prism.languages.javascript,
      alias: 'language-javascript'
    }
  })
}

Prism.languages.js = Prism.languages.javascript
;(function(Prism) {
  var insideString = {
    variable: [
      // Arithmetic Environment
      {
        pattern: /\$?\(\([\w\W]+?\)\)/,
        inside: {
          // If there is a $ sign at the beginning highlight $(( and )) as variable
          variable: [
            {
              pattern: /(^\$\(\([\w\W]+)\)\)/,
              lookbehind: true
            },
            /^\$\(\(/
          ],
          number: /\b-?(?:0x[\dA-Fa-f]+|\d*\.?\d+(?:[Ee]-?\d+)?)\b/,
          // Operators according to https://www.gnu.org/software/bash/manual/bashref.html#Shell-Arithmetic
          operator: /--?|-=|\+\+?|\+=|!=?|~|\*\*?|\*=|\/=?|%=?|<<=?|>>=?|<=?|>=?|==?|&&?|&=|\^=?|\|\|?|\|=|\?|:/,
          // If there is no $ sign at the beginning highlight (( and )) as punctuation
          punctuation: /\(\(?|\)\)?|,|;/
        }
      },
      // Command Substitution
      {
        pattern: /\$\([^)]+\)|`[^`]+`/,
        inside: {
          variable: /^\$\(|^`|\)$|`$/
        }
      },
      /\$(?:[a-z0-9_#\?\*!@]+|\{[^}]+\})/i
    ]
  }

  Prism.languages.bash = {
    important: {
      pattern: /^#!\s*\/bin\/bash|^#!\s*\/bin\/sh/
    },
    comment: {
      pattern: /(^|[^"{\\])#.*/,
      lookbehind: true
    },
    string: [
      //Support for Here-Documents https://en.wikipedia.org/wiki/Here_document
      {
        pattern: /((?:^|[^<])<<\s*)(?:"|')?(\w+?)(?:"|')?\s*\r?\n(?:[\s\S])*?\r?\n\2/g,
        lookbehind: true,
        greedy: true,
        inside: insideString
      },
      {
        pattern: /(["'])(?:\\\\|\\?[^\\])*?\1/g,
        greedy: true,
        inside: insideString
      }
    ],
    variable: insideString.variable,
    // Originally based on http://ss64.com/bash/
    function: {
      pattern: /(^|\s|;|\||&)(?:alias|apropos|apt-get|aptitude|aspell|awk|basename|bash|bc|bg|builtin|bzip2|cal|cat|cd|cfdisk|chgrp|chmod|chown|chroot|chkconfig|cksum|clear|cmp|comm|command|cp|cron|crontab|csplit|cut|date|dc|dd|ddrescue|df|diff|diff3|dig|dir|dircolors|dirname|dirs|dmesg|du|egrep|eject|enable|env|ethtool|eval|exec|expand|expect|export|expr|fdformat|fdisk|fg|fgrep|file|find|fmt|fold|format|free|fsck|ftp|fuser|gawk|getopts|git|grep|groupadd|groupdel|groupmod|groups|gzip|hash|head|help|hg|history|hostname|htop|iconv|id|ifconfig|ifdown|ifup|import|install|jobs|join|kill|killall|less|link|ln|locate|logname|logout|look|lpc|lpr|lprint|lprintd|lprintq|lprm|ls|lsof|make|man|mkdir|mkfifo|mkisofs|mknod|more|most|mount|mtools|mtr|mv|mmv|nano|netstat|nice|nl|nohup|notify-send|npm|nslookup|open|op|passwd|paste|pathchk|ping|pkill|popd|pr|printcap|printenv|printf|ps|pushd|pv|pwd|quota|quotacheck|quotactl|ram|rar|rcp|read|readarray|readonly|reboot|rename|renice|remsync|rev|rm|rmdir|rsync|screen|scp|sdiff|sed|seq|service|sftp|shift|shopt|shutdown|sleep|slocate|sort|source|split|ssh|stat|strace|su|sudo|sum|suspend|sync|tail|tar|tee|test|time|timeout|times|touch|top|traceroute|trap|tr|tsort|tty|type|ulimit|umask|umount|unalias|uname|unexpand|uniq|units|unrar|unshar|uptime|useradd|userdel|usermod|users|uuencode|uudecode|v|vdir|vi|vmstat|wait|watch|wc|wget|whereis|which|who|whoami|write|xargs|xdg-open|yes|zip)(?=$|\s|;|\||&)/,
      lookbehind: true
    },
    keyword: {
      pattern: /(^|\s|;|\||&)(?:let|:|\.|if|then|else|elif|fi|for|break|continue|while|in|case|function|select|do|done|until|echo|exit|return|set|declare)(?=$|\s|;|\||&)/,
      lookbehind: true
    },
    boolean: {
      pattern: /(^|\s|;|\||&)(?:true|false)(?=$|\s|;|\||&)/,
      lookbehind: true
    },
    operator: /&&?|\|\|?|==?|!=?|<<<?|>>|<=?|>=?|=~/,
    punctuation: /\$?\(\(?|\)\)?|\.\.|[{}[\];]/
  }

  var inside = insideString.variable[1].inside
  inside['function'] = Prism.languages.bash['function']
  inside.keyword = Prism.languages.bash.keyword
  inside.boolean = Prism.languages.bash.boolean
  inside.operator = Prism.languages.bash.operator
  inside.punctuation = Prism.languages.bash.punctuation
})(Prism)

Prism.languages.nginx = Prism.languages.extend('clike', {
  comment: {
    pattern: /(^|[^"{\\])#.*/,
    lookbehind: true
  },
  keyword: /\b(?:CONTENT_|DOCUMENT_|GATEWAY_|HTTP_|HTTPS|if_not_empty|PATH_|QUERY_|REDIRECT_|REMOTE_|REQUEST_|SCGI|SCRIPT_|SERVER_|http|server|events|location|include|accept_mutex|accept_mutex_delay|access_log|add_after_body|add_before_body|add_header|addition_types|aio|alias|allow|ancient_browser|ancient_browser_value|auth|auth_basic|auth_basic_user_file|auth_http|auth_http_header|auth_http_timeout|autoindex|autoindex_exact_size|autoindex_localtime|break|charset|charset_map|charset_types|chunked_transfer_encoding|client_body_buffer_size|client_body_in_file_only|client_body_in_single_buffer|client_body_temp_path|client_body_timeout|client_header_buffer_size|client_header_timeout|client_max_body_size|connection_pool_size|create_full_put_path|daemon|dav_access|dav_methods|debug_connection|debug_points|default_type|deny|devpoll_changes|devpoll_events|directio|directio_alignment|disable_symlinks|empty_gif|env|epoll_events|error_log|error_page|expires|fastcgi_buffer_size|fastcgi_buffers|fastcgi_busy_buffers_size|fastcgi_cache|fastcgi_cache_bypass|fastcgi_cache_key|fastcgi_cache_lock|fastcgi_cache_lock_timeout|fastcgi_cache_methods|fastcgi_cache_min_uses|fastcgi_cache_path|fastcgi_cache_purge|fastcgi_cache_use_stale|fastcgi_cache_valid|fastcgi_connect_timeout|fastcgi_hide_header|fastcgi_ignore_client_abort|fastcgi_ignore_headers|fastcgi_index|fastcgi_intercept_errors|fastcgi_keep_conn|fastcgi_max_temp_file_size|fastcgi_next_upstream|fastcgi_no_cache|fastcgi_param|fastcgi_pass|fastcgi_pass_header|fastcgi_read_timeout|fastcgi_redirect_errors|fastcgi_send_timeout|fastcgi_split_path_info|fastcgi_store|fastcgi_store_access|fastcgi_temp_file_write_size|fastcgi_temp_path|flv|geo|geoip_city|geoip_country|google_perftools_profiles|gzip|gzip_buffers|gzip_comp_level|gzip_disable|gzip_http_version|gzip_min_length|gzip_proxied|gzip_static|gzip_types|gzip_vary|if|if_modified_since|ignore_invalid_headers|image_filter|image_filter_buffer|image_filter_jpeg_quality|image_filter_sharpen|image_filter_transparency|imap_capabilities|imap_client_buffer|include|index|internal|ip_hash|keepalive|keepalive_disable|keepalive_requests|keepalive_timeout|kqueue_changes|kqueue_events|large_client_header_buffers|limit_conn|limit_conn_log_level|limit_conn_zone|limit_except|limit_rate|limit_rate_after|limit_req|limit_req_log_level|limit_req_zone|limit_zone|lingering_close|lingering_time|lingering_timeout|listen|location|lock_file|log_format|log_format_combined|log_not_found|log_subrequest|map|map_hash_bucket_size|map_hash_max_size|master_process|max_ranges|memcached_buffer_size|memcached_connect_timeout|memcached_next_upstream|memcached_pass|memcached_read_timeout|memcached_send_timeout|merge_slashes|min_delete_depth|modern_browser|modern_browser_value|mp4|mp4_buffer_size|mp4_max_buffer_size|msie_padding|msie_refresh|multi_accept|open_file_cache|open_file_cache_errors|open_file_cache_min_uses|open_file_cache_valid|open_log_file_cache|optimize_server_names|override_charset|pcre_jit|perl|perl_modules|perl_require|perl_set|pid|pop3_auth|pop3_capabilities|port_in_redirect|post_action|postpone_output|protocol|proxy|proxy_buffer|proxy_buffer_size|proxy_buffering|proxy_buffers|proxy_busy_buffers_size|proxy_cache|proxy_cache_bypass|proxy_cache_key|proxy_cache_lock|proxy_cache_lock_timeout|proxy_cache_methods|proxy_cache_min_uses|proxy_cache_path|proxy_cache_use_stale|proxy_cache_valid|proxy_connect_timeout|proxy_cookie_domain|proxy_cookie_path|proxy_headers_hash_bucket_size|proxy_headers_hash_max_size|proxy_hide_header|proxy_http_version|proxy_ignore_client_abort|proxy_ignore_headers|proxy_intercept_errors|proxy_max_temp_file_size|proxy_method|proxy_next_upstream|proxy_no_cache|proxy_pass|proxy_pass_error_message|proxy_pass_header|proxy_pass_request_body|proxy_pass_request_headers|proxy_read_timeout|proxy_redirect|proxy_redirect_errors|proxy_send_lowat|proxy_send_timeout|proxy_set_body|proxy_set_header|proxy_ssl_session_reuse|proxy_store|proxy_store_access|proxy_temp_file_write_size|proxy_temp_path|proxy_timeout|proxy_upstream_fail_timeout|proxy_upstream_max_fails|random_index|read_ahead|real_ip_header|recursive_error_pages|request_pool_size|reset_timedout_connection|resolver|resolver_timeout|return|rewrite|root|rtsig_overflow_events|rtsig_overflow_test|rtsig_overflow_threshold|rtsig_signo|satisfy|satisfy_any|secure_link_secret|send_lowat|send_timeout|sendfile|sendfile_max_chunk|server|server_name|server_name_in_redirect|server_names_hash_bucket_size|server_names_hash_max_size|server_tokens|set|set_real_ip_from|smtp_auth|smtp_capabilities|so_keepalive|source_charset|split_clients|ssi|ssi_silent_errors|ssi_types|ssi_value_length|ssl|ssl_certificate|ssl_certificate_key|ssl_ciphers|ssl_client_certificate|ssl_crl|ssl_dhparam|ssl_engine|ssl_prefer_server_ciphers|ssl_protocols|ssl_session_cache|ssl_session_timeout|ssl_verify_client|ssl_verify_depth|starttls|stub_status|sub_filter|sub_filter_once|sub_filter_types|tcp_nodelay|tcp_nopush|timeout|timer_resolution|try_files|types|types_hash_bucket_size|types_hash_max_size|underscores_in_headers|uninitialized_variable_warn|upstream|use|user|userid|userid_domain|userid_expires|userid_name|userid_p3p|userid_path|userid_service|valid_referers|variables_hash_bucket_size|variables_hash_max_size|worker_connections|worker_cpu_affinity|worker_priority|worker_processes|worker_rlimit_core|worker_rlimit_nofile|worker_rlimit_sigpending|working_directory|xclient|xml_entities|xslt_entities|xslt_stylesheet|xslt_types)\b/i
})

Prism.languages.insertBefore('nginx', 'keyword', {
  variable: /\$[a-z_]+/i
})
Prism.languages.yaml = {
  scalar: {
    pattern: /([\-:]\s*(![^\s]+)?[ \t]*[|>])[ \t]*(?:((?:\r?\n|\r)[ \t]+)[^\r\n]+(?:\3[^\r\n]+)*)/,
    lookbehind: true,
    alias: 'string'
  },
  comment: /#.*/,
  key: {
    pattern: /(\s*(?:^|[:\-,[{\r\n?])[ \t]*(![^\s]+)?[ \t]*)[^\r\n{[\]},#\s]+?(?=\s*:\s)/,
    lookbehind: true,
    alias: 'atrule'
  },
  directive: {
    pattern: /(^[ \t]*)%.+/m,
    lookbehind: true,
    alias: 'important'
  },
  datetime: {
    pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)(\d{4}-\d\d?-\d\d?([tT]|[ \t]+)\d\d?:\d{2}:\d{2}(\.\d*)?[ \t]*(Z|[-+]\d\d?(:\d{2})?)?|\d{4}-\d{2}-\d{2}|\d\d?:\d{2}(:\d{2}(\.\d*)?)?)(?=[ \t]*($|,|]|}))/m,
    lookbehind: true,
    alias: 'number'
  },
  boolean: {
    pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)(true|false)[ \t]*(?=$|,|]|})/im,
    lookbehind: true,
    alias: 'important'
  },
  null: {
    pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)(null|~)[ \t]*(?=$|,|]|})/im,
    lookbehind: true,
    alias: 'important'
  },
  string: {
    pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')(?=[ \t]*($|,|]|}))/m,
    lookbehind: true,
    greedy: true
  },
  number: {
    pattern: /([:\-,[{]\s*(![^\s]+)?[ \t]*)[+\-]?(0x[\da-f]+|0o[0-7]+|(\d+\.?\d*|\.?\d+)(e[\+\-]?\d+)?|\.inf|\.nan)[ \t]*(?=$|,|]|})/im,
    lookbehind: true
  },
  tag: /![^\s]+/,
  important: /[&*][\w]+/,
  punctuation: /---|[:[\]{}\-,|>?]|\.\.\./
}
Prism.languages.other = {}

window.Prism = Prism
export default Prism
