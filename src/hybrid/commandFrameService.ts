import { PathLike, readFileSync } from "fs";
import { ICommandFrame } from "./commandFrame";
import { ICommandPathResolver } from "./commandPathResolver";

export class CommandFrameService {

    constructor(private readonly _pathResolver: ICommandPathResolver) { }

    getCommandFrames(command: string): ICommandFrame[] {
        const paths = this._pathResolver.resolve(command)

        const frames: ICommandFrame[] = []
        for (let path of paths) {
            const frame = readHtmlFromFile(path)
            if (!frame) {
                continue
            }
            frames.push({ command, frame })
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