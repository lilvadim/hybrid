import { ICommandLine } from "../commandLine/commandLine"

export interface ICommandLineSyncEvent {
    readonly oldCommandLineString: string
    readonly commandLineString: string
    readonly oldCommandLine: Readonly<ICommandLine> | undefined
    readonly commandLine: Readonly<ICommandLine> | undefined
}