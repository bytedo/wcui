const encoder = new TextEncoder()
const subtle = window.crypto.subtle

/**
 * String 转 Uint8Array
 */
function str2uint(txt) {
  return encoder.encode(txt)
}

/**
 * ArrayBuffer 转 hex
 */
function ab2hex(buf) {
  var uint8 = new Uint8Array(buf)
  return [...uint8].map(n => n.toString(16).padStart(2, '0')).join('')
}

/**
 * ArrayBuffer 转 Binary
 */
function ab2bin(buf) {
  var bin = ''
  var uint8 = new Uint8Array(buf)
  for (var i = 0; i < uint8.length; i++) {
    bin += String.fromCharCode(uint8[i])
  }
  return bin
}

/* ------------------------------------- */

export default function hash(type, str) {
  return subtle.digest(type, str2uint(str)).then(buf => ab2hex(buf))
}

export function sha1(str) {
  return hash('sha-1', str)
}

export function sha256(str) {
  return hash('sha-256', str)
}

export function sha512(str) {
  return hash('sha-512', str)
}

export function hmac(mode, str, key, output) {
  key = key === '' ? new Uint8Array(16) : str2uint(key)
  return subtle
    .importKey('raw', key, { name: 'HMAC', hash: { name: mode } }, true, [
      'sign',
      'verify'
    ])
    .then(cKey => {
      return subtle.sign('HMAC', cKey, str2uint(str)).then(buf => {
        if (output === 'binary') {
          return ab2bin(buf)
        } else if (output === 'hex') {
          return ab2hex(buf)
        } else if (output === 'base64') {
          return window.btoa(ab2bin(buf))
        }
        return new Uint8Array(buf)
      })
    })
}

// 支持对中文的base64编码
export function base64encode(str) {
  return window.btoa(unescape(encodeURIComponent(str)))
}

export function base64decode(str) {
  return decodeURIComponent(escape(window.atob(str)))
}
