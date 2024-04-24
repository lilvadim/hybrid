import { IPty, IPtyForkOptions, spawn } from "node-pty"
import * as fs from "fs"
import * as path from "path"
import { getShellIntegrationInjection } from "./terminalEnvironment"

export interface IProcessEnvironment {
    [key: string]: string | undefined
}

export interface IShellLaunchConfig {
    executable: string,
    env: IProcessEnvironment
}

export class PtyService {

    private readonly _ptyById: Map<number, IPty> = new Map()
    private _lastPtyId = 0

    constructor(
        private _shellConfig: IShellLaunchConfig
    ) { }

    getPty(id: number): IPty | undefined {
        return this._ptyById.get(id)
    }

    createPty(): number {

        const id = this._lastPtyId++

        let env = process.env
        const shellIntegrationInjection = getShellIntegrationInjection(this._shellConfig, env)
        console.log('PtyService.start#shellIntegrationInjection', shellIntegrationInjection)

        if (shellIntegrationInjection && shellIntegrationInjection.filesToCopy) {
            shellIntegrationInjection.filesToCopy.forEach(it => this.copyFiles(it.source, it.dest))
        }

        if (shellIntegrationInjection && shellIntegrationInjection.envMixin) {
            for (const [key, val] of Object.entries(shellIntegrationInjection.envMixin)) {
                env[key] = val
            }
        }

        // console.log('PtyService.start#env', env)
        const options: IPtyForkOptions = {
            name: 'xterm-256color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: env as { [key: string]: string }
        }

        const pty = spawn(this._shellConfig.executable, shellIntegrationInjection?.args ?? [], options)
        this._ptyById.set(id, pty)

        return id
    }

    copyFiles(source: string, dest: string) {
        fs.mkdir(path.dirname(dest), { recursive: true }, (err) => {
            if (!err) return
            console.error(err)
        })
        fs.copyFile(source, dest, (err) => {
            if (!err) return
            console.error(err)
        })
    }
}