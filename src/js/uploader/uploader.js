/**
 * Uploader 无刷新上传文件(next版)
 * 只支持chrome/firefox/IE10+/opera12+
 * @authors yutent (yutent@doui.cc)
 * @date    2016-09-05 19:33:23
 *
 */

"use strict";

define(function(){

/*    var isIE = !!window.VBArray

    function IEVersion(){
        if(document.documentMode)
            return document.documentMode

        return window.XMLHttpRequest ? 7 : 6
    }*/

    var Uploader = function(){
            this.init()
        }

    Uploader.prototype = {
        init: function(){
            this.xhr = new XMLHttpRequest()
            this.form = new FormData()
            this.field = {}
            this.header = {}
            return this
        },
        setUrl: function(url){
            if(!url || typeof url !== 'string')
                return console.error('url不能为空且必须是字符串')

            this.url = url
            return this
        },
        setField: function(key, val){
            if(typeof key === 'object'){
                for(var i in key){
                    this.field[i] = key[i]
                }
            }else{
                this.field[key] = val
            }
            return this
        },
        setHeader: function(key, val){
            if(typeof key === 'object'){
                for(var i in key){
                    this.header[i] = key[i]
                }
            }else{
                this.header[key] = val
            }
            return this
        },
        start: function(){
            var _this = this
            if(!this.url)
                return console.error('请先设置url')

            this.xhr.open('POST', this.url, true)

            for(var i in this.field){
                this.form.append(i, this.field[i])
            }

            var startTime = Date.now()

            this.xhr.upload.addEventListener('progress', function(evt){

                if(evt.lengthComputable && _this.progress){
                    var now = Date.now()
                    var upSize = (evt.loaded * 1000) / 1024
                    var res = {loaded: evt.loaded, time: now - startTime}
                    res.speed = upSize / res.time

                    if(res.speed < 10){
                        res.speed = Math.floor(res.speed * 1024) + ' B/s'
                    }else{
                        res.speed = res.speed.toFixed(2) + ' KB/s'
                    }

                    res.progress = Math.round(evt.loaded * 100 / evt.total)
                    _this.progress(res)
                }

            }, false)
 
            this.xhr.onreadystatechange = function(){
                if(_this.xhr.readyState === 4 && 
                _this.xhr.status === 200 &&
                _this.xhr.responseText !== ''){
                    var res = _this.xhr.responseText
                    try{
                        res = JSON.parse(res)
                    }catch(err){}
                    _this.end && _this.end(res)
                }else{
                    if(_this.xhr.status !== 200 && _this.xhr.responseText)
                        _this.error && _this.error(_this.xhr.responseText)
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
        },
        onError: function(fn){
            this.error = fn
            return this
        }
        
        
    }




    if(!window.Uploader)
        window.Uploader = Uploader


    return Uploader

})