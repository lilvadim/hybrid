import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"
import { CommandFrameLoader } from "./commandFrame/loader/commandFrameLoader"

export class CommandLineProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameProvider,
        private readonly _commandFrameRenderer: CommandFrameRenderer,
        private readonly _commandFrameLoader: CommandFrameLoader,
    ) {}

    onCommandLineChange(commandLineOldValue: string, commandLineNewValue: string) {
        const executable = getCommand(commandLineNewValue)
        if (!executable || executable === '') {
            this._commandFrameRenderer.renderEmpty()
            return
        }
        const previousExecutable = getCommand(commandLineOldValue)
        if (executable == previousExecutable) {
            return
        }
        const commandFrames = this._commandFrameService.getCommandFrames(executable)
        this._commandFrameRenderer.render(commandFrames)
        for (let frame of commandFrames) {
            if (frame.isLoaded) {
                continue
            } 
            this._commandFrameLoader.load(frame)
        }
    }

}

function getCommand(commandLine: string): string | undefined {
    return commandLine.split(/\s/)[0]?.trim()
}