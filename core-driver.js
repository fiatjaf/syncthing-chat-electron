'use strict'

const Rx = require('rx')
const core = require('syncthing-chat-core')

module.exports = makeCoreDriver

function makeCoreDriver () {
  return function coreDriver (action$) {
    return {
      d: core.data,

      actionResponse$: action$
        .map(act => {
          return Rx.Observable.fromPromise(core.action[act.method].apply(core.action, act.args))
        })
        .mergeAll()
        .subscribe(),

      message$: Rx.Observable.fromEvent(core.event, 'gotMessage')
    }
  }
}
