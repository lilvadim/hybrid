import { Terminal } from "@xterm/xterm";
import { IShellIntegration } from "../../terminal/xterm/shellIntegration";
import { ITerminal } from "../../terminal/xterm/terminalService";
import { ipcRenderer } from "electron";
import { ipc } from "../../constants/ipc";
import { IHybridTerminalApi } from "../api/api";
import EventEmitter from "events";
import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { isBlank } from "../../util/strings";
import { IAddOption, IRemoveOption, addOptionsToCommand, removeOptionsFromCommand } from "../../commandLine/util/options";
import { CommandLineParserProvider } from "../../commandLine/parser/commandLineParserProvider";
import { ICommandLine } from "../../commandLine/commandLine";
import { insertValueAsLastArgument, removeSubcommandAndRest } from "../../commandLine/util/args";
import { CommandLineSerializer } from "../../commandLine/serializer/commandLineSerializer";
import { deepClone } from "../../util/clone";
import { ITerminalControlConfig } from "./terminalControlConfig";
import { UxLog } from "../../log/log";
import { CommandInfoRegistry } from "../commandInfo/commandInfoRegistry";
import { correctInline } from "../../commandLine/correct";
import Logger from "electron-log";
import { IXtermInputEvent } from "../xtermInputEvent";
import { tokensCount } from "../../commandLine/util/tokens";
import { CommandSyntaxHelper } from "../api/commandSyntaxHelper";

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
        if (_config.activeSpace && _config.autoCorrect) {
            _terminal.xtermInputEvents.on('data', (event: IXtermInputEvent) => this._handleAutoCorrection(event))
        }
    }

    private _handleAutoCorrection(event: IXtermInputEvent) {
        if (event.data === ' ' || event.data === '\x7F') {
            const previewCommandLineString = event.data === ' ' ? 
                this._commandLinePreview(event.data) :
                this._commandLinePreviewBackspace()
            
            Logger.debug('PREVIEW', { previewCommandLineString })

            const currentCommand = this._parsedCurrentCommandLine()?.command
            const previewCommand = this._parse(previewCommandLineString)?.command
            const trailingSpace = previewCommandLineString[previewCommandLineString.length - 1] === ' ' ? ' ' : ''
            if (currentCommand 
                && previewCommand 
                && tokensCount(currentCommand) === tokensCount(previewCommand)
                && previewCommand === currentCommand
                && !trailingSpace) {
                return
            }
            const corrected = this._correct(this._commandParserProvider.getParser().parseCommandLine(previewCommandLineString))
            Logger.debug('CORRECTED', JSON.stringify(corrected, undefined, ' '))
            if (corrected) {
                event.ignore = true
                // const previewParsed = _commandParserProvider.getParser().parseCommandLine(previewCommandLineString)
                const correctedCommandLineString = this._serialize(corrected)
                const offset = event.data === ' ' && (correctedCommandLineString === previewCommandLineString || trailingSpace) ? 1 : event.data === '\x7F' ? -1 : 0
                UxLog.info('Auto Correction: ', JSON.stringify({ 
                    userInput: previewCommandLineString, 
                    corrected: correctedCommandLineString,
                }, undefined, ' '))
                this._overwriteCommandLine(correctedCommandLineString + trailingSpace, offset)
            }
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

        const updatedCommandLineString = this._serialize(updatedCommandLine)

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

        const updatedCommandLineString = this._serialize(updatedCommandLine)

        const cursorOffset = updatedCommandLineString.length - this._cursorInCommandPosition()
        this._overwriteCommandLine(updatedCommandLineString, cursorOffset)
        this._handleSync(this._currentCommandLine(), updatedCommandLineString, updatedCommandLine, true)

        return true
    }

    private _cursorInCommandPosition(): number {
        return (this._shellIntegration.currentCursorXPosition() || this._currentCommandLine().length) - 
            (this._shellIntegration.currentCommandProperties()?.startX ?? 0)
    }
 
    updateOptions(parameters: { addOptions: IAddOption[], removeOptions: IRemoveOption[] }): boolean {
        UxLog.info("Update options from GUI", parameters)
        Logger.debug(parameters)

        const parsed = this._parsedCurrentCommandLine()
        if (!parsed) {
            return false
        }

        const updatedCommandLine = deepClone(parsed)
        const info = this._registry.getInfo(updatedCommandLine.command.command)
        let subcommand = undefined
        if (info && info.syntax) {
            const syntaxHelper = CommandSyntaxHelper.getCached(info.syntax)
            subcommand = syntaxHelper.getSubcommand(updatedCommandLine.command)
        }
        removeOptionsFromCommand(updatedCommandLine.command, parameters.removeOptions, undefined, subcommand)
        addOptionsToCommand(updatedCommandLine.command, parameters.addOptions, subcommand)

        const updatedCommandLineString = this._serialize(updatedCommandLine)

        this._overwriteCommandLine(updatedCommandLineString)
        this._handleSync(this._currentCommandLine(), updatedCommandLineString, updatedCommandLine, true)

        return true
    }

    private _currentCommandLine(): string {
        return this._shellIntegration.currentCommandProperties()?.command ?? ''
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

    private _commandLinePreviewBackspace(): string {
        const currentCommandLine = this._currentCommandLine()
        const currentCursor = this._shellIntegration.currentCursorXPosition() ?? 0
        const start = this._shellIntegration.currentCommandProperties()?.startX ?? 0
        const cursorPositionInCommand = currentCursor - start

        return currentCommandLine.slice(0, cursorPositionInCommand - 1) +
            currentCommandLine.slice(cursorPositionInCommand)
    }

    private _parsedCurrentCommandLine(): ICommandLine | undefined {
        return this._parse(this._currentCommandLine())
    }

    private _parse(commandLineString: string): ICommandLine | undefined {
        if (!commandLineString || isBlank(commandLineString)) {
            return undefined
        }
        return this._commandParserProvider.getParser().parseCommandLine(commandLineString)
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

    private _overwriteCommandLine(commandLine: string, overwrittenCursorOffset = 0) {
        const cursor = this._shellIntegration.currentCursorXPosition()
        const start = this._shellIntegration.currentCommandProperties()?.startX ?? 0
        const currentCommand = this._currentCommandLine()

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
            cursorRight.repeat(cursorOffset) +
            backspace.repeat(currentCommandLength) +
            commandLine + 
            cursorLeft.repeat(commandLine.length) +
            cursorRight.repeat(cursorInCommandLine + overwrittenCursorOffset)

        Logger.debug('OVERWRITE', JSON.stringify({ currentCommand, commandLine }))
        Logger.debug('SEQ', JSON.stringify(sequence))
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

        const oldParsedCommand = this._parse(oldCommandLine)?.command
        const oldTokenCount = oldParsedCommand ? tokensCount(oldParsedCommand) : -1
        const newTokenCount = newParsedCommandLine?.command ? tokensCount(newParsedCommandLine.command) : -1
        const trailingSpace = newCommandLine[newCommandLine.length - 1] === ' ' ? true : false 

        if (!force && this._config.activeSpace && !trailingSpace && oldTokenCount === newTokenCount) {
            return
        }

        if (!newParsedCommandLine) {
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

    private _serialize(commandLine: ICommandLine): string {
        return CommandLineSerializer.getCached().serializeCommandLine(commandLine)
    }
}

function directPtyWrite(data: string, type: string = 'direct') {
    ipcRenderer.send(ipc.term.terminal, data, type)
}

