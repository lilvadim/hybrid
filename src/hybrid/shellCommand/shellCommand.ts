import { isBlank } from "../../util/strings"
import { ICommandDescription, IOptionPattern, ICommandOptionDescription } from "../commandDescription/commandDescription"

export interface IShellCommand {
    executable: ICommandExecutable,
    options: ICommandOption[], 
    args: ICommandArgument[],
    invalidTokens: IToken[]
}

export interface IIndex {
    index: number | undefined | null
}

export interface ICommandExecutable {
    executable: string, 
    subcommand?: string
}

export interface ICommandOption extends IIndex {
    option: string,
    value?: string,
}

export interface ICommandArgument extends IIndex {
    value: string
}

export interface IToken extends IIndex {
    value: string
}

export const shellCommand = {
    parsed: (commandLine: string, commandDescription: ICommandDescription): IShellCommand => parseShellCommand(commandLine, commandDescription),
    commandLine: (command: IShellCommand): string => translateToCommandLine(command)
}

export const isNotSeparator = (value: string) => /-|\w/.test(value)
export const isSeparator = (value: string) => !isNotSeparator(value)

function translateToCommandLine(shellCommand: IShellCommand): string {
    const execSep = shellCommand.executable.subcommand ? ' ' : ''
    let buffer = shellCommand.executable.executable + execSep + (shellCommand.executable.subcommand ?? '') + ' '

    const byIndex = (a: IIndex, b: IIndex) => (a.index ?? Number.MAX_VALUE) - (b.index ?? Number.MAX_VALUE)
    for (let option of shellCommand.options.sort(byIndex)) {
        if (!option) {
            continue
        }
        const lastSymbol = option.option.charAt(option.option.length - 1)
        const valueTokensCount = option.value ? option.value.split(/\s/).length : 0
        const sep = (isNotSeparator(lastSymbol) && option.value) ? ' ' : ''
        const quotes = valueTokensCount > 1 ? '"' : ''
        const value = option.value ?? ''
        buffer += option.option + sep + quotes + value + quotes + ' '
    }

    for (let argument of shellCommand.args.sort(byIndex)) {
        const argumentTokensCount = argument.value.split(/\s/).length
        const quotes = argumentTokensCount > 1 ? '"' : ''
        buffer += quotes + argument.value + quotes + ' '
    }

    for (let token of shellCommand.invalidTokens.sort(byIndex)) {
        buffer += token.value + ' '
    }

    return buffer.trimRight()
}

export const optionArgRegexp = /<[^\s<>]*>/
export function removeArgs(optionPattern: IOptionPattern): string {
    return optionPattern.pattern.replace(optionArgRegexp, '')
}

export function tokenCount(optionPattern: IOptionPattern): number {
    return optionPattern.pattern.split(/\s/).length
}

export function tokenize(commandLine: string): string[] {
    const tokens: string[] = []
    var escapedRegions = commandLine.split(/'|"/)
    for (let i = 0; i < escapedRegions.length; i++) {
        const isEscaped = i % 2 !== 0
        if (isEscaped) {
            tokens.push(escapedRegions[i])
        } else {
            tokens.push(...escapedRegions[i].split(/\s/).filter(it => !isBlank(it)))
        }
    }
    return tokens
}

function parseShellCommand(commandLine: string, commandDescription: ICommandDescription): IShellCommand {
    const tokens = tokenize(commandLine)
    console.debug(JSON.stringify(tokens))
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
    const invalidTokens: IToken[] = []
    const offset = executable.subcommand ? 2 : 1
    const restTokens: readonly string[] = tokens.slice(offset)
    for (let i = 0; i < restTokens.length; i++) {
        const index = i + offset
        const token = restTokens[i]
        if (isOption(token)) {
            const optionDesc = findOption(token, optionDescriptions)
            if (!optionDesc) {
                invalidTokens.push({ index, value: token })
                continue
            }

            const splittedOption = splitOption(optionDesc, token)
            if (!splittedOption) {
                invalidTokens.push({ index, value: token })
                continue
            }

            const option: ICommandOption = {
                index,
                option: splittedOption.option,
                value: splittedOption.value
            }
            
            const nextToken = restTokens[i + 1]
            if (optionDesc.hasValue && optionDesc.tokenCount > 1 && nextToken && !isOption(nextToken)) {
                option.value = nextToken
                i++
            }
            options.push(option)
        } else {
            const argument: IToken = {
                index,
                value: token
            }
            args.push(argument)
        }
    }

    return {
        executable,
        options,
        args,
        invalidTokens
    }
}

function splitOption(
    optionDesc: ICommandOptionDescription,
    optionToken: string
): { option: string, value: string } | undefined {
    const option = optionDesc.optionPatterns.map(it => removeArgs(it).trim()).find(it => optionToken.startsWith(it))
    if (!option) {
        return undefined
    }
    const value = optionToken.replace(RegExp('^' + option), '')
    return { option, value }
}

function findOption(
    token: string, 
    options: readonly (ICommandOptionDescription & { tokenCount: number })[]
): ICommandOptionDescription & { tokenCount: number } | undefined {
    return options
        .find(optionDesc => optionDesc.optionPatterns
            .map(pattern => removeArgs(pattern).trim())
            .find(pattern => token.startsWith(pattern)))
}

const optionFormat = /(-|--)[^\s<>]+/

export function isOption(token: string): boolean {
    return token.startsWith("-") || token.startsWith("--")
}

export function isPipe(token: string): boolean {
    return token === '|'
}

export function isStreamRedirect(token: string): boolean {
    return /<|>/.test(token)
}
