import { readFileSync } from "fs";
import { join } from "path";
import * as peggy from "peggy";
import { EnvironmentUtils } from "../../util/environment";
import { CommandLineParser } from "./commandLineParser";
import { startRules } from "./startRules";
import { Cacheable } from "typescript-cacheable";

export class CommandParserProvider {

    @Cacheable()
    getParser(): CommandLineParser {
        const grammarPath = join(EnvironmentUtils.resourcePath, 'resources', 'peg', 'command.peggy')
        const grammarInput = readFileSync(grammarPath).toString()
        const pegParser = peggy.generate(grammarInput, { allowedStartRules: Object.values(startRules) })
        return new CommandLineParser(pegParser)
    }

}