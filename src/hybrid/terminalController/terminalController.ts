import { Terminal } from "@xterm/xterm";
import { IShellIntegration } from "../../terminal/xterm/shellIntegration";
import { ITerminal } from "../../terminal/xterm/terminalService";
import { ipcRenderer } from "electron";
import { ipc } from "../../constants/ipc";
import { IHybridTerminalApi } from "../api/api";
import EventEmitter from "events";
import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { count, isBlank } from "../../util/strings";
import { IAddOption, IRemoveOption, addOptionsToCommand, removeLastArgument, removeOptionsFromCommand } from "../../commandLine/util/options";
import { CommandLineParserProvider } from "../../commandLine/parser/commandLineParserProvider";
import { ICommandLine } from "../../commandLine/commandLine";
import { insertValueAsLastArgument } from "../../commandLine/util/args";
import { CommandLineSerializer } from "../../commandLine/serializer/commandLineSerializer";
import { deepClone } from "../../util/clone";
import { ITerminalControlConfig } from "./terminalControlConfig";
import { ux } from "../../log/log";

export class TerminalController implements IHybridTerminalApi {

    private readonly _xterm: Terminal
    private readonly _shellIntegration: IShellIntegration
    private readonly _event = new EventEmitter().setMaxListeners(0)

    constructor(    
        private readonly _config: ITerminalControlConfig,
        private readonly _terminal: ITerminal,
        private readonly _commandParserProvider: CommandLineParserProvider
    ) {
        this._xterm = _terminal.xterm
        this._shellIntegration = _terminal.shellIntegration

        this._shellIntegration.onCommandLineChange(
            (oldCommandLine, newCommandLine) => {
                const oldParsed = this._parse(oldCommandLine)
                const newParsed = this._parse(newCommandLine)
                this._handleSync(
                    oldCommandLine,
                    newCommandLine,
                    oldParsed,
                    newParsed,
                    _config.syncOnSpace
                )
            }
        )
    }

    removeSubcommandArg(subcommand: string): boolean {
        ux.info("Removed Subcommand from GUI", subcommand)
        const currentCommandLine = this._shellIntegration.currentCommandProperties()?.command
        if (!currentCommandLine || isBlank(currentCommandLine)) {
            return false
        }

        const parsed = this._parse(currentCommandLine)
        if (!parsed) {
            return false
        }

        const newCommandLine = deepClone(parsed)
        const lastArg = removeLastArgument(newCommandLine.command)

        if (lastArg !== subcommand) {
            return false
        }

        const updatedCommandLine = CommandLineSerializer.getCached().serializeCommandLine(newCommandLine)

        this._overwriteCommandLine(updatedCommandLine)
        this._handleSync(currentCommandLine, updatedCommandLine, parsed, newCommandLine, false)

        return true
    }

    insertLastArg(arg: string): boolean {
        ux.log("Add Subcommand from GUI", arg)
        const currentCommandLine = this._shellIntegration.currentCommandProperties()?.command
        if (!currentCommandLine || isBlank(currentCommandLine)) {
            return false
        }

        const parsed = this._parse(currentCommandLine)
        if (!parsed) {
            return false
        }

        const newCommandLine = deepClone(parsed)
        insertValueAsLastArgument(newCommandLine.command, arg)

        const updatedCommandLine = CommandLineSerializer.getCached().serializeCommandLine(newCommandLine)

        this._overwriteCommandLine(updatedCommandLine)
        this._handleSync(currentCommandLine, updatedCommandLine, parsed, newCommandLine, false)

        return true
    }

    updateOptions(parameters: { addOptions: IAddOption[], removeOptions: IRemoveOption[] }): boolean {
        ux.info("Update options from GUI", parameters)
        console.debug(parameters)

        const currentCommandLine = this._shellIntegration.currentCommandProperties()?.command
        if (!currentCommandLine || isBlank(currentCommandLine)) {
            return false
        }

        const parsed = this._parse(currentCommandLine)
        if (!parsed) {
            return false
        }

        const newCommandLine = deepClone(parsed)
        removeOptionsFromCommand(newCommandLine.command, parameters.removeOptions)
        addOptionsToCommand(newCommandLine.command, parameters.addOptions)

        const updatedCommandLine = CommandLineSerializer.getCached().serializeCommandLine(newCommandLine)

        this._overwriteCommandLine(updatedCommandLine)
        this._handleSync(currentCommandLine, updatedCommandLine, parsed, newCommandLine, false)

        return true
    }

    private _parse(commandLine: string): ICommandLine | undefined {
        return this._commandParserProvider.getParser().parseCommandLine(commandLine)
    }

    appendCommandLine(toAppend: string): boolean {
        if (!toAppend) {
            return true
        }

        directPtyWrite(toAppend)

        return true
    }

    onCommandLineSync(listener: (event: ICommandLineSyncEvent) => void) {
        this._event.on('command-line-sync', listener)
    }

    clearCommandLine(): boolean {
        this._overwriteCommandLine('')
        return true
    }

    private _overwriteCommandLine(commandLine: string) {
        const cursor = this._shellIntegration.currentCursorXPosition()
        const start = this._shellIntegration.currentCommandProperties()?.startX ?? 0
        const currentCommand = this._shellIntegration.currentCommandProperties()?.command ?? ""

        if (!cursor) {
            console.warn('no cursor')
            return
        }

        const currentCommandLength = currentCommand.length
        const cursorOffset = Math.max(currentCommandLength - (cursor - start), 0)

        var backspace = '\b \b'
        var cursorRight = '\u001b[1C'
        var sequence = cursorRight.repeat(cursorOffset) + backspace.repeat(currentCommandLength) + commandLine 

        directPtyWrite(sequence)
    }

    private _handleSync(
        oldCommandLine: string,
        newCommandLine: string,
        oldParsedCommandLine: ICommandLine | undefined,
        newParsedCommandLine: ICommandLine | undefined,
        onSpace: boolean,
    ) {
        if (newCommandLine !== oldCommandLine) {
            ux.info("CommandLine", newCommandLine)
        }
        const oldTokens = oldCommandLine.split(/\s/).filter(it => !isBlank(it))
        const newTokens = newCommandLine.split(/\s/).filter(it => !isBlank(it))
        const oldSpaceCount = count(oldCommandLine, /\s/g)
        const newSpaceCount = count(newCommandLine, /\s/g)

        if (onSpace && oldSpaceCount === newSpaceCount && oldTokens.length === newTokens.length) {
            return
        }

        const event: ICommandLineSyncEvent = { commandLine: newParsedCommandLine, oldCommandLine: oldParsedCommandLine }
        this._event.emit('command-line-sync', event)
        console.debug('command-line-sync', event)
    }
}

function directPtyWrite(data: string) {
    ipcRenderer.sendSync(ipc.term.terminal, data)
}

