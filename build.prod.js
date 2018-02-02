#! /usr/bin/env node

const log = console.log
const fs = require('iofs')
const path = require('path')
const babel = require('babel-core')
const scss = require('node-sass')
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
  presets: ['es2015', 'minify'],
  plugins: [
    'transform-es2015-modules-amd',
    'transform-decorators-legacy',
    'transform-class-properties',
    'transform-object-rest-spread'
  ]
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
  let tmpOpt = jsOpt
  if (/anot/.test(entry)) {
    tmpOpt = Object.assign({}, jsOpt, { plugins: [] })
  }
  const { code } = babel.transformFileSync(entry, tmpOpt)
  log(
    '编译JS: %s, 耗时 %s ms',
    chalk.green(entry),
    chalk.yellow(Date.now() - t1)
  )
  fs.echo(code, output)
}

const compileCss = (entry, output) => {
  let t1 = Date.now()
  const { css } = scss.renderSync({ ...cssOpt, file: entry })
  prefixer.process(css, { from: '', to: '' }).then(result => {
    log(
      '编译scss: %s, 耗时 %s ms',
      chalk.green(entry),
      chalk.yellow(Date.now() - t1)
    )
    fs.echo(result.css, output)
  })
}

const compileHtm = (entry, output) => {
  let t1 = Date.now()
  let htm = fs.cat(entry).toString('utf8')
  htm = htm.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ')
  log(
    '压缩HTML: %s, 耗时 %s ms',
    chalk.green(entry),
    chalk.yellow(Date.now() - t1)
  )
  fs.echo(htm, output)
}

/*=======================================================*/
/*=====                                               ===*/
/*=======================================================*/

const fontFiles = fs.ls('./src/font/', true)
const jsFiles = fs.ls('./src/js/', true)
const cssFiles = fs.ls('./src/css/', true)

if (fs.isdir(buildDir)) {
  fs.rm(buildDir, true)
  log(chalk.cyan('清除旧目录 dist/'))
}

// 字体文件直接复制
fontFiles.forEach(file => {
  fs.cp('./src/font/' + file, './dist/font/' + file)
})

// css目录
cssFiles.forEach(file => {
  if (/\.scss$/.test(file)) {
    let entry = path.resolve(sourceDir, 'css/', file)
    let output = path.resolve(buildDir, 'css/', file.replace(/scss$/, 'css'))

    compileCss(entry, output)
  }
})

// js目录的处理要复杂一点
jsFiles.forEach(file => {
  let entry = path.resolve(sourceDir, 'js', file)
  let output = path.resolve(buildDir, 'js', file)
  let ext = file.slice(file.lastIndexOf('.') + 1)

  switch (ext) {
    case 'js':
      compileJs(entry, output)
      break
    case 'scss':
      output = output.replace(/scss$/, 'css')
      compileCss(entry, output)
      break
    case 'htm':
      compileHtm(entry, output)
      break
    default:
      if (!fs.isdir(entry)) {
        fs.cp(entry, output)
      }
  }
})
