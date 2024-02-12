/**
 * This file will automatically be loaded by webpack and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/latest/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css'
import '@xterm/xterm/css/xterm.css'

import { Terminal } from '@xterm/xterm'
import { ipcRenderer } from 'electron'

const xterm = new Terminal({
  rows: 24,
  cols: 80
})
xterm.open(document.getElementById('xterm'))

ipcRenderer.on('xterm.term', (_, data) => xterm.write(data))
xterm.onData(data => ipcRenderer.send('xterm.pty', data))

ipcRenderer.send('ready')
