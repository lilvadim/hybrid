import { ipcRenderer } from "electron"
import { ipc } from "../constants/ipc"
import { TerminalService } from "../terminal/xterm/terminalService"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandFrameActivator } from "./commandFrameActivator"
import { TerminalController } from "./terminalController/terminalController"
import { initApi } from "./api/api"
import { CommandFramePathResolver } from "./commandFrame/provider/commandFramePathResolver"
import { ICommandFrameProviderConfig } from "./commandFrame/provider/commandFrameProviderConfig"
import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"
import { FitAddon } from "xterm-addon-fit"
import { setTimeout } from "timers"
import Split from "split.js"
import { ConfigProvider } from "../config/configProvider"
import { CommandLineParserProvider } from "../commandLine/parser/commandLineParserProvider"
import { CommandInfoRegistry } from "./commandInfo/commandInfoRegistry"
import Logger from "electron-log"

export class TerminalRenderer {

    private readonly _terminalService = new TerminalService()
    private readonly _config = ConfigProvider.getCached().getOverridden()
    private readonly _commandFrameProviderConfig: ICommandFrameProviderConfig = this._config.commandFrameProvider
    private readonly _commandFramePathResolver = new CommandFramePathResolver(this._commandFrameProviderConfig)
    private readonly _commandFrameProvider = new CommandFrameProvider(this._commandFrameProviderConfig, this._commandFramePathResolver)
    private readonly _commandFrameLoader = new CommandFrameLoader()
    private readonly _commandLineParserProvider = new CommandLineParserProvider()

    render(xtermContainer: HTMLElement, commandFrameContainer: HTMLElement) {
        const commandFrameRenderer = new CommandFrameRenderer(commandFrameContainer)
        const commandLineProcessor = new CommandFrameActivator(
            this._config.terminalControl,
            this._commandFrameProvider, 
            commandFrameRenderer, 
            this._commandFrameLoader,
            this._commandLineParserProvider,
        )

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

        terminal.xterm.onData(data => {
            const event = { data, ignore: false }
            Logger.debug('PRE EMIT', event)
            terminal.xtermInputEvents.emit('data', event)
            Logger.debug('EMITTED', event)
            if (!event.ignore) {
                ipcRenderer.send(ipc.term.terminal, event.data, 'input')
            }
        })

        const controller = new TerminalController(
            this._config.terminalControl, 
            terminal,
            this._commandLineParserProvider,
            CommandInfoRegistry.getCached()
        )

        Split([commandFrameContainer, xtermContainer], {
            gutterSize: 7,
            onDrag: (_) => fitAddon.fit()
        })

        this._initApi(controller)
    }

    private _initApi(controller: TerminalController) {
        initApi(controller)
        console.log('hybrid.terminal api initialized')
    }

}