import { IShellCommand } from "./shell/shellCommand"

export interface ICommandLineSyncEvent {
    readonly command: Readonly<IShellCommand>
}