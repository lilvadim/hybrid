
export interface ICommandDescription {
    command: string,
    subcommand?: string,
    options: ICommandOptionDescription[]
}

export interface ICommandOptionDescription {
    optionPatterns: IOptionPattern[],
    hasValue: boolean
}

export interface IOptionPattern {
    pattern: string
}

export const optionArgRegexp = /<[^<>]*>/

export interface IShellCommand {
    executable: ICommandExecutable,
    options: ICommandOption[], 
    args: ICommandArgument[],
    invalidTokens: string[]
}

export interface IIndex {
    index: number
}

export interface ICommandExecutable {
    executable: string, 
    subcommand?: string
}

export interface ICommandOption extends IIndex {
    option: string,
    value?: string,
    spaceSep?: boolean
}

export interface ICommandArgument extends IIndex {
    value: string
}

export function translateToString(shellCommand: IShellCommand): string {
    const execSep = shellCommand.executable.subcommand ? ' ' : ''
    let buffer = shellCommand.executable.executable + execSep + (shellCommand.executable.subcommand ?? '') + ' '

    const byIndex = (a: IIndex, b: IIndex) => a.index - b.index
    for (let option of shellCommand.options.sort(byIndex)) {
        const sep = option.spaceSep ? ' ' : ''
        const valueTokensCount = option.value ? option.value.split(/\s/).length : 0
        const quotes = valueTokensCount > 0 ? '"' : ''
        const value = option.value ?? ''
        buffer += option.option + sep + quotes + value + quotes + ' '
    }

    for (let argument of shellCommand.args.sort(byIndex)) {
        const argumentTokensCount = argument.value.split(/\s/).length
        const quotes = argumentTokensCount > 0 ? '"' : ''
        buffer += quotes + argument.value + quotes + ' '
    }

    for (let token of shellCommand.invalidTokens) {
        buffer += token + ' '
    }

    return buffer.trim()
}

export function removeArgs(optionPattern: IOptionPattern): string {
    return optionPattern.pattern.replace(optionArgRegexp, '')
}

export function tokenCount(optionPattern: IOptionPattern): number {
    return optionPattern.pattern.split(/\s/).length
}

export function tokenize(commandString: string): string[] {
    const tokens: string[] = []
    
    const stringLength = commandString.length
    const whitespace = /\s/
    const quote = /'|"/
    let quoteOpened = false
    let left = 0
    for (let i = left; i < stringLength; i++) {
        const currentSymbol = commandString[i]
        const isQuote = quote.test(currentSymbol)
        if (isQuote && !quoteOpened) {
            quoteOpened = true
            left = i + 1
            continue
        }
        if (isQuote && quoteOpened) {
            quoteOpened = false
            const token = commandString.substring(left, i)
            tokens.push(token)
            left = i + 1
            continue
        }
        if (quoteOpened) {
            continue
        }
        const isWhitespace = whitespace.test(currentSymbol)
        if (!quoteOpened && isWhitespace && left < i) {
            const token = commandString.substring(left, i)
            if (!whitespace.test(token)) {
                tokens.push(token)
            }
            left = i + 1
            continue
        }
    }

    if (quoteOpened) {
        const restTokens = commandString.substring(left - 1, stringLength).split(/\s/)
        tokens.push(...restTokens)
    }
    
    return tokens
}

export function parseString(commandString: string, commandDescription: ICommandDescription): IShellCommand {
    const tokens = tokenize(commandString)
    const executable: ICommandExecutable = {
        executable: commandDescription.command,
        subcommand: commandDescription.subcommand
    }

    const optionDescriptions: readonly (ICommandOptionDescription & { tokenCount: number })[] = commandDescription.options.map(value => {
        return {
            optionPatterns: value.optionPatterns,
            hasValue: value.hasValue,
            tokenCount: tokenCount(value.optionPatterns[0])
        }
    })

    const options: ICommandOption[] = []
    const args: ICommandArgument[] = []
    const offset = executable.subcommand ? 2 : 1
    const restTokens: readonly string[] = tokens.slice(offset)
    for (let i = 0; i < restTokens.length; i++) {
        const token = restTokens[i]
        if (isOption(token)) {
            const option: ICommandOption = {
                index: i + offset,
                option: token
            }
            const nextToken = restTokens[i + 1]
            const optionDesc = findOption(token, optionDescriptions)
            if (optionDesc.hasValue && optionDesc.tokenCount > 1 && nextToken && !isOption(nextToken)) {
                option.value = nextToken
                option.spaceSep = true
                i++
            }
            options.push(option)
        } else {
            const argument: ICommandArgument = {
                index: i + offset,
                value: token
            }
            args.push(argument)
        }
    }

    return {
        executable,
        options,
        args,
        invalidTokens: []
    }
}

export function findOption(
    token: string, 
    options: readonly (ICommandOptionDescription & { tokenCount: number })[]
): ICommandOptionDescription & { tokenCount: number } {
    return options
        .find(optionDesc => optionDesc.optionPatterns
            .map(pattern => removeArgs(pattern).trim())
            .find(pattern => token.startsWith(pattern)))
}

export const optionFormatRegexp = /(-|--)[^\s<>]+/

export function isOption(token: string): boolean {
    return optionFormatRegexp.test(token)
}
