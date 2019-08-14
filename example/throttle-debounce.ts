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
