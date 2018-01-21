# 拖拽插件
> 该插件可以让任意一个元素可以被拖拽,而不需要该元素是否具有定位属性。
> 使用时,在目标元素上添加`:drag`属性即可以实现拖拽功能。

## 依赖
> 依赖`yua`框架

## 浏览器兼容性
+ chrome
+ firefox
+ safari
+ IE10+


## 用法
> 只需要在要拖拽的元素上添加`:drag`即可;
> 如果要拖拽的元素不是当前元素,只需要给该属性增加一个值为想要拖拽元素的类名或ID。
> 具体请看示例:
> **注意:** `拖拽的元素不是本身时,只会往父级一级一级找相匹配的` 

```html

<!DOCTYPE html>
<html>
<head>
<style>
    * {margin:0;padding:0}
    .box {width:100px;height:100px;background:#f30;}
</style>
</head>
<body :controller="test">

<div class="box" :drag></div>

<script src="/js/yua.js"></script>
<script>
        
    require(['lib/drag/main'], function(){

        yua({
            $id: 'test'
        })
        yua.scan()
    })
</script>

</body>
</html>

```


```html

<!DOCTYPE html>
<html>
<head>
<style>
    * {margin:0;padding:0}
    .box {width:200px;height:100px;background:#aaa;}
    .box .handle {width:200px;height:30px;background:#f30;}
</style>
</head>
<body :controller="test">

<div class="box">
    <div class="handle" :drag="box"></div>
</div>


<script>
        
    require(['lib/drag/main'], function(){

        yua({
            $id: 'test'
        })
        yua.scan()
    })
</script>

</body>
</html>

```
