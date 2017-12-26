# md5 加密组件

可对普通字符串和文件计算其对应的md5值。


组件符合AMD规范, 可使用require引入


### demo:

```javascript
require(['./md5/main'], function(SparkMD5){
    var Spark = new SparkMD5()
    var md5 = function(cont){
            return Spark.sign.call(Spark, cont)
        }
    
    var file = /*...*/ //文件表单获取
    var fs = new FileReader() // Chrome, IE9+, FF, Safari
    fs.readAsBinaryString(file)

    fs.onload = function(){ // 计算该文件的md5签名
        var sign = md5(this.result)
    }
})
```

