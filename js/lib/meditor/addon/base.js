/**
 * 
 * @authors yutent (yutent@doui.cc)
 * @date    2017-04-17 21:41:48
 *
 */

"use strict";

define(['lib/layer/base'], function(){

    function objArr(num){
        var arr = []
        while(num > 0){
            arr.push({v: 0})
            num--
        }
        return arr
    }
    function trim(str, sign){
        return str.replace(new RegExp('^' + sign + '|' + sign + '$', 'g'), '')
    }
    function getOrderArr(len){
        var arr = [], i = 0;
        while(i < len){
            arr.push(i++)
        }
        return arr
    }
    ME.addon = {
        h1: function(elem, vm){
            var offset = yua(elem).offset(),
                wrap = ME.selection(vm.$editor, true) || '在此输入文本',
                h1ID = layer.open({
                    type: 7,
                    menubar: false,
                    shadeClose: true,
                    fixed: true,
                    $insert: function(level){
                        wrap = wrap.replace(/^#{1,6} /, '')
                        wrap = ME.repeat('#', level) + ' ' + wrap
                        ME.insert(vm.$editor, wrap, true)
                        layer.close(h1ID)
                    },
                    offset: [offset.top + 37 - ME.doc.scrollTop(), 'auto', 'auto', offset.left - ME.doc.scrollLeft()],
                    content: '<ul class="do-meditor-h1 do-fn-noselect meditor-font">'
                        + '<li :click="$insert(1)" class="h1">一级标题</li>'
                        + '<li :click="$insert(2)" class="h2">二级标题</li>'
                        + '<li :click="$insert(3)" class="h3">三级标题</li>'
                        + '<li :click="$insert(4)" class="h4">四级标题</li>'
                        + '<li :click="$insert(5)" class="h5">五级标题</li>'
                        + '<li :click="$insert(6)" class="h6">六级标题</li>'
                        + '</ul>'
                })
        },
        quote: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本'
            wrap = '> ' + wrap

            ME.insert(vm.$editor, wrap, true)
        },
        bold: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本',
                wraped = trim(wrap, '\\*\\*')

            wrap = wrap === wraped ? ('**' + wrap + '**') : wraped

            ME.insert(vm.$editor, wrap, true)
        },
        italic: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本',
                wraped = trim(wrap, '_')

            wrap = wrap === wraped ? ('_' + wrap + '_') : wraped

            ME.insert(vm.$editor, wrap, true)
        },
        through: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本',
                wraped = trim(wrap, '~~')

            wrap = wrap === wraped ? ('~~' + wrap + '~~') : wraped

            ME.insert(vm.$editor, wrap, true)
        },
        unordered: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本'
            wrap = '* ' + wrap

            ME.insert(vm.$editor, wrap, false)
        },
        ordered: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本'
            wrap = '1. ' + wrap

            ME.insert(vm.$editor, wrap, false)
        },
        hr: function(elem, vm){
            ME.insert(vm.$editor, '\n\n---\n\n', false)
        },
        link: function(elem, vm){
            var offset = yua(elem).offset(),
                wrap = ME.selection(vm.$editor) || '',
                layid = layer.open({
                    type: 7,
                    menubar: false,
                    shadeClose: true,
                    fixed: true,
                    link: '',
                    linkName: wrap,
                    linkTarget: 1,
                    $confirm: function(){
                        var lvm = yua.vmodels[layid]
                        if(!lvm.link || !lvm.linkName){
                            return layer.alert('链接文字和地址不能为空')
                        }
                        var val = '[' + lvm.linkName + ']('
                            + lvm.link
                            + (lvm.linkTarget === 1 ? ' "target=_blank"' : '')
                            + ')'
                        ME.insert(vm.$editor, val, false)
                        layer.close(layid)
                    },
                    offset: [offset.top + 37 - ME.doc.scrollTop(), 'auto', 'auto', offset.left - ME.doc.scrollLeft()],
                    content: '<div class="do-meditor-common meditor-font">'
                        + '<section><span class="label">链接文字</span>'
                            + '<input class="input" :duplex="linkName" />'
                        + '</section>'
                        + '<section><span class="label">链接地址</span>'
                            + '<input class="input" :duplex="link"/>'
                        + '</section>'
                        + '<section>'
                            + '<label><input name="link" type="radio" class="radio" :duplex-number="linkTarget" value="1"/> 新窗口打开</label>'
                            + '<label><input name="link" type="radio" class="radio" :duplex-number="linkTarget" value="2"/> 本窗口打开</label>'
                        + '</section>'
                        + '<section>'
                            + '<a href="javascript:;" class="submit" :click="$confirm">确定</a>'
                        + '</section>'
                        + '</div>'
                })
        },
        time: function(elem, vm){
            ME.insert(vm.$editor, new Date().format(), false)
        },
        face: function(elem, vm){
            var offset = yua(elem).offset(),
                faceid = 0,
                layid = layer.open({
                    type: 7,
                    title: '插入表情',
                    fixed: true,
                    shadeClose: true,
                    arr: getOrderArr(36),
                    offset: [offset.top + 37 - ME.doc.scrollTop(), 'auto', 'auto', offset.left - ME.doc.scrollLeft()],
                    content: '<ul class="do-meditor-face">'
                        + '<li class="item" :repeat="arr" ><img :attr-src="ME.path + \'/addon/face/\' + el + \'.gif\'" :click="$insert(this.src)" /></li>'
                        + '</ul>',
                    $insert: function(src){
                        ME.insert(vm.$editor, '![](' + src + ')', false)
                        layer.close(layid)
                    }
                })
        },
        table: function(elem, vm){
            var offset = yua(elem).offset();
            layer.open({
                type: 7,
                title: '0行 x 0列',
                fixed: true,
                shadeClose: true,
                offset: [offset.top + 37 - ME.doc.scrollTop(), 'auto', 'auto', offset.left - ME.doc.scrollLeft()],
                matrix: objArr(10).map(function(){return objArr(10)}),
                content: '<ul class="do-meditor-table">'
                    + '<li :repeat="matrix"><span :repeat-o="el" :class="{active: o.v}" :data="{x: $index, y: $outer.$index}"></span></li>'
                    + '</ul>',
                success: function(id){
                    var tb = document.querySelector('.do-meditor-table'),
                        _this = yua.vmodels[id],
                        lastx,lasty;
                    yua(tb).bind('mousemove', function(ev){
                        if(ev.target.nodeName === 'SPAN'){
                            var x = ev.target.dataset.x - 0,
                                y = ev.target.dataset.y - 0;
                            if(x === lastx && y === lasty){
                                return
                            }
                            lastx = x;
                            lasty = y;
                            _this.title = (y + 1) + '行 x ' + (x + 1) + '列'
                            for(var i = 0; i <= 9; i++){
                                for(var j = 0; j <= 9; j++){
                                    _this.matrix[i][j].v = (i <= y && j <= x) ? 1 : 0
                                }
                            }
                        }
                    })
                    yua(tb).bind('mouseleave', function(ev){
                        lastx = -1;
                        lasty = -1;
                        _this.title = '0行 x 0列'
                        for(var i = 0; i <= 9; i++){
                            for(var j = 0; j <= 9; j++){
                                _this.matrix[i][j].v = 0
                            }
                        }
                    })
                    yua(tb).bind('click', function(ev){
                        if(ev.target.nodeName === 'SPAN'){
                            var x = ev.target.dataset.x - 0 + 1,
                                y = ev.target.dataset.y - 0 + 1;
                            
                            var val = '\n\n' + ME.repeat('| 表头 ', x) + '|\n'
                                    + ME.repeat('| -- ', x) + '|\n'
                                    + ME.repeat(ME.repeat('| ', x) + '|\n', y)
                            ME.insert(vm.$editor, val, false)
                            layer.close(id)
                        }
                    })
                }
            })
        },
        image: function(elem, vm){
            var offset = yua(elem).offset(),
                wrap = ME.selection(vm.$editor) || '',
                layid = layer.open({
                    type: 7,
                    menubar: false,
                    shadeClose: true,
                    fixed: true,
                    img: '',
                    imgAlt: wrap,
                    $confirm: function(){
                        var lvm = yua.vmodels[layid]
                        if(!lvm.img || !lvm.imgAlt){
                            return layer.alert('图片描述和图片地址不能为空')
                        }
                        var val = '![' + lvm.imgAlt + '](' + lvm.img + ')'

                        ME.insert(vm.$editor, val, false)
                        layer.close(layid)
                    },
                    offset: [offset.top + 37 - ME.doc.scrollTop(), 'auto', 'auto', offset.left - ME.doc.scrollLeft()],
                    content: '<div class="do-meditor-common meditor-font">'
                        + '<section><span class="label">图片描述</span>'
                            + '<input class="input" :duplex="imgAlt" />'
                        + '</section>'
                        + '<section><span class="label">图片地址</span>'
                            + '<input class="input" :duplex="img"/>'
                        + '</section>'
                        + '<section>'
                            + '<a href="javascript:;" class="submit" :click="$confirm">确定</a>'
                        + '</section>'
                        + '</div>'
                })
        },
        file: function(elem, vm){
            this.link(elem, vm, false)
        },
        inlinecode: function(elem, vm){
            var wrap = ME.selection(vm.$editor) || '在此输入文本'
            wrap = '`' + wrap + '`'
            ME.insert(vm.$editor, wrap, true)
        },
        blockcode: function(elem, vm){
            var layid = layer.open({
                    type: 7,
                    title: '添加代码块',
                    $lang: [
                        {id: 'asp'},
                        {id: 'actionscript', name: 'ActionScript(3.0)/Flash/Flex'},
                        {id: 'bash', name: 'Bash/Shell/Bat'},
                        {id: 'css'},
                        {id: 'c', name: 'C'},
                        {id: 'cpp', name: 'C++'},
                        {id: 'csharp', name: 'C#'},
                        {id: 'coffeescript', name: 'CoffeeScript'},
                        {id: 'd', name: 'D'},
                        {id: 'dart'},
                        {id: 'delphi', name: 'Delphi/Pascal'},
                        {id: 'erlang'},
                        {id: 'go', name: 'Golang'},
                        {id: 'html'},
                        {id: 'java'},
                        {id: 'javascript'},
                        {id: 'json'},
                        {id: 'lua'},
                        {id: 'less'},
                        {id: 'markdown'},
                        {id: 'nginx'},
                        {id: 'objective-c'},
                        {id: 'php'},
                        {id: 'perl'},
                        {id: 'python'},
                        {id: 'r', name: 'R'},
                        {id: 'ruby'},
                        {id: 'sql'},
                        {id: 'sass', name: 'SASS/SCSS'},
                        {id: 'swift'},
                        {id: 'typescript'},
                        {id: 'xml'},
                        {id: 'yaml'},
                        {id: 'other', name: '其他语言'},
                    ],
                    lang: 'javascript',
                    code: '',
                    $confirm: function(){
                        var lvm = yua.vmodels[layid]
                        var val = '\n```' + lvm.lang + '\n' + (lvm.code || '//在此输入代码') + '\n```\n'

                        ME.insert(vm.$editor, val, false)
                        layer.close(layid)
                    },
                    content: '<div class="do-meditor-codeblock meditor-font">'
                        + '<section><span class="label">语言类型</span>'
                            + '<select :duplex="lang">'
                                + '<option :repeat="$lang" :attr-value="el.id">{{el.name || el.id}}</option>'
                            + '</select>'
                        + '</section>'
                        + '<section>'
                            + '<textarea :duplex="code" placeholder="在这里输入/粘贴代码"></textarea>'
                        + '</section>'
                        + '<section>'
                            + '<a href="javascript:;" class="submit" :click="$confirm">确定</a>'
                        + '</section>'
                        + '</div>'
                })
        },
        preview: function(elem, vm){
            vm.preview = !vm.preview
            if(vm.preview){
                vm.htmlTxt = vm.$htmlTxt
            }
        },
        fullscreen: function(elem, vm){
            vm.fullscreen = !vm.fullscreen
            vm.$onFullscreen(vm.fullscreen)
        },
        about: function(elem){
            var offset = yua(elem).offset()
            layer.open({
                type: 7,
                title: '关于编辑器',
                offset: [offset.top + 37 - ME.doc.scrollTop()],
                content: '<div class="do-meditor-about meditor-font">'
                    + '<pre>'
                    + ' __  __ _____    _ _ _\n'             
                    + '|  \\/  | ____|__| (_) |_ ___  _ __\n' 
                    + '| |\\/| |  _| / _` | | __/ _ \\| \'__|\n'
                    + '| |  | | |__| (_| | | || (_) | |\n'   
                    + '|_|  |_|_____\\__,_|_|\\__\\___/|_|    ' 
                    + 'v' + ME.version + '</pre>'
                    + '<p>开源在线Markdown编辑器</p>'
                    + '<p><a target="_blank" href="https://doui.cc/product/meditor">https://doui.cc/product/meditor</a></p>'
                    + '<p>Copyright © 2017 Yutent, The MIT License.</p>'
                    + '</div>'
            })
        }

    }
    
})