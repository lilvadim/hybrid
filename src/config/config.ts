import { IShellLaunchConfig } from "../terminal/node/shellLaunchConfig";
import { ICommandFrameProviderConfig } from "../hybrid/commandFrame/provider/commandFrameProviderConfig";
import { ITerminalControlConfig } from "../hybrid/terminalController/terminalControlConfig";

export interface IConfig {
    commandFrameProvider: ICommandFrameProviderConfig
    shellLaunchConfig: IShellLaunchConfig 
    terminalControl: ITerminalControlConfig
}

export type IPartialConfig = Partial<IConfig>