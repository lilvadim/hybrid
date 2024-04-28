import { ICommandDescriptor } from "../commandDescriptionRegistry";
import { ICommandDescription, ICommandOption } from "../shell/shellCommand";

export interface IHybridApi {
    addOption(parameters: { option: ICommandOption, commandDescriptor: ICommandDescriptor }): boolean
    clearCurrentCommand(): void
    isRegisteredCommand(commandDescriptor: ICommandDescriptor): boolean,
    registerCommand(commandDescription: ICommandDescription): boolean,
    removeOption(parameters: { option: ICommandOption, commandDescriptor: ICommandDescriptor }): boolean,
}

export function initApi(impl: IHybridApi) {
    // @ts-ignore
    window.hybrid = impl;
}
