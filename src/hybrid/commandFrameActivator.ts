import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"
import { count, isBlank } from "../util/strings"
import { CommandLineParserProvider } from "../commandLine/parser/commandLineParserProvider"
import { ITerminalControlConfig } from "./terminalController/terminalControlConfig"
import Logger from "electron-log"

export class CommandFrameActivator {

    constructor(
        private readonly _terminalControlConfig: ITerminalControlConfig,
        private readonly _commandFrameService: CommandFrameProvider,
        private readonly _commandFrameRenderer: CommandFrameRenderer,
        private readonly _commandFrameLoader: CommandFrameLoader,
        private readonly _commandLineParserProvider: CommandLineParserProvider,
    ) {}

    onCommandLineChange(commandLineOldValue: string, commandLineNewValue: string) {
        Logger.debug({ commandLineNewValue })
        if (isBlank(commandLineNewValue)) {
            this._commandFrameRenderer.renderEmpty()
            return 
        }

        const parsed = this._commandLineParserProvider.getParser().parseCommandLine(commandLineNewValue)

        if (!parsed) {
            return
        }

        const newExecutable = parsed.command.command
        
        if (!newExecutable || isBlank(newExecutable)) {
            this._commandFrameRenderer.renderEmpty()
            return
        }

        const oldExecutable = this._commandLineParserProvider.getParser().parseCommandLine(commandLineOldValue)?.command.command

        const oldSpaceCount = count(commandLineOldValue, /\s/g)
        const newSpaceCount = count(commandLineNewValue, /\s/g)

        if (this._terminalControlConfig.activeSpace && oldSpaceCount === newSpaceCount) {
            return
        }

        if (!this._terminalControlConfig.activeSpace && oldExecutable == newExecutable) {
            return
        }

        const commandFrames = this._commandFrameService.getCommandFrames(newExecutable)
        this._commandFrameRenderer.render(commandFrames)
        commandFrames.filter(it => !it.isLoaded).forEach(it =>  this._commandFrameLoader.load(it))
    }

}

