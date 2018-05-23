import CodeMirror from './codemirror'
import './theme-dark.scss'

CodeMirror.defineMode(
  'htmlmixed',
  function(config) {
    var htmlMode = CodeMirror.getMode(config, {
      name: 'xml',
      htmlMode: true
    })
    var jsMode = CodeMirror.getMode(config, 'javascript')
    var cssMode = CodeMirror.getMode(config, 'css')

    function html(stream, state) {
      var style = htmlMode.token(stream, state.htmlState)
      if (
        style == 'tag' &&
        stream.current() == '>' &&
        state.htmlState.context
      ) {
        if (/^script$/i.test(state.htmlState.context.tagName)) {
          state.token = javascript
          state.localState = jsMode.startState(
            htmlMode.indent(state.htmlState, '')
          )
        } else if (/^style$/i.test(state.htmlState.context.tagName)) {
          state.token = css
          state.localState = cssMode.startState(
            htmlMode.indent(state.htmlState, '')
          )
        }
      }
      return style
    }

    function maybeBackup(stream, pat, style) {
      var cur = stream.current()
      var close = cur.search(pat),
        m
      if (close > -1) stream.backUp(cur.length - close)
      else if ((m = cur.match(/<\/?$/))) {
        stream.backUp(cur.length)
        if (!stream.match(pat, false)) stream.match(cur[0])
      }
      return style
    }

    function javascript(stream, state) {
      if (stream.match(/^<\/\s*script\s*>/i, false)) {
        state.token = html
        state.localState = null
        return html(stream, state)
      }
      return maybeBackup(
        stream,
        /<\/\s*script\s*>/,
        jsMode.token(stream, state.localState)
      )
    }

    function css(stream, state) {
      if (stream.match(/^<\/\s*style\s*>/i, false)) {
        state.token = html
        state.localState = null
        return html(stream, state)
      }
      return maybeBackup(
        stream,
        /<\/\s*style\s*>/,
        cssMode.token(stream, state.localState)
      )
    }
    return {
      startState: function() {
        var state = htmlMode.startState()
        return {
          token: html,
          localState: null,
          mode: 'html',
          htmlState: state
        }
      },
      copyState: function(state) {
        if (state.localState)
          var local = CodeMirror.copyState(
            state.token == css ? cssMode : jsMode,
            state.localState
          )
        return {
          token: state.token,
          localState: local,
          mode: state.mode,
          htmlState: CodeMirror.copyState(htmlMode, state.htmlState)
        }
      },
      token: function(stream, state) {
        return state.token(stream, state)
      },
      indent: function(state, textAfter) {
        if (state.token == html || /^\s*<\//.test(textAfter))
          return htmlMode.indent(state.htmlState, textAfter)
        else if (state.token == javascript)
          return jsMode.indent(state.localState, textAfter)
        else return cssMode.indent(state.localState, textAfter)
      },
      electricChars: '/{}:',
      innerMode: function(state) {
        var mode =
          state.token == html
            ? htmlMode
            : state.token == javascript ? jsMode : cssMode
        return {
          state: state.localState || state.htmlState,
          mode: mode
        }
      }
    }
  },
  'xml',
  'javascript',
  'css'
)
CodeMirror.defineMIME('text/html', 'htmlmixed')

CodeMirror.defineMode('css', function(config) {
  var indentUnit = config.indentUnit,
    type
  var atMediaTypes = keySet([
    'all',
    'aural',
    'braille',
    'handheld',
    'print',
    'projection',
    'screen',
    'tty',
    'tv',
    'embossed'
  ])
  var atMediaFeatures = keySet([
    'width',
    'min-width',
    'max-width',
    'height',
    'min-height',
    'max-height',
    'device-width',
    'min-device-width',
    'max-device-width',
    'device-height',
    'min-device-height',
    'max-device-height',
    'aspect-ratio',
    'min-aspect-ratio',
    'max-aspect-ratio',
    'device-aspect-ratio',
    'min-device-aspect-ratio',
    'max-device-aspect-ratio',
    'color',
    'min-color',
    'max-color',
    'color-index',
    'min-color-index',
    'max-color-index',
    'monochrome',
    'min-monochrome',
    'max-monochrome',
    'resolution',
    'min-resolution',
    'max-resolution',
    'scan',
    'grid'
  ])
  var propertyKeywords = keySet([
    'align-content',
    'align-items',
    'align-self',
    'alignment-adjust',
    'alignment-baseline',
    'anchor-point',
    'animation',
    'animation-delay',
    'animation-direction',
    'animation-duration',
    'animation-iteration-count',
    'animation-name',
    'animation-play-state',
    'animation-timing-function',
    'appearance',
    'azimuth',
    'backface-visibility',
    'background',
    'background-attachment',
    'background-clip',
    'background-color',
    'background-image',
    'background-origin',
    'background-position',
    'background-repeat',
    'background-size',
    'baseline-shift',
    'binding',
    'bleed',
    'bookmark-label',
    'bookmark-level',
    'bookmark-state',
    'bookmark-target',
    'border',
    'border-bottom',
    'border-bottom-color',
    'border-bottom-left-radius',
    'border-bottom-right-radius',
    'border-bottom-style',
    'border-bottom-width',
    'border-collapse',
    'border-color',
    'border-image',
    'border-image-outset',
    'border-image-repeat',
    'border-image-slice',
    'border-image-source',
    'border-image-width',
    'border-left',
    'border-left-color',
    'border-left-style',
    'border-left-width',
    'border-radius',
    'border-right',
    'border-right-color',
    'border-right-style',
    'border-right-width',
    'border-spacing',
    'border-style',
    'border-top',
    'border-top-color',
    'border-top-left-radius',
    'border-top-right-radius',
    'border-top-style',
    'border-top-width',
    'border-width',
    'bottom',
    'box-decoration-break',
    'box-shadow',
    'box-sizing',
    'break-after',
    'break-before',
    'break-inside',
    'caption-side',
    'clear',
    'clip',
    'color',
    'color-profile',
    'column-count',
    'column-fill',
    'column-gap',
    'column-rule',
    'column-rule-color',
    'column-rule-style',
    'column-rule-width',
    'column-span',
    'column-width',
    'columns',
    'content',
    'counter-increment',
    'counter-reset',
    'crop',
    'cue',
    'cue-after',
    'cue-before',
    'cursor',
    'direction',
    'display',
    'dominant-baseline',
    'drop-initial-after-adjust',
    'drop-initial-after-align',
    'drop-initial-before-adjust',
    'drop-initial-before-align',
    'drop-initial-size',
    'drop-initial-value',
    'elevation',
    'empty-cells',
    'fit',
    'fit-position',
    'flex',
    'flex-basis',
    'flex-direction',
    'flex-flow',
    'flex-grow',
    'flex-shrink',
    'flex-wrap',
    'float',
    'float-offset',
    'font',
    'font-feature-settings',
    'font-family',
    'font-kerning',
    'font-language-override',
    'font-size',
    'font-size-adjust',
    'font-stretch',
    'font-style',
    'font-synthesis',
    'font-variant',
    'font-variant-alternates',
    'font-variant-caps',
    'font-variant-east-asian',
    'font-variant-ligatures',
    'font-variant-numeric',
    'font-variant-position',
    'font-weight',
    'grid-cell',
    'grid-column',
    'grid-column-align',
    'grid-column-sizing',
    'grid-column-span',
    'grid-columns',
    'grid-flow',
    'grid-row',
    'grid-row-align',
    'grid-row-sizing',
    'grid-row-span',
    'grid-rows',
    'grid-template',
    'hanging-punctuation',
    'height',
    'hyphens',
    'icon',
    'image-orientation',
    'image-rendering',
    'image-resolution',
    'inline-box-align',
    'justify-content',
    'left',
    'letter-spacing',
    'line-break',
    'line-height',
    'line-stacking',
    'line-stacking-ruby',
    'line-stacking-shift',
    'line-stacking-strategy',
    'list-style',
    'list-style-image',
    'list-style-position',
    'list-style-type',
    'margin',
    'margin-bottom',
    'margin-left',
    'margin-right',
    'margin-top',
    'marker-offset',
    'marks',
    'marquee-direction',
    'marquee-loop',
    'marquee-play-count',
    'marquee-speed',
    'marquee-style',
    'max-height',
    'max-width',
    'min-height',
    'min-width',
    'move-to',
    'nav-down',
    'nav-index',
    'nav-left',
    'nav-right',
    'nav-up',
    'opacity',
    'order',
    'orphans',
    'outline',
    'outline-color',
    'outline-offset',
    'outline-style',
    'outline-width',
    'overflow',
    'overflow-style',
    'overflow-wrap',
    'overflow-x',
    'overflow-y',
    'padding',
    'padding-bottom',
    'padding-left',
    'padding-right',
    'padding-top',
    'page',
    'page-break-after',
    'page-break-before',
    'page-break-inside',
    'page-policy',
    'pause',
    'pause-after',
    'pause-before',
    'perspective',
    'perspective-origin',
    'pitch',
    'pitch-range',
    'play-during',
    'position',
    'presentation-level',
    'punctuation-trim',
    'quotes',
    'rendering-intent',
    'resize',
    'rest',
    'rest-after',
    'rest-before',
    'richness',
    'right',
    'rotation',
    'rotation-point',
    'ruby-align',
    'ruby-overhang',
    'ruby-position',
    'ruby-span',
    'size',
    'speak',
    'speak-as',
    'speak-header',
    'speak-numeral',
    'speak-punctuation',
    'speech-rate',
    'stress',
    'string-set',
    'tab-size',
    'table-layout',
    'target',
    'target-name',
    'target-new',
    'target-position',
    'text-align',
    'text-align-last',
    'text-decoration',
    'text-decoration-color',
    'text-decoration-line',
    'text-decoration-skip',
    'text-decoration-style',
    'text-emphasis',
    'text-emphasis-color',
    'text-emphasis-position',
    'text-emphasis-style',
    'text-height',
    'text-indent',
    'text-justify',
    'text-outline',
    'text-shadow',
    'text-space-collapse',
    'text-transform',
    'text-underline-position',
    'text-wrap',
    'top',
    'transform',
    'transform-origin',
    'transform-style',
    'transition',
    'transition-delay',
    'transition-duration',
    'transition-property',
    'transition-timing-function',
    'unicode-bidi',
    'vertical-align',
    'visibility',
    'voice-balance',
    'voice-duration',
    'voice-family',
    'voice-pitch',
    'voice-range',
    'voice-rate',
    'voice-stress',
    'voice-volume',
    'volume',
    'white-space',
    'widows',
    'width',
    'word-break',
    'word-spacing',
    'word-wrap',
    'z-index'
  ])
  var colorKeywords = keySet([
    'black',
    'silver',
    'gray',
    'white',
    'maroon',
    'red',
    'purple',
    'fuchsia',
    'green',
    'lime',
    'olive',
    'yellow',
    'navy',
    'blue',
    'teal',
    'aqua'
  ])
  var valueKeywords = keySet([
    'above',
    'absolute',
    'activeborder',
    'activecaption',
    'afar',
    'after-white-space',
    'ahead',
    'alias',
    'all',
    'all-scroll',
    'alternate',
    'always',
    'amharic',
    'amharic-abegede',
    'antialiased',
    'appworkspace',
    'arabic-indic',
    'armenian',
    'asterisks',
    'auto',
    'avoid',
    'background',
    'backwards',
    'baseline',
    'below',
    'bidi-override',
    'binary',
    'bengali',
    'blink',
    'block',
    'block-axis',
    'bold',
    'bolder',
    'border',
    'border-box',
    'both',
    'bottom',
    'break-all',
    'break-word',
    'button',
    'button-bevel',
    'buttonface',
    'buttonhighlight',
    'buttonshadow',
    'buttontext',
    'cambodian',
    'capitalize',
    'caps-lock-indicator',
    'caption',
    'captiontext',
    'caret',
    'cell',
    'center',
    'checkbox',
    'circle',
    'cjk-earthly-branch',
    'cjk-heavenly-stem',
    'cjk-ideographic',
    'clear',
    'clip',
    'close-quote',
    'col-resize',
    'collapse',
    'compact',
    'condensed',
    'contain',
    'content',
    'content-box',
    'context-menu',
    'continuous',
    'copy',
    'cover',
    'crop',
    'cross',
    'crosshair',
    'currentcolor',
    'cursive',
    'dashed',
    'decimal',
    'decimal-leading-zero',
    'default',
    'default-button',
    'destination-atop',
    'destination-in',
    'destination-out',
    'destination-over',
    'devanagari',
    'disc',
    'discard',
    'document',
    'dot-dash',
    'dot-dot-dash',
    'dotted',
    'double',
    'down',
    'e-resize',
    'ease',
    'ease-in',
    'ease-in-out',
    'ease-out',
    'element',
    'ellipsis',
    'embed',
    'end',
    'ethiopic',
    'ethiopic-abegede',
    'ethiopic-abegede-am-et',
    'ethiopic-abegede-gez',
    'ethiopic-abegede-ti-er',
    'ethiopic-abegede-ti-et',
    'ethiopic-halehame-aa-er',
    'ethiopic-halehame-aa-et',
    'ethiopic-halehame-am-et',
    'ethiopic-halehame-gez',
    'ethiopic-halehame-om-et',
    'ethiopic-halehame-sid-et',
    'ethiopic-halehame-so-et',
    'ethiopic-halehame-ti-er',
    'ethiopic-halehame-ti-et',
    'ethiopic-halehame-tig',
    'ew-resize',
    'expanded',
    'extra-condensed',
    'extra-expanded',
    'fantasy',
    'fast',
    'fill',
    'fixed',
    'flat',
    'footnotes',
    'forwards',
    'from',
    'geometricPrecision',
    'georgian',
    'graytext',
    'groove',
    'gujarati',
    'gurmukhi',
    'hand',
    'hangul',
    'hangul-consonant',
    'hebrew',
    'help',
    'hidden',
    'hide',
    'higher',
    'highlight',
    'highlighttext',
    'hiragana',
    'hiragana-iroha',
    'horizontal',
    'hsl',
    'hsla',
    'icon',
    'ignore',
    'inactiveborder',
    'inactivecaption',
    'inactivecaptiontext',
    'infinite',
    'infobackground',
    'infotext',
    'inherit',
    'initial',
    'inline',
    'inline-axis',
    'inline-block',
    'inline-table',
    'inset',
    'inside',
    'intrinsic',
    'invert',
    'italic',
    'justify',
    'kannada',
    'katakana',
    'katakana-iroha',
    'khmer',
    'landscape',
    'lao',
    'large',
    'larger',
    'left',
    'level',
    'lighter',
    'line-through',
    'linear',
    'lines',
    'list-item',
    'listbox',
    'listitem',
    'local',
    'logical',
    'loud',
    'lower',
    'lower-alpha',
    'lower-armenian',
    'lower-greek',
    'lower-hexadecimal',
    'lower-latin',
    'lower-norwegian',
    'lower-roman',
    'lowercase',
    'ltr',
    'malayalam',
    'match',
    'media-controls-background',
    'media-current-time-display',
    'media-fullscreen-button',
    'media-mute-button',
    'media-play-button',
    'media-return-to-realtime-button',
    'media-rewind-button',
    'media-seek-back-button',
    'media-seek-forward-button',
    'media-slider',
    'media-sliderthumb',
    'media-time-remaining-display',
    'media-volume-slider',
    'media-volume-slider-container',
    'media-volume-sliderthumb',
    'medium',
    'menu',
    'menulist',
    'menulist-button',
    'menulist-text',
    'menulist-textfield',
    'menutext',
    'message-box',
    'middle',
    'min-intrinsic',
    'mix',
    'mongolian',
    'monospace',
    'move',
    'multiple',
    'myanmar',
    'n-resize',
    'narrower',
    'navy',
    'ne-resize',
    'nesw-resize',
    'no-close-quote',
    'no-drop',
    'no-open-quote',
    'no-repeat',
    'none',
    'normal',
    'not-allowed',
    'nowrap',
    'ns-resize',
    'nw-resize',
    'nwse-resize',
    'oblique',
    'octal',
    'open-quote',
    'optimizeLegibility',
    'optimizeSpeed',
    'oriya',
    'oromo',
    'outset',
    'outside',
    'overlay',
    'overline',
    'padding',
    'padding-box',
    'painted',
    'paused',
    'persian',
    'plus-darker',
    'plus-lighter',
    'pointer',
    'portrait',
    'pre',
    'pre-line',
    'pre-wrap',
    'preserve-3d',
    'progress',
    'push-button',
    'radio',
    'read-only',
    'read-write',
    'read-write-plaintext-only',
    'relative',
    'repeat',
    'repeat-x',
    'repeat-y',
    'reset',
    'reverse',
    'rgb',
    'rgba',
    'ridge',
    'right',
    'round',
    'row-resize',
    'rtl',
    'run-in',
    'running',
    's-resize',
    'sans-serif',
    'scroll',
    'scrollbar',
    'se-resize',
    'searchfield',
    'searchfield-cancel-button',
    'searchfield-decoration',
    'searchfield-results-button',
    'searchfield-results-decoration',
    'semi-condensed',
    'semi-expanded',
    'separate',
    'serif',
    'show',
    'sidama',
    'single',
    'skip-white-space',
    'slide',
    'slider-horizontal',
    'slider-vertical',
    'sliderthumb-horizontal',
    'sliderthumb-vertical',
    'slow',
    'small',
    'small-caps',
    'small-caption',
    'smaller',
    'solid',
    'somali',
    'source-atop',
    'source-in',
    'source-out',
    'source-over',
    'space',
    'square',
    'square-button',
    'start',
    'static',
    'status-bar',
    'stretch',
    'stroke',
    'sub',
    'subpixel-antialiased',
    'super',
    'sw-resize',
    'table',
    'table-caption',
    'table-cell',
    'table-column',
    'table-column-group',
    'table-footer-group',
    'table-header-group',
    'table-row',
    'table-row-group',
    'telugu',
    'text',
    'text-bottom',
    'text-top',
    'textarea',
    'textfield',
    'thai',
    'thick',
    'thin',
    'threeddarkshadow',
    'threedface',
    'threedhighlight',
    'threedlightshadow',
    'threedshadow',
    'tibetan',
    'tigre',
    'tigrinya-er',
    'tigrinya-er-abegede',
    'tigrinya-et',
    'tigrinya-et-abegede',
    'to',
    'top',
    'transparent',
    'ultra-condensed',
    'ultra-expanded',
    'underline',
    'up',
    'upper-alpha',
    'upper-armenian',
    'upper-greek',
    'upper-hexadecimal',
    'upper-latin',
    'upper-norwegian',
    'upper-roman',
    'uppercase',
    'urdu',
    'url',
    'vertical',
    'vertical-text',
    'visible',
    'visibleFill',
    'visiblePainted',
    'visibleStroke',
    'visual',
    'w-resize',
    'wait',
    'wave',
    'white',
    'wider',
    'window',
    'windowframe',
    'windowtext',
    'x-large',
    'x-small',
    'xor',
    'xx-large',
    'xx-small',
    'yellow'
  ])

  function keySet(array) {
    var keys = {}
    for (var i = 0; i < array.length; ++i) keys[array[i]] = true
    return keys
  }

  function ret(style, tp) {
    type = tp
    return style
  }

  function tokenBase(stream, state) {
    var ch = stream.next()
    if (ch == '@') {
      stream.eatWhile(/[\w\\\-]/)
      return ret('def', stream.current())
    } else if (ch == '/' && stream.eat('*')) {
      state.tokenize = tokenCComment
      return tokenCComment(stream, state)
    } else if (ch == '<' && stream.eat('!')) {
      state.tokenize = tokenSGMLComment
      return tokenSGMLComment(stream, state)
    } else if (ch == '=') ret(null, 'compare')
    else if ((ch == '~' || ch == '|') && stream.eat('='))
      return ret(null, 'compare')
    else if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch)
      return state.tokenize(stream, state)
    } else if (ch == '#') {
      stream.eatWhile(/[\w\\\-]/)
      return ret('atom', 'hash')
    } else if (ch == '!') {
      stream.match(/^\s*\w*/)
      return ret('keyword', 'important')
    } else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/)
      return ret('number', 'unit')
    } else if (ch === '-') {
      if (/\d/.test(stream.peek())) {
        stream.eatWhile(/[\w.%]/)
        return ret('number', 'unit')
      } else if (stream.match(/^[^-]+-/)) {
        return ret('meta', type)
      }
    } else if (/[,+>*\/]/.test(ch)) {
      return ret(null, 'select-op')
    } else if (ch == '.' && stream.match(/^-?[_a-z][_a-z0-9-]*/i)) {
      return ret('qualifier', type)
    } else if (ch == ':') {
      return ret('operator', ch)
    } else if (/[;{}\[\]\(\)]/.test(ch)) {
      return ret(null, ch)
    } else {
      stream.eatWhile(/[\w\\\-]/)
      return ret('property', 'variable')
    }
  }

  function tokenCComment(stream, state) {
    var maybeEnd = false,
      ch
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == '/') {
        state.tokenize = tokenBase
        break
      }
      maybeEnd = ch == '*'
    }
    return ret('comment', 'comment')
  }

  function tokenSGMLComment(stream, state) {
    var dashes = 0,
      ch
    while ((ch = stream.next()) != null) {
      if (dashes >= 2 && ch == '>') {
        state.tokenize = tokenBase
        break
      }
      dashes = ch == '-' ? dashes + 1 : 0
    }
    return ret('comment', 'comment')
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false,
        ch
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) break
        escaped = !escaped && ch == '\\'
      }
      if (!escaped) state.tokenize = tokenBase
      return ret('string', 'string')
    }
  }
  return {
    startState: function(base) {
      return {
        tokenize: tokenBase,
        baseIndent: base || 0,
        stack: []
      }
    },
    token: function(stream, state) {
      if (stream.eatSpace()) return null
      var style = state.tokenize(stream, state)
      var context = state.stack[state.stack.length - 1]
      if (style == 'property') {
        if (context == 'propertyValue') {
          if (valueKeywords[stream.current()]) {
            style = 'string-2'
          } else if (colorKeywords[stream.current()]) {
            style = 'keyword'
          } else {
            style = 'variable-2'
          }
        } else if (context == 'rule') {
          if (!propertyKeywords[stream.current()]) {
            style += ' error'
          }
        } else if (!context || context == '@media{') {
          style = 'tag'
        } else if (context == '@media') {
          if (atMediaTypes[stream.current()]) {
            style = 'attribute'
          } else if (/^(only|not)$/i.test(stream.current())) {
            style = 'keyword'
          } else if (stream.current().toLowerCase() == 'and') {
            style = 'error'
          } else if (atMediaFeatures[stream.current()]) {
            style = 'error'
          } else {
            style = 'attribute error'
          }
        } else if (context == '@mediaType') {
          if (atMediaTypes[stream.current()]) {
            style = 'attribute'
          } else if (stream.current().toLowerCase() == 'and') {
            style = 'operator'
          } else if (/^(only|not)$/i.test(stream.current())) {
            style = 'error'
          } else if (atMediaFeatures[stream.current()]) {
            style = 'error'
          } else {
            style = 'error'
          }
        } else if (context == '@mediaType(') {
          if (propertyKeywords[stream.current()]) {
          } else if (atMediaTypes[stream.current()]) {
            style = 'error'
          } else if (stream.current().toLowerCase() == 'and') {
            style = 'operator'
          } else if (/^(only|not)$/i.test(stream.current())) {
            style = 'error'
          } else {
            style += ' error'
          }
        } else {
          style = 'error'
        }
      } else if (style == 'atom') {
        if (!context || context == '@media{') {
          style = 'builtin'
        } else if (context == 'propertyValue') {
          if (!/^#([0-9a-fA-f]{3}|[0-9a-fA-f]{6})$/.test(stream.current())) {
            style += ' error'
          }
        } else {
          style = 'error'
        }
      } else if (context == '@media' && type == '{') {
        style = 'error'
      }
      if (type == '{') {
        if (context == '@media' || context == '@mediaType') {
          state.stack.pop()
          state.stack[state.stack.length - 1] = '@media{'
        } else state.stack.push('rule')
      } else if (type == '}') {
        state.stack.pop()
        if (context == 'propertyValue') state.stack.pop()
      } else if (type == '@media') state.stack.push('@media')
      else if (context == '@media' && /\b(keyword|attribute)\b/.test(style))
        state.stack.push('@mediaType')
      else if (context == '@mediaType' && stream.current() == ',')
        state.stack.pop()
      else if (context == '@mediaType' && type == '(')
        state.stack.push('@mediaType(')
      else if (context == '@mediaType(' && type == ')') state.stack.pop()
      else if (context == 'rule' && type == ':')
        state.stack.push('propertyValue')
      else if (context == 'propertyValue' && type == ';') state.stack.pop()
      return style
    },
    indent: function(state, textAfter) {
      var n = state.stack.length
      if (/^\}/.test(textAfter))
        n -= state.stack[state.stack.length - 1] == 'propertyValue' ? 2 : 1
      return state.baseIndent + n * indentUnit
    },
    electricChars: '}'
  }
})
CodeMirror.defineMIME('text/css', 'css')

