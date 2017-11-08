# 幻灯片组件文档

## 配置说明

```json
    {
        sliderList: [{src: '', title: '', link: '', elm: ''}],       //src: 图片地址; link: 点击链接; title: 幻灯片标题(可以是文本或html); elm: 幻灯片中的dom元素
        autoSlide: boolean,     //true: 自动轮播; false: 停止轮播
        time: int,     //自动轮播间隔时间
        preview: boolean   //是否缩略有图(不适用于全屏)
        skin: int,     //4种,默认0(0,1,2,3)
        sliderType: int,      //幻灯片动画效果,目前有1: 水平滑动;2: 水平渐进渐出;3: 垂直滑动;4: 垂直渐进渐出
        $onSuccess: function(vm){
            slider = vm
        },           //初始化回调
        vm.$setSliderList(list),         //赋值数据给幻灯片数组
    }

```


## 用法

```html
<div class="slider" :controller="test">
    <template name="sliders" config="sliderOpts"></template>
</div>
<!--  
其中config属性是指定分页组件的配置，会自动从上一层controller里找;
其他的属性（除$id, config, id, class, tabindex, style, ms-*属性,data-*属性外，也可以用以配置组件，且优先级最高）;
name属性可以设定组件的$id值，方便各模块之间进行通讯
-->
<!--  引入幻灯片组件  -->
<script src="//dist.doui.cc/js/yua.js"></script>
<script>
    require(['//dist.doui.cc/js/lib/sliders/main.js'],function(){
        var vm = yua({
            $id: "test",
            sliderOpts: {
                sliderList: [{src: '', link: '', title: '', elm: ''}],
                autoSlide: false,
                time: 0,
                // preview: true,
                fullScreen: true,
                skin: 1,
                sliderType: 4,
                $onSuccess: function(vm){
                    slider = vm
                    slider.$setSliderList(list)
                }
            }
        })

        yua.scan()
    })
</script>
```
