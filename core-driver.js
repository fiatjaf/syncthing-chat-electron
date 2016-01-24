'use strict'

const Rx = require('rxjs')

const core = require('syncthing-chat-core')
const action = core.action

module.exports = makeCoreDriver

function makeCoreDriver () {
  return function coreDriver (action$) {
    return {
      d: core.data,

      actionResponse$: action$
        .map(act =>
          Rx.Observable.fromPromise(core.action[act.method].apply(core.action, act.args))
        )
        .flatMap()

      message$: Rx.Observable.fromEvent(core.event, 'gotMessage')
    }
  }
}
