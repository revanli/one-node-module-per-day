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