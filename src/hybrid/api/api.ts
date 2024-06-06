import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { IAddOption, IRemoveOption } from "../../commandLine/util/options";
import { CommandSyntaxHelper } from "./commandSyntaxHelper";
import { CommandInfoRegistry } from "../commandInfo/commandInfoRegistry";

export interface IHybridTerminalApi {
    updateOptions(parameters: { addOptions: IAddOption[], removeOptions: IRemoveOption[] }): boolean
    insertLastArg(arg: string): boolean
    removeSubcommandAndRest(subcommand: string): boolean
    appendCommandLine(toAppend: string): boolean
    clearCommandLine(): boolean
    onCommandLineSync(listener: (event: ICommandLineSyncEvent) => void): void
}

export function initApi(terminalApiImpl: IHybridTerminalApi) {
    // @ts-ignore
    window.hybrid = {
        terminal: terminalApiImpl,
        commandInfo: CommandInfoRegistry.getCached(),
        getCommandSyntaxHelper: (command: string) => {
            const syntax = CommandInfoRegistry.getCached().getInfo(command)?.syntax
            if (syntax) {
                return CommandSyntaxHelper.getCached(syntax)
            }
            return undefined
        },
        uiUtils: {
            hide: (id: string) => {
                var toHide = document.getElementById(id)
                if (toHide) {
                    toHide.classList.add('invisible')
                }
            },
            show: (id: string) => {
                var toShow = document.getElementById(id)
                if (toShow) {
                    toShow.classList.remove('invisible')
                }
            },
            toggleOn: (...inputIds: string[]) => Array.from(inputIds)
                .map(inputId => document.getElementById(inputId) as HTMLInputElement)
                .filter(input => input)
                .forEach(input => input.checked = true),
            toggleOff: (...inputIds: string[]) => Array.from(inputIds)
                .map(inputId => document.getElementById(inputId) as HTMLInputElement)
                .filter(input => input)
                .forEach(input => input.checked = false),
            setValue: (inputId: string, value: string) => {
                const input = document.getElementById(inputId) as HTMLInputElement
                if (input) {
                    input.value = value
                }
            }
        },
        
    }
}
