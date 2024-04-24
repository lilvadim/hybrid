import { ICommandFrame } from "./commandFrame"
import { CommandFrameService } from "./commandFrameService"

export class CommandProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameService,
        private readonly _commandFrameContainer: HTMLElement,
    ) {}

    onCommand(commandOldValue: string, commandNewValue: string) {
        const executable = getCommand(commandNewValue)
        if (!executable || executable === '') {
            this._clearCommandFrames()
            return
        }
        const previousExecutable = getCommand(commandOldValue)
        if (executable == previousExecutable) {
            return
        }
        const commandFrames = this._commandFrameService.getCommandFrames(executable)
        this._appendCommandFrames(commandFrames)
    }

    private _appendCommandFrames(commandFrames: ICommandFrame[]) {
        for (let commandFrame of commandFrames) {
            this._commandFrameContainer.appendChild(commandFrame.frame)
        }
    }

    private _clearCommandFrames() {
        clearChildren(this._commandFrameContainer)
    }
}

function clearChildren(htmlElement: HTMLElement) {
    htmlElement.innerHTML = ""
}

function getCommand(commandLine: string): string | undefined {
    return commandLine.split(/\s/)[0]?.trim()
}