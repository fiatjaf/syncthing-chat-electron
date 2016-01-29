'use strict'

const electron = require('electron')
const app = electron.app

var window = null

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('ready', () => {
  window = new electron.BrowserWindow({width: 800, height: 600})
  window.loadURL(`file://${__dirname}/index.html`)

  if (process.env.NODE_DEBUG === 'debug') {
    window.webContents.openDevTools()
  }

  window.on('closed', () => {
    window = null
  })
})
