#! /usr/bin/env node

const log = console.log
const fs = require('iofs')
const path = require('path')
const babel = require('babel-core')
const scss = require('node-sass')
const chokidar = require('chokidar')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const chalk = require('chalk')

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')
const prefixer = postcss().use(
  autoprefixer({
    browsers: ['ie > 9', 'iOS > 8', 'Android >= 4.4', 'ff > 38', 'Chrome > 38']
  })
)
const jsOpt = {
  presets: ['es2015'],
  plugins: ['transform-es2015-modules-amd']
}
const cssOpt = {
  includePaths: ['src/css/'],
  outputStyle: 'compressed'
}

const compileJs = (entry, output) => {
  if (/touch\.patch/.test(entry)) {
    return
  }
  setTimeout(() => {
    if (/anot/.test(entry)) {
      fs.cp(entry, output)
    } else {
      try {
        const { code } = babel.transformFileSync(entry, jsOpt)
        fs.echo(code, output)
      } catch (err) {
        return log(err)
      }
    }
  }, 100)
  log('编译JS: %s', chalk.green(entry))
}

const compileCss = (entry, output) => {
  setTimeout(() => {
    try {
      const { css } = scss.renderSync({ ...cssOpt, file: entry })
      prefixer.process(css, { from: '', to: '' }).then(result => {
        fs.echo(result.css, output)
      })
    } catch (err) {
      log(err)
    }
  }, 100)
  log('编译scss: %s', chalk.green(entry))
}

const compileHtm = (entry, output) => {
  setTimeout(() => {
    let htm = fs.cat(entry).toString('utf8')
    htm = htm.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ')
    fs.echo(htm, output)
  }, 100)
  log('压缩HTML: %s', chalk.green(entry))
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
    log(chalk.red('预处理完成,监听文件变化中,请勿关闭本窗口...'))
  })
