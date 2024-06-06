import { ICommand } from "./command";
import { ICommandSyntax } from "./syntax/commandSyntax";
import { ICommandSemantic } from "./semantic/commandSemantic";
import { addOptionsToCommand, removeOptionsFromCommand } from "./util/options";

export function correctInline(command: ICommand, semantic: ICommandSemantic, syntax: ICommandSyntax) {

    for (let i = 0; i < command.options.length; i++) {
        const option = command.options[i]

        const optionsToProcess = []
        if (option.option.type === 'UNIX' && option.option.prefix && option.option.words) {
            optionsToProcess.push(...option.option.words.map(w => option.option.prefix + w))
        } else {
            optionsToProcess.push(option.option.option)
        }

        optionsToProcess.forEach(optionText => {
            const optionSyntax = syntax.options.find(it => it.optionSynonyms.includes(optionText))
            if (!optionSyntax) {
                return
            }
    
            if (!optionSyntax.hasValue && !syntax.subcommands.includes(option.value || '')) {
                option.value = undefined
            }
    
            const optionSemantic = semantic.options.filter(it => optionSyntax.optionSynonyms.includes(it.option))[0]
            if (!optionSemantic) {
                return
            }
    
            addOptionsToCommand(command, optionSemantic.whenAdded.add)       
            removeOptionsFromCommand(command, optionSemantic.whenAdded.remove)
        })
    }
}