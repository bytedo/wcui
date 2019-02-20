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
    browsers: ['ff > 61', 'Chrome > 63']
  })
)

const compileJs = (entry, output) => {
  log('编译JS: %s', chalk.green(entry))
  let buf = fs.cat(entry).toString()
  let code = buf
    .replace(/\.scss/g, '.css')
    .replace(/import '([a-z0-9\/\.\-_]*)(?<!\.css)'/g, 'import "$1.js"')
    .replace(
      /import ([\w]*) from '([a-z0-9\/\.\-_]*)'/g,
      'import $1 from "$2.js"'
    )
    .replace(/import '([a-z0-9\/\.\-_]*\.css)'/g, 'importCss("/$1")')

  fs.echo(code, output)
}

const compileCss = (entry, output) => {
  log('编译scss: %s', chalk.green(entry))
  try {
    const { css } = scss.renderSync({ file: entry })
    prefixer.process(css, { from: '', to: '' }).then(result => {
      fs.echo(result.css, output)
    })
  } catch (err) {
    log(err)
  }
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
        case '.scss':
          output = output.replace(/\.scss$/, '.css')
          compileCss(entry, output)
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
