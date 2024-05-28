import { ipcRenderer } from "electron"
import { ipc } from "../constants/ipc"
import { TerminalService } from "../terminal/xterm/terminalService"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandLineProcessor } from "./commandLineProcessor"
import { TerminalController } from "./terminalController/terminalController"
import { initApi } from "./api/api"
import { CommandFramePathResolver } from "./commandFrame/provider/commandFramePathResolver"
import { ICommandFrameProviderConfig } from "./commandFrame/provider/commandFrameProviderConfig"
import { join } from "path"
import { EnvironmentUtils } from "../util/environment"
import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"
import { FitAddon } from "xterm-addon-fit"
import { setTimeout } from "timers"
import Split from "split.js"

export class TerminalRenderer {

    private readonly _terminalService = new TerminalService()
    private readonly _commandFrameProviderConfig: ICommandFrameProviderConfig = {
        cache: true,
        htmlFramesPaths: [join(EnvironmentUtils.resourcePath, 'resources', 'cf')]
    }
    private readonly _commandFramePathResolver = new CommandFramePathResolver(this._commandFrameProviderConfig)
    private readonly _commandFrameProvider = new CommandFrameProvider(this._commandFrameProviderConfig, this._commandFramePathResolver)
    private readonly _commandFrameLoader = new CommandFrameLoader()

    render(xtermContainer: HTMLElement, commandFrameContainer: HTMLElement) {
        const commandFrameRenderer = new CommandFrameRenderer(commandFrameContainer)
        const commandLineProcessor = new CommandLineProcessor(this._commandFrameProvider, commandFrameRenderer, this._commandFrameLoader)

        const terminalId = this._terminalService.createXterm()
        const terminal = this._terminalService.getTerminal(terminalId)
        if (!terminal) {
            throw new Error('no terminal')
        }
        terminal.shellIntegration.onCommandLineChange((oldVal, newVal) => commandLineProcessor.onCommandLineChange(oldVal, newVal))

        const fitAddon = new FitAddon()
        terminal.xterm.loadAddon(fitAddon)

        terminal.xterm.open(xtermContainer)
        setTimeout(() => fitAddon.fit(), 200)

        window.onresize = (_: UIEvent) => fitAddon.fit()
        commandFrameContainer.onresize = () => fitAddon.fit()
        terminal.xterm.onResize((dimensions, _) => ipcRenderer.sendSync(ipc.term.resize, dimensions))

        ipcRenderer.on(ipc.term.pty, (_, data) => terminal.xterm.write(data))
        terminal.xterm.onData(data => ipcRenderer.send(ipc.term.terminal, data))

        const controller = new TerminalController(terminal)

        Split([commandFrameContainer, xtermContainer], {
            gutterSize: 7,
            onDrag: (_) => fitAddon.fit()
        })

        this._initApi(controller)
    }

    private _initApi(controller: TerminalController) {
        initApi(controller)
        console.log('hybrid api initialized')
    }

}