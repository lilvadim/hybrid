import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { ICommandDescription } from "./commandDescription";
import { IAddOption, IRemoveOption } from "../../commandLine/util/options";
import { CommandLineUtil } from "./commandLineUtil";

export interface IHybridTerminalApi {
    updateOptions(parameters: { addOptions: IAddOption[], removeOptions: IRemoveOption[] }): boolean
    insertLastArg(arg: string): boolean
    removeSubcommandArg(subcommand: string): boolean
    appendCommandLine(toAppend: string): boolean
    clearCommandLine(): boolean
    onCommandLineSync(listener: (event: ICommandLineSyncEvent) => void): void
}

export function initApi(terminalApiImpl: IHybridTerminalApi) {
    // @ts-ignore
    window.hybrid = {
        terminal: terminalApiImpl,
        getCommandLineUtil: (commandDescription: ICommandDescription) => CommandLineUtil.getCached(commandDescription),
        utils: {
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
            toggleOn: (input: HTMLInputElement) => {
                if (input) {
                    input.checked = true;
                }
            },
            toggleOff: (input: HTMLInputElement) => {
                if (input) {
                    input.checked = false;
                }
            },
            setValue: (input: HTMLInputElement, value: string) => {
                if (input) {
                    input.value = value
                }
            }
        },
        
    }
}
