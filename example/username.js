const username = require('username');
const os = require('os');

// sync
console.log(username.sync()); // => revan

// Promise
(async () => {
  console.log(await username())
  // => revan
})();

console.log(os.userInfo())

