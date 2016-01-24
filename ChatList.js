'use strict'

const Rx = require('rx')
const CycleDOM = require('@cycle/dom')
const h = CycleDOM.h
const isolate = require('@cycle/isolate')

const ChatWindow = require('./ChatWindow')

module.exports = ChatList

function ChatList (sources) {
  return {
    DOM: vtree$
  }
}
