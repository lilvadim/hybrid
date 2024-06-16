import { getFirstOptionWithValueOrArgs, getLastOption, lastOptionHasValue, optionHasValue } from "../../commandLine/util/options";
import { ICommand } from "../../commandLine/command";
import { ICommandSyntax } from "../../commandLine/syntax/commandSyntax";
import { collectAllArgs, collectPositionalArgs } from "../../commandLine/util/args";
import { Cacheable } from "typescript-cacheable";

export class CommandSyntaxHelper {

    constructor(readonly desc: ICommandSyntax) {}

    @Cacheable()
    public static getCached(syntax: ICommandSyntax): CommandSyntaxHelper {
        return new CommandSyntaxHelper(syntax)
    }

    getPositionalArgs(command: ICommand): string[] {
        const _lastOptionHasValue = lastOptionHasValue(command, this.desc)
        return collectPositionalArgs(command, !_lastOptionHasValue)
    }

    getSubcommand(command: ICommand): string | undefined {
        for (let arg of collectAllArgs(command)) {
            if (this.desc.subcommands.includes(arg)) {
                return arg
            }
        }
        return undefined
    }
}