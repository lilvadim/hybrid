import { ICommandDescription } from "../../hybrid/api/commandDescription";
import { ICommand, IOption } from "../command";

export interface IAddOption {
    optionType: 'UNIX' | 'GNU' | 'NON-STD';
    optionText: string;
    value?: string;
    delimiter?: string;
    words?: string[];
    unique: boolean;
}

export interface IRemoveOption {
    optionText: string;
    removeValue: boolean;
}


export function addOptionsToCommand(commandObj: ICommand, options: IAddOption[]): void {
    options.forEach(opt => {
        const newOption: IOption = {
            option: {
                type: opt.optionType,
                option: opt.optionText,
                prefix: opt.optionType === 'UNIX' && opt.words ? '-' : undefined,
                words: opt.words
            },
            delimiter: opt.delimiter,
            value: opt.value,
            subsequentArgs: []
        };

        if (opt.unique) {
            const existingOpt = isOptionPresent(opt.optionText, commandObj.options)
            if (existingOpt) {
                existingOpt.value = opt.value
                return
            } 
        }
        
        commandObj.options.push(newOption)
    })
}

function isOptionPresent(optionText: string, options: IOption[]): IOption | undefined {
    for (const option of options) {
        if (option.option.type === 'UNIX' && option.option.words && option.option.prefix) {
            for (const word of option.option.words) {
                if (option.option.prefix + word === optionText) {
                    return option;
                }
            }
        } else {
            if (option.option.option === optionText) {
                return option;
            }
        }
    }
    return undefined;
}

export function removeOptionsFromCommand(commandObj: ICommand, optionsToRemove: IRemoveOption[]): void {
    optionsToRemove.forEach(({ optionText, removeValue }) => {

        commandObj.options.forEach((option, index) => {
            if (option.option.option === optionText) {
                // Exact match for option
                processRemoval(commandObj, index, removeValue)
            } else if (option.option.type === 'UNIX' && option.option.prefix === '-' && option.option.words && optionText.length === 2) {
                // Handle combined UNIX options
                const strippedOptionText = optionText.startsWith('-') ? optionText.slice(1) : optionText
                const optionIndex = option.option.words.indexOf(strippedOptionText)
                if (optionIndex !== -1) {
                    // Remove the specific flag from the combined option
                    option.option.words.splice(optionIndex, 1)
                    option.option.option = option.option.words.join('')
                    if (removeValue) {
                        option.value = undefined
                    }

                    // If the combined option is now empty, remove it entirely
                    if (option.option.option === '') {
                        processRemoval(commandObj, index, removeValue)
                    }
                }
            }
        })
    })
}

function processRemoval(commandObj: ICommand, index: number, removeValue: boolean): void {
    const removedOption = commandObj.options.splice(index, 1)[0];

    if (!removeValue && removedOption.value) {
        if (!removedOption.subsequentArgs) {
            removedOption.subsequentArgs = [];
        }
        removedOption.subsequentArgs.unshift(removedOption.value);
    }

    if (index === 0) {
        // If the removed option is the first one, append its subsequent args to the precedingArgs of the command
        if (removedOption.subsequentArgs) {
            commandObj.precedingArgs = (commandObj.precedingArgs || []).concat(removedOption.subsequentArgs);
        }
    } else {
        // Append the subsequent args of the removed option to the preceding option's subsequentArgs
        const precedingOption = commandObj.options[index - 1];
        if (removedOption.subsequentArgs) {
            precedingOption.subsequentArgs = (precedingOption.subsequentArgs || []).concat(removedOption.subsequentArgs);
        }
    }
}

export function lastOptionHasValue(commandObj: ICommand, commandDescription: ICommandDescription): boolean {
    if (commandObj.options.length === 0) {
        return false;
    }

    const lastOption = commandObj.options[commandObj.options.length - 1];

    // Handle UNIX combined options
    if (lastOption.option.type === 'UNIX' && lastOption.option.words && lastOption.option.prefix) {
        for (let i = lastOption.option.words.length - 1; i >= 0; i--) {
            const word = lastOption.option.prefix + lastOption.option.words[i];
            for (const optionDesc of commandDescription.options) {
                if (optionDesc.optionSynonyms.includes(word)) {
                    return optionDesc.hasValue;
                }
            }
        }
    } else {
        // Handle other options
        for (const optionDesc of commandDescription.options) {
            if (optionDesc.optionSynonyms.includes(lastOption.option.option)) {
                return optionDesc.hasValue;
            }
        }
    }

    return false // Default to false if no match found
}

export function optionHasValue(option: IOption, commandDesc: ICommandDescription): boolean {
    // Handle UNIX combined options
    if (option.option.type === 'UNIX' && option.option.words && option.option.prefix) {
        for (const word of option.option.words) {
            const prefixedWord = option.option.prefix + word;
            for (const optionDesc of commandDesc.options) {
                if (optionDesc.optionSynonyms.includes(prefixedWord)) {
                    return optionDesc.hasValue;
                }
            }
        }
    } else {
        // Handle other options
        for (const optionDesc of commandDesc.options) {
            if (optionDesc.optionSynonyms.includes(option.option.option)) {
                return optionDesc.hasValue;
            }
        }
    }

    return false // Default to false if no match found
}

export function getLastOption(command: ICommand): IOption | undefined {
    if (command.options.length === 0) {
        return undefined
    }

    return command.options[command.options.length - 1]
}

export function getFirstOptionWithValueOrArgs(command: ICommand): IOption | undefined {
    for (const option of command.options) {
        if (option.value !== undefined || (option.subsequentArgs && option.subsequentArgs.length > 0)) {
            return option;
        }
    }
    return undefined;
}

export function removeLastArgument(command: ICommand): string | undefined {
    // Remove from subsequentArgs of the last option, if present
    if (command.options && command.options.length > 0) {
        const lastOption = command.options[command.options.length - 1];
        if (lastOption.subsequentArgs && lastOption.subsequentArgs.length > 0) {
            return lastOption.subsequentArgs.pop();
        }
    }
    
    // Remove from precedingArgs, if present
    if (command.precedingArgs && command.precedingArgs.length > 0) {
        return command.precedingArgs.pop();
    }
    
    return undefined;
}