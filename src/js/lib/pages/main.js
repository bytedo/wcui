"use strict";
define(["yua","text!./main.htm", "css!./main"], function(yua, tpl) {

    yua.ui.pages = '1.0.0'
    var colors = {plain: 1, green: 1, blue: 1, red: 1, orange: 1, grey: 1},
        themes = ['skin-1 ', 'skin-2 '];
    //计算页码列表
    function calculate(vm){
        if (vm.total < 2)
            return vm.pageList.clear();

        var arr = [],
            mid = vm.curr < vm.max / 2 ? vm.max - vm.curr : Math.floor(vm.max / 2);

        if(vm.curr - mid > 1){
            arr.push('...')
        }
        for (var i = vm.curr - mid; i < vm.curr + mid + 1 && i <= vm.total; i++){
            if(i > 0){
                arr.push(i)
            }
        }
        if(vm.curr + mid < vm.total){
            arr.push('...')
        }
        vm.pageList.clear()
        vm.pageList.pushArray(arr)
    }

    function update(pid, vm) {
        if(pid < 1){
            pid = vm.input = 1
        }
        if(pid > vm.total){
            pid = vm.input = vm.total
        }
        if(pid !== vm.curr){
            vm.curr = vm.input = pid
            vm.$onJump(pid)
        }
    }

    return yua.component('pages', {
        $template: tpl,
        $construct: function(a, b, c){
            yua.mix(a, b, c)
            a.theme = themes[a.theme>>0]
            if(!a.theme){
                a.theme = themes[0]
            }
            if(a.color && colors[a.color]){
                a.theme += a.color
            }else{
                a.theme += 'plain'
            }
            delete a.color
            return a
        },
        $init: function(vm) {

            calculate(vm)

            vm.$setUrl = function(val) {
                if(!vm.url
                    || '...' === val
                    || vm.curr === val
                    || val > vm.total
                    || 1 > val) {

                    return 'javascript:;'
                }else{
                    return vm.url.replace('{id}', val)
                }
            }
            vm.$forceReset = function(){
                vm.curr = 1
                calculate(vm)
            }

            vm.$jump = function(ev, val) {
                if ('...' !== val) {
                    var link = this.getAttribute('href') || this.getAttribute('xlink:href')

                    if (val !== void 0){
                        if('javascript:;' !== link){
                            location.href = link
                        }
                        var pid = val >> 0;
                        update(pid, vm)
                    } else {
                        vm.input = vm.input >>> 0 || 1;
                        if(13 == ev.keyCode){
                            update(vm.input, vm)
                        }
                    }
                }
            }
            vm.$watch('curr', function(val, old) {
                val = (val >>> 0) || 1
                old = old >>> 0
                if(val !== old){
                    calculate(vm)
                }
            })

            vm.$watch('total', function(val, old) {
                val = (val >>> 0) || 1
                old = old >>> 0
                if(val !== old){
                    calculate(vm)
                }
            })
        },
        $ready: function(vm){
            vm.$onSuccess(vm)
        },
        curr: 1,
        total: 1,
        max: 5,
        url: "javascript:;",
        inputJump: !1,
        simpleMode: !1,
        input: 1,
        pageList: [],
        btns: {
            prev: "<<",
            next: ">>",
            home: "首页",
            end: "末页"
        },
        theme: '',
        $skipArray: ['max', 'btns', 'url', 'theme'],
        $setUrl: yua.noop,
        $jump: yua.noop,
        $onJump: yua.noop,
        $onSuccess: yua.noop,
        $forceReset: yua.noop,
    })
});