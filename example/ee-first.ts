const EventEmitter = require('events')
const emitter = new EventEmitter()

// first example
// listen first event invoked
var first = require('ee-first')
var ee1 = new EventEmitter()
var ee2 = new EventEmitter()

first([
  [ee1, 'close', 'end', 'error'],
  [ee2, 'error']
], function(err: any, ee: any, event: any, args: any) {
  // listener invoked
  console.log(`'${event}' happend. ${args}`)
})

ee1.emit('end', 'arg1', 'arg2')

// cancel
const ee3 = new EventEmitter()
const ee4 = new EventEmitter()
const trunk = first([
  [ee3, 'close', 'end', 'error', 'end-again'],
  [ee4, 'error']
], function(err: any, ee: any, event: any, args: any) {
  console.log(`'${event}' happened!`)
})

trunk.cancel()
ee3.emit('end-again')