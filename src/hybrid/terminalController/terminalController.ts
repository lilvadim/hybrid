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
import { collectAllArgs, insertValueAsLastArgument, removeSubcommandAndRest } from "../../commandLine/util/args";
import { CommandLineSerializer } from "../../commandLine/serializer/commandLineSerializer";
import { deepClone } from "../../util/clone";
import { ITerminalControlConfig } from "./terminalControlConfig";
import { UxLog } from "../../log/log";
import { CommandInfoRegistry } from "../commandInfo/commandInfoRegistry";
import { correctInline } from "../../commandLine/correct";
import { setTimeout } from "timers"
import Logger from "electron-log";
import { IXtermInputEvent } from "../xtermInputEvent";

export class TerminalController implements IHybridTerminalApi {

    private readonly _xterm: Terminal
    private readonly _shellIntegration: IShellIntegration
    private readonly _event = new EventEmitter().setMaxListeners(0)
    private _lastSyncState: {
        commandLine: ICommandLine | undefined,
        commandLineString: string
    } = {
            commandLineString: '',
            commandLine: undefined
        }

    constructor(
        private readonly _config: ITerminalControlConfig,
        private readonly _terminal: ITerminal,
        private readonly _commandParserProvider: CommandLineParserProvider,
        private readonly _registry: CommandInfoRegistry
    ) {
        this._xterm = _terminal.xterm
        this._shellIntegration = _terminal.shellIntegration

        this._shellIntegration.onCommandLineChange((oldCommandLine, newCommandLine) => {
            const newParsed = this._parsedCurrentCommandLine()
            this._handleSync(
                oldCommandLine,
                newCommandLine,
                newParsed,
                false
            )
        })
        if (_config.syncOnSpace && _config.autoCorrect) {
            _terminal.xtermInputEvents.on('data', (event: IXtermInputEvent) => {
                if (event.data === ' ') {
                    const previewCommandLineString = this._commandLinePreview(event.data)
                    const corrected = this._correct(this._commandParserProvider.getParser().parseCommandLine(previewCommandLineString))
                    if (corrected) {
                        const previewParsed = _commandParserProvider.getParser().parseCommandLine(previewCommandLineString)
                        const correctedCommandLineString = CommandLineSerializer.getCached().serializeCommandLine(corrected)
                        if (correctedCommandLineString !== previewCommandLineString &&
                            JSON.stringify(previewParsed) !== JSON.stringify(corrected)
                        ) {
                            event.ignore = true
                            const trailingSpace = previewCommandLineString[previewCommandLineString.length - 1] === ' ' ? ' ' : ''
                            UxLog.info('Auto Correction: ', JSON.stringify({ 
                                previewCommandLineString, 
                                correctedCommandLineString,
                            }, undefined, ' '))
                            this._overwriteCommandLine(correctedCommandLineString + trailingSpace)
                        }
                    }
                }
            })
        }
    }

    removeSubcommandAndRest(subcommand: string): boolean {
        const parsed = this._parsedCurrentCommandLine()
        if (!parsed) {
            return false
        }

        const updatedCommandLine = deepClone(parsed)

        const removed = removeSubcommandAndRest(updatedCommandLine.command, subcommand)
        if (!removed) {
            return false
        }

        const updatedCommandLineString = CommandLineSerializer.getCached().serializeCommandLine(updatedCommandLine)

        UxLog.info("Removed Subcommand from GUI", subcommand)
        this._overwriteCommandLine(updatedCommandLineString)
        this._handleSync(this._currentCommandLine(), updatedCommandLineString, updatedCommandLine, true)

        return true
    }

    insertLastArg(arg: string): boolean {
        UxLog.log("Add Subcommand from GUI", arg)

        const parsed = this._parsedCurrentCommandLine()
        if (!parsed) {
            return false
        }

        const updatedCommandLine = deepClone(parsed)
        insertValueAsLastArgument(updatedCommandLine.command, arg)

        const updatedCommandLineString = CommandLineSerializer.getCached().serializeCommandLine(updatedCommandLine)

        this._overwriteCommandLine(updatedCommandLineString)
        this._handleSync(this._currentCommandLine(), updatedCommandLineString, updatedCommandLine, true)

        return true
    }

