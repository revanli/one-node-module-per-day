var EventEmitter = require('events').EventEmitter;
var emitter = new EventEmitter();
var first = require('ee-first');
var ee1 = new EventEmitter();
var ee2 = new EventEmitter();
first([
    [ee1, 'close', 'end', 'error'],
    [ee2, 'error']
], function (err, ee, event, args) {
    console.log("'" + event + "' happend. " + args);
});
ee1.emit('end', 'arg1', 'arg2');
var ee3 = new EventEmitter();
var ee4 = new EventEmitter();
var trunk = first([
    [ee3, 'close', 'end', 'error', 'end-again'],
    [ee4, 'error']
], function (err, ee, event, args) {
    console.log("'" + event + "' happened!");
});
trunk.cancel();
ee3.emit('end-again');
