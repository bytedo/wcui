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
$ct: #4db6ac #26a69a #009688;
$cg: #81c784 #66bb6a #4caf50;
$cpp: #9575cd #9575cd #673ab7;
$cb: #64b5f6 #42a5f5 #2196f3;
$cr: #ff5061 #eb3b48 #ce3742;
$co: #ffb618 #f39c12 #e67e22;
$cp: #f2f5fc #e8ebf4 #dae1e9;
$cgr: #bdbdbd #9e9e9e #757575;
$cd: #62778d #526273 #425064;

@mixin ts($c: all, $t: .1s, $m: ease-in-out){
  transition:$c $t $m;
}

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
  let props = ''

  js = js.replace(/props = (\{\}|\{[\w\W]*?\n\s{2}?\})/, function(s, m) {
    props = m
    var attr = new Function(
      `try {
        var props = ${m}, attr = []
        for(var i in props){attr.push(i)}
        return attr
      } catch(err) {console.error(err);return []}
      `
    )()
    return `static get observedAttributes() {
        return ${JSON.stringify(attr)}
      }
      `
  })

  js = fixImport(js)
    .replace(/class ([a-zA-Z0-9]+)/, function(s, m) {
      name = m
      return `${s} extends HTMLElement `
    })
    .replace(/__init__\(\)\s+\{/, 'constructor() {\n super();')
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
    .replace('mounted()', 'connectedCallback()')
    .replace('unmount()', 'disconnectedCallback()')
    .replace(
      'watch() {',
      'attributeChangedCallback(name, old, val) {\nif (val === null || old === val) {return}'
    )
    .replace('adopted()', 'adoptedCallback()')

  return `/**
 *
 * @authors yutent (yutent.io@gmail.com)
 * @date    ${BUILD_DATE}
 * @version v${VERSION}
 * 
 */

'use strict'

const log = console.log

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
