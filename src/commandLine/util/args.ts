import { ICommand, IComplexCommand } from "../command";

export function collectAllArgs(commandObj: ICommand, ignoreOptionValues: boolean = false): string[] {
    let args: string[] = []

    // Collect preceding arguments
    if (commandObj.precedingArgs) {
        args = args.concat(commandObj.precedingArgs)
    }

    // Collect option values and subsequent arguments
    for (const option of commandObj.options) {
        if (!ignoreOptionValues && option.value) {
            args.push(option.value)
        }
        if (option.subsequentArgs) {
            args = args.concat(option.subsequentArgs)
        }
    }

    return args
}

// Helper function to collect all arguments from a complex command
export function collectAllArgsFromComplexCommand(complexCommandObj: IComplexCommand, ignoreOptionValues: boolean = false): string[] {
    let args: string[] = collectAllArgs(complexCommandObj.command, ignoreOptionValues)

    // Collect arguments from the subcommand if it exists
    if (complexCommandObj.subcommand) {
        args = args.concat(collectAllArgs(complexCommandObj.subcommand, ignoreOptionValues))
    }

    return args
}

export function insertValueAsLastArgument(commandObj: ICommand, value: string): void {
    if (commandObj.options.length > 0) {
        const lastOption = commandObj.options[commandObj.options.length - 1]
        if (lastOption.subsequentArgs) {
            lastOption.subsequentArgs.push(value)
        } else {
            lastOption.subsequentArgs = [value]
        }
    } else {
        if (commandObj.precedingArgs) {
            commandObj.precedingArgs.push(value)
        } else {
            commandObj.precedingArgs = [value]
        }
    }
}

export function collectPositionalArgs(commandObj: ICommand, ignoreLastOptionValue: boolean = false): string[] {
    if (commandObj.options.length === 0) {
        return commandObj.precedingArgs ? [...commandObj.precedingArgs] : [];
    } else {
        const lastOption = commandObj.options[commandObj.options.length - 1];
        const args = [];

        if (!ignoreLastOptionValue && lastOption.value !== undefined) {
            args.push(lastOption.value);
        }

        if (lastOption.subsequentArgs) {
            args.push(...lastOption.subsequentArgs);
        }

        return args;
    }
}

export function removeSubcommandAndRest(command: ICommand, subcommandWord: string): boolean {

    if (command.precedingArgs) {
        for (let i = 0; i < command.precedingArgs.length; i++) {
            const arg = command.precedingArgs[i]
            if (arg === subcommandWord) {
                (command.precedingArgs || []).splice(i)
                command.options = []
                return true 
            }
        }
    }

    for (let i = 0; i < command.options.length; i++) {
        const option = command.options[i]
        if (option.value === subcommandWord) {
            option.value = undefined
            option.subsequentArgs = []
            command.options.splice(i + 1)
            return true
        }
        if (!option.subsequentArgs) {
            continue
        }
        for (let j = 0; j < option.subsequentArgs.length; j++) {
            const arg = option.subsequentArgs[j]
            if (arg === subcommandWord) {
                (option.subsequentArgs || []).splice(j)
                command.options = command.options.splice(i + 1)
                return true
            }
        }
    }

    return false
}