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
import 'bootstrap/dist/css/bootstrap'
import * as bootstrap from 'bootstrap'
import './index.css'
import '@xterm/xterm/css/xterm.css'

bootstrap

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

    initRadioCheckSupport(commandFrameContainer)

    terminalRenderer.render(xtermContainer, commandFrameContainer)
}

const initRadioCheckSupport = (containerToObserve: HTMLElement) => {

    const addChangeEventListener = (input: HTMLInputElement) => {
        input.addEventListener('change', event => {
            event.preventDefault()
            document.querySelectorAll(`input[name=${input.getAttribute('name')}].radio-check`).forEach(otherInput => {
                if (!otherInput.isSameNode(input)) {
                    (otherInput as HTMLInputElement).checked = false
                }
            })
        })
    }

    const observer = new MutationObserver((mutationList, _) => {
        mutationList.filter(it => it.type === 'childList' && it.addedNodes.length > 0).forEach(mutation => {
            mutation.addedNodes.forEach(addedNode => {
                const element = addedNode.nodeType === Node.ELEMENT_NODE ? addedNode as HTMLElement : undefined
                element?.querySelectorAll('input.radio-check').forEach(input => addChangeEventListener(input as HTMLInputElement))
            })
        })
    })

    observer.observe(containerToObserve, { childList: true, subtree: true })
}

start()


