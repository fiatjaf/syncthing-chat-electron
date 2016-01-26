'use strict'

// const Rx = require('rx')
const CycleDOM = require('@cycle/dom')
const h = CycleDOM.h

module.exports = ChatItem

function ChatItem (sources /* : {props$, CORE, DOM}*/) {
  // let CORE = sources.CORE
  let DOM = sources.DOM
  let props$ = sources.props$

  let action$ = DOM.events('click')
    .do(ev => ev.preventDefault())
    .share()
    .withLatestFrom(props$, (_, props) => {
      return {dev: props.dev}
    })

  let vtree$ = props$
    .map(props =>
      h('li',
        h('a', {href: '#/'}, props.dev.name || props.dev.deviceID)
      )
    )

  return {
    DOM: vtree$,
    action$
  }
}