CodeMirror.defineMode('javascript', function(config, parserConfig) {
  var indentUnit = config.indentUnit
  var jsonMode = parserConfig.json
  var isTS = parserConfig.typescript
  var keywords = (function() {
    function kw(type) {
      return {
        type: type,
        style: 'keyword'
      }
    }
    var A = kw('keyword a'),
      B = kw('keyword b'),
      C = kw('keyword c')
    var operator = kw('operator'),
      atom = {
        type: 'atom',
        style: 'atom'
      }
    var jsKeywords = {
      if: A,
      while: A,
      with: A,
      else: B,
      async: B,
      await: B,
      '*': B,
      yield: B,
      do: B,
      try: B,
      finally: B,
      return: C,
      break: C,
      continue: C,
      new: C,
      delete: C,
      throw: C,
      var: kw('var'),
      const: kw('var'),
      let: kw('var'),
      function: kw('function'),
      require: kw('function'),
      interface: kw('interface'),
      class: kw('class'),
      extends: kw('extends'),
      constructor: kw('constructor'),
      public: kw('public'),
      private: kw('private'),
      protected: kw('protected'),
      static: kw('static'),
      super: kw('super'),
      catch: kw('catch'),
      for: kw('for'),
      switch: kw('switch'),
      case: kw('case'),
      default: kw('default'),
      in: operator,
      typeof: operator,
      instanceof: operator,
      true: atom,
      false: atom,
      null: atom,
      undefined: atom,
      NaN: atom,
      Infinity: atom
    }
    if (isTS) {
      var type = {
        type: 'variable',
        style: 'variable-3'
      }
      var tsKeywords = {
        interface: kw('interface'),
        class: kw('class'),
        extends: kw('extends'),
        constructor: kw('constructor'),
        public: kw('public'),
        private: kw('private'),
        protected: kw('protected'),
        static: kw('static'),
        super: kw('super'),
        string: type,
        number: type,
        bool: type,
        any: type
      }
      for (var attr in tsKeywords) {
        jsKeywords[attr] = tsKeywords[attr]
      }
    }
    return jsKeywords
  })()
  var isOperatorChar = /[+\-*&%=<>!?|]/

  function chain(stream, state, f) {
    state.tokenize = f
    return f(stream, state)
  }

  function nextUntilUnescaped(stream, end) {
    var escaped = false,
      next
    while ((next = stream.next()) != null) {
      if (next == end && !escaped) return false
      escaped = !escaped && next == '\\'
    }
    return escaped
  }
  var type, content

  function ret(tp, style, cont) {
    type = tp
    content = cont
    return style
  }

  function jsTokenBase(stream, state) {
    var ch = stream.next()
    if (ch == '"' || ch == "'") return chain(stream, state, jsTokenString(ch))
    else if (/[\[\]{}\(\),;\:\.]/.test(ch)) return ret(ch)
    else if (ch == '0' && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i)
      return ret('number', 'number')
    } else if (/\d/.test(ch) || (ch == '-' && stream.eat(/\d/))) {
      stream.match(/^\d*(?:\.\d*)?(?:[eE][+\-]?\d+)?/)
      return ret('number', 'number')
    } else if (ch == '/') {
      if (stream.eat('*')) {
        return chain(stream, state, jsTokenComment)
      } else if (stream.eat('/')) {
        stream.skipToEnd()
        return ret('comment', 'comment')
      } else if (
        state.lastType == 'operator' ||
        state.lastType == 'keyword c' ||
        /^[\[{}\(,;:]$/.test(state.lastType)
      ) {
        nextUntilUnescaped(stream, '/')
        stream.eatWhile(/[gimy]/)
        return ret('regexp', 'string-2')
      } else {
        stream.eatWhile(isOperatorChar)
        return ret('operator', null, stream.current())
      }
    } else if (ch == '#') {
      stream.skipToEnd()
      return ret('error', 'error')
    } else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar)
      return ret('operator', null, stream.current())
    } else {
      stream.eatWhile(/[\w\$_]/)
      var word = stream.current(),
        known = keywords.propertyIsEnumerable(word) && keywords[word]
      return known && state.lastType != '.'
        ? ret(known.type, known.style, word)
        : ret('variable', 'variable', word)
    }
  }

  function jsTokenString(quote) {
    return function(stream, state) {
      if (!nextUntilUnescaped(stream, quote)) state.tokenize = jsTokenBase
      return ret('string', 'string')
    }
  }

  function jsTokenComment(stream, state) {
    var maybeEnd = false,
      ch
    while ((ch = stream.next())) {
      if (ch == '/' && maybeEnd) {
        state.tokenize = jsTokenBase
        break
      }
      maybeEnd = ch == '*'
    }
    return ret('comment', 'comment')
  }
  var atomicTypes = {
    atom: true,
    number: true,
    variable: true,
    string: true,
    regexp: true
  }

  function JSLexical(indented, column, type, align, prev, info) {
    this.indented = indented
    this.column = column
    this.type = type
    this.prev = prev
    this.info = info
    if (align != null) this.align = align
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true
  }

  function parseJS(state, style, type, content, stream) {
    var cc = state.cc
    cx.state = state
    cx.stream = stream
    ;(cx.marked = null), (cx.cc = cc)
    if (!state.lexical.hasOwnProperty('align')) state.lexical.align = true
    while (true) {
      var combinator = cc.length ? cc.pop() : jsonMode ? expression : statement
      if (combinator(type, content)) {
        while (cc.length && cc[cc.length - 1].lex) cc.pop()()
        if (cx.marked) return cx.marked
        if (type == 'variable' && inScope(state, content)) return 'variable-2'
        return style
      }
    }
  }
  var cx = {
    state: null,
    column: null,
    marked: null,
    cc: null
  }

  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i])
  }

  function cont() {
    pass.apply(null, arguments)
    return true
  }

  function register(varname) {
    var state = cx.state
    if (state.context) {
      cx.marked = 'def'
      for (var v = state.localVars; v; v = v.next) if (v.name == varname) return
      state.localVars = {
        name: varname,
        next: state.localVars
      }
    }
  }
  var defaultVars = {
    name: 'this',
    next: {
      name: 'arguments'
    }
  }

  function pushcontext() {
    cx.state.context = {
      prev: cx.state.context,
      vars: cx.state.localVars
    }
    cx.state.localVars = defaultVars
  }

  function popcontext() {
    cx.state.localVars = cx.state.context.vars
    cx.state.context = cx.state.context.prev
  }

  function pushlex(type, info) {
    var result = function() {
      var state = cx.state
      state.lexical = new JSLexical(
        state.indented,
        cx.stream.column(),
        type,
        null,
        state.lexical,
        info
      )
    }
    result.lex = true
    return result
  }

  function poplex() {
    var state = cx.state
    if (state.lexical.prev) {
      if (state.lexical.type == ')') state.indented = state.lexical.indented
      state.lexical = state.lexical.prev
    }
  }
  poplex.lex = true

  function expect(wanted) {
    return function expecting(type) {
      if (type == wanted) return cont()
      else if (wanted == ';') return pass()
      else return cont(arguments.callee)
    }
  }

  function statement(type) {
    if (type == 'var')
      return cont(pushlex('vardef'), vardef1, expect(';'), poplex)
    if (type == 'keyword a')
      return cont(pushlex('form'), expression, statement, poplex)
    if (type == 'keyword b') return cont(pushlex('form'), statement, poplex)
    if (type == '{') return cont(pushlex('}'), block, poplex)
    if (type == ';') return cont()
    if (type == 'function') return cont(functiondef)
    if (type == 'for')
      return cont(
        pushlex('form'),
        expect('('),
        pushlex(')'),
        forspec1,
        expect(')'),
        poplex,
        statement,
        poplex
      )
    if (type == 'variable') return cont(pushlex('stat'), maybelabel)
    if (type == 'switch')
      return cont(
        pushlex('form'),
        expression,
        pushlex('}', 'switch'),
        expect('{'),
        block,
        poplex,
        poplex
      )
    if (type == 'case') return cont(expression, expect(':'))
    if (type == 'default') return cont(expect(':'))
    if (type == 'catch')
      return cont(
        pushlex('form'),
        pushcontext,
        expect('('),
        funarg,
        expect(')'),
        statement,
        poplex,
        popcontext
      )
    return pass(pushlex('stat'), expression, expect(';'), poplex)
  }

  function expression(type) {
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeoperator)
    if (type == 'function') return cont(functiondef)
    if (type == 'keyword c') return cont(maybeexpression)
    if (type == '(')
      return cont(
        pushlex(')'),
        maybeexpression,
        expect(')'),
        poplex,
        maybeoperator
      )
    if (type == 'operator') return cont(expression)
    if (type == '[')
      return cont(
        pushlex(']'),
        commasep(expression, ']'),
        poplex,
        maybeoperator
      )
    if (type == '{')
      return cont(pushlex('}'), commasep(objprop, '}'), poplex, maybeoperator)
    return cont()
  }

  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass()
    return pass(expression)
  }

  function maybeoperator(type, value) {
    if (type == 'operator' && /\+\+|--/.test(value)) return cont(maybeoperator)
    if (type == 'operator' && value == '?')
      return cont(expression, expect(':'), expression)
    if (type == ';') return
    if (type == '(')
      return cont(
        pushlex(')'),
        commasep(expression, ')'),
        poplex,
        maybeoperator
      )
    if (type == '.') return cont(property, maybeoperator)
    if (type == '[')
      return cont(pushlex(']'), expression, expect(']'), poplex, maybeoperator)
  }

  function maybelabel(type) {
    if (type == ':') return cont(poplex, statement)
    return pass(maybeoperator, expect(';'), poplex)
  }

  function property(type) {
    if (type == 'variable') {
      cx.marked = 'property'
      return cont()
    }
  }

  function objprop(type) {
    if (type == 'variable') cx.marked = 'property'
    if (atomicTypes.hasOwnProperty(type)) return cont(expect(':'), expression)
  }

  function commasep(what, end) {
    function proceed(type) {
      if (type == ',') return cont(what, proceed)
      if (type == end) return cont()
      return cont(expect(end))
    }
    return function commaSeparated(type) {
      if (type == end) return cont()
      else return pass(what, proceed)
    }
  }

  function block(type) {
    if (type == '}') return cont()
    return pass(statement, block)
  }

  function maybetype(type) {
    if (type == ':') return cont(typedef)
    return pass()
  }

  function typedef(type) {
    if (type == 'variable') {
      cx.marked = 'variable-3'
      return cont()
    }
    return pass()
  }

  function vardef1(type, value) {
    if (type == 'variable') {
      register(value)
      return isTS ? cont(maybetype, vardef2) : cont(vardef2)
    }
    return pass()
  }

  function vardef2(type, value) {
    if (value == '=') return cont(expression, vardef2)
    if (type == ',') return cont(vardef1)
  }

  function forspec1(type) {
    if (type == 'var') return cont(vardef1, expect(';'), forspec2)
    if (type == ';') return cont(forspec2)
    if (type == 'variable') return cont(formaybein)
    return cont(forspec2)
  }

  function formaybein(type, value) {
    if (value == 'in') return cont(expression)
    return cont(maybeoperator, forspec2)
  }

  function forspec2(type, value) {
    if (type == ';') return cont(forspec3)
    if (value == 'in') return cont(expression)
    return cont(expression, expect(';'), forspec3)
  }

  function forspec3(type) {
    if (type != ')') cont(expression)
  }

  function functiondef(type, value) {
    if (type == 'variable') {
      register(value)
      return cont(functiondef)
    }
    if (type == '(')
      return cont(
        pushlex(')'),
        pushcontext,
        commasep(funarg, ')'),
        poplex,
        statement,
        popcontext
      )
  }

  function funarg(type, value) {
    if (type == 'variable') {
      register(value)
      return isTS ? cont(maybetype) : cont()
    }
  }
  return {
    startState: function(basecolumn) {
      return {
        tokenize: jsTokenBase,
        lastType: null,
        cc: [],
        lexical: new JSLexical(
          (basecolumn || 0) - indentUnit,
          0,
          'block',
          false
        ),
        localVars: parserConfig.localVars,
        context: parserConfig.localVars && {
          vars: parserConfig.localVars
        },
        indented: 0
      }
    },
    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty('align')) state.lexical.align = false
        state.indented = stream.indentation()
      }
      if (stream.eatSpace()) return null
      var style = state.tokenize(stream, state)
      if (type == 'comment') return style
      state.lastType = type
      return parseJS(state, style, type, content, stream)
    },
    indent: function(state, textAfter) {
      if (state.tokenize == jsTokenComment) return CodeMirror.Pass
      if (state.tokenize != jsTokenBase) return 0
      var firstChar = textAfter && textAfter.charAt(0),
        lexical = state.lexical
      if (lexical.type == 'stat' && firstChar == '}') lexical = lexical.prev
      var type = lexical.type,
        closing = firstChar == type
      if (type == 'vardef')
        return (
          lexical.indented +
          (state.lastType == 'operator' || state.lastType == ',' ? 4 : 0)
        )
      else if (type == 'form' && firstChar == '{') return lexical.indented
      else if (type == 'form') return lexical.indented + indentUnit
      else if (type == 'stat')
        return (
          lexical.indented +
          (state.lastType == 'operator' || state.lastType == ','
            ? indentUnit
            : 0)
        )
      else if (lexical.info == 'switch' && !closing)
        return (
          lexical.indented +
          (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit)
        )
      else if (lexical.align) return lexical.column + (closing ? 0 : 1)
      else return lexical.indented + (closing ? 0 : indentUnit)
    },
    electricChars: ':{}',
    jsonMode: jsonMode
  }
})
CodeMirror.defineMIME('text/javascript', 'javascript')
CodeMirror.defineMIME('application/json', {
  name: 'javascript',
  json: true
})
CodeMirror.defineMIME('text/typescript', {
  name: 'javascript',
  typescript: true
})
CodeMirror.defineMIME('application/typescript', {
  name: 'javascript',
  typescript: true
})

