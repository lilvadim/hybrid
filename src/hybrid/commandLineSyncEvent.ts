import { ICommandLine } from "../commandLine/commandLine"

export interface ICommandLineSyncEvent {
    readonly oldCommandLine: Readonly<ICommandLine> | undefined
    readonly commandLine: Readonly<ICommandLine> | undefined
}