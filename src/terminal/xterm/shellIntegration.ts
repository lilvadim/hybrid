import { IMarker } from "@xterm/xterm"

export interface IShellIntegration {
    commands(): readonly ICommand[]
    currentCommandProperties(): Readonly<ICommandProperties> | undefined
    currentCursorXPosition(): number | undefined
}

export interface ICommandProperties {
    startX?: number,
    command: string,
    exitCode?: number,

    promptStartMarker?: IMarker,
    finishedMarker?: IMarker,
    executedMarker?: IMarker
}

export interface ICommand {
    command(): string
    output(): string
    exitCode(): number
}