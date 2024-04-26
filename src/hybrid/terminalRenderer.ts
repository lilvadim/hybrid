import { ipcRenderer } from "electron"
import { ipc } from "../constants/ipc"
import { TerminalService } from "../terminal/xterm/terminalService"
import { CommandFrameService } from "./commandFrameService"
import { CommandProcessor } from "./commandProcessor"
import { TerminalController } from "./terminalController"
import { hybridApi } from "../preload"
import { CommandPathResolverImpl, ICommandPathResolveConfig } from "./commandPathResolver"
import { dirname, join } from "path"

export class TerminalRenderer {

    private readonly _terminalService = new TerminalService()
    private readonly _commandPathResolveConfig: ICommandPathResolveConfig = {
        htmlFramesPaths: [join(process.resourcesPath, 'cf')]
    }
    private readonly _commandPathResolver = new CommandPathResolverImpl(this._commandPathResolveConfig)
    private readonly _commandFrameService = new CommandFrameService(this._commandPathResolver)

    constructor() {}

    render(xtermContainer: HTMLElement, commandFrameContainer: HTMLElement) {
        const commandProcessor = new CommandProcessor(this._commandFrameService, commandFrameContainer)

        const terminalId = this._terminalService.createXterm((commandOldValue, commandNewValue) => commandProcessor.onCommand(commandOldValue, commandNewValue))
        const terminal = this._terminalService.getTerminal(terminalId)
        if (!terminal) {
            throw new Error('no terminal')
        }
        terminal.xterm.open(xtermContainer)

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
        hybridApi.isRegisteredCommand = (commandDescriptor) => controller.isRegisteredCommand(commandDescriptor)
        console.log('TerminalRenderer: api initialized')
    }
  
}