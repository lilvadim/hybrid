import { CommandFrameService } from "../commandFrameService"

export class CommandProcessor {

    constructor(
        private readonly _commandFrameService: CommandFrameService
    ) {}

    onCommand(commandOldValue: string, commandNewValue: string) {
        
    }
}