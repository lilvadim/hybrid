import { Terminal, ITerminalAddon, IViewportRangePosition } from "@xterm/xterm";
import { IShellIntegrationHandler } from "./shellIntegrationHandler";

/**
 * Shell integration is a feature that enhances the terminal's understanding of what's happening
 * in the shell by injecting special sequences into the shell's prompt using the "Set Text
 * Parameters" sequence (`OSC Ps ; Pt ST`).
 *
 * Definitions:
 * - OSC: `\x1b]`
 * - Ps:  A single (usually optional) numeric parameter, composed of one or more digits.
 * - Pt:  A text parameter composed of printable characters.
 * - ST: `\x7`
 *
 * This is inspired by a feature of the same name in the FinalTerm, iTerm2 and kitty terminals.
 */

/**
 * The identifier for the first numeric parameter (`Ps`) for OSC commands used by shell integration.
 */
const enum ShellIntegrationOscPs {
	/**
	 * Sequences pioneered by FinalTerm.
	 */
	FinalTerm = 133,
	/**
	 * Sequences pioneered by VS Code. The number is derived from the least significant digit of
	 * "VSC" when encoded in hex ("VSC" = 0x56, 0x53, 0x43).
	 */
	VSCode = 633,
	/**
	 * Sequences pioneered by iTerm.
	 */
	ITerm = 1337,
	SetCwd = 7,
	SetWindowsFriendlyCwd = 9
}

/**
 * VS Code-specific shell integration sequences. Some of these are based on more common alternatives
 * like those pioneered in FinalTerm. The decision to move to entirely custom sequences was to try
 * to improve reliability and prevent the possibility of applications confusing the terminal. If
 * multiple shell integration scripts run, VS Code will prioritize the VS Code-specific ones.
 *
 * It's recommended that authors of shell integration scripts use the common sequences (eg. 133)
 * when building general purpose scripts and the VS Code-specific (633) when targeting only VS Code
 * or when there are no other alternatives.
 */
const enum VSCodeOscPt {
	/**
	 * The start of the prompt, this is expected to always appear at the start of a line.
	 * Based on FinalTerm's `OSC 133 ; A ST`.
	 */
	PromptStart = 'A',

	/**
	 * The start of a command, ie. where the user inputs their command.
	 * Based on FinalTerm's `OSC 133 ; B ST`.
	 */
	CommandStart = 'B',

	/**
	 * Sent just before the command output begins.
	 * Based on FinalTerm's `OSC 133 ; C ST`.
	 */
	CommandExecuted = 'C',

	/**
	 * Sent just after a command has finished. The exit code is optional, when not specified it
	 * means no command was run (ie. enter on empty prompt or ctrl+c).
	 * Based on FinalTerm's `OSC 133 ; D [; <ExitCode>] ST`.
	 */
	CommandFinished = 'D',

	/**
	 * Explicitly set the command line. This helps workaround performance and reliability problems
	 * with parsing out the command, such as conpty not guaranteeing the position of the sequence or
	 * the shell not guaranteeing that the entire command is even visible.
	 *
	 * The command line can escape ascii characters using the `\xAB` format, where AB are the
	 * hexadecimal representation of the character code (case insensitive), and escape the `\`
	 * character using `\\`. It's required to escape semi-colon (`0x3b`) and characters 0x20 and
	 * below, this is particularly important for new line and semi-colon.
	 *
	 * Some examples:
	 *
	 * ```
	 * "\"  -> "\\"
	 * "\n" -> "\x0a"
	 * ";"  -> "\x3b"
	 * ```
	 *
	 * An optional nonce can be provided which is may be required by the terminal in order enable
	 * some features. This helps ensure no malicious command injection has occurred.
	 *
	 * Format: `OSC 633 ; E [; <CommandLine> [; <Nonce>]] ST`.
	 */
	CommandLine = 'E',

	/**
	 * Set an arbitrary property: `OSC 633 ; P ; <Property>=<Value> ST`, only known properties will
	 * be handled.
	 *
	 * Known properties:
	 *
	 * - `Cwd` - Reports the current working directory to the terminal.
	 * - `IsWindows` - Indicates whether the terminal is using a Windows backend like winpty or
	 *   conpty. This may be used to enable additional heuristics as the positioning of the shell
	 *   integration sequences are not guaranteed to be correct. Valid values: `True`, `False`.
	 *
	 * WARNING: Any other properties may be changed and are not guaranteed to work in the future.
	 */
	Property = 'P',

}

export class ShellIntegrationAddon implements ITerminalAddon {

    private readonly _handlers: IShellIntegrationHandler[] = []

    constructor(...handlers: IShellIntegrationHandler[]) {
        this._handlers.push(...handlers)
    }

    activate(terminal: Terminal) {
        terminal.parser.registerOscHandler(ShellIntegrationOscPs.VSCode, data => {
			console.log('ShellIntegrationAddon.Osc.VSCode.data', data)
			return this.handleVsCodeSequence(data)
		})
		console.log('ShellIntegrationAddon activated')
    }
    
    dispose() {}

    handleVsCodeSequence(data: string): boolean {
        const argsIndex = data.indexOf(';')
        const sequenceCommand = argsIndex === -1 ? data : data.substring(0, argsIndex);
		// Cast to strict checked index access
		const args: (string | undefined)[] = argsIndex === -1 ? [] : data.substring(argsIndex + 1).split(';')
        switch (sequenceCommand) {
            case VSCodeOscPt.PromptStart:
                this._handlers.forEach(it => it.onPromptStart())
				return true
			case VSCodeOscPt.CommandStart:
				this._handlers.forEach(it => it.onCommandStart())
				return true
			case VSCodeOscPt.CommandExecuted:
				this._handlers.forEach(it => it.onCommandExecuted())
				return true
			case VSCodeOscPt.CommandFinished:
				const exitCode = Number(args[0])
				this._handlers.forEach(it => it.onCommandFinished(exitCode))
				return true
        }

        return true
    }

}