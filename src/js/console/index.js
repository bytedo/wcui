/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-12-26 11:04:52
 * @version $Id$
 */

import './style.scss'

const logElem = document.createElement('div')
logElem.className = 'do-console'

const Logger = function() {
  document.body.appendChild(logElem)
}

Logger.prototype = {
  log: function(...args) {
    let pre = document.createElement('pre')
    args = args.map(it => {
      if (Anot.isPlainObject(it)) {
        return JSON.stringify(it)
      } else {
        if (Anot.type(it) === 'error') {
          return it.stack || it
        }
        return it
      }
    })
    pre.textContent = args.join(' ')
    logElem.appendChild(pre)
  },
  error: function(...args) {
    let pre = document.createElement('pre')
    args = args.map(it => {
      if (Anot.isPlainObject(it)) {
        return JSON.stringify(it)
      } else {
        if (Anot.type(it) === 'error') {
          return it.stack || it
        }
        return it
      }
    })
    pre.className = 'error'
    pre.textContent = args.join(' ')
    logElem.appendChild(pre)
  }
}

window.console = new Logger()

export default window.console
