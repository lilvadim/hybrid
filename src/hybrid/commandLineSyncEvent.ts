import { IShellCommand } from "./shellCommand/shellCommand"

export interface ICommandLineSyncEvent {
    readonly command: Readonly<IShellCommand>
}