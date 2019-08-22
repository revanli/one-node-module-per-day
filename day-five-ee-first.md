## 每天阅读一个npm模块(5) - ee-first

### 前言
今天阅读的npm模块是[ee-first](https://www.npmjs.com/package/ee-first)，通过监听一系列事件，得知哪一个事件最先发生并进行相应的操作，当前包版本1.1.1。

### 用法
`ee-first`中`ee`的意思是`EventEmitter`，`EventEmitter`类由Nodejs中的`events`模块定义，它的核心就是事件触发与事件监听器功能的一个封装。大多数Nodejs核心API构建于惯用的异步事件驱动架构，`eventEmitter.on()`用于注册监听器，`eventEmitter.emit()`用于触发事件。
```javascript
let EventEmitter = require('events')
let eventEmitter = new EventEmitter()

event.on('some_event', function () {
  console.log('some_event事件触发')
})

setTimeout(() => {
  event.emit('some_event')
}, 3000)
```
看完官方例子，我们看下`ee-first`的官方例子

* first
```typescript
const first = require('ee-first')
const ee1 = new EventEmitter()
const ee2 = new EventEmitter()

first([
  [ee1, 'close', 'end', 'error'],
  [ee2, 'error']
], function(err: any, ee: any, event: any, args: any) {
  console.log(`'${event}' happed. ${args}`)
})

ee1.emit('end', 'arg1', 'arg2')
// => 'end' happend. arg1,arg2
```
* .cancel()
```typescript
// cancel
const ee3 = new EventEmitter()
const ee4 = new EventEmitter()
const trunk = first([
  [ee3, 'close', 'end', 'error', 'end-again'],
  [ee4, 'error']
], function(err: any, ee: any, event: any, args: any) {
  console.log(`'${event}' happened!`)
})

trunk.cancel()
ee3.emit('end-again')
// => 不会执行 nothing
```

### 源码分析

#### 生成响应函数
```javascript
// 5-1
function listener(event, done) {
  return function onevent(arg1) {
    var args = new Array(arguments.length)
    var ee = this
    var err = event === 'error'
      ? arg1
      : null

    // copy args to prevent arguments escaping scope
    for (var i = 0; i < args.length; i++) {
      args[i] = arguments[i]
    }

    done(err, ee, event, args)
  }
}
```
1.从5-1的源码可以看到，对`error`事件进行了特殊的处理，将错误信息作为第一个参数传给回调函数，这个Nodejs中的一个`error-first-callback`的编程规范，这种模式的好处有以下几点，[不知道怎么确切的翻译，干脆直接用原话](https://github.com/30-seconds/30-seconds-of-interviews/blob/master/questions/node-error-first-callback.md)
 - i. 错误发生时没必要处理接下来的数据，直接中断.
 - ii. Having a consistent API leads to more adoption.
 - iii. Ability to easily adapt a callback pattern that will lead to more maintainable code.

2.通过`new Array`和循环复制，将`onevent`函数的参数都保存到新数组`args`中，这里不太清楚为什么需要复制到新数组`args`中，注释说是防止参数作用域异常，不明白，这里用ES6的`Array.from()`也是可以将`arguments`复制到新数组中的.

#### 绑定响应函数
```javascript
// 5-2
function first(stuff, done) {
  if (!Array.isArray(stuff))
    throw new TypeError('arg must be an array of [ee, events...] arrays')

  // ...

  for (var i = 0; i < stuff.length; i++) {
    var arr = stuff[i]

    if (!Array.isArray(arr) || arr.length < 2)
      throw new TypeError('each array member must be [ee, events...]')

    var ee = arr[0]

    for (var j = 1; j < arr.length; j++) {
      var event = arr[j]
      var fn = listener(event, callback)

      // listen to the event
      ee.on(event, fn)
      // ...
    }
  }

  // ...
}
```
通过`var fn = listener(event, callback); ee.on(event, fn)`就将对应event的响应函数监听了。

#### 移除响应函数
既然有绑定响应函数，那么按照正常的流程来说就有解绑响应函数了，因为绑定事件监听函数对内存有不小的消耗，这也是为什么Nodejs在默认情况下，一个EventEmitter最多只能绑定10个监听函数。
```javascript
// 5-3
function first(stuff, done) {
  // ...
  var cleanups = []

  for (var i = 0; i < stuff.length; i++) {
    var arr = stuff[i]

    if (!Array.isArray(arr) || arr.length < 2)
      throw new TypeError('each array member must be [ee, events...]')

    var ee = arr[0]

    for (var j = 1; j < arr.length; j++) {
      // ...
      cleanups.push({
        ee: ee,
        event: event,
        fn: fn,
      })
    }
  }

  function cleanup() {
    var x
    for (var i = 0; i < cleanups.length; i++) {
      x = cleanups[i]
      x.ee.removeListener(x.event, x.fn)
    }
  }
}
```
每一次绑定响应函数后，push方法将事件和响应函数一一对应起来储存到clearups数组中，然后通过遍历`clearups`数组，将之前绑定的监听函数逐一移除.

#### thunk函数
```javascript
// 5-4
function first (stuff, done) {
  // ...

  function thunk (fn) {
    done = fn
  }

  thunk.cancel = cleanup

  return thunk
}
```
这里声明了一个函数`thunk`，把需要两个参数的`first(stuff, done)`转换成只需要一个回调函数作为参数的`thunk(done)`返回。thunk函数就是将一段代码通过函数包裹返回，[阮一峰老师的说法](http://www.ruanyifeng.com/blog/2015/05/thunk.html)
> 在 JavaScript 语言中，Thunk 函数替换的不是表达式，而是多参数函数，将其替换成单参数的版本，且只接受回调函数作为参数。