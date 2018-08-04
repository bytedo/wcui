#! /usr/bin/env node

const log = console.log
const fs = require('iofs')
const path = require('path')
const babel = require('babel-core')
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
const jsOpt = {
  presets: ['es2015'],
  plugins: [
    'transform-es2015-modules-amd',
    'transform-decorators-legacy',
    'transform-object-rest-spread',
    ['transform-es2015-classes', { loose: true }],
    ['transform-es2015-for-of', { loose: true }]
  ]
}
const cssOpt = {
  // includePaths: ['src/css/'],
  outputStyle: 'compressed'
}

const compileJs = (entry, output) => {
  let t1 = Date.now()
  try {
    let { code } = babel.transformFileSync(entry, jsOpt)
    code = uglify.minify(code).code.replace(/\.scss/g, '.css')

    log(
      '编译JS: %s, 耗时 %s ms',
      chalk.green(entry),
      chalk.yellow(Date.now() - t1)
    )
    fs.echo(code, output)
  } catch (err) {
    return log(err)
  }
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
