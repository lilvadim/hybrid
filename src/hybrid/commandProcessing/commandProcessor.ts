import { CommandFrameService } from "../commandFrameService"

export class CommandProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameService
    ) {}

    onCommand(commandOldValue: string, commandNewValue: string): void {
        const tokens = commandNewValue.split(new RegExp('\\s'))
        const name = tokens[0]
        if (!name) {
            return undefined
        }
        const commandFrame = this._commandFrameService.getCommandFrame(name)
    }
}