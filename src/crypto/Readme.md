# crypto & md5 加密组件




## md5
>  这里使用的是第三方的 SparkMD5 实现

```javascript

import { md5, md5Sum } from 'crypto/md5'

// 直接计算字段串的md5值
console.log(md5('123456'))


// 计算该文件的md5签名
var file = /*...*/ //文件表单获取
var fs = new FileReader() 
fs.onload = function(){ 
  console.log(md5Sum(this.result))
}
fs.readAsBinaryString(file)

```


## crypto
> 这里使用的是浏览器内置的实现, 需要在https下或本地才能用。
>> 返回值都是Promise对象

```javascript

import hash, { sha1, sha256, sha512, hmac, base64encode, base64decode } from 'crypto/index'



hash('sha-1', '123456')
// 等价于
sha1('123456')


// hmac签名
hmac('sha-1', '123456', 'a key', 'hex')


```