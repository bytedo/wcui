/**
 *
 * @authors yutent (yutent@doui.cc)
 * @date    2018-06-25 21:39:42
 * @version $Id$
 */

const __STORE__ = {}
// 解析and条件
function parse$And(it) {
  let result = ''
  for (let k in it) {
    let tmp = it[k]
    switch (Anot.type(tmp)) {
      case 'object':
        if (tmp.$has) {
          result += `it.${k}.indexOf(${JSON.stringify(tmp.$has)}) > -1`
          break
        }
        if (tmp.$in) {
          result += `${JSON.stringify(tmp.$in)}.indexOf(it.${k}) > -1`
          break
        }
        if (tmp.$regex) {
          result += `${tmp.$regex}.test(it.${k})`
          break
        }

        // 区间解析
        if (tmp.$lt || tmp.$lte) {
          result += `it.${k} <${tmp.$lte ? '=' : ''} ${tmp.$lt || tmp.$lte}`
          if (tmp.$gt || tmp.$gte) {
            result += ` && it.${k} >${tmp.$gte ? '=' : ''} ${tmp.$gt ||
              tmp.$gte}`
          }
          break
        }
        if (tmp.$gt || tmp.$gte) {
          result += `it.${k} >${tmp.$gte ? '=' : ''} ${tmp.$gt || tmp.$gte}`
          break
        }
        if (tmp.$eq) {
          result += `it.${k} === ${tmp.$eq}`
          break
        }
      default:
        result += `it.${k} === ${JSON.stringify(it[k])}`
        break
    }
    result += ' && '
  }
  result = result.slice(0, -4)

  if (!result) {
    result = 'true'
  }
  return result
}

// 解析or条件
function parse$Or(arr) {
  let result = ''

  arr.forEach(it => {
    result += '('

    result += parse$And(it)
    result += ') || '
  })
  return result.slice(0, -4)
}

class AnotStore {
  constructor(name) {
    Anot.hideProperty(this, '__name__', name)
    Anot.hideProperty(this, '__LAST_QUERY__', '')
    Anot.hideProperty(this, '__QUERY_HISTORY__', [])
    if (!__STORE__[name]) {
      __STORE__[name] = []
      __STORE__[`${name}Dict`] = {}
    }
  }

  static collection(name) {
    return new this(name)
  }

  __MAKE_FN__(opt) {
    let fnStr = `
      let result = [];
      let num = 0;
      for (let it of arr) {
        if(`

    if (opt.$or) {
      fnStr += parse$Or(opt.$or)
    } else {
      fnStr += parse$And(opt)
    }
    fnStr += `){
        result.push(it)
        num++
        if(limit > 0 && num >= limit){
          break
        }
      }
    }
    return result;`

    return Function('arr', 'limit', fnStr)
  }

  // 清除当前集合的数据及缓存, 默认只清除缓存
  clear(force) {
    this.__QUERY_HISTORY__ = []
    this.__LAST_QUERY__ = ''
    if (force) {
      __STORE__[this.__name__] = []
      __STORE__[`${this.__name__}Dict`] = {}
    }
  }

  // 查询多条记录,返回数组
  getAll({ filter, limit = [] } = {}) {
    const collection = __STORE__[this.__name__]
    let result = []
    let forceLimited = false // 强制限制查询结果集
    if (!collection || !collection.length) {
      return result
    }

    if (limit.length < 1) {
      limit = [0]
    }

    if (limit.length < 2 && filter) {
      forceLimited = true
      if (limit[0] > 0) {
        limit.unshift(0)
      }
    }

    if (filter) {
      let query = JSON.stringify(filter)
      if (this.__LAST_QUERY__ === query) {
        result = this.__QUERY_HISTORY__.slice.apply(
          this.__QUERY_HISTORY__,
          limit
        )
      } else {
        let tmpFn = this.__MAKE_FN__(filter)
        result = tmpFn(collection, forceLimited ? limit[1] || 0 : 0)

        // 非强制限制的查询, 缓存结果集
        if (!forceLimited) {
          this.__LAST_QUERY__ = query
          this.__QUERY_HISTORY__ = result
          result = this.__QUERY_HISTORY__.slice.apply(
            this.__QUERY_HISTORY__,
            limit
          )
        }
      }
    } else {
      result = collection.slice.apply(collection, limit)
    }
    return Anot.deepCopy(result)
  }

  // 查询单条记录, 返回Object对象
  get(_id) {
    const collectionDict = __STORE__[`${this.__name__}Dict`]
    return Anot.deepCopy(collectionDict[_id]) || null
  }

  // 查询总数
  count({ filter } = {}) {
    if (filter) {
      if (this.__LAST_QUERY__ === JSON.stringify(filter)) {
        return this.__QUERY_HISTORY__.length
      } else {
        return this.getAll({ filter, limit: [0] }).length
      }
    }
    return __STORE__[this.__name__].length
  }

  __INSERT__(item, primary) {
    let collection = __STORE__[this.__name__]
    let collectionDict = __STORE__[`${this.__name__}Dict`]
    let _id = item[primary || 'id']
    let tmp = collectionDict[_id]
    // 已存在, 则直接更新
    if (tmp) {
      this.update(_id, item)
    } else {
      collection.push(item)
      collectionDict[_id] = item
    }
  }

  // 插入数据, 可以同时插入多条
  insert(items, primary) {
    if (!Array.isArray(items)) {
      items = [items]
    }
    items.forEach(item => {
      this.__INSERT__(item, primary)
    })
    this.clear()
  }

  // 按指定字段排序, 是否字符串排序, 是否逆序
  sort(key, locale, desc) {
    let fnStr = ''
    if (locale && window.Intl) {
      fnStr += `
      let col = new Intl.Collator('zh')
      `
    }
    if (desc) {
      fnStr += 'return arr.sort((b, a) => {'
    } else {
      fnStr += 'return arr.sort((a, b) => {'
    }

    fnStr += `
      let filter = function(val) {
        try {
          return val.${key} || ''
        } catch (err) {
          return ''
        }
      }
    `

    if (locale) {
      if (window.Intl) {
        fnStr += `return col.compare(filter(a), filter(b))`
      } else {
        fnStr += `return (filter(a) + '').localeCompare(filter(b), 'zh')`
      }
    } else {
      fnStr += `return filter(a) - filter(b)`
    }
    fnStr += '\n})'
    Function('arr', fnStr).call(this, __STORE__[this.__name__])
    this.clear()
  }

  // 更新集合中的数据
  update(_id, data) {
    let collection = __STORE__[this.__name__]
    let collectionDict = __STORE__[`${this.__name__}Dict`]

    let tmp = collectionDict[_id]
    let idx = collection.indexOf(tmp)

    Object.assign(tmp, data)
    collection.splice(idx, 1, tmp)
    collectionDict[_id] = tmp
  }

  // 删除集合中单条数据
  remove(_id) {
    let collection = __STORE__[this.__name__]
    let collectionDict = __STORE__[`${this.__name__}Dict`]

    let tmp = collectionDict[_id]
    let idx = collection.indexOf(tmp)

    collection.splice(idx, 1)
    delete collectionDict[_id]
  }
}

Anot.store = window.store = AnotStore

export default AnotStore
