#! /usr/bin/env node

const log = console.log
const fs = require('iofs')
const path = require('path')
const scss = require('node-sass')

const chalk = require('chalk')
const uglify = require('uglify-es')

const sourceDir = path.resolve(__dirname, 'src')
const buildDir = path.resolve(__dirname, 'dist')

const cssOpt = {
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
    .replace(/import"(([a-z0-9/.]*\.css))"/g, 'importCss("/$1")')
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

/*=======================================================*/
/*=====                                               ===*/
/*=======================================================*/

if (fs.isdir(buildDir)) {
  fs.rm(buildDir, true)
  log(chalk.cyan('清除旧目录 dist/'))
}
fs.mkdir(buildDir)

let list = fs.ls('./node_modules/anot/dist/')
list.forEach(it => {
  fs.cp(it, path.resolve(buildDir, path.parse(it).base))
})

log('复制anot框架文件完成...')

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
})
