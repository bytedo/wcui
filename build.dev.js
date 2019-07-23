#! /usr/bin/env node

require('es.shim')
const log = console.log
const fs = require('iofs')
const path = require('path')
const babel = require('babel-core')
const scss = require('node-sass')
const chokidar = require('chokidar')
const chalk = require('chalk')

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')

const VERSION = require('./package.json').version
const BUILD_DATE = new Date().format()

const BASE_SCSS = `
$ct: #3fc2a7 #19b491 #16967a;
$cg: #58d68d #2ecc71 #27ae60;
$cpp: #ac61ce #9b59b6 #8e44ad;
$cb: #66b1ff #409eff #3a8ee6;
$cr: #ff5061 #eb3b48 #ce3742;
$co: #ffb618 #f39c12 #e67e22;
$cp: #f3f5fb #e8ebf4 #dae1e9;
$cgr: #aabac3 #90a3ae #7e909a;
$cd: #62778d #526273 #425064;

@mixin ts($c: all, $t: .2s, $m: ease-in-out){
  transition:$c $t $m;
}

* {
  box-sizing: border-box;
  margin: 0;padding: 0;
} 
::before,
::after{box-sizing:border-box;}
`

function compileJs(entry, output) {
  log('编译JS: %s', chalk.green(entry))
  let buf = fs.cat(entry).toString()
  let code = buf
    .replace(/import '([a-z0-9\/\.\-_]*)'/g, 'import "$1.js"')
    .replace(
      /import ([\w]*) from '([a-z0-9\/\.\-_]*)'/g,
      'import $1 from "$2.js"'
    )

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
  let props = ''

  js = js.replace(/props = (\{[\w\W]*?\})/, function(s, m) {
    props = m
    var attr = new Function(
      `var props = ${m}, attr = []; for(var i in props){attr.push(i)}; return attr`
    )()
    return `static get observedAttributes() {
        return ${JSON.stringify(attr)}
      }
      `
  })

  js = js
    .replace(/class ([\w]+)/, function(s, m) {
      name = m
      return `${s} extends HTMLElement `
    })
    .replace(/import '([a-z0-9\/\.\-_]*)'/g, 'import "$1.js"')
    .replace(
      /import ([\w]*) from '([a-z0-9\/\.\-_]*)'/g,
      'import $1 from "$2.js"'
    )
    .replace(/constructor\([^)]?\)\s+\{/, 'constructor() {\n super()')
    .replace(
      '/* render */',
      `
      Object.defineProperty(this, 'root', {
        value: this.attachShadow({ mode: 'open' }),
        writable: true,
        enumerable: false,
        configurable: true
      })
      Object.defineProperty(this, 'props', {
        value: ${props},
        writable: true,
        enumerable: false,
        configurable: true
      })

      this.root.innerHTML = \`<style>${style}</style>${html}\`
      `
    )
    .replace('mounted', 'connectedCallback')
    .replace('unmount', 'disconnectedCallback')
    .replace('watch', 'attributeChangedCallback')
    .replace('adopted', 'adoptedCallback')

  return `/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    ${BUILD_DATE}
 * @version v${VERSION}
 * 
 */

'use strict'

const log = console.log

${js}

customElements.define('wc-${name.toLowerCase()}', ${name})
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
    }
  })
  .on('ready', () => {
    log(chalk.red('预处理完成,监听文件变化中,请勿关闭本窗口...'))
  })

chokidar
  .watch(path.resolve('./node_modules/anot/dist/'))
  .on('all', (act, file) => {
    if (act === 'add' || act === 'change') {
      log('复制: %s', chalk.green(file))
      fs.cp(file, path.resolve(buildDir, path.parse(file).base))
    }
  })
  .on('ready', () => {
    log('复制anot框架文件完成...')
  })
