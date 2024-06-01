import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"
import { isBlank } from "../util/strings"
import { CommandLineParserProvider } from "../commandLine/parser/commandLineParserProvider"

export class CommandLineProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameProvider,
        private readonly _commandFrameRenderer: CommandFrameRenderer,
        private readonly _commandFrameLoader: CommandFrameLoader,
        private readonly _commandLineParserProvider: CommandLineParserProvider
    ) {}

    onCommandLineChange(commandLineOldValue: string, commandLineNewValue: string) {
        
        const newExecutable = this._commandLineParserProvider.getParser().parseCommandLine(commandLineNewValue)?.command.command
        
        if (!newExecutable || isBlank(newExecutable)) {
            this._commandFrameRenderer.renderEmpty()
            return
        }

        const oldExecutable = this._commandLineParserProvider.getParser().parseCommandLine(commandLineOldValue)?.command.command

        if (oldExecutable === newExecutable) {
            return
        }

        const commandFrames = this._commandFrameService.getCommandFrames(newExecutable)
        this._commandFrameRenderer.render(commandFrames)
        commandFrames.filter(it => !it.isLoaded).forEach(it =>  this._commandFrameLoader.load(it))
    }

}

