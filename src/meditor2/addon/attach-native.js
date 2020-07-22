/**
 *
 * @authors yutent (yutent.io@gmail.com)
 * @date    2017-04-19 21:17:26
 *
 */

'use strict'

import '../../layer/index'
import 'css/meditor__attach.scss'

const $doc = Anot(document)
const LANGUAGES = {
  zh: {
    IMAGE: {
      REMOTE: '远程图片',
      LOCAL: '本地上传',
      MANAGE: '图片管理',
      ALT: '图片描述',
      ADDRESS: '图片地址'
    },
    FILE: {
      REMOTE: '远程附件',
      LOCAL: '本地上传',
      MANAGE: '附件管理',
      ALT: '附件描述',
      ADDRESS: '附件地址'
    },
    BTN: '确定',
    INSERT: '插入',
    CHOOSE: '选择文件',
    LIMIT: '上传大小限制:单文件最大 ',
    SCREENSHOT: '截图',
    COMPRESS: '截图处理中...',
    TABLE: {
      NAME: '文件名',
      PROGRESS: '上传进度',
      HANDLE: '操作'
    },
    ERROR: {
      TYPE: '文件类型错误',
      SIZE: '文件体积过大',
      EMPTY: '描述和地址不能为空',
      UNDEFINED: '在node-webkit中saveAttach回调必须定义'
    }
  },
  en: {
    IMAGE: {
      REMOTE: 'Remote image',
      LOCAL: 'Local image',
      MANAGE: 'Manage',
      ALT: 'Image alt text',
      ADDRESS: 'Image address'
    },
    FILE: {
      REMOTE: 'Remote file',
      LOCAL: 'Local file',
      MANAGE: 'Manage',
      ALT: 'File alt text',
      ADDRESS: 'File address'
    },
    BTN: 'OK',
    INSERT: 'insert',
    CHOOSE: 'Choose file',
    LIMIT: 'Size of upload file limit to ',
    SCREENSHOT: 'screenshot',
    COMPRESS: 'Screenshot compressing...',
    TABLE: {
      NAME: 'name',
      PROGRESS: 'progress',
      HANDLE: 'handle'
    },
    ERROR: {
      TYPE: 'Forbidden type',
      SIZE: 'Too large',
      EMPTY: 'Alt text and address can not be null',
      UNDEFINED: 'Function saveAttach is not defined'
    }
  }
}
LANGUAGES['zh-CN'] = LANGUAGES.zh
LANGUAGES['zh-TW'] = LANGUAGES.zh
const lang =
  LANGUAGES[window.__ENV_LANG__ || navigator.language] || LANGUAGES.en

const fixCont = function(vm, tool) {
  let limit = false
  if (vm.props.uploadSizeLimit) {
    limit = (vm.props.uploadSizeLimit / (1024 * 1024)).toFixed(2)
  }
  return `
  <dl class="do-meditor-attach">
    <dt class="tab-box" :drag="do-layer" data-limit="window">
      <span class="item" :class="active:tab === 1" :click="switchTab(1)">
        ${lang[tool].REMOTE}
      </span>
      <span class="item" :class="active:tab === 2" :click="switchTab(2)">
        ${lang[tool].LOCAL}
      </span>
      <span class="item" :class="active:tab === 3" :click="switchTab(3)">
        ${lang[tool].MANAGE}
      </span>
    </dt>
    <dd class="cont-box">
      <div class="remote" :visible="tab === 1">
        <section class="section do-fn-cl">
          <input 
            class="do-meditor__input" 
            :duplex="attachAlt" 
            placeholder="${lang[tool].ALT}" />
        </section>
        <section class="section do-fn-cl">
          <input 
            class="do-meditor__input" 
            :duplex="attach" 
            placeholder="${lang[tool].ADDRESS}" />
        </section>
        <section class="section do-fn-cl">
          <a 
            href="javascript:;" 
            class="do-meditor__button submit" 
            :click="confirm">${lang.BTN}</a>
        </section>
      </div>
      <div class="local" :visible="tab === 2">
        <div class="select-file">
          <input ref="attach" multiple :change="change" type="file" class="hide" />
          <span class="file" :click="select">${lang.CHOOSE}</span>
          ${limit ? `<span class="tips">(${lang.LIMIT + limit} MB)</span>` : ''}
        </div>
        <ul class="upload-box">
          <li class="thead">
            <span class="col">${lang.TABLE.NAME}</span>
            <span class="col">${lang.TABLE.PROGRESS}</span>
            <span class="col">${lang.TABLE.HANDLE}</span>
          </li>
          <li class="tbody">
            <p :for="uploadQueue">
              <span 
                class="col do-fn-ell" 
                :text="el.name" 
                :layer-tips="el.name"></span>
              <span class="col" :html="el.progress"></span>
              <span class="col"><a class="insert" :click="insert(el)">${
                lang.INSERT
              }</a></span>
            </p>
          </li>
        </ul>
      </div>
      <div class="manager" :visible="tab === 3">
        <ul class="list-box">
          <li 
            class="item" 
            :for="attachList"
            :layer-tips="el.name"
            :click="insert(el)">

            <span class="thumb" :html="el.thumb"></span>
            <p class="name" :text="el.name"></p>
          </li>
        </ul>
        
      </div>
    </dd>
  </dl>`
}

