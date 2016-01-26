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
        name: dev.name,
        folderID: folder.id
      }
    })
    .startWith(null)
    .do(x => {
      console.log('props', x)
    })

  let chatWindow = ChatWindow({props$, CORE, DOM})

  let action$ = Rx.Observable.merge(
    chatWindow.CORE
  )

  let vtree$ = Rx.Observable.combineLatest(
    CORE.data$,
    CORE.devices$,
    CORE.devicesWithChat$,
    (data, devices, devicesWithChat) => {
      let devicesWithChatIds = devicesWithChat.map(d => d.deviceID)
      let devicesWithoutChat = devices.filter(d => devicesWithChatIds.indexOf(d.deviceID) === -1)

      return h('body', [
        h('header', [
          h('h1', 'Syncthing Chat')
        ]),
        h('nav', [
          h('ul',
            devicesWithChat.map(d =>
              h('li',
                h('a', d.name)
              )
            )
          ),
          h('ul',
            devicesWithoutChat.map(d =>
              h('li',
                h('a', d.name)
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

  return {
    DOM: vtree$,
    CORE: action$
  }
}
