import { Terminal } from "@xterm/xterm";
import { IShellIntegration } from "../terminal/xterm/shellIntegration";
import { ITerminal } from "../terminal/xterm/terminalService";
import { ipcRenderer } from "electron";
import { ipc } from "../constants/ipc";
import { ICommandDescription, ICommandOption, isOption, parseString, translateToString } from "./shell/shellCommand";
import { CommandDescriptionRegistry, ICommandDescriptor } from "./commandDescriptionRegistry";
import { IHybridTerminalApi } from "./api/api";

export class TerminalController implements IHybridTerminalApi {

    private readonly _commandDescriptionRegistry: CommandDescriptionRegistry = new CommandDescriptionRegistry()
    private readonly _xterm: Terminal
    private readonly _shellIntegration: IShellIntegration

    constructor(
        private readonly _terminal: ITerminal,
    ) {
        this._xterm = _terminal.xterm
        this._shellIntegration = _terminal.shellIntegration
    }

    registerCommand(commandDescription: ICommandDescription): boolean {
        console.log('TerminalController.registerCommand', { commandDescription })
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

    addOptions(parameters: { commandDescriptor: ICommandDescriptor, options: ICommandOption[] }): boolean {
        console.log('TerminalController.addOption', parameters)
        if (!parameters || !parameters.options) {
            console.warn('TerminalController.addOption', 'option is undefined')
            return false
        }

        const commandDescription = this._commandDescriptionRegistry.getDescription(parameters.commandDescriptor)
        if (!commandDescription) {
            console.debug('TerminalController.addOption', 'command description not found', 'command', parameters.commandDescriptor)
            return false
        }

        const commandLine = this._shellIntegration.currentCommandProperties()?.command ?? undefined
        if (!commandLine) {
            console.warn('TerminalController.addOption', { commandLine })
            return false
        }

        const command = parseString(commandLine, commandDescription)
        command.options.push(...parameters.options)

        const updatedCommandLine = translateToString(command)

        this._replaceCurrentCommand(updatedCommandLine)

        return true
    }

    removeOptions(parameters: { commandDescriptor: ICommandDescriptor, options: ICommandOption[] }): boolean {
        console.log('TerminalController.removeOption', { parameters })
        if (!parameters || !parameters.options) {
            console.warn('TerminalController.registerOption', 'option is undefined')
            return false
        }

        const commandDescription = this._commandDescriptionRegistry.getDescription(parameters.commandDescriptor)
        if (!commandDescription) {
            console.debug('TerminalController.addOption', 'command description not found', 'command', parameters.commandDescriptor)
            return false
        }

        const commandLine = this._shellIntegration.currentCommandProperties()?.command ?? undefined
        if (!commandLine) {
            console.warn('TerminalController.addOption', { commandLine })
            return false
        }

        const command = parseString(commandLine, commandDescription)
        for (let optionToRemove of parameters.options) {
            const optionIndex = command.options.findIndex(value => value.option === optionToRemove.option)
            delete command.options[optionIndex]
        }

        const updatedCommandLine = translateToString(command)

        this._replaceCurrentCommand(updatedCommandLine)

        return true
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

        const commandLength = cursor - (start ?? 0)

        for (let i = 0; i < commandLength; i++) {
            ptyWrite('\b \b')
        }

        ptyWrite(command)
    }

}

function ptyWrite(data: string) {
    ipcRenderer.send(ipc.term.terminal, data)
}

