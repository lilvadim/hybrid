import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"
import { isBlank } from "../util/strings"

export class CommandLineProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameProvider,
        private readonly _commandFrameRenderer: CommandFrameRenderer,
        private readonly _commandFrameLoader: CommandFrameLoader,
    ) {}

    onCommandLineChange(commandLineOldValue: string, commandLineNewValue: string) {
        
        const newTokens = commandLineNewValue.split(/\s/).filter(it => !isBlank(it))
        const newExecutable = newTokens[0]
        
        if (!newExecutable || isBlank(newExecutable)) {
            this._commandFrameRenderer.renderEmpty()
            return
        }

        const oldTokens = commandLineOldValue.split(/\s/).filter(it => !isBlank(it))
        const oldExecutable = oldTokens[0]

        if (oldExecutable === newExecutable) {
            return
        }

        const commandFrames = this._commandFrameService.getCommandFrames(newExecutable)
        this._commandFrameRenderer.render(commandFrames)
        commandFrames.filter(it => !it.isLoaded).forEach(it =>  this._commandFrameLoader.load(it))
    }

}

