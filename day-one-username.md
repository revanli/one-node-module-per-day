#### 每天阅读一个npm模块(1) - username

##### 前言
最近看到博客[每天阅读一个 npm 模块（1）- username](https://juejin.im/post/5b803ee6e51d4538e567a85c)，觉得作者的这个想法很好，每天阅读一个npm模块，积少成多，聚沙成塔。好处是：一可以扩展下见识，知道有那些轮子；二是知道这些轮子的原理，方便在自己造轮子的时候能信手拈来；三是可以锻炼下毅力，持续更新。

##### 介绍
[username](https://www.npmjs.com/package/username)(v 5.0.0)模块是获取系统当前用户的名字

##### 用法
username支持同步和Promise异步写法：
```javascript
const username = require('username');

// sync
console.log(username.sync()); // => revan

// Promise
(async () => {
  console.log(await username())
  // => revan
})();
```

##### 原理
1. 通过**process.env**变量中的值获取用户名，若存，直接返回
2. 若存在**os.userInfo**函数，通过**os.userInfo().username**获得用户名并返回
3. 若以上方法都获取不到数据，则在OS X/Linux下通过制定**id -un**命令，Windows通过**whoami**命令获取，然后用正则过滤得到username

接下来结合源码对这三步进行研究

###### process.env
```javascript
// 源代码 1-1 
const getEnvironmentVariable = () => {
	const {env} = process;

	return (
		env.SUDO_USER ||
		env.C9_USER /* Cloud9 */ ||
		env.LOGNAME ||
		env.USER ||
		env.LNAME ||
		env.USERNAME
	);
};
```
**process.env**返回一个包含用户当前环境变量(environment variable)的对象，可以在命令行执行**printenv**命令查看所有的环境变量，也可以使用**printenv v_name**命令获取一个变量的值
```shell
$ printenv
// => SHELL=/bin/zsh
// => TERM=xterm-256color
// => USER=revan
// => SUDO_USER=revan
// => ...

$ printenv USER
// => revan
```

在Node.js中，关于**process.env**需要了解以下几点
1. 可以通过**process.env.foo = "bar"的方式设置环境变量，在将来版本中，只允许设置string、number、和boolean类型的值
2. 可以通过delete方法删除环境变量
3. 在 Node.js 中对**process.env**的修改并不会反映在 node 进程之外，不过可以在外部设置环境变量然后通过 Node.js 代码去获取，实践中经常通过这种方式设置**NODE_ENV**变量，然后在 webpack 配置代码中读取它的值来判断环境进行不同的构建。Windows下不支持直接**NODE_ENV=production**这种方式，需要安装**cross-env**包进行兼容

回到源代码1-1，我们来看下SUDO_USER这个变量：

当用户身份是root时，此时**USER**变量会返回root，而**SUDO_USER**变量返回的是登陆为root的账户名

###### os.userInfo

```javascript
// 源代码1-2
const getUsernameFromOsUserInfo = () => {
	try {
		return os.userInfo().username;
	} catch (_) {}
};
```
**os.userInfo()返回的是当前用户的一些信息

```javascript
const os = require('os')
console.log(os.userInfo())

// => {
// =>  uid: 501,
// =>  gid: 20,
// =>  username: 'revan',
// =>  homedir: '/Users/revan',
// =>  shell: '/bin/zsh'
// => }
```

###### 执行命令行命令

当前两种方式都无法获取用户名时，在OS X/Linux下会通过**id -un**命令获取用户名，在Windows会通过whoami命令获取用户名。[execa](https://www.npmjs.com/package/execa)，node官方child_process的增强包
```javascript
try {
  if (process.platform === 'win32') {
    return cleanWindowsCommand(await execa.stdout('whoami'));
  }

  return await execa.stdout('id', ['-un']);
} catch (_) {}
```
**process.platform**会返回当前的平台，包括aix|darwin|freebsd|linux|openbsd|sunos|win32，当命令执行异常时，会返回undefined给到用户，从使用者角度来说，这样处理的好处是：一作为使用者，只关心能否拿到正确结果，不关心包的内部异常信息，多余的出错信息是一种干扰，二返回**undefined**有利于使用者处理逻辑

##### 总结
通过阅读username源码
1.了解SUDO_USER与USER变量的区别
2.知道process.env的增删查改
3.os.userInfo()返回的信息
最后，username还使用[mem](https://www.npmjs.com/package/mem)缓存结果，提升效率

