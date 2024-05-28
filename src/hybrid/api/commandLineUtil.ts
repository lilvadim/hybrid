import { getFirstOptionWithValueOrArgs, getLastOption, lastOptionHasValue, optionHasValue } from "../../commandLine/util/options";
import { ICommand } from "../../commandLine/command";
import { ICommandDescription } from "./commandDescription";
import { collectPositionalArgs } from "../../commandLine/util/args";
import { Cacheable } from "typescript-cacheable";

export class CommandLineUtil {

    constructor(readonly desc: ICommandDescription) {}

    @Cacheable()
    public static getCached(desc: ICommandDescription): CommandLineUtil {
        return new CommandLineUtil(desc)
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