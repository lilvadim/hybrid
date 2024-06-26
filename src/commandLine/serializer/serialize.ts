import { isBlank } from "../../util/strings";
import { IComplexCommand, ICommand, IOption } from "../command";
import { ICommandLine } from "../commandLine";

function escapeValue(value: string): string {
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function serializeComplexCommand(complexCommand: IComplexCommand): string {
    return serializeCommand(complexCommand.command) + ' ' + serializeCommand(complexCommand.subcommand)
}

export function serializeCommand(commandObj: ICommand): string {
    let result = commandObj.command

    if (commandObj.precedingArgs && commandObj.precedingArgs.length) {
        result += ' ' + commandObj.precedingArgs.map(arg => serializeArgument(arg)).join(' ')
    }

    if (commandObj.options && commandObj.options.length) {
        result += ' ' + commandObj.options.map(opt => serializeOption(opt)).join(' ')
    }

    return result
}

function serializeOption(optionObj: IOption): string {
    let result = ''

    if (optionObj.option.type === 'UNIX' && optionObj.option.prefix) {
        result += optionObj.option.prefix + optionObj.option.words?.join('')
    } else {
        result += optionObj.option.option
    }

    if (optionObj.value) {
        const delimiter = optionObj.delimiter ?? '' 
        result += delimiter + serializeArgument(optionObj.value)
    }

    if (optionObj.subsequentArgs && optionObj.subsequentArgs.length) {
        result += ' ' + optionObj.subsequentArgs.map(arg => serializeArgument(arg)).join(' ')
    }

    return result
}

function serializeArgument(arg: string): string {
    if (/[\s'"\\]/.test(arg) || arg === '') {
        return `"${escapeValue(arg)}"`
    }
    return arg
}

export function serializeCommandLine(cmdLine: ICommandLine): string {
    const envVars = cmdLine.env?.map(env => `${env.envVar}=${serializeArgument(env.value)}`).join(' ') || ''
    const baseCommand = serializeCommand(cmdLine.command)

    const operations = cmdLine.operations?.map(op => {
        const operationCmd = serializeCommand(op.command)
        return `${op.operator} ${operationCmd}`
    }).join(' ') || ''

    const redirect = cmdLine.redirect ? 
        `${cmdLine.redirect.operator} ${serializeArgument(cmdLine.redirect.value)}` :
        ''

    return [envVars, baseCommand, operations, redirect].filter(part => part).filter(part => !isBlank(part)).join(' ').trim()
}