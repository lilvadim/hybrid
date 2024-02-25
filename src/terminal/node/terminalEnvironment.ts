import * as path from "path"
import * as os from "os"
import { IProcessEnvironment, IShellLaunchConfig } from "./ptyService"

export interface IShellIntegrationInjection {
    args: string[],
    envMixin: IProcessEnvironment | undefined,
    filesToCopy?: {
        source: string,
        dest: string
    }[],
}

export function getShellIntegrationInjection(
    shellLaunchConfig: IShellLaunchConfig,
    env: IProcessEnvironment
): IShellIntegrationInjection | undefined {

    const shell = shellLaunchConfig.executable
    let envMixin: IProcessEnvironment = {
        'VSCODE_INJECTION': '1'
    }
    let args: string[] = []

    switch (shell) {
        case 'zsh':
            const zdotdir = path.join(os.tmpdir(), 'hybrid-zsh')

            envMixin['ZDOTDIR'] = zdotdir
            envMixin['USER_ZDOTDIR'] = env.ZDOTDIR ?? os.homedir()

            const resourcePath = process.resourcesPath
            console.log(resourcePath)
            const filesToCopy: IShellIntegrationInjection['filesToCopy'] = [
                {
                    source: path.join(resourcePath, 'sh/shellIntegration-rc.zsh'),
                    dest: path.join(zdotdir, '.zshrc')
                },
                {
                    source: path.join(resourcePath, 'sh/shellIntegration-profile.zsh'),
                    dest: path.join(zdotdir, '.zprofile')
                }, 
                {
                    source: path.join(resourcePath, 'sh/shellIntegration-env.zsh'),
                    dest: path.join(zdotdir, '.zshenv')
                },
                {
                    source: path.join(resourcePath, 'sh/shellIntegration-login.zsh'),
                    dest: path.join(zdotdir, '.zlogin')
                }
            ]

            args = ['-i']
            return { args, envMixin, filesToCopy }
        case 'bash':
            args = ['--init-file', path.join(resourcePath, 'sh/shellIntegration-bash.sh')]
            envMixin['VSCODE_SHELL_LOGIN'] = '1'
            return { args, envMixin }
    }

    return undefined
}