#! /usr/bin/env node

require('es.shim')
const log = console.log
const fs = require('iofs')
const path = require('path')
const scss = require('node-sass')
const chalk = require('chalk')
const { minify } = require('terser')

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')

const VERSION = require('./package.json').version
const BUILD_DATE = new Date().format()

const BASE_SCSS = `
@mixin focus1(){
  box-shadow: 0 0 2px #88f7df;
}

@mixin focus2(){
  box-shadow: 0 0 2px #f3be4d;
}

* {
  box-sizing: border-box;
  margin: 0;padding: 0;
} 
::before,
::after{box-sizing:border-box;}

:host {
  --color-teal-1: #4db6ac;
  --color-teal-2: #26a69a;
  --color-teal-3: #009688;
  --color-green-1: #81c784;
  --color-green-2: #66bb6a;
  --color-green-3: #4caf50;
  --color-purple-1: #9575cd;
  --color-purple-2: #9575cd;
  --color-purple-3: #673ab7;
  --color-blue-1: #64b5f6;
  --color-blue-2: #42a5f5;
  --color-blue-3: #2196f3;
  --color-red-1: #ff5061;
  --color-red-2: #eb3b48;
  --color-red-3: #ce3742;
  --color-orange-1: #ffb618;
  --color-orange-2: #f39c12;
  --color-orange-3: #e67e22;
  --color-plain-1: #f2f5fc;
  --color-plain-2: #e8ebf4;
  --color-plain-3: #dae1e9;
  --color-grey-1: #bdbdbd;
  --color-grey-2: #9e9e9e;
  --color-grey-3: #757575;
  --color-dark-1: #62778d;
  --color-dark-2: #526273;
  --color-dark-3: #425064;
}
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
        return tmp[0].trim()
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
    .replace('unmount()', 'disconnectedCallback()')
    .replace(
      'watch() {',
      'attributeChangedCallback(name, old, val) {\nif (val === null || old === val) {return}'
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
