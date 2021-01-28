#! /usr/bin/env node

require('es.shim')
const log = console.log
const fs = require('iofs')
const path = require('path')
const scss = require('node-sass')
const chokidar = require('chokidar')
const chalk = require('chalk')

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

function compileJs(entry, output) {
  log('编译JS: %s', chalk.green(entry))
  let buf = fs.cat(entry).toString()
  let code = fixImport(buf)

  fs.echo(code, output)
}

// 编译样式
function compileScss(code = '') {
  try {
    return scss.renderSync({ data: BASE_SCSS + code }).css
  } catch (err) {
    log(err)
  }
}

function mkWCFile({ style, html, js }) {
  style = compileScss(style)

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
      'attributeChangedCallback(name, old, val) {\nif (old === val) {return}'
    )
    .replace('adopted()', 'adoptedCallback()')

  return `/**
 *
 * @authors yutent (yutent.io@gmail.com)
 * @date    ${BUILD_DATE}
 * @version v${VERSION}
 * 
 */

${js}

if(!customElements.get('wc-${parseName(name)}')){
  customElements.define('wc-${parseName(name)}', ${name})
}
`
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

  let result = mkWCFile({ style, html, js })
  fs.echo(result, output)
}

/*=======================================================*/
/*=====                                               ===*/
/*=======================================================*/

chokidar
  .watch(sourceDir)
  .on('all', (act, file) => {
    if (act === 'add' || act === 'change') {
      let entry = file
      let output = file.replace('src/', 'dist/')

      file = path.parse(entry)
      if (!file.ext || file.base === '.DS_Store' || file.base === 'var.scss') {
        return
      }

      setTimeout(() => {
        switch (file.ext) {
          case '.js':
            compileJs(entry, output)
            break
          case '.wc':
            output = output.replace(/\.wc$/, '.js')
            compileWC(entry, output)
            break
          default:
            fs.cp(entry, output)
        }
      }, 100)
    }
  })
  .on('ready', () => {
    log(chalk.red('预处理完成,监听文件变化中,请勿关闭本窗口...'))
  })
