import { CommandFrameRenderer } from "./commandFrame/renderer/commandFrameRenderer"
import { CommandFrameProvider } from "./commandFrame/provider/commandFrameProvider"

export class CommandLineProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameProvider,
        private readonly _commandFrameRenderer: CommandFrameRenderer,
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
    }

}

function getCommand(commandLine: string): string | undefined {
    return commandLine.split(/\s/)[0]?.trim()
}