import { ICommandLineSyncEvent } from "../commandLineSyncEvent";
import { IAddOption, IRemoveOption } from "../../commandLine/util/options";
import { CommandSyntaxHelper } from "./commandSyntaxHelper";
import { CommandInfoRegistry } from "../commandInfo/commandInfoRegistry";
import * as bootstrap from 'bootstrap'
import { ICommandSyntax } from "../../commandLine/syntax/commandSyntax";

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
        getCommandSyntaxHelper: (commandSyntax: ICommandSyntax) => CommandSyntaxHelper.getCached(commandSyntax),
        uiUtils: {
            showTab(tabId: string | undefined | null) {
                if (!tabId) {
                    return
                }
                const tabBtn = document.getElementById(tabId)
                if (tabBtn) {
                    const tab = bootstrap.Tab.getInstance(tabBtn) || new bootstrap.Tab(tabBtn)
                    tab.show()
                    const parentTabId = tabBtn.closest('div[role="tabpanel"]')?.getAttribute('aria-labelledby')
                    this.showTab(parentTabId)
                }
            },
            hide: (id: string) => {
                const toHide = document.getElementById(id)
                if (toHide) {
                    toHide.classList.add('invisible')
                }
            },
            show: (id: string) => {
                const toShow = document.getElementById(id)
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
