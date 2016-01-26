'use strict'

const Rx = require('rx')
const core = require('syncthing-chat-core')

module.exports = makeCoreDriver

function makeCoreDriver () {
  return function coreDriver (action$) {
    let data$ = Rx.Observable.fromEvent(core.event, 'data')
      .replay(1)
    data$.connect()

    return {
      actionResponse$: action$
        .map(act => Rx.Observable.fromPromise(core.action[act.method].apply(core.action, act.args)))
        .mergeAll()
        .subscribe(),

      message$: Rx.Observable.fromEvent(core.event, 'gotMessage'),
      status$: Rx.Observable.fromEvent(core.event, 'deviceStatusChanged'),

      data$
    }
  }
}
