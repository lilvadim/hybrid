import { ICommandSyntax } from "../../commandLine/syntax/commandSyntax";
import { ICommandSemantic } from "../../commandLine/semantic/commandSemantic";
import { ICommandInfo } from "./commandInfo";
import { Cacheable } from "typescript-cacheable";

export class CommandInfoRegistry {

    @Cacheable()
    public static getCached(): CommandInfoRegistry {
        return new CommandInfoRegistry()
    }

    private _map: Record<string, ICommandInfo> = {}

    addSemantic(semantic: ICommandSemantic) {
        const command = semantic.command
        const inMap = this._map[command]
        const info = inMap || {}
        info.semantic = semantic
        this._map[command] = info
    }

    addSyntax(syntax: ICommandSyntax) {
        const command = syntax.command
        const inMap = this._map[command]
        const info = inMap || {}
        info.syntax = syntax
        this._map[command] = info
    }

    addInfo(info: ICommandInfo) {
        if (info.command !== info.semantic?.command || info.command !== info.syntax?.command) {
            throw new Error("Different command name: " + info)
        }
        this._map[info.command] = info
    }

    getInfo(command: string): ICommandInfo | undefined {
        return this._map[command]
    }
}