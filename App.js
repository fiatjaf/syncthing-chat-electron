'use strict'

const Rx = require('rx')
const Cycle = require('@cycle/core')
const makeDOMDriver = require('@cycle/dom').makeDOMDriver

const makeCoreDriver = require('./core-driver')
const main = require('./ChatList')

Cycle.run(main, {
  DOM: makeDOMDriver(document.documentElement),
  CORE: makeCoreDriver()
})
