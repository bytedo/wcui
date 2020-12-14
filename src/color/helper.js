/**
 *
 * @author yutent<yutent.io@gmail.com>
 * @date 2020/12/03 18:24:47
 */

// H: 色相, S: 饱和度, B/V: 亮度
export function hsb2rgb(hsb) {
  var h = hsb.h
  var s = Math.round((hsb.s * 255) / 100)
  var v = Math.round((hsb.b * 255) / 100)
  var r = 0
  var g = 0
  var b = 0

  if (s === 0) {
    r = g = b = v
  } else {
    var t1 = v
    var t2 = ((255 - s) * v) / 255
    var t3 = ((t1 - t2) * (h % 60)) / 60

    //
    if (h === 360) {
      h = 0
    }

    if (h < 60) {
      r = t1
      g = t2 + t3
      b = t2
    } else if (h < 120) {
      r = t1 - t3
      g = t1
      b = t2
    } else if (h < 180) {
      r = t2
      g = t1
      b = t2 + t3
    } else if (h < 240) {
      r = t2
      g = t1 - t3
      b = t1
    } else if (h < 300) {
      r = t2 + t3
      g = t2
      b = t1
    } else if (h < 360) {
      r = t1
      g = t2
      b = t1 - t3
    }
  }
  r = Math.round(r)
  g = Math.round(g)
  b = Math.round(b)

  return { r, g, b }
}

export function rgb2hex({ r, g, b }) {
  return [r, g, b].map(it => it.toString(16).padStart(2, '0')).join('')
}

export function hex2rgb(hex) {
  var r, g, b

  hex = hex.replace(/^#/, '').split('')

  if (hex.length === 3) {
    r = parseInt(hex[0] + hex[0], 16)
    g = parseInt(hex[1] + hex[1], 16)
    b = parseInt(hex[2] + hex[2], 16)
  } else {
    r = parseInt(hex[0] + hex[1], 16)
    g = parseInt(hex[2] + hex[3], 16)
    b = parseInt(hex[4] + hex[5], 16)
  }

  return { r, g, b }
}

export function rgb2hsb({ r, g, b }) {
  var hsb = { h: 0, s: 0, b: 0 }
  var max = Math.max(r, g, b)
  var min = Math.min(r, g, b)
  var delta = max - min

  hsb.b = max
  hsb.s = max === 0 ? 0 : (delta * 255) / max

  if (hsb.s === 0) {
    hsb.h = -1
  } else {
    if (r === max) {
      hsb.h = (g - b) / delta
    } else if (g === max) {
      hsb.h = 2 + (b - r) / delta
    } else {
      hsb.h = 4 + (r - g) / delta
    }
  }
  hsb.h *= 60

  if (hsb.h < 0) {
    hsb.h += 360
  }

  hsb.s *= 100 / 255
  hsb.b *= 100 / 255

  return hsb
}

export function hex2hsb(hex) {
  return rgb2hsb(hex2rgb(hex))
}