    updateOptions(parameters: { addOptions: IAddOption[], removeOptions: IRemoveOption[] }): boolean {
        UxLog.info("Update options from GUI", parameters)
        Logger.debug(parameters)

        const parsed = this._parsedCurrentCommandLine()
        if (!parsed) {
            return false
        }

        const updatedCommandLine = deepClone(parsed)
        removeOptionsFromCommand(updatedCommandLine.command, parameters.removeOptions)
        addOptionsToCommand(updatedCommandLine.command, parameters.addOptions)

        const updatedCommandLineString = CommandLineSerializer.getCached().serializeCommandLine(updatedCommandLine)

        this._overwriteCommandLine(updatedCommandLineString)
        this._handleSync(this._currentCommandLine(), updatedCommandLineString, updatedCommandLine, true)

        return true
    }

    private _currentCommandLine(): string {
        return this._shellIntegration.currentCommandProperties()?.command || ''
    }

    private _commandLinePreview(insertData: string): string {
        const currentCommandLine = this._currentCommandLine()
        const currentCursor = this._shellIntegration.currentCursorXPosition() ?? 0
        const start = this._shellIntegration.currentCommandProperties()?.startX ?? 0
        const cursorPositionInCommand = currentCursor - start

        return currentCommandLine.slice(0, cursorPositionInCommand) +
            insertData +
            currentCommandLine.slice(cursorPositionInCommand)
    }

    private _parsedCurrentCommandLine(): ICommandLine | undefined {
        const currentCommandLine = this._shellIntegration.currentCommandProperties()?.command
        if (!currentCommandLine || isBlank(currentCommandLine)) {
            return undefined
        }
        return this._commandParserProvider.getParser().parseCommandLine(currentCommandLine)
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

    private _overwriteCommandLine(commandLine: string, offset = 0) {
        const cursor = this._shellIntegration.currentCursorXPosition()
        const start = this._shellIntegration.currentCommandProperties()?.startX ?? 0
        const currentCommand = this._shellIntegration.currentCommandProperties()?.command ?? ""

        if (!cursor) {
            Logger.warn('no cursor')
            return
        }

        const currentCommandLength = currentCommand.length
        const cursorInCommandLine = cursor - start
        const cursorOffset = Math.max(currentCommandLength - cursorInCommandLine, 0)

        var backspace = '\x7F'
        var cursorRight = '\x1B[C'
        var cursorLeft = '\x1B[D'
        var sequence = 
            cursorRight.repeat(cursorOffset + offset) +
            backspace.repeat(currentCommandLength + offset) +
            commandLine + 
            cursorLeft.repeat(commandLine.length) +
            cursorRight.repeat(cursorInCommandLine)

        Logger.debug('SEQ', { cursorOffset, currentCommandLength })

        Logger.debug('OVERWRITE', JSON.stringify({ currentCommand, commandLine }))
        directPtyWrite(sequence)
    }

    private _handleSync(
        oldCommandLine: string,
        newCommandLine: string,
        newParsedCommandLine: ICommandLine | undefined,
        force: boolean,
    ) {
        UxLog.info("CommandLine", newCommandLine)

        if (JSON.stringify(this._lastSyncState.commandLine) === JSON.stringify(newParsedCommandLine)) {
            return
        }

        const oldTokens = oldCommandLine.split(/\s/).filter(it => !isBlank(it))
        const newTokens = newCommandLine.split(/\s/).filter(it => !isBlank(it))
        const oldSpaceCount = count(oldCommandLine, /\s/g)
        const newSpaceCount = count(newCommandLine, /\s/g)

        if (!force && this._config.syncOnSpace && oldSpaceCount === newSpaceCount && oldTokens.length === newTokens.length) {
            return
        }

        const event: ICommandLineSyncEvent = {
            commandLine: newParsedCommandLine,
            commandLineString: newCommandLine,
            oldCommandLine: this._lastSyncState.commandLine,
            oldCommandLineString: this._lastSyncState.commandLineString
        }
        Logger.debug('command-line-sync', JSON.stringify(event, undefined, ' '))
        this._event.emit('command-line-sync', event)
        this._lastSyncState.commandLineString = newCommandLine
        this._lastSyncState.commandLine = newParsedCommandLine
    }

    private _correct(
        commandLine: ICommandLine | undefined,
    ): ICommandLine | undefined {

        if (!commandLine) {
            return undefined
        }

        const info = this._registry.getInfo(commandLine.command.command)
        if (info && info.syntax && info.semantic) {
            const copy = deepClone(commandLine)
            correctInline(copy.command, info.semantic, info.syntax)
            return copy
        }

        return undefined
    }
}

function directPtyWrite(data: string, type: string = 'direct') {
    ipcRenderer.sendSync(ipc.term.terminal, data, type)
}

