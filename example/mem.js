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

(async () => {
  console.log(await memoized('foobar'))
  console.log(await memoized('foobar'))
})();


