import { ICommandDescriptor } from "../commandDescriptionRegistry";
import { ICommandFrame } from "../commandFrame/commandFrame";
import { ICommandDescription, ICommandOption } from "../shell/shellCommand";

export interface IHybridTerminalApi {
    addOptions(parameters: { commandDescriptor: ICommandDescriptor, options: ICommandOption[] }): boolean
    clearCurrentCommand(): boolean
    isRegisteredCommand(commandDescriptor: ICommandDescriptor): boolean,
    registerCommand(commandDescription: ICommandDescription): boolean,
    removeOptions(parameters: { commandDescriptor: ICommandDescriptor, options: ICommandOption[] }): boolean,
}

export interface IHybridCommandFrameApi {
}

export function initApi(terminalApiImpl: IHybridTerminalApi, commandFrameApiImpl: IHybridCommandFrameApi) {
    // @ts-ignore
    window.hybrid = {
        terminal: terminalApiImpl
    }
}
