/**
 *
 * @authors linteng (875482941@qq.com)
 * @date    2017-09-07 19:53:18
 */

define(["yua", "text!./main.htm", "css!./main"], function(yua, tpl){

    var dom;
    function getWidth(){}

    /**
     * [根据当前幻灯片索引获取填充底下按钮数据]
     * @param  {Object} vm [vm对象]
     * @return {[Array]}    [填充到按钮的数据]
     */
    function getBtnList(vm){
        var currWidth = vm.currWidth.slice(0, -2)
        vm.maxNum = Math.floor(currWidth / 130)
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
        }, vm.time)
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

            vm.$setSliderType = function(type){
                vm.sliderType = type
                yua.log(vm.sliderType)
            }

            vm.$watch('curr', function(val, old) {
                vm.currWidth = getWidth()
                var width
                if(vm.currWidth.indexOf('px') > -1)
                    width = vm.currWidth.slice(0, vm.currWidth.indexOf('px'))

                vm.animation = 'translate(' + (-width * val) + 'px, 0)'
                if(vm.preview && vm.maxNum < vm.sliderList.length){
                    vm.sliderBtnList.removeAll()
                    vm.sliderBtnList.pushArray(getBtnList(vm))
                }
            })

            window.addEventListener('resize', function(){
                vm.currWidth = getWidth()
                var width
                if(vm.currWidth.indexOf('px') > -1)
                    width = vm.currWidth.slice(0, vm.currWidth.indexOf('px'))

                vm.animation = 'translate(' + (-width * vm.curr) + 'px, 0)'
                if(vm.preview && vm.maxNum < vm.sliderList.length){
                    yua.log(vm.maxNum , vm.sliderList.length)
                    vm.sliderBtnList.removeAll()
                    vm.sliderBtnList.pushArray(getBtnList(vm))
                }
            }, false)

            vm.$onSuccess(vm)
        },
        $ready: function(vm){
            dom = document.querySelector('.do-sliders')

            /**
             * [获取当前幻灯片元素宽度]
             */
            getWidth = function(){

                return window.getComputedStyle ? window.getComputedStyle(dom).width : dom.offsetWidth + 'px'
            }

            vm.currWidth = getWidth()
            if(vm.autoSlide)
                autoSlide(vm)

            if(vm.preview){
                vm.sliderBtnList.removeAll()
                vm.sliderBtnList.pushArray(getBtnList(vm))
            }
            yua.log(vm)
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
        preview: true,
        skin: 'skin-0',

        $onSuccess: yua.noop,
        $setSliderList: yua.noop,
        $setSliderType: yua.noop,
        $jump: yua.noop,
        $stopSlide: yua.noop,
        $startSlide: yua.noop,
        $go: yua.noop,
    })

    yua.scan(dom)

})
