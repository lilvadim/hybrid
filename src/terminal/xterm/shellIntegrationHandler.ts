import { IDecorationOptions, IMarker, Terminal } from "@xterm/xterm";
import { ICommand, ICommandProperties, IShellIntegration } from "./shellIntegration";
import { setTimeout } from "timers";
import EventEmitter from "events";

export interface IShellIntegrationHandler {
    onPromptStart(): void
    onCommandStart(): void
    onCommandExecuted(): void 
    onCommandFinished(exitCode: number): void 
}

class Command implements ICommand {

    constructor(
        private readonly _terminal: Terminal,
        private readonly _properties: ICommandProperties,
    ) {
        if (!_properties || !_terminal) {
            console.error('Cannot initialize command', { properties: _properties, _terminal })
            throw Error('Cannot initialize command')
        }
    }

    command(): string {
        return this._properties.command
    }

    exitCode(): number {
        return this._properties.exitCode ?? 0
    }

    output(): string {
        if (!this._properties.executedMarker || !this._properties.finishedMarker) {
            return ''
        }
        const executedLine = this._properties.executedMarker.line
        const finishedLine = this._properties.finishedMarker.line

        let result: string = ''
        for (let i = executedLine; i < finishedLine; i++) {
            result += this._terminal.buffer.active.getLine(i)?.translateToString() ?? ''
        }

        return result
    }

}

function promptDecorationOptions(marker: IMarker, promptEndX: number): IDecorationOptions {
    return {
        marker: marker,
        // backgroundColor: '#005588',
        foregroundColor: '#5fb9f5',
        width: promptEndX
    }
}

export type CommandProcessorType = (commandOldValue: string, commandNewValue: string) => any

export class ShellIntegrationHandler implements IShellIntegrationHandler, IShellIntegration {

    private readonly _commands: Command[] = []
    private _currentCommand: ICommandProperties | undefined = undefined
    private readonly _event = new EventEmitter()

    constructor(
        private readonly _terminal: Terminal,
    ) {
        _terminal.onWriteParsed(() => setTimeout(() => this._onWriteParsed(), 50))
    }

    onCommandLineChange(listener: (oldCommandLine: string, newCommandLine: string) => void): void {
        this._event.on('command-line-change', listener)
    }

    commands(): readonly Command[] { 
        return this._commands 
    }

    currentCommandProperties(): Readonly<ICommandProperties> | undefined {
        return this._currentCommand
    }

    currentCursorXPosition(): number {
        return this._terminal.buffer.active.cursorX
    }

    onCommandFinished(exitCode: number): void {
        if (!this._currentCommand) {
            return
        }
        console.debug('onCommandFinished.cursorY', this._terminal.buffer.active.cursorY)
        const marker = this._terminal.registerMarker(0)
        this._currentCommand.finishedMarker = marker
        this._currentCommand.exitCode = exitCode
        this._commands.push(new Command(this._terminal, this._currentCommand))

        console.debug('onCommandFinished.currentCommand', this._currentCommand)
    }

    onPromptStart(): void {
        console.debug('onPromptStart.cursorY', this._terminal.buffer.active.cursorY)
        const marker = this._terminal.registerMarker(0)
        console.debug('onPromptStart.lineY', marker.line)
        this._currentCommand = {
            promptStartMarker: marker,
            command: ""
        }
        console.debug('onPromptStart.currentCommand', this._currentCommand)
    }

    onCommandStart(): void {
        if (!this._currentCommand) {
            return 
        }
        const cursorX = this._terminal.buffer.active.cursorX

        if (this._currentCommand && this._currentCommand.promptStartMarker) {
            this._terminal.registerDecoration(promptDecorationOptions(this._currentCommand.promptStartMarker, cursorX)) 
        }
        this._currentCommand.startX = cursorX
        console.debug('onCommandStart.currentCommand', this._currentCommand)
    }

    onCommandExecuted(): void {
        if (!this._currentCommand) {
            return
        }
        this._currentCommand.executedMarker = this._terminal.registerMarker(0)
        console.debug('onCommandExecuted')
    }

    private _onWriteParsed() {
        if (!this._currentCommand || !this._currentCommand.startX) {
            return
        }
        const lineY = this._currentCommand?.promptStartMarker?.line
        if (!lineY) {
            return
        }
        const line = this._terminal.buffer.active.getLine(lineY)
        if (!line) {
            console.warn('onWriteParsed', 'Line not found', lineY)
            return
        }
        const startX = this._currentCommand.startX
        const commandText = line.translateToString(
            true, 
            this._currentCommand.startX
        )
        const cursorX = this._terminal.buffer.normal.cursorX 

        const trimmedCommandText = commandText.trimEnd()
        const trimmedToCursorCommandText = commandText.substring(0, cursorX - startX)
        
        const commandNewValue = trimmedCommandText.length > trimmedToCursorCommandText.length ? trimmedCommandText : trimmedToCursorCommandText
        const commandOldValue = this._currentCommand.command
        this._currentCommand.command = commandNewValue

        this._event.emit('command-line-change', commandOldValue, commandNewValue)
        console.debug('onWriteParsed.currentCommand', this._currentCommand)
    }

}