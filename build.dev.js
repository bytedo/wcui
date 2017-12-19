#! /usr/bin/env node

const fs = require('iofs')
const path = require('path')
const babel = require('babel-core')
const scss = require('node-sass')
const chokidar = require('chokidar')
const log = console.log

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')
const jsOpt = {
  presets: ['es2015'],
  plugins: ['transform-es2015-modules-umd']
}
const cssOpt = {
  includePaths: ['src/css/'],
  outputStyle: 'compressed'
}

const compileJs = (entry, output) => {
  if (/touch\.patch/.test(entry)) {
    return
  }
  let t1 = Date.now()
  if (/anot/.test(entry)) {
    setTimeout(() => {
      fs.cp(entry, output)
    }, 100)
  } else {
    const { code } = babel.transformFileSync(entry, jsOpt)
    fs.echo(code, output)
  }
  log('编译JS: %s, 耗时 %d ms', entry, Date.now() - t1)
}

const compileCss = (entry, output) => {
  let t1 = Date.now()
  const { css } = scss.renderSync({ ...cssOpt, file: entry })
  log('编译scss: %s, 耗时 %d ms', entry, Date.now() - t1)
  fs.echo(css, output)
}

const compileHtm = (entry, output) => {
  let t1 = Date.now()
  let htm = fs.cat(entry).toString('utf8')
  htm = htm.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ')
  log('压缩HTML: %s, 耗时 %d ms', entry, Date.now() - t1)
  fs.echo(htm, output)
}

/*=======================================================*/
/*=====                                               ===*/
/*=======================================================*/

const fontFiles = fs.ls('./src/font/', true)
const jsFiles = fs.ls('./src/js/', true)
const cssFiles = fs.ls('./src/css/', true)

// 字体文件直接复制
chokidar.watch(path.join(sourceDir, 'font/')).on('all', (act, file) => {
  if (act === 'add' || act === 'change') {
    let output = file.replace('src/font/', 'dist/font/')
    fs.cp(file, output)
  }
})

// css目录
chokidar.watch(path.resolve(sourceDir, 'css/')).on('all', (act, file) => {
  if (act === 'add' || act === 'change') {
    if (/\.scss$/.test(file)) {
      let output = file
        .replace('src/css/', 'dist/css/')
        .replace('.scss', '.css')

      compileCss(file, output)
    }
  }
})

// js目录的处理要复杂一点
chokidar
  .watch(path.resolve(sourceDir, 'js/'))
  .on('all', (act, file) => {
    if (act === 'add' || act === 'change') {
      let output = file.replace('src/js/', 'dist/js/')
      let ext = file.slice(file.lastIndexOf('.') + 1)
      switch (ext) {
        case 'js':
          compileJs(file, output)
          break
        case 'scss':
          output = output.replace(/scss$/, 'css')
          compileCss(file, output)
          break
        case 'htm':
          compileHtm(file, output)
          break
        default:
          fs.cp(file, output)
      }
    }
  })
  .on('ready', () => {
    log('预处理完成,监听文件变化中,请勿关闭本窗口...')
  })
