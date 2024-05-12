import { Terminal } from "@xterm/xterm";
import { ShellIntegrationAddon } from "./shellIntegrationAddon";
import { ShellIntegrationHandler } from "./shellIntegrationHandler";
import { IShellIntegration } from "./shellIntegration";

export interface ITerminal {
    xterm: Terminal, 
    shellIntegration: IShellIntegration
}

export class TerminalService {

    private readonly _xtermById: Map<number, ITerminal> = new Map()
    private _lastXtermId = 0

    createXterm(): number {
        const id = this._lastXtermId++

        const xterm = new Terminal({
            allowProposedApi: true,
            rows: 24,
            cols: 80
        })

        const shellIntegration = new ShellIntegrationHandler(xterm)
        const shellIntegrationAddon = new ShellIntegrationAddon(shellIntegration)
        xterm.loadAddon(shellIntegrationAddon)

        this._xtermById.set(id, {
            xterm,
            shellIntegration
        })
        return id
    }

    getTerminal(id: number): ITerminal | undefined {
        return this._xtermById.get(id)
    }
}