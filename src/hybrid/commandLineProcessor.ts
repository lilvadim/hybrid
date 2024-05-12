import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"
import { tokenize } from "./shell/shellCommand"
import { isBlank } from "../util/strings"
import { arraysEq } from "../util/arrays"

export class CommandLineProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameProvider,
        private readonly _commandFrameRenderer: CommandFrameRenderer,
        private readonly _commandFrameLoader: CommandFrameLoader,
    ) {}

    onCommandLineChange(commandLineOldValue: string, commandLineNewValue: string) {
        
        const tokens = tokenize(commandLineNewValue)
        const executable = tokens[0]
        
        if (!executable || isBlank(executable)) {
            this._commandFrameRenderer.renderEmpty()
            return
        }

        const oldTokens = tokenize(commandLineOldValue)
        const oldExecutable = oldTokens[0]

        if (executable == oldExecutable || arraysEq(tokens, oldTokens)) {
            return 
        }

        const commandFrames = this._commandFrameService.getCommandFrames(executable)
        this._commandFrameRenderer.render(commandFrames)
        for (let frame of commandFrames) {
            if (!frame.isLoaded) {
                this._commandFrameLoader.load(frame)
            } 
        }
    }

}

