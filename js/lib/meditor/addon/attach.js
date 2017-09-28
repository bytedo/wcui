/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-19 21:17:26
 *
 */

"use strict";


define([
    'lib/layer/base',
    'css!./attach'
    ], function(){

    var Uploader = function(url){
        this.url = url || ''
        this.init()
    }

    Uploader.prototype = {
        init: function(){
            this.xhr = new XMLHttpRequest()
            this.form = new FormData()
            return this
        },
        field: function(key, val){
            if(typeof key === 'object'){
                for(var i in key){
                    this.form.append(i, key[i])
                }
            }else{
                this.form.append(key, val)
            }
            return this
        },
        start: function(){
            var _this = this

            this.xhr.open('POST', this.url, true)

            var startTime = Date.now()

            this.xhr.upload.addEventListener('progress', function(evt){

                if(evt.lengthComputable && _this.progress){
                    var res = Math.round(evt.loaded * 100 / evt.total)
                    _this.progress(res)
                }

            }, false)
 
            this.xhr.onreadystatechange = function(){
                if(_this.xhr.readyState === 4){
                    if(_this.xhr.status >= 200 && _this.xhr.status < 205){
                        var res = _this.xhr.responseText
                        try{
                            res = JSON.parse(res)
                        }catch(err){}
                        _this.end && _this.end(res)
                    }else{
                        console.error(_this.xhr)
                    }
                }
            }

            this.xhr.send(this.form)

        },
        onProgress: function(fn){
            this.progress = fn
            return this
        },
        onEnd: function(fn){
            this.end = fn
            return this
        }
    }


    function uploadScreenshot(vm, blob){
        var upload = new Uploader(vm.uploadUrl || ME.uploadUrl)
        if(ME.beforeUpload){
            ME.beforeUpload(Date.now().toString(16) + '.jpg', function(qn){
                upload.field('file', blob)
                    .field('token', qn.token)
                    .field('key', qn.key)
                    .onEnd(function(json){
                        ME.insert(vm.$editor, '![截图](' + qn.url + ')')
                    })
                    .start()
            })
        }else{
            upload.field('file', blob)
                .onEnd(function(json){
                    ME.insert(vm.$editor, '![截图](' + json.data.url + ')')
                })
                .start()
        }
    }


    var $init = function(vm){
            if(!vm.uploadUrl && !ME.uploadUrl){
                console.error('使用附件上传,必须先设置uploadUrl;\n可以给vm增加uploadUrl属性,也可以通过ME.uploadUrl设置')
            }
            if(!vm.manageUrl && !ME.manageUrl){
                console.error('使用附件管理功能,必须先设置manageUrl;\n可以给vm增加manageUrl属性,也可以通过ME.manageUrl设置')
            }
            if(!ME.maxSize){
                ME.maxSize = 4194304
            }

            vm.$editor.addEventListener('paste', function(ev){
                var txt = ev.clipboardData.getData('text/plain').trim(),
                    html = ev.clipboardData.getData('text/html').trim();

                //文本类型直接默认处理
                if(txt || html){
                    return
                }

                if(ev.clipboardData.items){
                    var items = ev.clipboardData.items,
                        len = items.length,
                        blob = null;
                    for(var i = 0,it; it = items[i++];){
                        if(it.type.indexOf('image') > -1){
                            blob = it.getAsFile()
                        }
                    }

                    if(blob !== null) {
                        layer.msg('截图处理中...')
                        // 压缩截图,避免文件过大
                        var reader = new FileReader()
                        reader.onload = function(){
                            var img = document.createElement('img'),
                                canvas = document.createElement('canvas')

                            img.onload = function(){
                                canvas.width = img.width
                                canvas.height = img.height

                                var ctx = canvas.getContext('2d')
                                ctx.clearRect(0,0, canvas.width, canvas.height)
                                ctx.drawImage(this, 0, 0, canvas.width, canvas.height)


                                if(canvas.toBlob){
                                    canvas.toBlob(function(obj){
                                        uploadScreenshot(vm, obj)
                                    }, 'image/jpeg', 0.8)
                                }else{
                                    var base64 = canvas.toDataURL('image/jpeg', 0.8),
                                        buf = atob(base64.split(',')[1]),
                                        arrBuf = new ArrayBuffer(buf.length),
                                        intArr = new Uint8Array(arrBuf),
                                        obj = null;

                                    for(var i = 0; i < buf.length; i++){
                                        intArr[i] = buf.charCodeAt(i)
                                    }
                                    obj = new Blob([intArr], {type: 'image/jpeg'})
                                    uploadScreenshot(vm, obj)
                                }

                                
                            }
                            img.src = this.result
                        }
                        reader.readAsDataURL(blob)
                    }
                }
                ev.preventDefault()
            })
        },
        lang = {
            image: ['远程图片', '图片管理', '图片描述', '图片地址'],
            file: ['远程附件', '附件管理', '附件描述', '附件地址']
        },
        opened = false, //记录是否已经打开
        openType = 'image', //打开类型, 图片/附件
        cache = { //缓存附件列表
            image: [],
            file: []
        },
        fixCont = function(){
            return '<div class="do-meditor-attach meditor-font">'
                + '<dl class="attach-wrap">'
                    + '<dt class="tab-box" :drag="do-layer" data-limit="window">'
                        + '<span class="item" :class="active:tab === 1" :click="$switch(1)">' + lang[openType][0] +'</span>'
                        + '<span class="item" :class="active:tab === 2" :click="$switch(2)">本地上传</span>'
                        + '<span class="item" :class="active:tab === 3" :click="$switch(3)">' + lang[openType][1] + '</span>'
                        + '<a href="javascript:;" :click="no" class="action-close def-font"></a>'
                    + '</dt>'
                    + '<dt class="cont-box">'
                        + '<div class="remote" :visible="tab === 1">'
                            + '<section class="section"><span class="label">'+ lang[openType][2] + '</span>'
                                + '<input class="input" :duplex="attachAlt" />'
                            + '</section>'
                            + '<section class="section"><span class="label">'+ lang[openType][3] + '</span>'
                                + '<input class="input" :duplex="attach" />'
                            + '</section>'
                            + '<section class="section">'
                                + '<a href="javascript:;" class="submit" :click="$confirm">确定</a>'
                            + '</section>'
                        + '</div>'
                        + '<div class="local" :visible="tab === 2">'
                            + '<div class="select-file"><input id="meditor-attch" multiple :change="$change" type="file" class="hide" /><span class="file" :click="$select">选择文件</span><span class="tips">(上传大小限制:单文件最大'
                                + (ME.maxSize/1048576).toFixed(2)
                                + 'MB)</span></div>'
                            + '<ul class="upload-box">'
                                + '<li class="tr thead"><span class="td name">文件名</span><span class="td progress">上传进度</span><span class="td option">操作</span></li>'
                                + '<li class="tr" :repeat="uploadFile">'
                                    + '<span class="td name" :text="el.name"></span>'
                                    + '<span class="td progress" :html="el.progress"></span>'
                                    + '<span class="td option"><a href="javascript:;" :click="$insert(el)">插入</a></span>'
                                + '</li>'
                            + '</ul>'
                        + '</div>'
                        + '<ul class="manager" :visible="tab === 3">'
                            + '<li class="item" :repeat="attachList" :click="$insert(el)">'
                                + '<span class="thumb" :html="el.thumb"></span>'
                                + '<p class="name" :attr-title="el.name" :text="el.name"></p>'
                            + '</li>'
                        + '</ul>'
                    + '</dt>'
                + '</dl>'
            + '</div>'
        };

    /**
     * [uploadFile 文件上传]
     * @param  {[type]} files [文件列表]
     * @param  {[type]} vm    [vm对象]
     * @param  {[type]} type  [image/file]
     */
    function uploadFile(files, vm){
        for(var i = 0, it; it = files[i++];){

            if(openType === 'image' && !/\.(jpg|jpeg|png|gif|bmp|webp|ico)$/.test(it.name)){
                vm.uploadFile.push({name: it.name, progress: '<span class="red">0%(失败,不允许的文件类型)</span>', url: ''})
                continue
            }
            if(it.size > ME.maxSize){
                vm.uploadFile.push({name: it.name, progress: '<span class="red">0%(文件体积过大)</span>', url: ''})
                continue
            }
            var fixName = Date.now().toString(16) + it.name.slice(it.name.lastIndexOf('.'))

            var idx = vm.uploadFile.length,
                upload = new Uploader(vm.uploadUrl || ME.uploadUrl)

            vm.uploadFile.push({name: it.name, progress: '0%', url: ''})

            upload.field('file', it)

            if(ME.beforeUpload){
                ME.beforeUpload(fixName, function(qn){
                    
                    upload.field('token', qn.token)
                        .field('key', qn.key)
                        .onProgress(function(val){
                            vm.uploadFile[idx].progress = val + '%'
                        }).onEnd(function(json){
                            vm.uploadFile[idx].url = qn.url
                        }).start()
                })
            }else{
                upload.onProgress(function(val){
                        vm.uploadFile[idx].progress = val + '%'
                    }).onEnd(function(json){
                        vm.uploadFile[idx].url = json.data.url
                    }).start()
            }
        }
    }

    function getAttach(vm, cb){
        var xhr = new XMLHttpRequest(),
            url = vm.manageUrl || ME.manageUrl;

        if(/\?/.test(url)){
            url += '&type=' + openType
        }else{
            url += '?type=' + openType
        }
        url += '&t=' + Math.random()
        
        xhr.open('GET', url, true)
        xhr.onreadystatechange = function(){
            if(this.readyState === 4 && 
            this.status === 200 &&
            this.responseText !== ''){
                var res = this.responseText
                try{
                    res = JSON.parse(res)
                }catch(err){}
                cb(res)
            }else{
                if(this.status !== 200 && this.responseText)
                    console.error(this.responseText)
            }
        }
        xhr.send()
    }

    function showDialog(elem, vm){
        opened = true
        var offset = yua(elem).offset(),
            layid = layer.open({
                type: 7,
                menubar: false,
                shade: false,
                fixed: true,
                offset: [offset.top + 37 - ME.doc.scrollTop()],
                tab: 2,
                attach: '',
                attachAlt: '',
                uploadFile: [], //当前上传的列表
                attachList: [], //附件管理列表
                $switch: function(id){
                    var lvm = yua.vmodels[layid]

                    lvm.tab = id
                    if(id === 3){
                        lvm.attachList.clear()
                        if(cache[openType].length){
                            lvm.attachList = cache[openType]
                        }else{
                            getAttach(vm, function(json){
                                if(json){
                                    cache[openType] = json.data.list.map(function(it){
                                        it.thumb = openType === 'image' ? '<img src="' + it.url + '"/>' : '<em class="attac-icon">&#xe603;</em>'
                                        return it
                                    })
                                    lvm.attachList = json.data.list
                                }
                            })
                        }
                    }
                    
                    
                },
                $select: yua.noop,
                $change: yua.noop,
                $insert: function(it){
                    if(!it.url){
                        return
                    }
                    var val = (openType === 'image' ? '!' : '')
                            + '[' + it.name + '](' + it.url + ')'
                    ME.insert(vm.$editor, val)
                },
                $confirm: function(){
                    var lvm = yua.vmodels[layid]
                    if(!lvm.attach || !lvm.attachAlt){
                        return layer.alert('描述和地址不能为空')
                    }
                    var val = '![' + lvm.attachAlt + '](' + lvm.attach + ')'

                    ME.insert(vm.$editor, val)
                    lvm.no()
                },
                success: function(id){
                    var _this = yua.vmodels[id],
                        $file = document.body.querySelector('#meditor-attch')

                    _this.no = function(){
                        layer.close(id)
                        opened = false
                    }
                    _this.$select = function(){
                        var ev = document.createEvent('MouseEvent')
                        ev.initEvent('click', false, false)
                        $file.dispatchEvent(ev);
                    }
                    _this.$change = function(){
                        uploadFile(this.files, _this)
                    }
                },
                content: fixCont()
            })
    }


    ME.addon.image = function(elem, vm){
        if(opened){
            return
        }
        openType = 'image'
        showDialog(elem, vm)
    }


    ME.addon.file = function(elem, vm){
        if(opened){
            return
        }
        openType = 'file'
        showDialog(elem, vm)
    }









    return $init


})