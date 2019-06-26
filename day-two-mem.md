## 每天阅读一个npm模块(2) - mem

### 前言
今天学习的npm模块是[mem](https://www.npmjs.com/package/mem)

### 一句话介绍
> [mem](https://www.npmjs.com/package/mem)(v5.0.0) - 通过缓存函数的返回值从而减少函数的实际执行次数，从而提高了性能

### 用法
mem支持缓存同步函数和异步函数

```javascript
const mem = require('mem');

// 同步函数缓存
let i = 0;
const counter = () => ++i;
const memoized = mem(counter);

console.log(memoized('foo'));
// => 1
// 参数相同，返回缓存的结果1
console.log(memoized('foo'));
// => 1
// 参数变化，counter函数再次执行，返回2
console.log(memoized('bar'));
// => 2
// 参数相同，返回缓存的结果1
console.log(memoized('foo'));
// => 1
```

对返回promise的函数也同样适用

```javascript
const mem = require('mem');
 
let i = 0;
const counter = async () => ++i;
const memoized = mem(counter);
 
(async () => {
  console.log(await memoized());
  //=> 1

  // The return value didn't increase as it's cached
  console.log(await memoized());
  //=> 1
})();
```
这些是mem的核心功能，除此外还支持设置缓存时间、自定义缓存容器的功能。

### 源码学习

```javascript
const cacheStore = new WeakMap();

...

// 1-1 主函数
const mem = (fn, options) => {
	options = {
		cacheKey: defaultCacheKey,
		cache: new Map(),
		cachePromiseRejection: true,
		...options
	};

	if (typeof options.maxAge === 'number') {
		mapAgeCleaner(options.cache);
	}

	const {cache} = options;
	options.maxAge = options.maxAge || 0;

	const setData = (key, data) => {
		cache.set(key, {
			data,
			maxAge: Date.now() + options.maxAge
		});
	};

	const memoized = function (...arguments_) {
		const key = options.cacheKey(...arguments_);

		if (cache.has(key)) {
			return cache.get(key).data;
		}

		const cacheItem = fn.call(this, ...arguments_);

		setData(key, cacheItem);

		if (isPromise(cacheItem) && options.cachePromiseRejection === false) {
			// Remove rejected promises from cache unless `cachePromiseRejection` is set to `true`
			cacheItem.catch(() => cache.delete(key));
		}

		return cacheItem;
	};

	try {
		// The below call will throw in some host environments
		// See https://github.com/sindresorhus/mimic-fn/issues/10
		mimicFn(memoized, fn);
	} catch (_) {}

	cacheStore.set(memoized, options.cache);

	return memoized;
};

module.exports = mem;
...
```

我们直接从主函数一步一步往下看，options对象把传入的options和默认的属性进行合并，保存cache关键是如何保证key的唯一性，如何处理不同的数据类型的key？如何处理对象间的比较？这里看下defaultCacheKey的逻辑

```javascript
// 1-2 默认cahche key
const defaultCacheKey = (...arguments_) => {
	if (arguments_.length === 0) {
		return '__defaultKey';
	}

	if (arguments_.length === 1) {
		const [firstArgument] = arguments_;
		const isObject = typeof firstArgument === 'object' && firstArgument !== null;
		const isPrimitive = !isObject;
		if (isPrimitive) {
			return firstArgument;
		}
	}

	return JSON.stringify(arguments_);
};
```
从上面代码可以看到
1. 没有传入key的情况下，使用'__defaultKey'默认key
2. 判断是原始类型(Boolean | Number | Null | Undefined | String | Symbol)和Object类型，是原始类型直接返回，如果是对象则通过JSON.stringify()转化为字符串进行比较

对Object类型进行字符串比较是一种简单暴力的方式，一是对象结构复杂，会消耗不少时间；二是对于不同的正则对象，**JSON.stringify()**的结果均为**{}**，不能输出特定的key。

#### 存储结构
看回1-1主函数的源码，使用到了[Map](http://es6.ruanyifeng.com/?search=weakmap&x=0&y=0#docs/set-map#Map)和[WeakMap](http://es6.ruanyifeng.com/?search=weakmap&x=0&y=0#docs/set-map)两种存储结构，具体的用法可以看下阮老师的[ECMAScript 6 入门](http://es6.ruanyifeng.com/?search=weakmap&x=0&y=0#docs/set-map#Map)里面的介绍，这里不一一赘述。

1-1主函数源码主要完成了2个操作
1. cacheItem作为函数执行的结果，用Map类型缓存cacheItem函数结果，缓存的键值为defaultCacheKey返回的结果
2. 将类型为WeakMap的cacheStore作为整体的缓存，缓存的键值为函数本身

储存结果选用Map而不用Object类型主要是因为Map的键值支持所有类型，而Object的键值只支持字符串。
cacheStore选用WeakMap类型而不用Map类型是因为具有不增加引用个数的优点，更利于V8进行垃圾回收。

