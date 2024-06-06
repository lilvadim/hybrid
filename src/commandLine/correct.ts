import { ICommand } from "./command";
import { ICommandSyntax } from "./syntax/commandSyntax";
import { ICommandSemantic } from "./semantic/commandSemantic";
import { addOptionsToCommand, removeOptionsFromCommand } from "./util/options";
import Logger from "electron-log";

export function correctInline(command: ICommand, semantic: ICommandSemantic, syntax: ICommandSyntax) {

    for (let i = 0; i < command.options.length; i++) {
        const option = command.options[i]

        Logger.debug(JSON.stringify(option.option.option))

        const optionSyntax = syntax.options.find(it => it.optionSynonyms.includes(option.option.option))
        if (!optionSyntax) {
            continue
        }

        if (!optionSyntax.hasValue && !syntax.subcommands.includes(option.value || '')) {
            option.value = undefined
        }

        const optionSemantic = semantic.options.filter(it => optionSyntax.optionSynonyms.includes(it.option))[0]
        if (!optionSemantic) {
            continue
        }

        Logger.debug(JSON.stringify(optionSemantic))
        addOptionsToCommand(command, optionSemantic.whenAdded.add)       
        removeOptionsFromCommand(command, optionSemantic.whenAdded.remove)
    }
}