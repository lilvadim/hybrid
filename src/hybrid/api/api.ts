import { ICommandDescriptor } from "../commandDescription/commandDescriptor";
import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { ICommandOption } from "../shellCommand/shellCommand";
import { ICommandDescription } from "../commandDescription/commandDescription";
import { ICommandContext } from "./commandContext";

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
