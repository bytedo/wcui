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
  log('编译JS: %s', chalk.green(entry))
  try {
    let { code } = babel.transformFileSync(entry, jsOpt)
    code = code.replace(/\.scss/g, '.css')
    fs.echo(code, output)
  } catch (err) {
    return log(err)
  }
}

const compileCss = (entry, output) => {
  log('编译scss: %s', chalk.green(entry))
  try {
    const { css } = scss.renderSync({ ...cssOpt, file: entry })
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
    return
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
