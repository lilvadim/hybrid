import { Terminal } from "@xterm/xterm";
import { ShellIntegrationAddon } from "./shellIntegrationAddon";
import {  CommandProcessorType, ShellIntegrationHandler } from "./shellIntegrationHandler";


export class XtermService {

    private readonly _xtermById: Map<number, Terminal> = new Map()
    private _lastXtermId = 0

    createXterm(commandProcessor: CommandProcessorType): number {
        const id = this._lastXtermId++

        const xterm = new Terminal({
            allowProposedApi: true,
            rows: 24,
            cols: 80
        })

        const shellIntegrationAddon = new ShellIntegrationAddon(new ShellIntegrationHandler(xterm, commandProcessor))
        xterm.loadAddon(shellIntegrationAddon)

        this._xtermById.set(id, xterm)
        return id
    }

    getXterm(id: number): Terminal | undefined {
        return this._xtermById.get(id)
    }
}