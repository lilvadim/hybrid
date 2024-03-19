import { IDecorationOptions, IMarker, Terminal } from "@xterm/xterm";

const ENTER_SEQ = '\x0d'

export interface IShellIntegrationHandler {
    readonly commands: ReadonlyArray<Command>
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
    finishedMarker?: IMarker,
    executedMarker?: IMarker
}

class Command {

    constructor(
        private readonly _terminal: Terminal,
        private readonly _properties: ICommandProperties,
    ) {
        if (!_properties || !_terminal) {
            console.error('Cannot initialize command', { properties: _properties, _terminal })
            throw Error('Cannot initialize command')
        }
    }

    get command(): string {
        return this._properties.command
    }

    get exitCode(): number {
        return this._properties.exitCode
    }

    commandOutput(): string {
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

export class ShellIntegrationHandler implements IShellIntegrationHandler {

    private readonly _commands: Command[] = []
    private _currentCommand: ICommandProperties | undefined = undefined

    get commands(): readonly Command[] { return this._commands }

    constructor(
        private readonly _terminal: Terminal,
        private readonly _onCommand: CommandProcessorType 
    ) {
        _terminal.onWriteParsed(() => this._onWriteParsed())
        // _terminal.onData(data => this._onData(data))
    }

    onCommandFinished(exitCode: number): void {
        if (!this._currentCommand) {
            return
        }
        console.log('onCommandFinished.cursorY', this._terminal.buffer.active.cursorY)
        const marker = this._terminal.registerMarker(0)
        this._currentCommand.finishedMarker = marker
        this._currentCommand.exitCode = exitCode
        this._commands.push(new Command(this._terminal, this._currentCommand))

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
        if (!this._currentCommand) {
            return
        }
        this._currentCommand.executedMarker = this._terminal.registerMarker(0)
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

    // private _onData(data: string) {
    //     if (data === ENTER_SEQ) {
    //         this._onEnter()
    //     }
    // }

    // private _onEnter() {
    // }

}