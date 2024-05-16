import { Terminal } from "@xterm/xterm";
import { IShellIntegration } from "../../terminal/xterm/shellIntegration";
import { ITerminal } from "../../terminal/xterm/terminalService";
import { ipcRenderer } from "electron";
import { ipc } from "../../constants/ipc";
import { ICommandOption, shellCommand } from "../shellCommand/shellCommand";
import { ICommandDescription } from "../commandDescription/commandDescription";
import { CommandDescriptionRegistry } from "../commandDescription/commandDescriptionRegistry";
import { ICommandDescriptor } from "../commandDescription/commandDescriptor";
import { IHybridTerminalApi } from "../api/api";
import EventEmitter from "events";
import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { distinctBy } from "../../util/arrays";
import { count, isBlank } from "../../util/strings";
import { ICommandContext } from "../api/commandContext";

export class TerminalController implements IHybridTerminalApi {

    private readonly _commandDescriptionRegistry: CommandDescriptionRegistry = new CommandDescriptionRegistry()
    private readonly _xterm: Terminal
    private readonly _shellIntegration: IShellIntegration
    private readonly _event = new EventEmitter().setMaxListeners(0)
    private _commandContext: ICommandContext | undefined = undefined

    constructor(
        private readonly _terminal: ITerminal,
    ) {
        this._xterm = _terminal.xterm
        this._shellIntegration = _terminal.shellIntegration

        this._shellIntegration.onCommandLineChange(
            (oldCommandLine, newCommandLine) => this._handleSync(oldCommandLine, newCommandLine, true)
        )
    } 

    setCommandContext(ctx: ICommandContext): void {
        this._commandContext = ctx
    }

    onCommandLineSync(listener: (event: ICommandLineSyncEvent) => void) {
        this._event.on('command-line-sync', listener)
    }

    updateOptions(parameters: { addOptions: ICommandOption[], removeOptions: ICommandOption[] }): boolean {
        console.debug('TerminalController.updateOptions', parameters)
        if (!parameters || !this._commandContext) {
            return false
        }
        if (parameters.addOptions.length === 0 && parameters.removeOptions.length === 0) {
            return true
        }

        const descriptor = this._commandContext.descriptor
        const commandDescription = this._commandDescriptionRegistry.getDescription(descriptor)
        if (!commandDescription) {
            console.debug('TerminalController.updateOptions', 'command description not found', 'command', descriptor)
            return false
        }

        const commandLine = this._shellIntegration.currentCommandProperties()?.command ?? undefined
        console.debug('TerminalController.updateOptions', { commandLine })
        if (!commandLine) {
            return false
        }

        const command = shellCommand.parsed(commandLine, commandDescription)

        const options = [...command.options]
        console.debug(JSON.stringify(command))

        parameters.removeOptions.forEach(option => {
            const optionIndex = options.findIndex(it => option.option === it?.option)
            if (optionIndex >= 0) {
                delete options[optionIndex]
            }
        })
        parameters.addOptions.forEach(option => options.push(option))

        console.debug('updated options:', JSON.stringify(options))
        command.options = distinctBy(options, it => JSON.stringify({ 
            option: it.option,
            value: it.value ?? ""
        }))

        const updatedCommandLine = shellCommand.commandLine(command)
        console.debug({ updatedCommandLine })

        this._replaceCurrentCommand(updatedCommandLine)

        this._handleSync(commandLine, updatedCommandLine, false)
        return true
    }
   
    registerCommand(commandDescription: ICommandDescription): boolean {
        console.debug('TerminalController.registerCommand', { commandDescription })
        if (!commandDescription) {
            console.warn('TerminalController.registerCommand', 'command description is undefined')
            return false
        }
        this._commandDescriptionRegistry.registerDescription(commandDescription)
        return true
    }

    isRegisteredCommand(commandDescriptor: ICommandDescriptor): boolean {
        if (!commandDescriptor) {
            console.warn('TerminalController.isRegisteredCommand', 'command descriptor is undefined')
            return false
        }
        return this._commandDescriptionRegistry.getDescription(commandDescriptor) ? true : false
    }

    clearCurrentCommand(): boolean {
        this._replaceCurrentCommand('')
        return true
    }

    private _replaceCurrentCommand(command: string) {
        const cursor = this._shellIntegration.currentCursorXPosition()
        const start = this._shellIntegration.currentCommandProperties()?.startX ?? undefined

        if (!cursor) {
            console.warn('no cursor')
            return
        }

        const currentCommandLength = cursor - (start ?? 0)

        var sequence = ''
        for (let i = 0; i < currentCommandLength; i++) {
            sequence += '\b \b'
        }
        sequence += command
    
        ptyWrite(sequence)
    }

    private _handleSync(oldCommandLine: string, newCommandLine: string, onSpace: boolean) {
        const descriptor = this._commandContext?.descriptor
        if (!descriptor) {
            console.warn('No command context set!')
            return
        }

        const commandDescription = this._commandDescriptionRegistry.getDescription(descriptor)
        if (!commandDescription) {
            return
        }

        const oldTokens = oldCommandLine.split(/\s/).filter(it => !isBlank(it))
        const newTokens = newCommandLine.split(/\s/).filter(it => !isBlank(it))
        const oldSpaceCount = count(oldCommandLine, /\s/g)
        const newSpaceCount = count(newCommandLine, /\s/g)

        if (onSpace && oldTokens.length === newTokens.length && oldSpaceCount === newSpaceCount) {
            return
        }

        const command = shellCommand.parsed(newCommandLine, commandDescription)
        const event: ICommandLineSyncEvent = { command }
        this._event.emit('command-line-sync', event)
        console.debug('command-line-sync', event)
    }

}

function ptyWrite(data: string) {
    ipcRenderer.sendSync(ipc.term.terminal, data)
}

