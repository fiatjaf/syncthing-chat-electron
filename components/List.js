'use strict'

const Rx = require('rx')
const CycleDOM = require('@cycle/dom')
const isolate = require('@cycle/isolate')
const h = CycleDOM.h

const ChatWindow = require('./Window')
const Item = require('./Item')

module.exports = ChatList

function ChatList (sources /* : {CORE, DOM}*/) {
  let CORE = sources.CORE
  let DOM = sources.DOM

  /* the components for the listed device chats */
  let chatItem$ = CORE.data$
    .map(d =>
      Rx.Observable.from(d.folders.keys().map(k => d.deviceByFolderId[k]))
    )
    .mergeAll()
    .distinct(dev => dev.deviceID)
    .map(dev => isolate(Item, dev.name)({CORE, DOM, props$: Rx.Observable.just({dev: dev})}))

  let chatItems$ = chatItem$
    .scan((arr, ci) => {
      arr.push(ci)
      return arr
    }, [])
    .startWith([])

  /* the components for the listed devices without chat */
  let noChatItem$ = CORE.data$
    .map(d => {
      let devices = d.devices.keys().map(k => d.devices[k])
      let devicesWithChat = d.folders.keys().map(k => d.deviceByFolderId[k])
      let devicesWithChatIds = devicesWithChat.map(d => d.deviceID)
      let devicesWithoutChat = devices.filter(d => devicesWithChatIds.indexOf(d.deviceID) === -1)
      return Rx.Observable.from(devicesWithoutChat)
    })
    .mergeAll()
    .distinct(dev => dev.deviceID)
    .map(dev => isolate(Item, dev.name)({CORE, DOM, props$: Rx.Observable.just({dev: dev})}))

  let noChatItems$ = noChatItem$
    .scan((arr, ci) => {
      arr.push(ci)
      return arr
    }, [])
    .startWith([])

  /* the chat window component, with props given by a click on a chatItem */
  let chatWindowProps$ = chatItem$
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
  let chatWindow = ChatWindow({props$: chatWindowProps$, CORE, DOM})

  /* the vtree, which uses everything */
  let vtree$ = Rx.Observable.combineLatest(
    chatItems$,
    noChatItems$,
    (chatItems, noChatItems) => {
      return h('body', [
        h('header', [
          h('h1', 'Syncthing Chat')
        ]),
        h('nav', [
          h('h1', 'Chats'),
          h('ul',
            chatItems.map(c => c.DOM)
          ),
          h('h1', 'Devices without a chat'),
          h('ul',
            noChatItems.map(c => c.DOM)
          )
        ]),
        h('main', chatWindow.DOM),
        h('aside', []),
        h('footer', [])
      ])
    }
  )
    .startWith(h('div', 'loading...'))

  /* creating new chats based on the actions from noChatItems */
  /* global confirm */
  let createChatAction$ = noChatItem$
    .pluck('action$')
    .mergeAll()
    .filter(act => confirm('Are you sure you want to create a chat with ' + act.dev.name + '?'))
    .map(act => ({method: 'createChat', args: [act.dev.deviceID]}))

  return {
    DOM: vtree$,
    CORE: Rx.Observable.merge(
      createChatAction$,
      chatWindow.CORE
    )
  }
}
