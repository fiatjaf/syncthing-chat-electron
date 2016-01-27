'use strict'

const Rx = require('rx')
const CycleDOM = require('@cycle/dom')
const h = CycleDOM.h
const isolate = require('@cycle/isolate')

const ChatWindow = require('./Window')

module.exports = ChatList

function ChatList (sources /* : {CORE, DOM}*/) {
  let CORE = sources.CORE
  let DOM = sources.DOM

  /* props for the chat window, based on the chat item we click on */
  let chatWindowProps$ = DOM.select('nav ul:first-of-type li a').events('click')
    .do(ev => ev.preventDefault())
    .withLatestFrom(CORE.data$, (ev, d) => {
      let dev = d.deviceByName[ev.target.innerHTML]
      let folder = d.chatFolderForDevice[dev.deviceID]
      return {
        folder: folder,
        devices: [dev]
      }
    })
  let chatWindow = isolate(ChatWindow, 'chat-window')({props$: chatWindowProps$, CORE, DOM})

  /* adding new devices */
  let deviceAdd$ = DOM.select('form#add-device').events('submit')
    .do(ev => ev.preventDefault())
    .map(ev => {
      let input = ev.target.querySelector('input')
      if (input) {
        // we have the input, send it to the core driver
        let normalized = input.value.trim().replace(/[^\w\d]/g, '')
        if (normalized.length === 56) {
          return {method: 'addDevice', args: [normalized]}
        }
      } else {
        // show the input box
        return true
      }
    })
    .share()
    .startWith(false)

  let vtree$ = Rx.Observable.combineLatest(
    CORE.data$,
    deviceAdd$,
    (d, deviceAdd) => {
      let devices = d.devices.keys().map(k => d.devices[k])
      let devicesWithChat = d.folders.keys().map(k => d.deviceByFolderId[k])
      let devicesWithChatIds = devicesWithChat.map(d => d.deviceID)
      let devicesWithoutChat = devices.filter(d => devicesWithChatIds.indexOf(d.deviceID) === -1)

      return h('body', [
        h('header', [
          h('h1', 'Syncthing Chat')
        ]),
        h('nav', [
          h('h1', 'chats'),
          h('ul',
            devicesWithChat.map(dev =>
              h('li', {title: d.chatFolderForDevice[dev.deviceID].id.split('::')[1]},
                h('a', {'href': '#/', 'deviceID': dev.deviceID}, dev.name || dev.deviceID)
              )
            )
          ),
          h('h1', 'peers without chat'),
          h('ul',
            devicesWithoutChat.map(dev =>
              h('li', [
                (dev.name || dev.deviceID) + ' ',
                h('a', {href: '#/', dataset: {'id': dev.deviceID}}, 'create chat')
              ])
            )
          ),
          h('form', {id: 'add-device'}, [
            deviceAdd === true ? h('input') : null,
            h('button', deviceAdd === true ? 'ok' : 'add peer')
          ])
        ]),
        h('main', chatWindow.DOM),
        h('aside', []),
        h('footer', [])
      ])
    }
  )
    .startWith(h('center', 'loading...'))

  /* creating chats for devices without chats */
  /* global confirm */
  let createChat$ = DOM.select('nav ul:last-of-type li a').events('click')
    .do(ev => ev.preventDefault())
    .withLatestFrom(CORE.data$, (ev, d) => d.devices[ev.target.dataset.id])
    .filter(dev => confirm(`do you really want to create a chat with ${dev.name || dev.deviceID}?`))
    .map(dev => ({method: 'createChat', args: [dev.deviceID]}))

  return {
    DOM: vtree$,
    CORE: Rx.Observable.merge(
      createChat$,
      deviceAdd$.filter(x => typeof x === 'object'),
      chatWindow.CORE
    )
  }
}
