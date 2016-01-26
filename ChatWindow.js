'use strict'

const Rx = require('rx')
const h = require('@cycle/dom').h

module.exports = ChatWindow

function ChatWindow (sources /* : {props$, CORE, DOM}*/) {
  let props$ = sources.props$
  let CORE = sources.CORE
  let messages$ = Rx.Observable.combineLatest(
    CORE.message$,
    props$,
    (msg, props) => {
      if (msg.content && msg.folder === props.folder.id) return msg
    })
    .do(x => console.log('message', x))
    .filter(x => x)
    .scan((messages, msg) => {
      messages.push(msg)
      return messages
    }, [])
    .startWith([])

  let vtree$ = Rx.Observable.combineLatest(
    props$.do(x => console.log('props', x)),
    messages$.do(x => console.log('messages', x)),
    CORE.data$.do(x => console.log('data', x)),
    (props, messages, data) => {
      return h('article', [
        h('h1', props.devices[0].name),
        h('ul', [
          messages.map(msg =>
            h('li', [
              h('time', msg.time),
              h('div', data.devices[msg.deviceID].name),
              h('div', msg.content)
            ])
          )
        ]),
        h('form', [
          h('input'),
          h('button', 'SEND')
        ])
      ])
    }
  )
    .startWith(h('center', 'nothing here.'))

  let form = sources.DOM.select('form')
  let action$ = form.events('submit')
    .do(ev => ev.preventDefault())
    .withLatestFrom(props$, (ev, props) => ({
      method: 'sendMessage',
      args: [props.folder.id, ev.target.querySelector('input').value]
    }))

  return {
    DOM: vtree$,
    CORE: action$
  }
}
