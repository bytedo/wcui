/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-03-29 18:39:35
 *
 */

"use strict";

define(['yua'], function(){

    function getBindingCallback(elem, name, vmodels) {
        var callback = elem.getAttribute(name)
        if (callback) {
            for (var i = 0, vm; vm = vmodels[i++]; ) {
                if (vm.hasOwnProperty(callback) && typeof vm[callback] === "function") {
                    return vm[callback]
                }
            }
        }
    }

    // 元素拖动
    yua.directive('drag', {
        priority: 1500,
        init: function(binding){
            binding.expr = '"' + binding.expr + '"'
            yua(binding.element).css('cursor', 'move')

            //取得拖动的3种状态回调
            //按下,且拖拽之前
            binding. beforedrag = getBindingCallback(binding.element, 'data-beforedrag', binding.vmodels)
            //拖拽过程
            binding.dragging = getBindingCallback(binding.element, 'data-dragging', binding.vmodels)
            // 拖拽结束,且释放鼠标
            binding.dragged = getBindingCallback(binding.element, 'data-dragged', binding.vmodels)

            //获取是否允许溢出可视区
            binding.overflow = !!binding.element.dataset.overflow

            //方向,x轴, y轴, xy轴
            binding.axis = 'xy'
            if(!!binding.element.dataset.axis){
                binding.axis = binding.element.dataset.axis
                delete binding.element.dataset.axis
            }

            //默认不限制拖拽区域
            binding.limit = false
            if(!!binding.element.dataset.limit) {
                binding.limit = binding.element.dataset.limit
                delete binding.element.dataset.limit
            }

            // 如果不限制,则允许溢出
            if(binding.limit === false) {
                binding.overflow = true
            }

            delete binding.element.dataset.overflow
            delete binding.element.dataset.beforedrag
            delete binding.element.dataset.dragging
            delete binding.element.dataset.dragged
        },
        update: function(val){
            var _this = this,
                target = val ? this.element.parentNode : this.element,
                $drag = yua(this.element),
                $doc = yua(document),
                $target = null,
                parent = null;

            // val值不为空时, 获取真正的拖动元素
            // 仅从父级上找
            while(val && target){
                if(target.classList.contains(val) || target.id === val){
                    break
                }else{
                    target = target.parentNode
                }
            }
            $target = yua(target);
            // 限制范围为parent时,获取父级元素
            if(this.limit === 'parent'){
                parent = target.parentNode
            }


            var dx,dy,mx,my,ox,oy,tw,th,ww,wh,bst,bsl;
            $drag.bind('mousedown', function(ev){
                var gcs = getComputedStyle(target),
                    cst = gcs.transform.replace(/matrix\((.*)\)/, '$1'),
                    offset = $target.offset();

                cst = cst !== 'none' ? cst.split(', ') : [1,0,0,1,0,0]
                cst[4] -= 0
                cst[5] -= 0

                //记录初始的transform位移
                dx = cst[4]
                dy = cst[5]

                //滚动条的偏移
                bst = document.body.scrollTop
                bsl = document.body.scrollLeft

                // 计算元素的offset值, 需要修正
                ox = offset.left - dx - bsl
                oy = offset.top - dy - bst

                mx = ev.pageX //按下鼠标的的坐标值
                my = ev.pageY //按下鼠标的的坐标值

                // 在按下时才获取窗口大小, 是为了防止人为的改变窗口大小,导致计算不准备
                // 同时减少不必要的事件监听(页面上可能会很多可拖动元素)
                ww = window.innerWidth;
                wh = window.innerHeight;

                // 同样,在点击之后获取元素的宽高,可保证获取到的是真实的值
                tw = target.clientWidth;
                th = target.clientHeight;

                //拖拽前回调
                if(_this.beforedrag){
                    _this.beforedrag.call(_this.vmodels, target, ox, oy)
                }

                //限制区域, 4个值依次是: 上, 下, 左, 右
                var limit = [0, wh - th, 0, ww - tw]

                if(_this.limit === 'parent') {
                    var pgcs = getComputedStyle(parent),
                        pcst = pgcs.transform.replace(/matrix\((.*)\)/, '$1'),
                        poffset = yua(parent).offset();

                    pcst = pcst !== 'none' ? pcst.split(', ') : [1,0,0,1,0,0]

                    var pox = poffset.left - pcst[4] - bsl,
                        poy = poffset.top - pcst[5] - bst;

                    limit = [poy, poy + parent.clientHeight - th, pox, pox + parent.clientWidth - tw]
                }

                var mvfn = $doc.bind('mousemove', function(ev){

                        //坐标轴限制
                        if(_this.axis !== 'y'){
                            cst[4] = ev.pageX - mx + dx
                        }
                        if(_this.axis !== 'x'){
                            cst[5] = ev.pageY - my + dy
                        }
                        
                        
                        var fox = ox + cst[4], //修正的offset
                            foy = oy + cst[5]; //修正的offset


                        //如果不允许溢出可视区
                        if(!_this.overflow){
                            if(_this.axis !== 'y'){
                                if(fox <= limit[2]) {
                                    fox = limit[2]
                                    //修正矩阵
                                    cst[4] = fox - ox
                                }
                                if(fox >= limit[3]){
                                    fox = limit[3]
                                    //修正矩阵
                                    cst[4] = fox - ox
                                }
                            }

                            if(_this.axis !== 'x'){
                                if(foy <= limit[0]) {
                                    foy = limit[0]
                                    //修正矩阵
                                    cst[5] = foy - oy
                                }
                                if(foy >= limit[1]){
                                    foy = limit[1]
                                    //修正矩阵
                                    cst[5] = foy - oy
                                } 
                            }
                            
                        }

                        $target.css({
                            transform: 'matrix(' + cst.join(', ') + ')'
                        })

                        //拖拽过程的回调
                        if(_this.dragging){
                            _this.dragging.call(_this.vmodels, target, fox, foy)
                        }
                        // 防止拖动到边缘时导致页面滚动
                        ev.preventDefault()
                    }),
                    upfn = $doc.bind('mouseup', function(ev){
                        $doc.unbind('mousemove', mvfn)
                        $doc.unbind('mouseup', upfn)
                        //结束回调
                        if(_this.dragged){
                            _this.dragged.call(_this.vmodels, target, fox, foy)
                        }
                    });

            })

        }
    })




})
