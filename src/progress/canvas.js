/**
 *
 * @author yutent<yutent.io@gmail.com>
 * @date 2021/03/08 14:25:13
 */

export function drawLine(el, size, opt) {
  var ctx = el.getContext('2d')
  var { width, height } = size
  var {
    colors,
    value,
    'show-text': showText,
    'default-color': bg,
    'line-size': line,
    'font-size': font
  } = opt
  var color = colors[0]
  var half

  if (colors.length > 1) {
    let idx = Math.floor(value / (100 / colors.length))
    if (idx === colors.length) {
      idx--
    }
    color = colors[idx]
  }

  //
  line = line || 10
  font = font || 10
  half = line / 2

  el.width = width
  el.height = height

  ctx.clearRect(0, 0, width, height)

  ctx.strokeStyle = bg
  ctx.lineWidth = line
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.moveTo(half, half)
  ctx.lineTo(width - half, half)
  ctx.stroke()
  ctx.closePath()

  if (value > 0) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.moveTo(half, half)
    ctx.lineTo(((width - half) * value) / 100, half)
    ctx.stroke()
    ctx.closePath()

    if (showText) {
      ctx.fillStyle = '#fff'
      ctx.font = `bold ${font}px Arial`
      ctx.textBaseline = 'middle'
      ctx.textAlign = 'right'
      ctx.fillText(
        (value < 100 ? value.toFixed(1) : 100) + '%',
        ((width - half) * value) / 100,
        half
      )
    }
  }
}

export function drawCircle(el, size, opt, start = -90, end = 270) {
  var ctx = el.getContext('2d')
  var { width } = size
  var {
    colors,
    value,
    'show-text': showText,
    'default-color': bg,
    'line-size': line,
    'font-size': font
  } = opt
  var color = colors[0]
  var half = width / 2

  if (width === 0) {
    return
  }

  if (colors.length > 1) {
    let idx = Math.floor(value / (100 / colors.length))
    if (idx === colors.length) {
      idx--
    }
    color = colors[idx]
  }

  //
  line = line || 10
  font = font || 32
  el.width = width
  el.height = width

  ctx.clearRect(0, 0, width, width)

  ctx.strokeStyle = bg
  ctx.lineWidth = line
  ctx.lineCap = 'round'

  ctx.beginPath()
  ctx.arc(
    half,
    half,
    half - line / 2,
    (Math.PI / 180) * start,
    (Math.PI / 180) * end,
    false
  ) //整圆
  ctx.stroke()
  ctx.closePath()

  if (value > 0) {
    ctx.strokeStyle = color
    ctx.beginPath()
    ctx.arc(
      half,
      half,
      half - line / 2,
      (Math.PI / 180) * start,
      (Math.PI / 180) * (((end - start) * value) / 100 + start),
      false
    ) //整圆
    ctx.stroke()
    ctx.closePath()
  }
  if (showText) {
    ctx.fillStyle = color
    ctx.font = `${font}px Arial`
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.fillText((value < 100 ? value.toFixed(1) : 100) + '%', half, half)
  }
}
