## 每天阅读一个npm模块(3) - mimic-fn

### 前言
今天学习的npm模块是[mimic-fn](https://www.npmjs.com/package/mimic-fn)

### 一句话介绍
> [mem](https://www.npmjs.com/package/mimic-fn)(v3.0.0) - 这个模块可以模仿让一个函数模仿另一个函数的行为
当你用一个函数包裹另一个函数时想保留被包裹函数的名字和其他属性的时候会很有用

### 用法
```javascript
const mimicFn = require('mimic-fn');

function foo() {}
foo.unicorn = '🦄'

function test() {}

console.log(foo.name);
// => foo
console.log(test.name);
// => test
mimicFn(test, foo);
console.log(test.name, test.unicorn);
// => foot, 🦄

// when wrap a function in another function and like to preserve
// original name and other properties
function wrapper() {
  return foo()
}

console.log(wrapper.name)
// => 'wrapper'

mimicFn(wrapper, foo);

console.log(wrapper.name);
// => 'foo'

console.log(wrapper.unicorn);
// => 🦄
```

### 源码学习
```javascript
...
const mimicFn = (to, from, {ignoreNonConfigurable = false} = {}) => {
	const {name} = to;

	for (const property of Reflect.ownKeys(from)) {
		copyProperty(to, from, property, ignoreNonConfigurable);
	}

	changePrototype(to, from);
	changeToString(to, from, name);

	return to;
};

module.exports = mimicFn;
```
ES6新API将`Object`对象的一些内部方法放到了`Reflect`对象上，`Reflect.ownKeys(target)`方法返回对象的所有属性，等同于`Object.getOwnPropertyNames`与`Object.getOwnPropertySymbols`之和, [阮一峰es6相关资料](http://es6.ruanyifeng.com/#docs/reflect)

这里循环被拷贝函数的所有属性，然后用`copyProperty`函数拷贝属性

```javascript
const copyProperty = (to, from, property, ignoreNonConfigurable) => {
	// `Function#length` should reflect the parameters of `to` not `from` since we keep its body.
	// `Function#prototype` is non-writable and non-configurable so can never be modified.
	if (property === 'length' || property === 'prototype') {
		return;
	}

	const toDescriptor = Object.getOwnPropertyDescriptor(to, property);
	const fromDescriptor = Object.getOwnPropertyDescriptor(from, property);

	if (!canCopyProperty(toDescriptor, fromDescriptor) && ignoreNonConfigurable) {
		return;
	}

	Object.defineProperty(to, property, fromDescriptor);
};

// `Object.defineProperty()` throws if the property exists, is not configurable and either:
//  - one its descriptors is changed
//  - it is non-writable and its value is changed
const canCopyProperty = function (toDescriptor, fromDescriptor) {
	return toDescriptor === undefined || toDescriptor.configurable || (
		toDescriptor.writable === fromDescriptor.writable &&
		toDescriptor.enumerable === fromDescriptor.enumerable &&
		toDescriptor.configurable === fromDescriptor.configurable &&
		(toDescriptor.writable || toDescriptor.value === fromDescriptor.value)
	);
};
```

我们先了解下属性描述符有哪些：
- configurable: 当且仅当该属性的 configurable 为 true 时，该属性描述符才能够被改变，同时该属性也能从对应的对象上被删除。默认为 false。
- enumerable: 当且仅当该属性的 enumerable 为 true 时，该属性才能够出现在对象的枚举属性中。默认为 false。
- value: 该属性对应的值。可以是任何有效的 JavaScript 值（数值，对象，函数等）。默认为 undefined。
- writable: 当且仅当该属性的 writable 为 true 时，value 才能被赋值运算符改变。默认为 false。
- get: 一个给属性提供 getter 的方法，如果没有 getter 则为 undefined。
- set: 一个给属性提供 setter 的方法，如果没有 setter 则为 undefined。当属性值修改时，触发执行该方法。该方法将接受唯一参数，即该属性新的参数值。


接下来我们顺藤摸瓜看看`copyProperty`函数，`Object.getOwnPropertyDescriptor(obj, prop)`方法获得对象上一个自有属性（自有属性指的是直接赋予该对象的属性，不需要从原型链上进行查找的属性）的属性描述符，而`Object.getOwnPropertyDescriptors(obj)`方法获取一个对象的所有自身属性的描述符，众所周知，javascript中，一切皆对象，来看看一个已定义函数有哪些属性：

```javascript
function foo() {}
console.log(Object.getOwnPropertyDescriptor(foo))
// =>
arguments: {
  configurable: false
  enumerable: false
  value: null
  writable: false
},
caller: {
  configurable: false
  enumerable: false
  value: null
  writable: false
},
length: {
  configurable: true
  enumerable: false
  value: 0
  writable: false
},
name: {
  configurable: true
  enumerable: false
  value: "foo"
  writable: false
},
prototype: {
  configurable: false
  enumerable: false
  value: {constructor: ƒ}
  writable: true
}
```

从上面代码看函数一共有5个属性，分别为：
1. `length`: 函数定义的参数个数；
2. `name`: 函数名，注意其`writable`为false, 所以直接修改函数名是不起作用的；
3. `arguments`: 函数执行时的参数，是一个类数组；
4. `caller`: 函数的调用者
5. `prototype`: 指向函数的原型

看回源码，通过`canCopyProperty`判断能否复制属性，可以复制的，直接用`Object.defineProperty(obj, property, descriptor)`进行复制属性

复制属性是步骤一，还需要把原型对象复制过去，使用的是`Object.setPrototypeOf(obj, prototype)`设置一个指定的对象原型到另一个对象