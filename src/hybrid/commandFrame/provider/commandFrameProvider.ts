import { PathLike, readFileSync } from "fs";
import { ICommandFrame } from "../commandFrame";
import { CommandFramePathResolver } from "./commandFramePathResolver";
import { ICommandFrameProviderConfig } from "./commandFrameProviderConfig";
import { config } from "process";

export class CommandFrameProvider {

    private _cache: Record<string, ICommandFrame[]> = {}

    constructor(
        private readonly _config: ICommandFrameProviderConfig,
        private readonly _pathResolver: CommandFramePathResolver
    ) { }

    getCommandFrames(command: string): ICommandFrame[] {
        if (this._config.cache) {
            const cached = this._cache[command]
            if (cached) {
                return cached
            }
        }

        const paths = this._pathResolver.resolve(command)

        const frames: ICommandFrame[] = []
        for (let path of paths) {
            const frame = readHtmlFromFile(path)
            console.log('CommandFrameService#getCommandFrames', 'loaded', path)
            if (!frame) {
                continue
            }
            frames.push({ command, frame })
        }

        if (this._config.cache) {
            this._cache[command] = frames
        }
        return frames
    }
}

function readHtmlFromFile(path: PathLike): HTMLElement | undefined {
    const content = readFileSync(path, 'utf-8')
    const domParser = new DOMParser()
    const html = domParser.parseFromString(content, 'text/html').querySelector('html')
    return html ?? undefined
}