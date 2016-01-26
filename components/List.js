'use strict'

const Rx = require('rx')
const CycleDOM = require('@cycle/dom')
const isolate = require('@cycle/isolate')
const h = CycleDOM.h

const ChatWindow = require('./Window')
const ChatItem = require('./Item')

module.exports = ChatList

function ChatList (sources /* : {CORE, DOM}*/) {
  let CORE = sources.CORE
  let DOM = sources.DOM

  let chatItems$ = CORE.data$
    .map(d => {
      let devicesWithChat = d.folders.keys().map(k => d.deviceByFolderId[k])
      return devicesWithChat.map(dev =>
        isolate(ChatItem, dev.name)({CORE, DOM, props$: Rx.Observable.just({dev: dev})})
      )
    })

  let chatWindowProps$ = chatItems$
    .map(chatItems => Rx.Observable.from(chatItems))
    .mergeAll()
    .pluck('action$')
    .mergeAll()
    .withLatestFrom(CORE.data$, (action, d) => {
      let dev = action.dev
      let folder = d.chatFolderForDevice[dev.deviceID]
      return {
        folder: folder,
        devices: [dev]
      }
    })
    .do(x => console.log('chatWindowProps', x))

  let chatWindow = ChatWindow({props$: chatWindowProps$, CORE, DOM})

  let vtree$ = Rx.Observable.combineLatest(
    CORE.data$,
    chatItems$,
    (d, chatItems) => {
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
            chatItems.map(c => c.DOM)
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
