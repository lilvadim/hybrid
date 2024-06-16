import { ICommand, IOption } from "../command";

export function tokensCount(commandObj: ICommand): number {
    let tokenCount = 0;

    // Count the main command token
    tokenCount += 1;

    // Count preceding arguments
    if (commandObj.precedingArgs) {
        tokenCount += commandObj.precedingArgs.length;
    }

    // Count options, their delimited values, and subsequent arguments
    commandObj.options.forEach((option: IOption) => {
        // Count the option itself
        tokenCount += 1;

        // Count the option value if it has a delimiter
        if (option.delimiter && option.value !== undefined) {
            tokenCount += 1;
        }

        // Count subsequent arguments
        if (option.subsequentArgs) {
            tokenCount += option.subsequentArgs.length;
        }
    });

    return tokenCount;
}