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

export type CommandProcessorType = (command: string) => void

export class ShellIntegrationHandlerImpl implements IShellIntegrationHandler {

    private _commands: ICommandProperties[]
    private _currentCommand: ICommandProperties | undefined = undefined

    constructor(
        private readonly _terminal: Terminal,
        private readonly _onCommand: CommandProcessorType 
    ) {
        _terminal.onWriteParsed(() => this._onWriteParsed())
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
        if (!this._currentCommand) {
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
        this._currentCommand.command = commandText.trimRight()
        this._onCommand(this._currentCommand.command)
        console.log('onWriteParsed.currentCommand', this._currentCommand)
    }

}