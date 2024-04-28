import { ICommandDescription } from "./shell/shellCommand";

export interface ICommandDescriptor {
    command: string 
    subcommand?: string
}

export class CommandDescriptionRegistry {

    private readonly _commandDescriptions: Record<string, ICommandDescription> = {}

    registerDescription(description: ICommandDescription) {
        const descriptor: ICommandDescriptor = {
            command: description.command,
            subcommand: description.subcommand
        } 

        this._commandDescriptions[descriptor.toString()] = description
    }

    getDescription(descriptor: ICommandDescriptor): ICommandDescription | undefined {
        if (!descriptor.subcommand) {
            descriptor.subcommand = undefined
        }

        return this._commandDescriptions[descriptor.toString()]
    }
}