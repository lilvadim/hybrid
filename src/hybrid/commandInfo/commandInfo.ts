import { ICommandSyntax } from "../../commandLine/syntax/commandSyntax";
import { ICommandSemantic } from "../../commandLine/semantic/commandSemantic";

export interface ICommandInfo {
    command: string
    semantic: ICommandSemantic | undefined
    syntax: ICommandSyntax | undefined
}