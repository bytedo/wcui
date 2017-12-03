/**
 * Request组件, full版, 支持IE6+,chrome,FF
 * @authors yutent (yutent@doui.cc)
 * @date    2016-11-27 13:08:40
 *
 */

"use strict";
var r = []
if(!window.JSON)
    r = ['./json'];

define(r, function(){
    var _request = function(url, protocol){
            this.transport = true
            protocol = (protocol + '').trim().toUpperCase()
            this.xhr = Xhr()
            this.pool = {
                url: (url + '').trim(),
                type: protocol || 'GET',
                form: '',
                headers: {},
                uuid: Math.random().toString(16).substr(2)
            }
        }
    var _requestp = _request.prototype
    var toS = Object.prototype.toString
    var win = window
    var doc = win.document
    var encode = encodeURIComponent
    var decode = decodeURIComponent
    var noop = function(e, res){
            if(e)
                throw new Error(e + '')
        }

    // -----------------------------
    
    // 本地协议判断正则
    var rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/ 
    var isLocal = false
    try{
        isLocal = rlocalProtocol.test(location.protocol)
    }catch(e){}


    var rheaders = /^(.*?):[ \t]*([^\r\n]*)\r?$/mg

    // ----------------- 一些兼容性预处理 --------------------
    
    if(!win.FormData){

    }
    
    //IE8-
    if(String.prototype.trim){
        String.prototype.trim = function(){
            return this.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g, '')
        }
    }
    //IE8-
    if (!Array.prototype.forEach) {

        Array.prototype.forEach = function(callback, thisArg) {

            var T, k;

            if (this === null) 
                throw new TypeError('forEach is not a function of null');

            var O = Object(this);
            var len = O.length >>> 0;

            if (typeof callback !== "function")
                throw new TypeError('callback is not a function');

            if (arguments.length > 1) {
                T = thisArg;
            }


            k = 0;
            while (k < len) {
                var kValue;
                if (k in O) {
                    kValue = O[k];
                    callback.call(T, kValue, k, O);
                }
                k++;
            }
        };
    }

 /*   if (!Array.prototype.filter) {
        Array.prototype.filter = function(fun) {
            'use strict';

            if (this === void 0 || this === null) {
                throw new TypeError('filter is not a function of null');
            }

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== 'function') {
                throw new TypeError('callback is not a function');
            }

            var res = [];
            var thisArg = arguments.length >= 2 ? arguments[1] : void 0;
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i];
                    if (fun.call(thisArg, val, i, t)) {
                        res.push(val);
                    }
                }
            }

            return res;
        };
    }*/
    // IE8-
    if(!Array.isArray){
        Array.isArray = function(arg) {
            return toS.call(arg) === '[object Array]';
        };
    }

    var IE = (function(){
            if(window.VBArray){
                var mode = document.documentMode
                return mode ? mode : (window.XMLHttpRequest ? 7 : 6)
            }
            return 0
        })();

    win.Xhr = (function(){
        var obj = [
                "XMLHttpRequest",
                "ActiveXObject('MSXML2.XMLHTTP.6.0')",
                "ActiveXObject('MSXML2.XMLHTTP.3.0')",
                "ActiveXObject('MSXML2.XMLHTTP')",
                "ActiveXObject('Microsoft.XMLHTTP')"
            ]
        //IE7- 本地打开文件不能使用原生XMLHttpRequest
        obj[0] = (IE < 8 && IE !== 0 && isLocal) ? '!' : obj[0]

        for(var i = 0,a; a = obj[i++];){
            try{
                if(eval('new ' + a)){
                    return new Function('return new ' + a)
                }
            }catch(e){}
        }

    })();
    var supportCors = 'withCredentials' in Xhr()

    // ------------------- 几个解释方法 -----------------------

    var Format = function(){
            this.tagHooks = new function(){
                this.option = doc.createElement('select')
                this.thead = doc.createElement('table')
                this.td = doc.createElement('tr')
                this.area = doc.createElement('map')
                this.tr = doc.createElement('tbody')
                this.col = doc.createElement('colgroup')
                this.legend = doc.createElement('fieldset')
                this._default = doc.createElement('div')
                this.g = doc.createElementNS('http://www.w3.org/2000/svg', 'svg')

                this.optgroup = this.option
                this.tbody = this.tfoot = this.colgroup = this.caption = this.thead
                this.th = this.td
            };
            var _this = this
            'circle,defs,ellipse,image,line,path,polygon,polyline,rect,symbol,text,use'.replace(/,/g, function(m){
                _this.tagHooks[m] = _this.tagHooks.g //处理svg
            })

            this.rtagName = /<([\w:]+)/
            this.rxhtml = /<(?!area|br|col|embed|hr|img|input|link|meta|param)(([\w:]+)[^>]*)\/>/ig
            this.scriptTypes = {
                    'text/javascript': 1,
                    'text/ecmascript': 1,
                    'application/ecmascript': 1,
                    'application/javascript': 1
                }
            this.rhtml = /<|&#?\w+;/
        }

    function serialize(p, obj, q){
        var k
        if(Array.isArray(obj)){
            obj.forEach(function(it, i){
                k = p ? (p + '[' + (Array.isArray(it) ? i : '') + ']') : i
                if(typeof it === 'object'){
                    serialize(k, it, q)
                }else{
                    q(k, it)
                }
            })
        }else{
            for(var i in obj){
                k = p ? (p + '[' + i + ']') : i
                if(typeof obj[i] === 'object'){
                    serialize(k, obj[i], q)
                }else{
                    q(k, obj[i])
                }
            }
        }
        
    }

    Format.prototype = {
        parseJS: function(code){
            code = (code + '').trim()
            if(code){
                if(code.indexOf('use strict') === 1){
                    var script = doc.createElement('script')
                    script.text = code
                    doc.head
                        .appendChild(script)
                        .parentNode
                        .removeChild(script)
                }else{
                    eval(code)
                }
            }
        },
        parseXML: function(data, xml, tmp){
            try{
                var mode = doc.documentMode
                //标准浏览器
                if(win.DOMParser && (!mode || mode > 8)){
                    tmp = new DOMParser()
                    xml = tmp.parseFromString(data, 'text/xml')
                }else{// IE了
                    xml = new ActiveXObject('Microsoft.XMLDOM')
                    xml.async = 'false'
                    xml.loadXML(data)
                }
            }catch(e){
                xml = void 0
            }

            if(!xml ||
                !xml.documentElement ||
                xml.getElementsByTagName('parsererror').length){
                    console.error('Invalid XML: ' + data)
            }
            return xml
        },
        parseHTML: function (html){
            var fragment = (doc.createDocumentFragment()).cloneNode(false)

            if(typeof html !== 'string')
                return fragment

            if(!this.rhtml.test(html)){
                fragment.appendChild(document.createTextNode(html))
                return fragment
            }

            html = html.replace(this.rxhtml, '<$1></$2>').trim()
            var tag = (this.rtagName.exec(html) || ['', ''])[1].toLowerCase()
            var wrap = this.tagHooks[tag] || this.tagHooks._default
            var firstChild = null

            //使用innerHTML生成的script节点不会触发请求与执行text属性
            wrap.innerHTML = html
            var script = wrap.getElementsByTagName('script')
            if(script.length){
                for(var i = 0, el; el = script[i++];){
                    if(this.scriptTypes[el.type]){
                        var tmp = (doc.createElement("script")).cloneNode(false)
                        el.attributes.forEach(function(attr){
                            tmp.setAttribute(attr.name, attr.value)
                        })
                        tmp.text = el.text
                        el.parentNode.replaceChild(tmp, el)
                    }
                }
            }

            while(firstChild = wrap.firstChild){
                fragment.appendChild(firstChild)
            }

            return fragment
        },
        param: function(obj){
            if(!obj || typeof obj === 'string' || typeof obj === 'number')
                return obj

            var arr = []
            var q = function(k, v){
                    if(/native code/.test(v))
                        return

                    v = (typeof v === 'function') ? v() : v
                    v = (toS.call(v) !== '[object File]') ? encode(v) : v

                    arr.push(encode(k) + '=' + v)
                }
            
            if(typeof obj === 'object')
                serialize('', obj, q)
            
            return arr.join('&')
        },
        parseForm: function(form){
            var data = {}
            for(var i = 0,field; field = form.elements[i++];){

                switch(field.type){
                    case 'select-one':
                    case 'select-multiple':
                        if(field.name.length && !field.disabled){
                            for(var j = 0, opt;opt = field.options[j++];){
                                if(opt.selected){
                                    data[field.name] = opt.value || opt.text
                                }
                            }
                        }
                        break;
                    case 'file':
                        if(field.name.length && !field.disabled){
                            data[field.name] = field.files[0]
                        }
                        break;
                    case undefined:
                    case 'submit':
                    case 'reset':
                    case 'button':
                        break; //按钮啥的, 直接忽略
                    case 'radio':
                    case 'checkbox':
                        // 只处理选中的
                        if(!field.checked)
                            break;
                    default:
                        if(field.name.length && !field.disabled){
                            data[field.name] = field.value
                        }
                        
                }
                
            }
            return data
        },
        merge: function(a, b){
            if(typeof a !== 'object' || typeof b !== 'object')
                throw new TypeError('argument must be an object')

            if(Object.assign)
                return Object.assign(a, b)

            for(var i in b){
                a[i] = b[i]
            }
            return a
        }
    }


    var F = new Format()


    // ---------------------------------------------------------
    // -------------------- request 模块开始 --------------------
    // ---------------------------------------------------------


    var requestConvert = {
            text: function(val){
                return val
            },
            xml: function(val, xml){
                return xml !== undefined ? xml : F.parseXML(val)
            },
            html: function(val){
                return F.parseHTML(val)
            },
            json: function(val){
                return JSON.parse(val)
            },
            script: function(val){
                return F.parseJS(val)
            },
            jsonp: function(){
                return window[this.jsonpCallback]
            }
        }
    var requestExtend = {
            formData: function(){
                
                //现代浏览器直接切换为FormData方式
                if(win.FormData){
                    if(this.pool.form){
                        console.log(this.pool.form.elements)
                        var data = F.parseForm(this.pool.form)
                        console.log(data)
                        F.merge(this.pool.data, data)
                    }

                    var form = new FormData()
                    for(var i in this.pool.data){
                        var el = this.pool.data[i]
                        if(Array.isArray(el)){
                            el.forEach(function(it){
                                form.append(i + '[]', it)
                            })
                        }else{
                            form.append(i, this.pool.data[i])
                        }
                    }
                    return form
                // IE8- 使用iframe
                }else{
                    this.transport = this.mkIframe(this.pool.uuid)
                    this.pool.form = this.mkForm(this.pool.form)
                    this.pool.field = []
                    for(var i in this.pool.data){

                        var val = this.pool.data[i]
                        if(Array.isArray(val)){
                            for(var j = 0,v; v = val[j++];){
                                var el = doc.createElement('input')
                                el.type = 'hidden'
                                el.name = i + '[]'
                                el.value = v
                                this.pool.field.push(el)
                                this.pool.form.appendChild(el)
                            }
                        }else{
                            var el = doc.createElement('input')
                            el.type = 'hidden'
                            el.name = i
                            el.value = val
                            this.pool.field.push(el)
                            this.pool.form.appendChild(el)
                        }
                    }
                }
            },
            mkIframe: function(id){
                var iframe = F.parseHTML('<iframe id="' + id + '" name="' + id + '" style="position: ' + (IE === 6 ? 'absolute' : 'fixed') + ';top: -9999px;left: 0"></iframe>').firstChild
                return (doc.body || doc.documentElement).insertBefore(iframe, null)
            },
            mkForm: function(form){
                if(!form)
                    form = doc.createElement('form')

                form.target = this.pool.uuid
                form.action = this.pool.url
                form.method = 'POST'
                form.enctype = 'multipart/form-data'

                return form
            },
            dispatch: function(self, status){
                var _this = this

                if(!this.transport)
                    return

                //状态为4,既已成功, 则清除超时
                clearTimeout(_this.timeoutID)
                
                if(status === 4)
                    self.status = status

                //成功的回调
                var isSucc = (self.status >= 200 && self.status < 300) || self.status === 304

                var result = {
                        response: {
                            url: self.responseURL || self.URL,
                            headers: {'content-type': ''}
                        },
                        request: {
                            url: self.responseURL || self.URL,
                            headers: _this.pool.headers
                        },
                        status: self.status,
                        statusText: self.statusText || 'OK',
                        text: '',
                        body: '',
                        error: null
                    }
                if(typeof _this.transport !== 'object'){
                    delete _this.transport
                    delete _this.pool
                }
                // 非iframe方式
                if(!status){
                    var headers = self.getAllResponseHeaders()
                    headers = headers.split('\n')
                    headers.forEach(function(it, i){
                        it = it.trim()
                        if(it){
                            it = it.split(':')
                            result.response.headers[it.shift().toLowerCase()] = it.join(':').trim()
                        }

                    })
                }
                
                if(isSucc){
                    
                    if(status === 204){
                        result.statusText = 'no content'
                    }else if(status === 304){
                        result.statusText = 'not modified'
                    }else{
                        //处理返回的数据
            
                        var dataType = result.response.headers['content-type'].match(/json|xml|script|html/i) || ['text']
          
                        dataType = dataType[0].toLowerCase()
                        
                        var responseTXT = self.responseText || ''
                        var responseXML = self.responseXML || ''
                        try{
                            result.text = responseTXT || responseXML
                            result.body = requestConvert[dataType](responseTXT, responseXML)
                        }catch(e){
                            isSucc = false
                            result.error = e
                            result.statusText = 'parse error'
                        }
                    }
                }else{
                    if(status){
                        result.status = 200
                        
                        if(self.body){
                            result.text = self.body.innerHTML
                            result.body = result.text
                            var child = self.body.firstChild
                            if(child && child.nodeName.toUpperCase() === 'PRE'){
                                result.text = child.innerHTML
                                result.body = requestConvert.json(result.text)
                            }
                        }else{
                            result.text = result.body = self
                        }
                    
                        //删除iframe
                        _this.transport.parentNode.removeChild(_this.transport)
                        //还原表单, 避免参数重复提交
                        if(_this.pool.field && _this.pool.field.length){
                            _this.pool.form.target = ''
                            _this.pool.form.action = ''
                            for(var i = 0,el; el = _this.pool.field[i++];){
                                _this.pool.form.removeChild(el)
                            }
                        }   
                        
                    }else{
                        result.status = result.status || 504
                        result.statusText = result.statusText || 'Connected timeout'
                        result.error = F.merge(new Error(result.statusText), {status: result.status})
                    }
                }
                
                _this.callback(result.error, result)
                delete _this.transport
                delete _this.pool
                delete _this.xhr
                
            }
        }

    // 设置表单类型, 支持2种, form/json
    _requestp.type = function(t){
        if(this.pool.formType === 'form-data')
            return this

        this.pool.formType = t || 'form'
        if(t === 'form' || this.pool.type === 'GET')
            this.set('content-type', 'application/x-www-form-urlencoded; charset=UTF-8')
        else
            this.set('content-type', 'application/json; charset=UTF-8')

        return this
    }

    //设置头信息
    _requestp.set = function(k, val){
        if(!this.transport)
            return

        if(typeof k === 'object'){
            for(var i in k){
                i = i.toLowerCase()
                this.pool.headers[i] = k[i]
            }

        }else if(typeof k === 'string'){
            if(arguments.length < 2)
                throw new Error('2 arguments required')

            // 全转小写,避免重复写入
            k = k.toLowerCase()

            if(val === undefined)
                delete this.pool.headers[k]
            else
                this.pool.headers[k] = val
        }else{
            throw new Error('arguments must be string/object, but [' + (typeof k) + '] given')
        }
        return this
    }

    //设置请求参数
    _requestp.send = function(k, val){

        if(!this.transport)
            return

        // 1. send方法可以多次调用, 但必须保证格式一致
        // 2. 2次圴提交纯字符串也会抛出异常
        if(typeof k === 'object'){
            if(this.pool.data && (typeof this.pool.data === 'string'))
                throw new Error('param can not be string and object at the same time')
            if(!this.pool.data)
                this.pool.data = {}

            F.merge(this.pool.data, k)
        }else{
            if(typeof k === 'string'){
                if(arguments.length === 1){
                    if(this.pool.data)
                        throw new Error('invalid param in function send')

                    this.pool.data = k
                }else{
                    if(this.pool.data && (typeof this.pool.data === 'string'))
                        throw new Error('param can not be string and object at the same time')

                    if(!this.pool.data)
                        this.pool.data = {}

                    this.pool.data[k] = val
                }
                
            }else{
                throw new Error('argument of send must be string/object, but [' + (typeof k) + '] given')
            }
            
        }

        return this
    }

    //该方法用于 form-data类型的post请求的参数设置
    _requestp.field = function(k, val){

        if(!this.transport)
            return

        // 此类型优先级最高
        this.pool.formType = 'form-data'
        if(!this.pool.data || (this.pool.data && typeof this.pool.data !== 'object'))
            this.pool.data = {}

        if(arguments.length === 1 && typeof k === 'object'){
            F.merge(this.pool.data, k)
        }else if(arguments.length === 2){
            this.pool.data[k] = val
        }else{
            throw new TypeError('argument must be an object, but ' + (typeof k) + ' given')
        }
        return this
    }


    //设置缓存
    _requestp.cache = function(t){
        if(!this.transport)
            return

        if(this.pool.type === 'GET')
            this.pool.cache = !!t

        return this
    }


    //取消网络请求
    _requestp.abort = function(){
        delete this.transport
        if(!this.pool.form)
            this.xhr.abort()

        return this
    }

    //超时设置, 单位毫秒
    _requestp.timeout = function(time){
        if(typeof time !== 'number' || time < 1)
            return this

        this.pool.timeout = time
        return this
    }


    _requestp.form = function(form){
        if(typeof form === 'object' && form.nodeName === 'FORM'){
            this.pool.type = 'POST'
            this.pool.form = form
        }
        
        return this
    }


    var originAnchor = doc.createElement('a')
    originAnchor.href = location.href
    _requestp.end = function(callback){
        var _this = this;
        // 回调已执行, 或已取消, 则直接返回, 防止重复执行
        if(!this.transport)
            return

        if(!this.pool.url)
            throw new Error('Invalid  request url')

        F.merge(this, requestExtend)

        this.callback = callback || noop

        // 1. url规范化
        this.pool.url = this.pool.url.replace(/#.*$/, '').replace(/^\/\//, location.protocol + '//')

        // 2. data转字符串
        this.pool.param = F.param(this.pool.data)

        // 3. 处理跨域
        if(typeof this.pool.crossDomain !== 'boolean'){
            var anchor = doc.createElement('a')
            try{
                anchor.href = this.pool.url
                // IE7及以下浏览器 '1'[0]的结果是 undefined
                // IE7下需要获取绝对路径
                var absUrl = !'1'[0] ? anchor.getAttribute('href', 4) : anchor.href
                anchor.href = absUrl
                this.pool.crossDomain = (originAnchor.protocol !== anchor.protocol) || (originAnchor.host !== anchor.host)
            }catch(e){
                this.pool.crossDomain = true
            }
        }

        // 4. 设置Content-Type类型, 默认x-www-form-urlencoded
        if(!this.pool.formType)
            this.type('form')

        // 5.处理GET请求
        this.pool.hasContent = this.pool.type !== 'GET' //是否为post请求
        if(!this.pool.hasContent){
            
            //GET请求直接把参数拼接到url上
            if(this.pool.param){
                this.pool.url += (/\?/.test(this.pool.url) ? '&' : '?') + this.pool.param
            }
            //加随机值,避免缓存
            if(this.pool.cache === false)
                this.pool.url += (/\?/.test(this.pool.url) ? '&' : '?') + '_=' + Math.random()
        }else{
            if(this.pool.formType === 'form-data'){
                delete this.pool.headers['content-type']
                this.pool.param = this.formData()

            }else if(this.pool.formType !== 'form'){
                this.pool.param = JSON.stringify(this.pool.data)
            } 
        }

        // transport不恒为 true, 则说明是走iframe路线的
        if(this.transport !== true){
            this.transport.onload = function(ev){
                _this.dispatch(this.contentWindow.document, 4)
            }
            this.pool.form.submit()
        }else{
            this.xhr.onreadystatechange = function(statusTxt){

                if(this.readyState !== 4)
                    return

                _this.dispatch(this)
            }


            // 6. 初始化xhr提交
            this.xhr.open(this.pool.type, this.pool.url, true)

            // 7. 设置头信息
            for(var i in this.pool.headers){
                if(this.pool.headers[i])
                    this.xhr.setRequestHeader(i, this.pool.headers[i])
            }

            // 8. 发起网络请求
            this.xhr.send(this.pool.param)

            
        }

        //超时处理
        //IE8- 不支持timeout属性的设置,
        if(this.pool.timeout && this.pool.timeout > 0){
            this.timeoutID = setTimeout(function(){
                _this.abort()
            }, this.pool.timeout)
        }
        
    }












    // ---------------------- end ------------------------


    if(!win.request){
        win.request = {
            get: function(url){
                if(!url)
                    throw new Error('argument url is required')

                return new _request(url, 'GET')
            },
            post: function(url){
                if(!url)
                    throw new Error('argument url is required')

                return new _request(url, 'POST')
            },
            version: '1.0.0',
            release: 'request full version/1.0.0'
        }
    }

    return request
})
