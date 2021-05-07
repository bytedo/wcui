#! /usr/bin/env node

require('es.shim')
const log = console.log
const fs = require('iofs')
const path = require('path')
const scss = require('sass')
const chalk = require('chalk')
const { minify } = require('terser')

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')

const VERSION = require('./package.json').version
const BUILD_DATE = new Date().format()

const BASE_SCSS = `
* {
  box-sizing: border-box;
  margin: 0;padding: 0;
} 
::before,
::after{box-sizing:border-box;}
`

function parseName(str) {
  return str.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`).replace(/^\-/, '')
}

function fixImport(str) {
  return str
    .replace(/import '([\w-/_.]*)'/g, 'import "$1.js"')
    .replace(
      /import ([\w\s,{}$]*) from '([a-z0-9\/\.\-_]*)'/g,
      'import $1 from "$2.js"'
    )
}

const compileJs = (entry, output) => {
  let t1 = Date.now()
  let buf = fs.cat(entry).toString()
  buf = fixImport(buf)
  minify(buf, { sourceMap: false }).then(res => {
    log(
      '编译JS: %s, 耗时 %s ms',
      chalk.green(entry),
      chalk.yellow(Date.now() - t1)
    )
    fs.echo(res.code, output)
  })
}

// 编译样式
function compileScss(code = '') {
  try {
    return (
      scss.renderSync({
        data: BASE_SCSS + code,
        outputStyle: 'compressed'
      }).css + ''
    ).trim()
  } catch (err) {
    log(err)
  }
}

function mkWCFile({ style, html, js }) {
  style = compileScss(style)

  html = html.replace(/[\n\r]+/g, ' ')
  html = html.replace(/\s+/g, ' ')

  let name = ''

  js = js.replace(/props = (\{\}|\{[\w\W]*?\n\s{2}?\})/, function(str) {
    var attr = str
      .split(/\n+/)
      .slice(1, -1)
      .map(it => {
        var tmp = it.split(':')
        return tmp[0].trim().replace(/^['"]|['"]$/g, '')
      })
    return `
    
  static get observedAttributes() {
    return ${JSON.stringify(attr)}
  }

  ${str}
  `
  })

  js = fixImport(js)
    .replace(/export default class ([a-zA-Z0-9]+)/, function(s, m) {
      name = m
      return `${s} extends HTMLElement `
    })
    .replace(/__init__\(\)\s+\{/, 'constructor() {\n    super();')
    .replace(
      '/* render */',
      `
      Object.defineProperty(this, 'root', {
        value: this.attachShadow({ mode: 'open' }),
        writable: true,
        enumerable: false,
        configurable: true
      })


      this.root.innerHTML = \`<style>${style}</style>${html}\`
      `
    )
    .replace('mounted()', 'connectedCallback()')
    .replace('unmounted()', 'disconnectedCallback()')
    .replace(
      'watch() {',
      'attributeChangedCallback(name, old, val) {\nif (old === val) {return}'
    )
    .replace('adopted()', 'adoptedCallback()')

  return minify(js, { sourceMap: false }).then(res => {
    return `/**
  *
  * @authors yutent (yutent.io@gmail.com)
  * @date    ${BUILD_DATE}
  * @version v${VERSION}
  * 
  */

${res.code}

if(!customElements.get('wc-${parseName(name)}')){
  customElements.define('wc-${parseName(name)}', ${name})
}
`
  })
}

const compileWC = (entry, output) => {
  log('编译wc: %s', chalk.green(entry))
  let code = fs.cat(entry).toString()
  let style = code.match(/<style[^>]*?>([\w\W]*?)<\/style>/)
  let html = code.match(/<template>([\w\W]*?)<\/template>/)
  let js = code.match(/<script>([\w\W]*?)<\/script>/)

  style = style ? style[1] : ''
  html = html ? html[1] : ''
  js = js ? js[1] : ''

  mkWCFile({ style, html, js }).then(txt => {
    fs.echo(txt, output)
  })
}

/*=======================================================*/
/*=====                                               ===*/
/*=======================================================*/

if (fs.isdir(buildDir)) {
  fs.rm(buildDir, true)
  log(chalk.cyan('清除旧目录 dist/'))
}
fs.mkdir(buildDir)

/*----------------------------------------------*/
/*----------------------------------------------*/
/*----------------------------------------------*/

let files = fs.ls(sourceDir, true)
files = files.map(it => {
  let file = path.parse(it)
  if (!file.ext || file.base === '.DS_Store' || file.base === 'var.scss') {
    return null
  }
  return { path: it, ext: file.ext, name: file.base }
})

files.forEach(file => {
  if (!file) {
    return
  }
  let entry = file.path
  let output = file.path.replace('src/', 'dist/')

  switch (file.ext) {
    case '.wc':
      output = output.replace(/\.wc$/, '.js')
      compileWC(entry, output)
      break
    case '.js':
      compileJs(entry, output)
      break
    default:
      fs.cp(entry, output)
  }
})
