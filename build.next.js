#! /usr/bin/env node

const log = console.log
const fs = require('iofs')
const path = require('path')
const scss = require('node-sass')
const postcss = require('postcss')
const autoprefixer = require('autoprefixer')
const chalk = require('chalk')
const uglify = require('uglify-es')

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')
const prefixer = postcss().use(
  autoprefixer({
    browsers: ['ie > 9', 'iOS > 8', 'Android >= 4.4', 'ff > 38', 'Chrome > 38']
  })
)
const cssOpt = {
  includePaths: ['src/css/'],
  outputStyle: 'compressed'
}

const compileJs = (entry, output) => {
  if (/touch\.patch/.test(entry)) {
    return
  }
  let t1 = Date.now()
  let buf = fs.cat(entry).toString()
  let { code } = uglify.minify(buf)
  code = code
    .replace(/\.scss/g, '.css')
    .replace(/import"([a-z0-9/.]*)(?<!\.css)"/g, 'import "$1.js"')
    .replace(/import ([\w]*) from"([a-z0-9/.]*)"/g, 'import $1 from "$2.js"')
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

  log(
    '编译scss: %s, 耗时 %s ms',
    chalk.green(entry),
    chalk.yellow(Date.now() - t1)
  )
  fs.echo(css, output)
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

const jsFiles = fs.ls('./src/js/', true)
const cssFiles = fs.ls('./src/css/', true)

if (fs.isdir(buildDir)) {
  fs.rm(buildDir, true)
  log(chalk.cyan('清除旧目录 dist/'))
}

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
