import { readFileSync } from "fs";
import * as peggy from "peggy";
import { CommandLineParser } from "./commandLineParser";
import { assert } from "typia";
import { ICommand, IComplexCommand } from "../command";
import { ICommandLine } from "../commandLine";

test('PEG parser test S=complex_command', () => {
    const pegParser = peggy.generate(
        readFileSync('/Users/vadim/diploma/hybrid/hybrid-webpack-ts/resources/peg/command.peggy').toString(),
        { allowedStartRules: ["complex_command"]}
    )

    const parser = new CommandLineParser(pegParser)

    const parsed = parser.parseComplexCommand('git -m --option"val" --key="kv" -Dj commit -fp --option \'Option Value String\' -p pValue -m"Msg" -l -a value -x=value arg')
    console.log(JSON.stringify(parsed))
    assert<IComplexCommand>(parsed)
})

test('PEG parser test S=simple_command', () => {
    const pegParser = peggy.generate(
        readFileSync('/Users/vadim/diploma/hybrid/hybrid-webpack-ts/resources/peg/command.peggy').toString(),
        { allowedStartRules: ["simple_command"]}
    )

    const parser = new CommandLineParser(pegParser)

    const parsed = parser.parseSimpleCommand('git -m --option"val" --key="kv" -Dj commit -fp --option \'Option Value String\' -p pValue -m"Msg" -l -a value -x=value arg')
    console.log(JSON.stringify(parsed))
    assert<ICommand>(parsed)
})

test('PEG parser test S=command_line', () => {
    const pegParser = peggy.generate(
        readFileSync('/Users/vadim/diploma/hybrid/hybrid-webpack-ts/resources/peg/command.peggy').toString(),
        { allowedStartRules: ["command_line"]}
    )

    const parser = new CommandLineParser(pegParser)

    const parsed = parser.parseCommandLine('VAR1=env_val1 VAR2=env_val2 git -m --option"val" --key="kv" -Dj commit -fp --option \'Option Value String\' -p pValue -m"Msg" -l -a value -x=value arg | cat "Dir" dir | echo 2> file.txt')
    console.log(JSON.stringify(parsed, undefined, ' '))
    assert<ICommandLine>(parsed)
})