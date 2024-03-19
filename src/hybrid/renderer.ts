import { ipcRenderer } from "electron"
import { ipc } from "../constants/ipc"
import { XtermService } from "../terminal/xterm/xtermService"
import { CommandFrameService } from "./commandFrameService"
import { CommandProcessor } from "./commandProcessing/commandProcessor"

export class TerminalRenderer {

    private readonly _xtermService = new XtermService()
    private readonly _commandFrameService = new CommandFrameService()
    private readonly _commandProcessor = new CommandProcessor(this._commandFrameService)

    constructor() {}

    render(container: HTMLElement) {
        const xtermId = this._xtermService.createXterm((commandOldValue, commandNewValue) => this._commandProcessor.onCommand(commandOldValue, commandNewValue))
        const xterm = this._xtermService.getXterm(xtermId)
        xterm.open(container)

        ipcRenderer.on(ipc.term.PTY, (_, data) => xterm.write(data))
        xterm.onData(data => ipcRenderer.send(ipc.term.TERMINAL, data))  
    }
  
}