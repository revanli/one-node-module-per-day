## 每天阅读一个npm模块(4) - throttle-debounce

### 前言
今天阅读的npm模块是[throttle](https://www.npmjs.com/package/throttle-debounce)，这个模块提供了*throttle*和*debounce*两个函数，就是常见的*throttle*节流函数和*debounce*防抖函数，一般用来限制函数的执行频率，避免短时间函数多次执行造成性能的浪费，当前包版本2.1.0

### 用法
首先，先介绍下*throttle*和*debounce*函数，他们都可以用于*函数节流*从而提高性能，他们的异同点如下：
* debounce: 防抖。将多次高频操作合并为最后一次执行，即该段时间内仅执行一次事件。
* throttle: 节流。将高频优化为低频操作，把短时间内多次触发的事件，优化为隔一段固定时间就会执行的事件，即该段时间内可能多次执行事件，节流会稀释函数的执行频率。

```typescript
import { throttle, debounce } from 'throttle-debounce';

function foo(): void {
  console.log('foo...')
}

function bar(): void {
  console.log('bar...')
}

const fooWrapper = throttle(200, foo);

for (let i = 1; i < 10; i++) {
  setTimeout(fooWrapper, i * 30);
}
// foo...
// foo...
// foo...

const barWrapper = debounce(200, bar);

for (let i = 1; i < 10; i++) {
  setTimeout(barWrapper, i * 30);
}
// bar...
```
### 源码解析

#### throttle 节流函数
源码注释比较多，这里将源码简化精简后，*throttle*节流函数如下
```javascript
// 源码4-1
function throttle(delay, callback) {
  var timeoutId;
  var lastExec = 0;

  function wrapper() {
    var self = this;
    var elapsed = Date.now() - lastExec;
    var args = arguments;

    function exec() {
      lastExec = Date.now()
      callback.apply(self, args)
    }

    clearTimeout(timeoutId)

    if (elapsed > delay) {
      exec()
    } else {
      timeoutID = setTimeout(exec, delay - elapsed);
    }
  }

  return wrapper
}
```
代码的逻辑分为三步走：
一、计算距离最近一次函数执行后经过的时间*elapsed*，并清除之前设置的计时器。
二、如果经过的时间大于设置的时间间隔*delay*，则立即执行函数，并更新最近一次函数的执行时间。
三、如果经过的时间小于设置的时间间隔*delay*，则设置一个定时器，在经过*delay - elapsed*时间间隔后执行函数。
这样就完成了节流函数的主要逻辑，节流函数在设置的时间间隔*delay*内一定会执行一次，这样就能打到高频降为低频的操作，稀释了函数的执行频率。

源码4-1用到闭包，返回一个包裹callback的函数，*callback.apply(self, args)*这里为什么要用到apply这种方式去调用回调函数，而不是直接*callback()*调用?一般用到call或者apply去调用，无非就是想改变this的绑定，这里如果直接用callback()调用，callback中的this指向的是window，而用apply的方式，这个self存的是callback的this，所以*callback.apply(self, args)*this的指向还是自身，

#### debounce 防抖函数
防抖函数实现起来比节流函数还更简单一点，因为防抖函数跟节流函数相比少了每隔一段时间就触发一次的操作。
```javascript
function debounce(delay, callback) {
  var timeoutId;

  function wrapper() {
    var self = this;
    var args = arguments;

    function exec() {
      callback.apply(self, args)
    }

    clearTimeout(timeoutId)
    
    timeoutID = setTimeout(exec, delay);
  }

  return wrapper
}
```
debounce函数与throttle函数对比，前者就少了*elapsed*相关逻辑后的代码，其他代码一模一样，所以*debounce*函数可以借助*throttle*函数实现，而源码也是这样做的
```javascript
...
timeoutID = setTimeout(debounceMode ? clear : exec, debounceMode === undefined ? delay - elapsed : delay);
...

function debounce (delay, atBegin, callback) {
  return callback === undefined ? throttle(delay, atBegin, false) : throttle(delay, callback, atBegin !== false);
}
```

