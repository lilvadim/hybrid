import { IPty, IPtyForkOptions, spawn } from "node-pty"
import * as os from "os"
import * as fs from "fs"
import * as path from "path"
import { ShellLaunchConfig } from "../config/shellLaunchConfig"

export class PtyService {

    private shellLaunchConfig: ShellLaunchConfig = {
        executable: 'zsh'
    }

    private lastPtyId = 0
    private ptyById: Map<number, IPty> = new Map()

    getPty(id: number): IPty | undefined {
        return this.ptyById.get(id)
    }

    start(): number | undefined {

        const id = this.lastPtyId++
        const options: IPtyForkOptions = {
            name: 'xterm_' + id,
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env
        }

        switch (this.shellLaunchConfig.executable) {
            case 'zsh':
                const zdotdir = path.join(os.tmpdir(), 'hybrid_tmp_shell')
                options.env['ZDOTDIR'] = zdotdir
                options.env['USER_ZDOTDIR'] = os.homedir()

                const resourcePath = process.resourcesPath
                this.copyFiles(path.join(resourcePath, 'sh/shellIntegration-rc.zsh'), path.join(zdotdir, '.zshrc'))
                this.copyFiles(path.join(resourcePath, 'sh/shellIntegration-profile.zsh'), path.join(zdotdir, '.zprofile'))
                this.copyFiles(path.join(resourcePath, 'sh/shellIntegration-env.zsh'), path.join(zdotdir, '.zshenv'))
                this.copyFiles(path.join(resourcePath, 'sh/shellIntegration-login.zsh'), path.join(zdotdir, '.zlogin'))

                const pty = spawn('zsh', [], options)

                this.ptyById.set(id, pty)
                return id
        }

        return undefined
    }

    copyFiles(source: string, dest: string) {
        fs.mkdir(path.dirname(dest), { recursive: true }, () => { })
        fs.copyFile(source, dest, () => { })
    }
}