"use strict";
exports.__esModule = true;
var throttle_debounce_1 = require("throttle-debounce");
function foo() {
    console.log('foo...');
}
function bar() {
    console.log('bar...');
}
var fooWrapper = throttle_debounce_1.throttle(200, foo);
for (var i = 1; i < 10; i++) {
    setTimeout(fooWrapper, i * 30);
}
var barWrapper = throttle_debounce_1.debounce(200, bar);
for (var i = 1; i < 10; i++) {
    setTimeout(barWrapper, i * 30);
}
