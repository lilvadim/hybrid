import { CommandOptions } from "./types"
import { ls } from "./commands/ls"

export interface ICommandDescriptions { 
    [commandName: string]: CommandOptions
}

export const commandDescriptions: ICommandDescriptions = {
    'ls': ls
}