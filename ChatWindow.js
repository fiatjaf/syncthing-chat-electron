'use strict'

const h = require('@cycle/dom').h
const Rx = require('rx')

module.exports = ChatWindow

function ChatWindow (sources /* : {props$, CORE, DOM}*/) {
  let props$ = sources.props$
  let messages$ = sources.CORE.message$
    .withLatestFrom(props$, (msg, props) => {
      if (msg.folder === props.folderID) return msg
    })
    .filter(x => x)
    .scan((messages, msg) => messages.push(msg), [])
    .startWith([])

  let vtree$ = Rx.Observable.combineLatest(props$, messages$, (props, messages) =>
    h('article', [
      h('h1', props.name),
      h('ul', [
        messages.map(msg =>
          h('li', [
            h('time', msg.time),
            h('div', sources.CORE.d.devices[msg.deviceID].name),
            h('div', msg.content)
          ])
        )
      ]),
      h('form', [
        h('input'),
        h('button', 'SEND')
      ])
    ])
  )

  let form = sources.DOM.select('form')
  let action$ = form.events('submit')
    .do(ev => ev.preventDefault())
    .withLatestFrom(props$, (ev, props) => ({
      method: 'sendMessage',
      args: [props.folderID, ev.target.querySelector('input').value]
    }))

  return {
    DOM: vtree$,
    CORE: action$
  }
}
