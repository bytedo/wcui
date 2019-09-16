![doui](./slogan.jpg)

## Anot 框架
> `Anot` 是`Anot not only templateEngine`的缩写。
> 它是一款迷你,易用、高性能的前端MVVM框架, fork于avalon。进行了大量的重构,精简部分冗余的API, 同时针对组件拓展进行了优化。


## doUI 组件库
> doUI组件库是基于`Web Components`开发的一套高效,轻量,可定制的现代化组件库。
>> 2.x版进行了大量重构, 专门适配支持 type=module的浏览器(着重于electron/node-webkit)。移除了原先对低版本浏览器的兼容代码, 更加高效。


##  亮点
> 框架有着最简洁的API,学习成本为市面上所有的组件/框架中是最低的。 而`Anot`框架也是目前市面上所有的mvvm框架中**最接近原生体验的**。


## 开发进度&计划
- [x] 头像组件(`wc-avatar`)
- [x] 徽标组件(`wc-badge`)
- [x] codemirror插件(第三方插件,整合适配)
- [ ] 倒计时组件(`wc-counter`)
- [x] 拖拽指令插件(`:drag`)
- [x] 表单组件-按钮(`wc-button`)
- [x] 表单组件-复选框(`wc-checkbox`)
- [x] 表单组件-文本输入框(`wc-input`)
- [x] 表单组件-步进数字输入(`wc-number`)
- [x] 表单组件-评分(`wc-star`)
- [x] 表单组件-单选框(`wc-radio`)
- [x] 表单组件-下拉选择(`wc-select`)
- [ ] 表单组件-多级联动(`wc-cascadar`)
- [x] 表单组件-开关(`wc-switch`)
- [x] 图标组件(`wc-icon`)
- [x] 弹层插件(`layer`)
- [ ] markdown解析器(`marked`) 待重构...
- [x] md5(`md5`)
- [ ] md文本编辑器(`anot-meditor`) 待重构...
- [x] 富文本编辑器(`do-neditor`)
- [x] 分页组件(`wc-pager`)
- [ ] 颜色选择器(`wc-colorpicker`)
- [x] 日期选择器(`wc-datepicker`)
- [ ] 时间选择器(`wc-timepicker`)
- [x] 代码高亮插件(`prism`)
- [ ] 网络请求插件(`request`) 待重构...
- [ ] 路由插件(`router`) 待重构...
- [x] 滚动组件(`wc-scroll`)
- [ ] 滑块组件(`wc-silder`)
- [x] 进度条组件(`wc-progress`)
- [x] 数据管理插件(`store`)
- [x] 树形菜单组件(`anot-tree`) 待重构...
- [x] 上传组件(`anot-uploader`) 待重构...


## 开发环境及生产环境
```bash
# 开发环境, 仅编译,不压缩
npm start

# 生产环境, 编译且压缩
npm run prod

```
