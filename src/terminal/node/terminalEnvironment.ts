import * as path from "path"
import * as os from "os"
import { IProcessEnvironment } from "./ptyService"
import { IShellLaunchConfig } from "./shellLaunchConfig"
import { EnvironmentUtils } from "../../util/environment"

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
        'VSCODE_INJECTION': '1',
        'LANG': env.LANG ?? 'en_US.UTF-8'
    }
    let args: string[] = []

    const resourcePath = path.join(EnvironmentUtils.resourcePath, 'resources')
    switch (shell) {
        case 'zsh':
            const zdotdir = path.join(os.tmpdir(), 'hybrid-zsh')

            envMixin['ZDOTDIR'] = zdotdir
            envMixin['USER_ZDOTDIR'] = env.ZDOTDIR ?? os.homedir()

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