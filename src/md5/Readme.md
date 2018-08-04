# md5 加密组件

可对普通字符串和文件计算其对应的 md5 值。

组件符合 AMD 规范, 可使用 require 引入

### demo:

```javascript
require(['./md5/main'], function(spark){

    var md5 = function(buf){
      spark.appendBinary(buf)
      return spark.end()
    }

    var file = /*...*/ //文件表单获取
    var fs = new FileReader() // Chrome, IE9+, FF, Safari
    fs.readAsBinaryString(file)

    fs.onload = function(){ // 计算该文件的md5签名
      var sign = md5(this.result)
    }
})
```
