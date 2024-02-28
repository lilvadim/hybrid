import { IDecorationOptions, IMarker, Terminal } from "@xterm/xterm";

export interface IShellIntegrationHandler {
    onPromptStart(): void
    onCommandStart(): void
    onCommandExecuted(): void 
    onCommandFinished(exitCode: number): void 
}

interface ICommandProperties {
    startX?: number,
    command: string,
    exitCode?: number,

    promptStartMarker?: IMarker,
    endMarker?: IMarker,
    executedMarker?: IMarker
}

class Command {

    constructor(
        private readonly terminal: Terminal,
        readonly properties: ICommandProperties,
    ) {
    }

}

function promptDecorationOptions(marker: IMarker, promptEndX: number): IDecorationOptions {
    return {
        marker: marker,
        backgroundColor: '#005588',
        width: promptEndX
    }
}

const ENTER_SEQ = '\x0d'

export type CommandProcessorType = (commandOldValue: string, commandNewValue: string) => void

export class ShellIntegrationHandlerImpl implements IShellIntegrationHandler {

    private readonly _commands: ICommandProperties[] = []
    private _currentCommand: ICommandProperties | undefined = undefined

    readonly commands: ReadonlyArray<ICommandProperties> = this._commands

    constructor(
        private readonly _terminal: Terminal,
        private readonly _onCommand: CommandProcessorType 
    ) {
        _terminal.onWriteParsed(() => this._onWriteParsed())
        _terminal.onData(data => this._onData(data))
    }

    onCommandFinished(exitCode: number): void {
        if (!this._currentCommand) {
            return
        }
        console.log('onCommandFinished.cursorY', this._terminal.buffer.active.cursorY)
        const marker = this._terminal.registerMarker(0)
        this._currentCommand.endMarker = marker
        this._currentCommand.exitCode = exitCode
        console.log('onCommandFinished.currentCommand', this._currentCommand)
    }

    onPromptStart(): void {
        console.log('onPromptStart.cursorY', this._terminal.buffer.active.cursorY)
        const marker = this._terminal.registerMarker(0)
        console.log('onPromptStart.lineY', marker.line)
        this._currentCommand = {
            promptStartMarker: marker,
            command: ""
        }
        console.log('onPromptStart.currentCommand', this._currentCommand)
    }

    onCommandStart(): void {
        if (!this._currentCommand) {
            return 
        }
        const cursorX = this._terminal.buffer.active.cursorX

        this._terminal.registerDecoration(promptDecorationOptions(this._currentCommand.promptStartMarker, cursorX))
        this._currentCommand.startX = cursorX
        console.log('onCommandStart.currentCommand', this._currentCommand)
    }

    onCommandExecuted(): void {
        console.log('onCommandExecuted')
    }

    private _onWriteParsed() {
        if (!this._currentCommand || !this._currentCommand.startX) {
            return
        }
        const lineY = this._currentCommand.promptStartMarker.line
        const line = this._terminal.buffer.active.getLine(lineY)
        if (!line) {
            console.warn('onWriteParsed', 'Line not found', lineY)
            return
        }
        const commandText = line.translateToString(
            true, 
            this._currentCommand.startX
        )
        const commandOldValue = this._currentCommand.command
        this._currentCommand.command = commandText.trimRight()
        this._onCommand(commandOldValue, this._currentCommand.command)
        console.log('onWriteParsed.currentCommand', this._currentCommand)
    }

    private _onData(data: string) {
        if (data === ENTER_SEQ) {
            this._onEnter()
        }
    }

    private _onEnter() {
        this._commands.push(this._currentCommand)
        console.log('onEnter.commands', this._commands)
    }

}