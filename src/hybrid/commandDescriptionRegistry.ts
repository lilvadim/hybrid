import { ICommandDescription } from "./shellCommand";

export class CommandDescriptor {
    command: string 
    subcommand?: string
}

export class CommandDescriptionRegistry {

    private readonly _commandDescriptions: Record<string, ICommandDescription> = {}

    registerDescription(description: ICommandDescription) {
        const descriptor: CommandDescriptor = {
            command: description.command,
            subcommand: description.subcommand
        } 

        this._commandDescriptions[descriptor.toString()] = description
    }

    getDescription(descriptor: CommandDescriptor): ICommandDescription | undefined {
        if (!descriptor.subcommand) {
            descriptor.subcommand = undefined
        }

        return this._commandDescriptions[descriptor.toString()]
    }
}