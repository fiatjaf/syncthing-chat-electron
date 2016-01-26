'use strict'

const Rx = require('rx')
const core = require('syncthing-chat-core')

module.exports = makeCoreDriver

function makeCoreDriver () {
  return function coreDriver (action$) {
    let data$ = Rx.Observable.fromEvent(core.event, 'data')

    return {
      actionResponse$: action$
        .map(act => Rx.Observable.fromPromise(core.action[act.method].apply(core.action, act.args)))
        .mergeAll()
        .subscribe(),

      message$: Rx.Observable.fromEvent(core.event, 'gotMessage'),
      status$: Rx.Observable.fromEvent(core.event, 'deviceStatusChanged'),
      devices$: data$
        .map(d => d.devices.keys().map(k => d.devices[k]))
        .startWith([]),
      devicesWithChat$: data$
        .map(d => d.folders.keys().map(k => d.deviceByFolderId[k]))
        .startWith([]),

      data$
    }
  }
}