CodeMirror.defineMode('xml', function(config, parserConfig) {
  var indentUnit = config.indentUnit
  var Kludges = parserConfig.htmlMode
    ? {
        autoSelfClosers: {
          area: true,
          base: true,
          br: true,
          col: true,
          command: true,
          embed: true,
          frame: true,
          hr: true,
          img: true,
          input: true,
          keygen: true,
          link: true,
          meta: true,
          param: true,
          source: true,
          track: true,
          wbr: true
        },
        implicitlyClosed: {
          dd: true,
          li: true,
          optgroup: true,
          option: true,
          p: true,
          rp: true,
          rt: true,
          tbody: true,
          td: true,
          tfoot: true,
          th: true,
          tr: true
        },
        contextGrabbers: {
          dd: {
            dd: true,
            dt: true
          },
          dt: {
            dd: true,
            dt: true
          },
          li: {
            li: true
          },
          option: {
            option: true,
            optgroup: true
          },
          optgroup: {
            optgroup: true
          },
          p: {
            address: true,
            article: true,
            aside: true,
            blockquote: true,
            dir: true,
            div: true,
            dl: true,
            fieldset: true,
            footer: true,
            form: true,
            h1: true,
            h2: true,
            h3: true,
            h4: true,
            h5: true,
            h6: true,
            header: true,
            hgroup: true,
            hr: true,
            menu: true,
            nav: true,
            ol: true,
            p: true,
            pre: true,
            section: true,
            table: true,
            ul: true
          },
          rp: {
            rp: true,
            rt: true
          },
          rt: {
            rp: true,
            rt: true
          },
          tbody: {
            tbody: true,
            tfoot: true
          },
          td: {
            td: true,
            th: true
          },
          tfoot: {
            tbody: true
          },
          th: {
            td: true,
            th: true
          },
          thead: {
            tbody: true,
            tfoot: true
          },
          tr: {
            tr: true
          }
        },
        doNotIndent: {
          pre: true
        },
        allowUnquoted: true,
        allowMissing: true
      }
    : {
        autoSelfClosers: {},
        implicitlyClosed: {},
        contextGrabbers: {},
        doNotIndent: {},
        allowUnquoted: false,
        allowMissing: false
      }
  var alignCDATA = parserConfig.alignCDATA
  var tagName, type

  function inText(stream, state) {
    function chain(parser) {
      state.tokenize = parser
      return parser(stream, state)
    }
    var ch = stream.next()
    if (ch == '<') {
      if (stream.eat('!')) {
        if (stream.eat('[')) {
          if (stream.match('CDATA[')) return chain(inBlock('atom', ']]>'))
          else return null
        } else if (stream.match('--')) return chain(inBlock('comment', '-->'))
        else if (stream.match('DOCTYPE', true, true)) {
          stream.eatWhile(/[\w\._\-]/)
          return chain(doctype(1))
        } else return null
      } else if (stream.eat('?')) {
        stream.eatWhile(/[\w\._\-]/)
        state.tokenize = inBlock('meta', '?>')
        return 'meta'
      } else {
        var isClose = stream.eat('/')
        tagName = ''
        var c
        while ((c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/))) tagName += c
        if (!tagName) return 'error'
        type = isClose ? 'closeTag' : 'openTag'
        state.tokenize = inTag
        return 'tag'
      }
    } else if (ch == '&') {
      var ok
      if (stream.eat('#')) {
        if (stream.eat('x')) {
          ok = stream.eatWhile(/[a-fA-F\d]/) && stream.eat(';')
        } else {
          ok = stream.eatWhile(/[\d]/) && stream.eat(';')
        }
      } else {
        ok = stream.eatWhile(/[\w\.\-:]/) && stream.eat(';')
      }
      return ok ? 'atom' : 'error'
    } else {
      stream.eatWhile(/[^&<]/)
      return null
    }
  }

  function inTag(stream, state) {
    var ch = stream.next()
    if (ch == '>' || (ch == '/' && stream.eat('>'))) {
      state.tokenize = inText
      type = ch == '>' ? 'endTag' : 'selfcloseTag'
      return 'tag'
    } else if (ch == '=') {
      type = 'equals'
      return null
    } else if (/[\'\"]/.test(ch)) {
      state.tokenize = inAttribute(ch)
      return state.tokenize(stream, state)
    } else {
      stream.eatWhile(/[^\s\u00a0=<>\"\']/)
      return 'word'
    }
  }

  function inAttribute(quote) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inTag
          break
        }
      }
      return 'string'
    }
  }

  function inBlock(style, terminator) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = inText
          break
        }
        stream.next()
      }
      return style
    }
  }

  function doctype(depth) {
    return function(stream, state) {
      var ch
      while ((ch = stream.next()) != null) {
        if (ch == '<') {
          state.tokenize = doctype(depth + 1)
          return state.tokenize(stream, state)
        } else if (ch == '>') {
          if (depth == 1) {
            state.tokenize = inText
            break
          } else {
            state.tokenize = doctype(depth - 1)
            return state.tokenize(stream, state)
          }
        }
      }
      return 'meta'
    }
  }
  var curState, setStyle

  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--)
      curState.cc.push(arguments[i])
  }

  function cont() {
    pass.apply(null, arguments)
    return true
  }

  function pushContext(tagName, startOfLine) {
    var noIndent =
      Kludges.doNotIndent.hasOwnProperty(tagName) ||
      (curState.context && curState.context.noIndent)
    curState.context = {
      prev: curState.context,
      tagName: tagName,
      indent: curState.indented,
      startOfLine: startOfLine,
      noIndent: noIndent
    }
  }

  function popContext() {
    if (curState.context) curState.context = curState.context.prev
  }

  function element(type) {
    if (type == 'openTag') {
      curState.tagName = tagName
      return cont(attributes, endtag(curState.startOfLine))
    } else if (type == 'closeTag') {
      var err = false
      if (curState.context) {
        if (curState.context.tagName != tagName) {
          if (
            Kludges.implicitlyClosed.hasOwnProperty(
              curState.context.tagName.toLowerCase()
            )
          ) {
            popContext()
          }
          err = !curState.context || curState.context.tagName != tagName
        }
      } else {
        err = true
      }
      if (err) setStyle = 'error'
      return cont(endclosetag(err))
    }
    return cont()
  }

  function endtag(startOfLine) {
    return function(type) {
      if (
        type == 'selfcloseTag' ||
        (type == 'endTag' &&
          Kludges.autoSelfClosers.hasOwnProperty(
            curState.tagName.toLowerCase()
          ))
      ) {
        maybePopContext(curState.tagName.toLowerCase())
        return cont()
      }
      if (type == 'endTag') {
        maybePopContext(curState.tagName.toLowerCase())
        pushContext(curState.tagName, startOfLine)
        return cont()
      }
      return cont()
    }
  }

  function endclosetag(err) {
    return function(type) {
      if (err) setStyle = 'error'
      if (type == 'endTag') {
        popContext()
        return cont()
      }
      setStyle = 'error'
      return cont(arguments.callee)
    }
  }

  function maybePopContext(nextTagName) {
    var parentTagName
    while (true) {
      if (!curState.context) {
        return
      }
      parentTagName = curState.context.tagName.toLowerCase()
      if (
        !Kludges.contextGrabbers.hasOwnProperty(parentTagName) ||
        !Kludges.contextGrabbers[parentTagName].hasOwnProperty(nextTagName)
      ) {
        return
      }
      popContext()
    }
  }

  function attributes(type) {
    if (type == 'word') {
      setStyle = 'attribute'
      return cont(attribute, attributes)
    }
    if (type == 'endTag' || type == 'selfcloseTag') return pass()
    setStyle = 'error'
    return cont(attributes)
  }

  function attribute(type) {
    if (type == 'equals') return cont(attvalue, attributes)
    if (!Kludges.allowMissing) setStyle = 'error'
    else if (type == 'word') setStyle = 'attribute'
    return type == 'endTag' || type == 'selfcloseTag' ? pass() : cont()
  }

  function attvalue(type) {
    if (type == 'string') return cont(attvaluemaybe)
    if (type == 'word' && Kludges.allowUnquoted) {
      setStyle = 'string'
      return cont()
    }
    setStyle = 'error'
    return type == 'endTag' || type == 'selfCloseTag' ? pass() : cont()
  }

  function attvaluemaybe(type) {
    if (type == 'string') return cont(attvaluemaybe)
    else return pass()
  }
  return {
    startState: function() {
      return {
        tokenize: inText,
        cc: [],
        indented: 0,
        startOfLine: true,
        tagName: null,
        context: null
      }
    },
    token: function(stream, state) {
      if (stream.sol()) {
        state.startOfLine = true
        state.indented = stream.indentation()
      }
      if (stream.eatSpace()) return null
      setStyle = type = tagName = null
      var style = state.tokenize(stream, state)
      state.type = type
      if ((style || type) && style != 'comment') {
        curState = state
        while (true) {
          var comb = state.cc.pop() || element
          if (comb(type || style)) break
        }
      }
      state.startOfLine = false
      return setStyle || style
    },
    indent: function(state, textAfter, fullLine) {
      var context = state.context
      if (
        (state.tokenize != inTag && state.tokenize != inText) ||
        (context && context.noIndent)
      )
        return fullLine ? fullLine.match(/^(\s*)/)[0].length : 0
      if (alignCDATA && /<!\[CDATA\[/.test(textAfter)) return 0
      if (context && /^<\//.test(textAfter)) context = context.prev
      while (context && !context.startOfLine) context = context.prev
      if (context) return context.indent + indentUnit
      else return 0
    },
    electricChars: '/'
  }
})
CodeMirror.defineMIME('text/xml', 'xml')
CodeMirror.defineMIME('application/xml', 'xml')
if (!CodeMirror.mimeModes.hasOwnProperty('text/html'))
  CodeMirror.defineMIME('text/html', {
    name: 'xml',
    htmlMode: true
  })
export default CodeMirror
