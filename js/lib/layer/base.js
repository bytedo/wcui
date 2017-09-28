/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-21 01:36:29
 *
 */

"use strict";


define(['yua', 'lib/drag/main', 'css!./skin/def'], function(yua){

    if(window.layer){
        return window.layer
    }

    yua.ui.layer = '1.0.0-base'
    var layerDom = {},
        layerObj = {},
        unique = null, //储存当前打开的1/2/3类型的弹窗
        lid = 0,
        defconf = {
            type: 1, // 弹窗类型
            skin: 'def', //默认主题
            icon: 1, //图标类型
            background: '#fff',
            shade: true, //遮罩
            shadeClose: false, //遮罩点击关闭弹窗
            radius: '0px', //弹窗圆角半径
            area: ['auto', 'auto'],
            title: '提示', //弹窗主标题(在工具栏上的)
            menubar: true, //是否显示菜单栏
            content: '', // 弹窗的内容
            fixed: false, //是否固定不可拖拽
            offset: null, //弹窗出来时的坐标, 为数组,可有4个值,依次是 上右下左
            btns: ['确定', '取消'], //弹窗的2个按钮的文字
            yes: yua.noop, //确定按钮对应的回调
            no: yua.noop, //取消按钮对应的回调
            success: null //弹窗初始化完成时的回调
        },
        uuid = function(){
            return 'layer-' + (++lid)
        },
        close = function(id){
            if(typeof id !== 'string' && typeof id !== 'number'){
                return yua.error('要关闭的layer实例不存在')
            }
            if(/^\$wrap\-/.test(id) || layerObj['$wrap-' + id]){

                try {
                    id = (layerObj['$wrap-' + id] ? '$wrap-' : '') + id;
                    //未显示过,忽略
                    if(!layerObj[id].show){
                        return
                    }
                    layerObj[id].parentElem.replaceChild(layerObj[id].wrap, layerDom[id][1])
                    layerObj[id].wrap.style.display = 'none'
                    layerObj[id].show = false

                }catch(err){}
            }else{
                try {
                    document.body.removeChild(layerDom[id][1])
                    document.body.removeChild(layerDom[id][0])
                    unique = null
                }catch(err){}

                delete layerDom[id]
                delete yua.vmodels[id]
            }
        },
        reapeat = function(str, num){
            var idx = 0,
                result = ''
            while(idx < num){
                result += str
                idx++
            }
            return result
        },
        fixOffset = function (val){
            if(!val && val !== 0){
                return 'auto'
            }else{
                return val
            }
        },
        __constructor = function(conf){
            if(conf){
                this.ready(conf).append().show()
            }
        },
        __layer = {
            alert: function(msg, conf){
                if(typeof conf === 'function'){
                    conf = {yes: conf, no: conf}
                }else if(typeof conf === 'object'){
                    conf = conf
                }else{
                    conf = {}
                }
                conf.icon = 5
                conf.content = msg
                return __layer.open(conf)
            },
            confirm: function(msg, yescb, nocb){
                var conf = {}
                if(typeof yescb === 'function'){
                    conf = {yes: yescb}
                }else if(typeof yescb === 'object'){
                    conf = yescb
                }
                conf.type = 2
                conf.icon = 0
                conf.content = msg
                if(typeof nocb === 'function'){
                    conf.no = nocb
                }
                return __layer.open(conf)
            },
            msg: function(msg, conf){
                if(typeof conf !== 'object'){
                    var tmp = conf
                    conf = {timeout: 2500}
                    if(typeof tmp === 'number'){
                        conf.icon = tmp
                    }
                }

                if(!conf.hasOwnProperty('timeout')){
                    conf.timeout = 2500
                }

                conf.specialMode = true;//特殊模式
                conf.content = '<p class="msg-box">' + msg + '</p>'
                conf.type = 7
                conf.fixed = true
                conf.shade = false
                conf.menubar = false
                conf.radius = '5px'
                return __layer.open(conf)
            },
            loading: function(style, time, cb){
                style = style >>> 0

                if(typeof time === 'function'){
                    cb = time;
                    time = 0
                } else{
                    time = time >>> 0
                    if(typeof cb !== 'function'){
                        cb = yua.noop
                    }
                }
                return __layer.open({type: 6, load: style, yes: cb, timeout: time, menubar: false, background: 'none', fixed: true})
            },
            tips: function(msg, elem, conf){
                if(!(elem instanceof HTMLElement)){
                    return yua.error('tips类型必须指定一个目标容器')
                }
                if(typeof conf !== 'object'){
                    var tmp = conf
                    conf = {timeout: 2500}
                    if(typeof tmp === 'number'){
                        conf.icon = tmp
                    }
                }
                if(!conf.hasOwnProperty('timeout')){
                    conf.timeout = 2500
                }
                if(!conf.background){
                    conf.background = 'rgba(0,0,0,.5)'
                }
                if(!conf.color){
                    conf.color = '#fff'
                }
                conf.$elem = elem
                conf.content = msg
                conf.type = 5;
                conf.icon = 0;
                conf.fixed = true;
                conf.shade = false;
                conf.menubar = false;
                return __layer.open(conf)
            },
            prompt: function(msg, yescb){
                if(typeof yescb !== 'function'){
                    return console.error('argument [callback] requires a function, but ' + (typeof yescb) + ' given')
                }
                var conf = {
                        type: 3,
                        prompt: '',
                        title: msg,
                        content: '<input class="prompt-value" :class="{alert: !prompt}" :duplex="prompt" />',
                        yes: function(id){
                            if(!yua.vmodels[id].prompt){
                                return
                            }
                            yescb(id, yua.vmodels[id].prompt)
                        }
                    }
                return __layer.open(conf)
            },
            use: function(skin, callback){
                require(['css!./skin/' + skin], callback)
            },
            close: close,
            open: function(conf){
                if(typeof conf === 'string'){
                    conf = '$wrap-' + conf
                    if(!layerObj[conf]){
                        throw new Error('layer实例不存在')
                    }else{
                        //只能显示一个实例
                        if(layerObj[conf].show){
                            return conf
                        }
                        layerObj[conf].show = true

                        if(!yua.vmodels[conf]){
                            yua(layerObj[conf].obj.init)
                        }

                        layerObj[conf].parentElem.appendChild(layerDom[conf][1])
                        layerDom[conf][1].querySelector('.detail').appendChild(layerObj[conf].wrap)
                        layerObj[conf].wrap.style.display = ''
                        yua.scan(layerDom[conf][1])
                        layerObj[conf].obj.show()
                        return conf
                    }
                }else{
                    return new __constructor(conf).init.$id
                }
            },
            version: yua.ui.layer
        };
    

    defconf.yes = defconf.no = close
    /*type: { // 弹窗类型对应的id值
        1: 'alert',
        2: 'confirm',
        3: 'prompt',
        4: 'iframe',
        5: 'tips',
        6: 'loading',
        7: 'msg',
    }*/
    __constructor.prototype = {
        dot: { //loading的子元素数量
            1: 0,
            2: 0,
            3: 5,
            4: 5,
            5: 9
        },
        timeout: null,
        create: function(){
            var layBox = document.createElement('div'),
                coverBox = document.createElement('div');

            coverBox.className = 'do-layer-cover type-' + this.init.type
            // 允许点击遮罩关闭弹层时, 添加控制器
            if(this.init.shadeClose){
                coverBox.setAttribute(':controller', this.cInit.$id)
                coverBox.setAttribute(':click', 'close(\'' + this.init.$id + '\')')
            }
            
            layBox.className = 'do-layer skin-'
                + this.init.skin
                + (this.init.type === 5 && ' active' || '')
                + ' type-'
                + ((!this.init.specialMode && this.init.type === 7) ? 'unspecial' : this.init.type);

            //暂时隐藏,避免修正定位时,能看到闪一下
            layBox.style.visibility = 'hidden'
            layBox.style.borderRadius = this.init.radius
      
            layBox.setAttribute(':controller', this.init.$id)

            //没有菜单栏, 且未禁止拖拽,则加上可拖拽属性
            if(!this.init.menubar && !this.init.fixed){
                layBox.setAttribute(':drag', '')
                layBox.setAttribute('data-limit', 'window')
            }

            //弹窗的宽高
            var boxcss = ''
            if(this.init.area[0] !== 'auto'){
                boxcss += 'width: ' + this.init.area[0] + ';'
            }
            if(this.init.area[1] !== 'auto'){
                boxcss += 'height: ' + this.init.area[1] + ';'
            }

            layBox.innerHTML = this.getMenubar()
                + '<div class="layer-content do-layer-cl '
                    + (this.init.icon < 0 && 'none-icon' || '')
                    + '" style="'
                    + boxcss
                    + '">'
                + this.getCont()
                + '</div>'
                + this.getBtns()
                + (this.init.type === 5 && '<i class="arrow" style="border-top-color: '
                    + this.init.background
                    + '"></i>' || '')
            delete this.init.wrap
            return [this.init.shade ? coverBox : null, layBox]
        },
        getCont: function(){
            if(this.init.type === 6){
                return this.getLoading(this.init.load)
            }else{
                return this.getIcon()
                    + '<div class="detail" '
                    + (this.init.wrap ?  '' : ':html="content"')
                    + '></div>'
            }
        },
        getLoading: function(style){
            return '<div class="loading-box style-'
                    + style
                    + '">'
                + '<span class="dot-box">'
                    + reapeat('<i></i>', this.dot[style])
                + '</span>'
                + '</div>'
        },
        //获取窗口导航条
        getMenubar: function(){
            var html = ''
            if(this.init.menubar){
                html += '<div class="layer-title do-fn-noselect" ';
                //可拖拽
                if(!this.init.fixed){
                    html += ':drag="do-layer" data-limit="window" '
                }
                
                html += '>{{title}}'
                    + '<a class="action-close do-ui-font" :click="no(\'' + this.init.$id + '\')"></a>'
                    + '</div>'
            }
            return html
        },
        //获取窗口内容的图标
        getIcon: function(){
            if(this.init.icon < 0){
                return ''
            }
            if(this.init.type < 4 || this.init.type === 5 || this.init.specialMode){
                return '<span class="do-ui-font msg-icon icon-' + this.init.icon + '"></span>'
            }
            return ''
        },
        // 获取窗口按钮
        getBtns: function(){
            if(this.init.type > 3){
                return ''
            }else{
                var html = '<div class="layer-btns do-fn-noselect">';
                if(this.init.type > 1){
                    html += '<a href="javascript:;" class="action-no" '
                        + ':click="no(\'' + this.init.$id + '\')" '
                        + ':text="btns[1]"></a>'
                    + '<a href="javascript:;" class="action-yes" '
                        + ':click="yes(\'' + this.init.$id + '\')" '
                        + ':text="btns[0]"></a>'
                }else{
                    html += '<a href="javascript:;" class="action-yes" '
                        + ':click="yes(\'' + this.init.$id + '\')" '
                        + ':text="btns[0]"></a>'
                }
                html += '</div>'

                return html
            }
        },
        append: function(){
            //如果有已经打开的弹窗,则关闭
            if(unique){
                __layer.close(unique)
            }
            if(this.init.type < 4){
                unique = this.init.$id
            }
            layerDom[this.init.$id] = this.create()
            if(layerDom[this.init.$id][0]){
                document.body.appendChild(layerDom[this.init.$id][0])
                //仅在允许点击遮罩时,初始化控制器,减少资源消耗
                if(this.init.shadeClose){
                    yua(this.cInit)
                    yua.scan(layerDom[this.init.$id][0])
                }
            }

            document.body.appendChild(layerDom[this.init.$id][1])
            yua(this.init)
            yua.scan(layerDom[this.init.$id][1])
            return this
        },
        show: function(){
            var _this = this;
            
            setTimeout(function(){
                var style = {visibility: '', background: _this.init.background},
                    css = getComputedStyle(layerDom[_this.init.$id][1]);

                if(_this.init.type === 5){
                    style.color = _this.init.color

                    var $elem = yua(_this.init.$elem),
                        ew = $elem.innerWidth(),
                        ol = $elem.offset().left - document.body.scrollLeft,
                        ot = $elem.offset().top - document.body.scrollTop;

                    style.left = ol + (ew * 0.7)
                    style.top = ot - parseInt(css.height) - 8

                }else{
                    if(_this.init.offset){
                        style.top = fixOffset(_this.init.offset[0])
                        style.right = fixOffset(_this.init.offset[1])
                        style.bottom = fixOffset(_this.init.offset[2])
                        style.left = fixOffset(_this.init.offset[3])
                        //左右都为auto时,改为居中
                        if(style.left === 'auto' && style.right === 'auto'){
                            style.left = '50%'
                            style.marginLeft = -parseInt(css.width) / 2;
                        }
                        //上下都为auto时,同样改为居中
                        if(style.top === 'auto' && style.bottom === 'auto'){
                            style.top = '50%'
                            style.marginTop = -parseInt(css.height) / 2;
                        }
                    }else{
                        style = yua.mix(style, {
                            marginLeft: -parseInt(css.width) / 2,
                            marginTop: -parseInt(css.height) / 2,
                        })
                    }
                }
                
                yua(layerDom[_this.init.$id][1]).css(style)

            }, 4)
  

            if(this.init.success && typeof this.init.success === 'function'){
                //弹窗成功的回调
                this.init.success(this.init.$id)
            }
            // loading类型,回调需要自动触发
            if(this.init.type > 3) {
                //大于0自动触发超时关闭
                if(this.init.timeout > 0){
                    clearTimeout(this.timeout)
                    this.timeout = setTimeout(function(){

                        clearTimeout(_this.timeout)
                        __layer.close(_this.init.$id)

                        // 为loading类型时,自动关闭同时触发回调
                        if(_this.init.type === 6){
                            _this.init.yes(_this.init.$id)
                        }

                    }, this.init.timeout)

                } else if(this.init.type === 6) {
                    // loading类型, 非自动关闭时, 主动触发回调
                    this.init.yes(this.init.$id)
                }
                
            }

        },
        ready: function(conf){
            this.init = yua.mix({}, defconf, conf)
            if(!this.init.$id){
                this.init.$id = uuid();
            }
            if(this.init.icon > 17){
                this.init.icon = 17
            }
            //base版没有iframe类型
            if(this.init.type === 4){
                this.icon.type = 7
            }
            this.cInit = {
                $id: this.init.$id + '-c',
                close: this.init.shadeClose ? close : yua.noop
            };
            return this
        }
    }


    yua.directive('layer', {
        priority: 1400,
        init: function(binding){
            if(!binding.param || binding.param !== 'tips'){
                
                binding.param = '' //去掉param,保证之后的逻辑处理正常
                // 去掉:layer属性,避免二次扫描
                binding.element.removeAttribute(binding.name)
                binding.element.style.display = 'none'
            }
        },
        update: function(val){
            if(!val){
                return yua.error(':layer指令格式不正确或无效属性. [' + this.name + '="' + this.expr + '"]')
            }

            var _this = this,
                init = Object.assign({}, this.element.dataset);

            if(init.hasOwnProperty('area')){
                init.area = init.area.split(',')
            }
            if(init.hasOwnProperty('offset')){
                init.offset = init.offset.split(',')
            }
            if(init.hasOwnProperty('btns')){
                init.btns = init.btns.split(',')
            }
            
            if(!this.param){
                init.wrap = true
                init.type = 7;
                init.$id = '$wrap-' + val;
                if(!init.hasOwnProperty('menubar')){
                    init.menubar = false;
                }

                var tmp = new __constructor().ready(init);
                
                //去掉data-*属性
                for(var i in this.element.dataset){
                    delete this.element.dataset[i]
                }

                layerObj[tmp.init.$id] = {obj: tmp, parentElem: this.element.parentNode, wrap: this.element, show: false};
                layerDom[tmp.init.$id] = tmp.create();
            }else if(this.param === 'tips'){
                var $elem = yua(this.element),
                    ew = $elem.innerWidth(),
                    ol = $elem.offset().left - document.body.scrollLeft,
                    ot = $elem.offset().top - document.body.scrollTop,
                    tipsBox = document.createElement('div'),
                    tipsArrow = document.createElement('i'),
                    tipsCont = document.createElement('div');


                tipsBox.className = 'do-layer skin-' + (init.skin || 'def') + ' type-5'
                tipsBox.style.left = ol + (ew * 0.7) + 'px'
                if(init.background){
                    tipsBox.style.background = init.background
                    tipsArrow.style.borderTopColor = init.background
                }
                if(init.color){
                    tipsBox.style.color = init.color
                }
                tipsCont.className = 'layer-content'
                tipsCont.textContent = val
                tipsArrow.className = 'arrow'
                tipsBox.appendChild(tipsCont)
                tipsBox.appendChild(tipsArrow)



                yua(document).bind('scroll', function(){
                    ol = $elem.offset().left - document.body.scrollLeft;
                    ot = $elem.offset().top - document.body.scrollTop;

                    tipsBox.style.left = ol + (ew * 0.7) + 'px'
                    tipsBox.style.top = (ot - tipsBox.offsetHeight - 8) + 'px'
                })

                $elem.bind('mouseenter', function(ev){
                    _this.element.parentNode.appendChild(tipsBox)
                    clearTimeout(_this.showTime)
                    clearTimeout(_this.hideTime)
                    _this.showTime = setTimeout(function(){
                        tipsBox.style.top = (ot - tipsBox.offsetHeight - 8) + 'px'
                        tipsBox.classList.add('active')
                        
                    }, 4)
                    
                })
                $elem.bind('mouseleave', function(){
                    _this.hideTime = setTimeout(function(){
                        clearTimeout(_this.hideTime)
                        try{
                            _this.element.parentNode.removeChild(tipsBox)
                        }catch(err){}
                    }, 150)
                })
            }
        }
    })



    window.layer = __layer

    return __layer

})