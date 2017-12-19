/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2017-03-17 20:55:57
 *
 */

'use strict'

// 1216fc0c668c09ade029ceae6db87f97cf560e21
define(function() {
    var Avatar = function() {
        this.sum = function(arr) {
            var sum = 0
            arr.forEach(function(it) {
                sum -= -it
            })
        }
    }

    Avatar.prototype = {
        get: function(hash, size) {
            if (!hash) return this.defafultImg

            if (!size || size < 100) {
                size = 100
            }

            var cv = document.createElement('canvas'),
                ct = cv.getContext('2d'),
                bg = hash.slice(-3),
                color = hash.slice(-9, -6),
                fixColor = color,
                lens = hash.slice(0, 8).match(/([\w]{1})/g),
                pos1 = hash.slice(8, 16).match(/([\w]{1})/g),
                pos2 = hash.slice(16, 24).match(/([\w]{1})/g),
                step = size / 10

            cv.width = size
            cv.height = size

            lens = lens.map(c => {
                c = parseInt(c, 16)
                return c % 8
            })
            pos1 = pos1.map(c => {
                c = parseInt(c, 16)
                return c % 4
            })
            pos2 = pos2.map(c => {
                c = parseInt(c, 16)
                return c % 4
            })
            fixColor = this.sum(lens) > 32 ? bg : color

            ct.fillStyle = '#' + bg
            ct.fillRect(0, 0, size, size)

            for (var i = 1; i < 9; i++) {
                var xl = lens[i - 1],
                    xp1 = pos1[i - 1],
                    xp2 = pos2[i - 1]

                if (xl + xp1 > 8) {
                    xl = 8 - xp1
                }
                ct.fillStyle = '#' + color
                ct.fillRect((xp1 + 1) * step, i * step, xl * step, step)

                ct.fillStyle = '#' + color
                ct.fillRect((9 - xp1 - xl) * step, i * step, xl * step, step)

                ct.fillStyle = '#' + fixColor
                ct.fillRect((xp2 + 1) * step, i * step, step, step)

                ct.fillStyle = '#' + fixColor
                ct.fillRect((8 - xp2) * step, i * step, step, step)
            }

            return cv.toDataURL()
        }
    }

    return new Avatar()
})
