import { ICommand } from "./command";
import { ICommandSyntax } from "./syntax/commandSyntax";
import { ICommandSemantic } from "./semantic/commandSemantic";
import { addOptionsToCommand, removeOptionsFromCommand } from "./util/options";

export function correctInline(command: ICommand,
    semantic: ICommandSemantic, 
    syntax: ICommandSyntax, 
) {
    const subcommand = syntax.command.split(' ')[1]
    const subcommandOptionsStart = command.options.findIndex(opt => opt.value === subcommand || opt.subsequentArgs?.includes(subcommand))
    const initialOptions = subcommand ? command.options.slice(subcommandOptionsStart) : [...command.options]

    for (let i = 0; i < initialOptions.length; i++) {
        const option = initialOptions[i]

        const optionsToProcess = [option.option.option]
        if (option.option.type === 'UNIX' && 
            option.option.prefix && 
            option.option.words && 
            option.option.words.length > 1) {
            optionsToProcess.push(...option.option.words.slice(1).map(w => option.option.prefix + w))
        }

        for (let optionText of optionsToProcess) {
            const optionSyntax = syntax.options.find(it => it.optionSynonyms.includes(optionText))
            if (!optionSyntax) {
                continue
            }
    
            const optionSemantic = semantic.options.filter(it => optionSyntax.optionSynonyms.includes(it.option))[0]
            if (!optionSemantic) {
                continue
            }

            addOptionsToCommand(command, optionSemantic.whenAdded.add)
        }

        if ((option.value && syntax.subcommands.includes(option.value)) || 
            option.subsequentArgs?.some(optArg => syntax.subcommands.includes(optArg))) {
            break
        } 
    }

    for (let i = 0; i < initialOptions.length; i++) {
        const option = initialOptions[i]

        const optionsToProcess = [option.option.option]
        if (option.option.type === 'UNIX' && 
            option.option.prefix && 
            option.option.words && 
            option.option.words.length > 1) {
            optionsToProcess.push(...option.option.words.slice(1).map(w => option.option.prefix + w))
        }

        for (let optionText of optionsToProcess) {
            const optionSyntax = syntax.options.find(it => it.optionSynonyms.includes(optionText))
            if (!optionSyntax) {
                continue
            }

            const optionSemantic = semantic.options.filter(it => optionSyntax.optionSynonyms.includes(it.option))[0]
            if (!optionSemantic) {
                continue
            }

            const optionIndex = command.options.findIndex(it => it.option.option === option.option.option)
            removeOptionsFromCommand(command, optionSemantic.whenAdded.remove, optionIndex + 1)
        }

        if ((option.value && syntax.subcommands.includes(option.value)) || 
            option.subsequentArgs?.some(optArg => syntax.subcommands.includes(optArg))) {
            break
        }
    }
}