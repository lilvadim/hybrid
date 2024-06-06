import { getFirstOptionWithValueOrArgs, getLastOption, lastOptionHasValue, optionHasValue } from "../../commandLine/util/options";
import { ICommand } from "../../commandLine/command";
import { ICommandSyntax } from "../../commandLine/syntax/commandSyntax";
import { collectPositionalArgs } from "../../commandLine/util/args";
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
        if (command.precedingArgs && command.precedingArgs.length > 0) {
            const possibleSubcommand = command.precedingArgs[0]
            if (this.desc.subcommands.includes(possibleSubcommand)) {
                return possibleSubcommand
            } else {
                return undefined
            }
        }
        const firstOptionWithValueOrArgs = getFirstOptionWithValueOrArgs(command)
        if (firstOptionWithValueOrArgs) {
            const hasValue = optionHasValue(firstOptionWithValueOrArgs, this.desc)
            if (hasValue) {
                return undefined
            } else {
                const possibleSubcommand = firstOptionWithValueOrArgs.value
                if (!possibleSubcommand) {
                    return undefined
                }
                if (this.desc.subcommands.includes(possibleSubcommand)) {
                    return possibleSubcommand
                } else {
                    return undefined
                }
            }
        }
    }
}