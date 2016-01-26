'use strict'

const Rx = require('rx')
const CycleDOM = require('@cycle/dom')
const h = CycleDOM.h

const ChatWindow = require('./ChatWindow')

module.exports = ChatList

function ChatList (sources /* : {CORE, DOM}*/) {
  let CORE = sources.CORE
  let DOM = sources.DOM

  let props$ = sources.DOM.select('nav li a').events('click')
    .do(ev => ev.preventDefault())
    .withLatestFrom(CORE.data$, (ev, d) => {
      let dev = d.deviceByName[ev.target.innerHTML]
      let folder = d.chatFolderForDevice[dev.deviceID]
      return {
        folder: folder,
        devices: [dev]
      }
    })

  let chatWindow = ChatWindow({props$, CORE, DOM})

  let vtree$ = Rx.Observable.combineLatest(
    CORE.data$,
    (d) => {
      let devices = d.devices.keys().map(k => d.devices[k])
      let devicesWithChat = d.folders.keys().map(k => d.deviceByFolderId[k])
      let devicesWithChatIds = devicesWithChat.map(d => d.deviceID)
      let devicesWithoutChat = devices.filter(d => devicesWithChatIds.indexOf(d.deviceID) === -1)

      return h('body', [
        h('header', [
          h('h1', 'Syncthing Chat')
        ]),
        h('nav', [
          h('ul',
            devicesWithChat.map(dev =>
              h('li',
                h('a', dev.name || dev.deviceID)
              )
            )
          ),
          h('ul',
            devicesWithoutChat.map(dev =>
              h('li',
                h('a', dev.name || dev.deviceID)
              )
            )
          )
        ]),
        h('main', chatWindow.DOM),
        h('aside', []),
        h('footer', [])
      ])
    }
  )
    .startWith(h('div', 'loading...'))

  let action$ = Rx.Observable.merge(
    Rx.Observable.just({method: 'listDevices', args: []}),
    chatWindow.CORE
  )

  return {
    DOM: vtree$,
    CORE: action$
  }
}
