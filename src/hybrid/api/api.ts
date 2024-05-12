import { ICommandDescriptor } from "../commandDescriptionRegistry";
import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { ICommandDescription, ICommandOption } from "../shell/shellCommand";
import { ICommandContext } from "../terminalController";

export interface IHybridTerminalApi {
    updateOptions(
        parameters: {
            addOptions: ICommandOption[],
            removeOptions: ICommandOption[]
        }
    ): boolean,
    clearCurrentCommand(): boolean
    isRegisteredCommand(commandDescriptor: ICommandDescriptor): boolean,
    registerCommand(commandDescription: ICommandDescription): boolean,
    onCommandLineSync(listener: (event: ICommandLineSyncEvent) => void): void,
    setCommandContext(ctx: ICommandContext): void
}

export function initApi(terminalApiImpl: IHybridTerminalApi) {
    // @ts-ignore
    window.hybrid = {
        terminal: terminalApiImpl
    }
}
