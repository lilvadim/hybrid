import { ipcRenderer } from "electron"
import { ipc } from "../constants/ipc"
import { TerminalService } from "../terminal/xterm/terminalService"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandLineProcessor } from "./commandLineProcessor"
import { TerminalController } from "./terminalController"
import { initApi } from "./api/api"
import { CommandFramePathResolver } from "./commandFrame/provider/commandFramePathResolver"
import { ICommandFrameProviderConfig } from "./commandFrame/provider/commandFrameProviderConfig"
import { join } from "path"
import { EnvironmentUtils } from "../util/environment"
import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"

export class TerminalRenderer {

    private readonly _terminalService = new TerminalService()
    private readonly _commandFrameProviderConfig: ICommandFrameProviderConfig = {
        cache: false,
        htmlFramesPaths: [join(EnvironmentUtils.resourcePath, 'resources', 'cf')]
    }
    private readonly _commandFramePathResolver = new CommandFramePathResolver(this._commandFrameProviderConfig)
    private readonly _commandFrameProvider = new CommandFrameProvider(this._commandFrameProviderConfig, this._commandFramePathResolver)
    private readonly _commandFrameLoader = new CommandFrameLoader()

    constructor() {}

    render(xtermContainer: HTMLElement, commandFrameContainer: HTMLElement) {
        const commandFrameRenderer = new CommandFrameRenderer(commandFrameContainer)
        const commandLineProcessor = new CommandLineProcessor(this._commandFrameProvider, commandFrameRenderer, this._commandFrameLoader)

        const terminalId = this._terminalService.createXterm()
        const terminal = this._terminalService.getTerminal(terminalId)
        if (!terminal) {
            throw new Error('no terminal')
        }
        terminal.shellIntegration.onCommandLineChange((oldVal, newVal) => commandLineProcessor.onCommandLineChange(oldVal, newVal))
        terminal.xterm.open(xtermContainer)

        ipcRenderer.on(ipc.term.pty, (_, data) => terminal.xterm.write(data))
        terminal.xterm.onData(data => ipcRenderer.send(ipc.term.terminal, data))  

        const controller = new TerminalController(terminal)

        this._initApi(controller, commandFrameRenderer)
    }

    private _initApi(controller: TerminalController, commandFrameRenderer: CommandFrameRenderer) {
        initApi(controller, commandFrameRenderer)
        console.log('TerminalRenderer: api initialized')
    }
  
}