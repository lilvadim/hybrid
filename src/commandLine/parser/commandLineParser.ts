import * as peggy from "peggy";
import { ICommand, IComplexCommand } from "../command";
import { ICommandLine } from "../commandLine";
import { startRules } from "./startRules";
import { Cacheable } from "typescript-cacheable";

export class CommandLineParser {

    constructor(
        private readonly pegParser: peggy.Parser
    ) {}

    parseComplexCommand(command: string): IComplexCommand | undefined {
        try {
            return this.pegParser.parse(command, { startRule: startRules.complexCommand })
        } catch (e) {
            return undefined
        }
    }

    parseSimpleCommand(command: string): ICommand | undefined { 
        try {
            return this.pegParser.parse(command, { startRule: startRules.simpleCommand })
        } catch (e) {
            return undefined
        }
    }

    parseCommandLine(commandLine: string): ICommandLine | undefined {
        try {
            return this.pegParser.parse(commandLine, { startRule: startRules.commandLine })
        } catch (e) {
            return undefined
        }
    }
}