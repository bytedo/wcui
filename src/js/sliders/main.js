/**
 *
 * @authors linteng (875482941@qq.com)
 * @date    2017-09-07 19:53:18
 */

define(["yua", "text!./main.htm", "css!./main"], function(yua, tpl){

    var dom;
    var sliderNum = 0;
    var skin = ['skin-0','skin-1','skin-2','skin-3']

    /**
     * [根据当前幻灯片索引获取填充底下按钮数据]
     * @param  {Object} vm [vm对象]
     * @return {[Array]}    [填充到按钮的数据]
     */
    function getBtnList(vm, el){
        if(el){
            dom = el
        }
        vm.maxNum = Math.floor(dom.offsetWidth / 90)
        var curr = vm.curr + 1
        let res = []
        if(!vm.preview)
            res = vm.sliderList

        if(vm.maxNum >= vm.sliderList.length){
            res = vm.sliderList
        }else{
            if(curr > vm.maxNum){
                res = vm.sliderList.slice(curr - vm.maxNum, curr)
            }else if(curr <= vm.maxNum){
                res = vm.sliderList.slice(0, vm.maxNum)
            }
        }
        return res
    }

    /**
     * [设置自动轮播]
     * @param  {[type]} vm [description]
     * @return {[type]}    [description]
     */
    function autoSlide(vm){
        vm.timer = setTimeout(function(){
            vm.$go(1)
            autoSlide(vm)
        }, vm.time <= 0 ? 3000 : vm.time)
    }

    return yua.component("sliders", {
        $template: tpl,
        $init: function(vm){
            vm.$go = function(num){
                vm.curr += num
                if(vm.curr < 0){
                    vm.curr = vm.sliderList.length - 1
                }else if(vm.curr > vm.sliderList.length - 1){
                    vm.curr = 0
                }
            }

            vm.$jump = function(i){
                var curr = vm.curr + 1
                if(curr > vm.maxNum && vm.preview){
                    var distance = vm.maxNum - (i + 1)
                    vm.curr -= distance
                }else{
                    vm.curr = i
                }
            }

            vm.$stopSlide = function(){
                if(vm.autoSlide){
                    clearTimeout(vm.timer)
                }
            }

            vm.$startSlide = function(){
                if(vm.autoSlide)
                    autoSlide(vm)
            }

            vm.$setSliderList = function(list){
                vm.sliderBtnList.removeAll()
                vm.sliderList.pushArray(list)
            }

            vm.$onSuccess(vm)
        },
        $ready: function(vm, el){
            vm.skin = skin[vm.skin]
            vm.currWidth = (100 / vm.sliderList.length)
            if(vm.autoSlide)
                autoSlide(vm)

            if(vm.preview){
                vm.sliderBtnList.removeAll()
                vm.sliderBtnList.pushArray(getBtnList(vm, el))
            }

            vm.$watch('curr', function(val, old) {

                vm.animation = vm.sliderType > 2 ? 'translate(0, ' + (-vm.currWidth * val) + '%)' : 'translate(' + (-vm.currWidth * val) + '%, 0)'
                if(vm.preview && vm.maxNum < vm.sliderList.length){
                    vm.sliderBtnList.removeAll()
                    vm.sliderBtnList.pushArray(getBtnList(vm, el))
                }
            })

            window.addEventListener('resize', function(){

                vm.animation = vm.sliderType > 2 ? 'translate(0, ' + (-vm.currWidth * vm.curr) + '%)' : 'translate(' + (-vm.currWidth * vm.curr) + '%, 0)'
                if(vm.preview && vm.maxNum < vm.sliderList.length){
                    vm.sliderBtnList.removeAll()
                    vm.sliderBtnList.pushArray(getBtnList(vm, el))
                }
            }, false)

            if(vm.sliderType >= 3){
                var now = 0
                var mouseWheelEv = /Firefox/i.test(navigator.userAgent) ? "DOMMouseScroll": "mousewheel"
                var direction = /Firefox/i.test(navigator.userAgent) ? "detail": "deltaY"
                window.addEventListener(mouseWheelEv, function(ev){
                    if(Date.now() - now > 500 || now == 0){

                        if(ev[direction] > 0){
                            vm.$go(1)
                        }else{
                            vm.$go(-1)
                        }
                        now = Date.now()
                    }
                }, false)
            }
        },
        currWidth: 0,
        animation: '',
        curr: 0,
        sliderBtnList: [],
        maxNum: 0,
        timer: yua.noop,
        sliderType: 1,

        sliderList: [],
        autoSlide: '',
        time: 3000,
        preview: false,
        skin: 0,
        fullScreen: false,

        $onSuccess: yua.noop,
        $setSliderList: yua.noop,
        $jump: yua.noop,
        $stopSlide: yua.noop,
        $startSlide: yua.noop,
        $go: yua.noop,
    })

    yua.scan(dom)

})
