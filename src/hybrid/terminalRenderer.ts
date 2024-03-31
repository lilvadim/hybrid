import { ipcRenderer } from "electron"
import { ipc } from "../constants/ipc"
import { TerminalService } from "../terminal/xterm/terminalService"
import { CommandFrameService } from "./commandFrameService"
import { CommandProcessor } from "./commandProcessing/commandProcessor"
import { TerminalController } from "./terminalController"
import { hybridApi } from "../preload"

export class TerminalRenderer {

    private readonly _terminalService = new TerminalService()
    private readonly _commandFrameService = new CommandFrameService()
    private readonly _commandProcessor = new CommandProcessor(this._commandFrameService)

    constructor() {}

    render(container: HTMLElement) {
        const terminalId = this._terminalService.createXterm((commandOldValue, commandNewValue) => this._commandProcessor.onCommand(commandOldValue, commandNewValue))
        const terminal = this._terminalService.getTerminal(terminalId)
        terminal.xterm.open(container)

        ipcRenderer.on(ipc.term.pty, (_, data) => terminal.xterm.write(data))
        terminal.xterm.onData(data => ipcRenderer.send(ipc.term.terminal, data))  

        const controller = new TerminalController(terminal)

        this._initApi(controller)
    }

    private _initApi(controller: TerminalController) {
        hybridApi.addOption = (parameters) => controller.addOption(parameters)
        hybridApi.clearCurrentCommand = () => controller.clearCurrentCommand()
        hybridApi.registerCommand = (commandDescription) => controller.registerCommand(commandDescription)
        hybridApi.removeOption = (parameters) => controller.removeOption(parameters)
        console.log('TerminalRenderer: api initialized')
    }
  
}