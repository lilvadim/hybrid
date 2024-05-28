import { collectAllArgsFromComplexCommand } from "./args";
import { IComplexCommand } from "../command";

test('collect args', () => {
    // Example usage
    const parsedCommand: IComplexCommand = {
        command: {
            command: "git",
            precedingArgs: ["arg1"],
            options: [
                { 
                    option: { type: 'UNIX', option: "-m", prefix: "-", words: ["m"] }, 
                    delimiter: undefined, 
                    value: "Initial commit", 
                    subsequentArgs: ["subArg1", "subArg2"] 
                },
                { 
                    option: { type: 'GNU', option: "--author" }, 
                    delimiter: "=", 
                    value: "John Doe", 
                    subsequentArgs: ["subArg3"] 
                }
            ]
        },
        subcommand: {
            command: "commit",
            precedingArgs: ["arg2"],
            options: [
                { 
                    option: { type: 'NON-STD', option: "-a" }, 
                    delimiter: undefined, 
                    value: undefined, 
                    subsequentArgs: ["subArg4"] 
                }
            ]
        }
    };

    // Collect all arguments including option values
    const allArgsWithValues = collectAllArgsFromComplexCommand(parsedCommand);
    console.log(allArgsWithValues);  // Output: ["arg1", "Initial commit", "subArg1", "subArg2", "John Doe", "subArg3", "arg2", "subArg4"]

    // Collect all arguments excluding option values
    const allArgsWithoutValues = collectAllArgsFromComplexCommand(parsedCommand, true);
    console.log(allArgsWithoutValues);  // Output: ["arg1", "subArg1", "subArg2", "subArg3", "arg2", "subArg4"]
    

})
