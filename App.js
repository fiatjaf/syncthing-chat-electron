'use strict'

const Cycle = require('@cycle/core')
const makeDOMDriver = require('@cycle/dom').makeDOMDriver

const makeCoreDriver = require('./core-driver')
const main = require('./ChatWindow')

Cycle.run(main, {
  DOM: makeDOMDriver('main'),
  CORE: makeCoreDriver(),
  props$: Rx.Observable.just({
    name: 'spooner',
    folderID: 'chat::90a4ff4f3f2901b89a0c7c5fe207bd89'
  })
})
