/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2016-08-19 10:38:25
 *
 */

'use strict'

define(['avalon'], function(av) {
  av.component('do:count', {
    $replace: true,
    $template:
      '<ul class="do-ui-count"><li class="num-box" ms-repeat-obj="list" ms-class="split:obj.opt === 0"><span class="num" ms-repeat="obj.val">{{el}}</span></li></ul>',
    maxLen: 8,
    speed: 1,
    update: av.noop,
    list: [],
    $list: [],
    total: 0,
    style: 2,
    $construct: function(opt, a, b) {
      var vm = av.mix(a, b)
      document.head.insertAdjacentHTML(
        'afterBegin',
        '<style>' +
          '.do-ui-count {width: 100%;height: 50px;text-align:center;}' +
          '.do-ui-count li.num-box {overflow:hidden;display: inline-block;position: relative;width: 40px;height: 50px;margin:0 15px;line-height: 50px;background: #09f;font-size: 30px;}' +
          '.do-ui-count li.num-box .num {display: block;width: 100%;height: 50px;margin-top: 0;transition: .3s ease-in-out}' +
          '.do-ui-count li.num-box.split {width: auto;margin:0;background: none;}' +
          '</style>'
      )

      vm.total = vm.total >> 0
      vm.maxLen = vm.maxLen || 8

      return av.mix(opt, vm)
    },
    $ready: function(vm, ele) {
      function updateList(val) {
        val = numberFormat(val, vm.maxLen)

        vm.$list = []
        vm.$list = val.split('')
        if (vm.style === 2) {
          vm.$list = vm.$list.reverse()
          val = vm.$list.join('').replace(/([\d,]{3})/g, '$1,')
          val = val.replace(/^,|,$/g, '')
          vm.$list = val.split('').reverse()
        }

        vm.$list.forEach(function(it, i) {
          if (it === ',') {
            if (!vm.list[i]) vm.list.push({ opt: 0, val: [it] })
          } else {
            if (vm.list[i]) {
              if (it !== vm.list[i].last) {
                vm.list[i].last = it
                vm.list[i].val.push(it)
                var curr = ele.querySelectorAll('.num-box')[i]
                curr.querySelector('.num').style.marginTop =
                  vm.speed * 50 + 'px'
                setTimeout(function() {
                  vm.list[i].val.shift()
                }, 300)
              }
            } else {
              vm.list.push({ opt: 1, last: it, val: [it] })
            }
          }
        })
      }

      updateList(vm.total)

      vm.update = function(val) {
        if (val < 0)
          //确定滚动方向
          vm.speed = 1
        else vm.speed = -1

        vm.total = vm.total - 0 + val
      }

      vm.$watch('total', function(n, o) {
        if (n === o) return

        updateList(n)
      })
    }
  })

  //数字长度补全（前面加0）
  function numberFormat(num, len) {
    num += ''
    if (num.length >= len) return num

    while (num.length < len) num = '0' + num
    return num
  }

  return av
})
