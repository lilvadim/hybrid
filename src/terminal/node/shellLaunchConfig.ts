import { IProcessEnvironment } from "./ptyService";


export interface IShellLaunchConfig {
    executable: string;
    env: IProcessEnvironment;
}
