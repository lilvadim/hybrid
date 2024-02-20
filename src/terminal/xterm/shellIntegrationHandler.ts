import { Terminal } from "@xterm/xterm";

export class TermPosition {
    x?: number;
    y?: number;
}

export interface IShellIntegrationHandler {
    onPromptStart(position?: TermPosition): void
}

export class SimpleHandler implements IShellIntegrationHandler {

    constructor(
        private terminal: Terminal
    ) {
        this.terminal = terminal
    }

    onPromptStart(position?: TermPosition): void {
        console.log('x', this.terminal.buffer.active.cursorX)
    }

}