/**
 * [uploadFile 文件上传]
 * @param  {[type]} vm    [vm对象]
 * @param  {[type]} tool  [image/file]
 */
function uploadFile(vm, tool) {
  for (let it of this.files) {
    let ext = it.name.slice(it.name.lastIndexOf('.'))
    if (tool === 'IMAGE' && !/^\.(jpg|jpeg|png|gif|bmp|webp|ico)$/.test(ext)) {
      this.uploadQueue.push({
        name: it.name,
        progress: '<span class="red">0%(' + lang.ERROR.TYPE + ')</span>',
        url: ''
      })
      continue
    }
    if (vm.props.uploadSizeLimit && it.size > vm.props.uploadSizeLimit) {
      this.uploadQueue.push({
        name: it.name,
        progress: '<span class="red">0%(' + lang.ERROR.SIZE + ')</span>',
        url: ''
      })
      continue
    }
    let fixName = new Date().format('YmdHis') + ext
    let attach = { name: it.name, fixName, progress: '100%', url: '' }

    if (vm.props.saveAttach) {
      vm.props
        .saveAttach(attach, it)
        .then(url => {
          attach.url = url
          this.uploadQueue.push(attach)
        })
        .catch(err => {
          Anot.error(err)
        })
    } else {
      layer.toast(lang.ERROR.UNDEFINED, 'error')
    }
  }
}

function uploadScreenshot(vm, blob) {
  let name = new Date().format('YmdHis') + '.jpg'
  let attach = { name, url: '' }

  if (vm.props.saveAttach) {
    vm.props
      .saveAttach(attach, blob)
      .then(url => {
        vm.insert(`![${lang.SCREENSHOT}](${url})`)
      })
      .catch(err => {
        Anot.error(err)
      })
  } else {
    layer.toast(lang.ERROR.UNDEFINED, 'error')
  }
}

function showDialog(elem, vm, tool) {
  let offset = Anot(elem).offset()

  layer.open({
    type: 7,
    menubar: false,
    fixed: true,
    maskClose: true,
    offset: [offset.top + 35 - $doc.scrollTop()],
    shift: {
      top: offset.top - $doc.scrollTop()
    },
    tab: 2,
    attach: '',
    attachAlt: '',
    uploadQueue: [], //当前上传的列表
    attachList: [], //附件管理列表
    switchTab(id) {
      this.tab = id
      if (id === 3) {
        this.attachList.clear()
        if (vm.props.getAttachList) {
          vm.props
            .getAttachList(tool)
            .then(list => {
              list.forEach(it => {
                let ext = it.name.slice(it.name.lastIndexOf('.'))
                it.isImage = /^\.(jpg|jpeg|png|gif|bmp|webp|ico)$/.test(ext)
                it.thumb = it.isImage
                  ? `<img src="${it.url}" />`
                  : `<em class="do-icon-txt"></em>`
              })
              return list
            })
            .then(list => {
              list = list.filter(it => {
                if (tool === 'IMAGE') {
                  return it.isImage
                }
                return true
              })
              this.attachList = list
            })
        }
      }
    },
    select() {
      let ev = document.createEvent('MouseEvent')
      ev.initEvent('click', false, false)
      this.$refs.attach.dispatchEvent(ev)
    },
    change(ev) {
      this.files = ev.target.files
      uploadFile.call(this, vm, tool)
    },
    insert: function(it) {
      if (!it.url) {
        return
      }
      let val = `\n${tool === 'IMAGE' ? '!' : ''}[${it.name}](${it.url})`
      vm.insert(val)
    },
    confirm: function() {
      if (!this.attach || !this.attachAlt) {
        return layer.toast(lang.ERROR.EMPTY, 'error')
      }
      let val = `\n${tool === 'IMAGE' ? '!' : ''}[${this.attachAlt}](${
        this.attach
      })`

      vm.insert(val)
      this.close()
    },
    content: fixCont(vm, tool)
  })
}

const plugin = {
  __init__(ME) {
    Object.assign(ME.vm.addon, {
      attach(elem) {
        showDialog(elem, this, 'FILE')
      },
      image(elem) {
        showDialog(elem, this, 'IMAGE')
      }
    })

    ME.vm.$refs.editor.addEventListener('paste', function(ev) {
      ev.preventDefault()
      let txt = ev.clipboardData.getData('text/plain')

      //文本类型直接默认处理
      if (txt) {
        return
      }

      if (ev.clipboardData.items) {
        let items = ev.clipboardData.items
        let len = items.length
        let blob = null

        for (let it of items) {
          if (it.type.indexOf('image') > -1) {
            blob = it.getAsFile()
          }
        }

        if (blob !== null) {
          layer.toast(lang.COMPRESS)
          // 压缩截图,避免文件过大
          let reader = new FileReader()
          reader.onload = function() {
            let img = document.createElement('img')
            let canvas = document.createElement('canvas')

            img.onload = function() {
              canvas.width = img.width
              canvas.height = img.height

              let ctx = canvas.getContext('2d')
              ctx.clearRect(0, 0, canvas.width, canvas.height)
              ctx.drawImage(this, 0, 0, canvas.width, canvas.height)

              canvas.toBlob(
                obj => {
                  uploadScreenshot(ME.vm, obj)
                },
                'image/jpeg',
                0.8
              )
            }
            img.src = this.result
          }
          reader.readAsDataURL(blob)
        }
      }
    })
  }
}

export default plugin
