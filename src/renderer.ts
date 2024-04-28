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

import { TerminalRenderer } from './hybrid/terminalRenderer'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import '@xterm/xterm/css/xterm.css'

const start = () => {
    const terminalRenderer = new TerminalRenderer()
    const xtermContainer = document.getElementById('xterm')
    if (!xtermContainer) {
        throw new Error("xterm container not found")
    }
    const commandFrameContainer = document.getElementById('command-frame-container')
    if (!commandFrameContainer) {
        throw new Error("command frame container not found")
    }
    terminalRenderer.render(xtermContainer, commandFrameContainer)
}

start()
