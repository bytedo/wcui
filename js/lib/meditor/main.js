/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-17 16:37:12
 *
 */

"use strict";


define([
    'yua',
    'lib/prism/base',
    'lib/marked/main',
    'css!./skin/main',
], function(yua){

    marked.setOptions({
        highlight: function(code, lang){
            return Prism.highlight(code, Prism.languages[lang])
        }
    })

    var editorVM = []
    yua.ui.meditor = '0.0.1'
    //存放编辑器公共静态资源
    window.ME = {
        version: yua.ui.meditor,
        toolbar: { //工具栏title
            pipe: '',
            h1: '标题',
            quote: '引用文本',
            bold: '粗体',
            italic: '斜体',
            through: '删除线',
            unordered: '无序列表',
            ordered: '有序列表',
            link: '超链接',
            hr: '横线',
            time: '插入当前时间',
            face: '表情',
            table: '插入表格',
            image: '插入图片',
            file: '插入附件',
            inlinecode: '行内代码',
            blockcode: '代码块',
            preview: '预览',
            fullscreen: '全屏',
            about: '关于编辑器',
        },
        addon: {}, //已有插件
        //往文本框中插入内容
        insert: function(dom, val, isSelect){
            if(document.selection){
                dom.focus()
                var range = document.selection.createRange()
                range.text = val
                dom.focus()
                range.moveStart('character', -1)

            }else if(dom.selectionStart || dom.selectionStart === 0) {
                var startPos = dom.selectionStart,
                    endPos = dom.selectionEnd,
                    scrollTop = dom.scrollTop;

                dom.value = dom.value.slice(0, startPos)
                    + val
                    + dom.value.slice(endPos, dom.value.length);

                dom.selectionStart = isSelect ? startPos : (startPos + val.length)
                dom.selectionEnd = startPos + val.length
                dom.scrollTop = scrollTop
                dom.focus()
            }else{
                dom.value += val;
                dom.focus()
            }
        },
        /**
         * [selection 获取选中的文本]
         * @param  {[type]} dom  [要操作的元素]
         * @param  {[type]} line [是否强制选取整行]
         */
        selection: function(dom, line){
            if(document.selection){
                return document.selection.createRange().text
            }else{

                var startPos = dom.selectionStart,
                    endPos = dom.selectionEnd;

                if(endPos){
                    //强制选择整行
                    if(line) {
                        startPos = dom.value.slice(0, startPos).lastIndexOf('\n');

                        var tmpEnd = dom.value.slice(endPos).indexOf('\n');
                        tmpEnd = tmpEnd < 0 ? 0 : tmpEnd

                        startPos += 1 //把\n加上
                        endPos += tmpEnd;

                        dom.selectionStart = startPos
                        dom.selectionEnd = endPos
                    }
                }else{
                    //强制选择整行
                    if(line) {
                        endPos = dom.value.indexOf('\n')
                        endPos = endPos < 0 ? dom.value.length : endPos
                        dom.selectionEnd = endPos
                    }
                }
                return dom.value.slice(startPos, endPos)
            }
        },
        repeat: function(str, num){
            if(String.prototype.repeat){
                return str.repeat(num)
            }else{
                var result = ''
                while(num > 0){
                    result += str;
                    num--
                }
                return result
            }
        },
        get: function(id){
            if(id === void 0){
                id = editorVM.length - 1
            }
            var vm = editorVM[id]
            if(vm){
                return {
                    id: vm.$id,
                    getVal: function(){
                        return vm.plainTxt.trim()
                    },
                    getHtml: function(){
                        return vm.$htmlTxt
                    },
                    setVal: function(txt){
                        vm.plainTxt = txt
                    },
                    show: function(){
                        vm.editorVisible = true
                    },
                    hide: function(){
                        vm.editorVisible = false
                    }
                }
            }
            return null
        },
        doc: yua(document)
    }
    //获取真实的引用路径,避免因为不同的目录结构导致加载失败的情况
    for(var i in yua.modules){
        if(/meditor/.test(i)) {
            ME.path = i.slice(0, i.lastIndexOf('/'))
            break;
        }
    }
    var elems = {
            p: function(str, attr, inner){
                return inner ? ('\n' + inner + '\n') : ''
            },
            br: '\n',
            'h([1-6])': function(str, level, attr, inner){
                var h = ME.repeat('#', level)
                return '\n' + h + ' ' + inner + '\n'
            },
            hr: '\n\n___\n\n',
            a: function(str, attr, inner){
                var href = attr.match(attrExp('href')),
                    title = attr.match(attrExp('title')),
                    tar = attr.match(attrExp('target'));

                href = href && href[1] || ''
                title = title && title[1] || ''
                tar = tar && tar[1] || '_self'

                href = href === 'javascript:void(0);' ? 'javascript:;' : href

                return '[' + (inner || href) + '](' + href + ' "title=' + title + ';target=' + tar + '")' 
            },
            em: function(str, attr, inner){
                return inner && ('_' + inner + '_') || ''
            },
            strong: function(str, attr, inner){
                return inner && ('**' + inner + '**') || ''
            },
            code: function(str, attr, inner){
                return inner && ('`' + inner + '`') || ''
            },
            pre: function(str, attr, inner){

                return '\n\n```\n' + inner + '\n```\n' 
            },
            blockquote: function(str, attr, inner){
                return '> ' + inner.trim()
            },
            img: function(str, attr, inner){
                var src = attr.match(attrExp('src')),
                    alt = attr.match(attrExp('alt'));

                src = src && src[1] || ''
                alt = alt && alt[1] || ''

                return '![' + alt + '](' + src + ')' 
            }
        }
        
    function attrExp(field){
        return new RegExp(field + '\\s?=\\s?["\']?([^"\']*)["\']?', 'i')
    }
    function tagExp(tag, open){
        var exp = ''
        if(['br', 'hr', 'img'].indexOf(tag) > -1){
            exp = '<' + tag + '([^>]*)\\/?>'
        }else{
            exp = '<' + tag + '([^>]*)>([\\s\\S]*?)<\\/' + tag + '>'
        }
        return new RegExp(exp, 'gi')
    }
    function html2md(str){
        str = decodeURIComponent(str).replace(/\t/g, '    ').replace(/<meta [^>]*>/, '')

        for(var i in elems){
            var cb = elems[i],
                exp = tagExp(i);

            if(i === 'blockquote'){
                while(str.match(exp)){
                    str = str.replace(exp, cb)
                }
            }else{
                str = str.replace(exp, cb)
            }

            if(i === 'em'){
                exp = tagExp('i')
                str = str.replace(exp, cb)
            }
            if(i === 'strong'){
                exp = tagExp('b')
                str = str.replace(exp, cb)
            }
        }
        var liExp = /<(ul|ol)[^>]*>(?:(?!<ul|<ol)[\s\S])*?<\/\1>/gi
        while(str.match(liExp)) {
            str = str.replace(liExp, function(match){
                match = match.replace(/<(ul|ol)[^>]*>([\s\S]*?)<\/\1>/gi, function(m, t, inner){
                    var li = inner.split('</li>')
                    li.pop()

                    for(var i = 0,len = li.length; i < len; i++){
                        var pre = t === 'ol' ? ((i + 1) + '. ') : '* '
                        li[i] = pre + li[i].replace(/\s*<li[^>]*>([\s\S]*)/i, function(m, n){
                            n = n.trim()
                                .replace(/\n/g, '\n  ')
                            return n
                        }).replace(/<[\/]?[\w]*[^>]*>/g, '')
                    }
                    return li.join('\n')
                })
                return '\n' + match.trim()
            })
        }
        str = str.replace(/<[\/]?[\w]*[^>]*>/g, '')
                .replace(/```([\w\W]*)```/g, function(str, inner){
                    inner = inner.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
                    return '```' + inner + '```'
                })
        return str
    }

    require([
        ME.path + '/addon/base'
    ], function(){


        var defaultToolbar = ['h1', 'quote', '|',
            'bold', 'italic', 'through', '|',
            'unordered', 'ordered', '|',
            'hr', 'link', 'time', 'face', '|',
            'table','image', 'file','inlinecode', 'blockcode','|',
            'preview',  'fullscreen', '|',
            'about'
            ],
            extraAddons = [];

        
        function tool(name){
            name = (name + '').trim().toLowerCase()
            name = '|' === name ? 'pipe' : name
            return '<span title="' + ME.toolbar[name] + '" class="edicon icon-' + name+ '" '
                + (name !== 'pipe' ? (':click="$onToolbarClick(\'' + name + '\')"') : '')
                + '></span>'
        }



        yua.component('meditor', {
            $template: '<div class="do-meditor meditor-font" '
                + ':visible="editorVisible" '
                + ':class="{fullscreen: fullscreen, preview: preview}">'
                + '<div class="tool-bar do-fn-noselect">{toolbar}</div>'
                + '<div class="editor-body">'
                    + '<textarea spellcheck="false" :duplex="plainTxt" :attr="{disabled: disabled}" :on-paste="$paste($event)" id="{uuid}"></textarea>'
                + '</div>'
                + '<content class="md-preview" :visible="preview" :html="htmlTxt"></content>'
            + '</div>',
            $$template: function(txt){
                
                var toolbar = (this.toolbar || defaultToolbar).map(function(it){
                        return tool(it)
                    }).join('')

                delete this.toolbar
                return txt.replace(/\{uuid\}/g, this.$id).replace(/\{toolbar\}/g, toolbar)
            },
            $construct: function(base, opt, attr){
                yua.mix(base, opt, attr)
                if(base.$addons && Array.isArray(base.$addons)){
                    extraAddons = base.$addons.map(function(name){
                        return ME.path + '/addon/' + name
                    })
                    delete base.$addons
                }
                if(base.hasOwnProperty('$show')){
                    base.editorVisible = base.$show
                    delete base.$show
                }
                return base
            },
            $init: function(vm){

                vm.$watch('plainTxt', function(val){
                    vm.$compile()
                    //只有开启实时预览,才会赋值给htmlTxt
                    if(vm.preview){
                        vm.htmlTxt = vm.$htmlTxt
                    }
                    vm.$onUpdate(vm.plainTxt, vm.$htmlTxt)
                })

                vm.$onToolbarClick = function(name){
                    if(ME.addon[name]){
                        ME.addon[name].call(ME.addon, this, vm)
                    }else{
                        console.log('%c没有对应的插件%c[%s]', 'color:#f00;', '',name)
                    }
                }

                vm.$paste = function(ev){
                    ev.preventDefault()
                    var txt = ev.clipboardData.getData('text/plain').trim(),
                        html = ev.clipboardData.getData('text/html').trim();

                    html = html2md(html)
                    
                    if(html){
                        ME.insert(this, html)
                    }else if(txt) {
                        ME.insert(this, txt)
                    }
                    vm.plainTxt = this.value
                }
            },
            $ready: function(vm){
                vm.$editor = document.querySelector('#' + vm.$id)
                
                editorVM.push(vm)
                //自动加载额外的插件
                require(extraAddons, function(){
                    var args = Array.prototype.slice.call(arguments, 0)
                    args.forEach(function(addon){
                        addon && addon(vm)
                    })
                })

                yua(vm.$editor).bind('keydown', function(ev){
                    
                    var wrap = ME.selection(vm.$editor) || '',
                        select = !!wrap;
                    //tab键改为插入2个空格,阻止默认事件,防止焦点失去
                    if(ev.keyCode === 9){
                        wrap = wrap.split('\n').map(function(it){
                            return ev.shiftKey ? it.replace(/^\s\s/, '') : '  ' + it
                        }).join('\n')
                        ME.insert(this, wrap, select)
                        ev.preventDefault()
                    }
                    //修复按退格键删除选中文本时,选中的状态不更新的bug
                    if(ev.keyCode === 8){
                        if(select){
                            ME.insert(this, '', select)
                            ev.preventDefault()
                        }
                    }
                    
                })
                //编辑器成功加载的回调
                vm.$onSuccess(ME.get(), vm)
            },
            $paste: yua.noop,
            $compile: function(){
                var txt = this.plainTxt.trim()
                txt = txt.replace(/<script([^>]*?)>/g, '&lt;script$1&gt;')
                    .replace(/<\/script>/g, '&lt;/script&gt;')
                
                //只解析,不渲染
                this.$htmlTxt = marked(txt)
            },
            $onToolbarClick: yua.noop,
            $onSuccess: yua.noop,
            $onUpdate: yua.noop,
            $onFullscreen: yua.noop,
            disabled: false, //禁用编辑器
            fullscreen: false, //是否全屏
            preview: false, //是否显示预览
            $editor: null, //编辑器元素
            editorVisible: true,
            $htmlTxt: '', //临时储存html文本
            htmlTxt: '', //用于预览渲染
            plainTxt: '' //纯md文本


        })



    })

})
