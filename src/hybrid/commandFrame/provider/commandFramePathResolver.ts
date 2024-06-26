import { PathLike, fstatSync, readdirSync, stat, statSync } from "fs";
import { join } from "path";
import { ICommandFrameProviderConfig } from "./commandFrameProviderConfig";
import { BUILTIN_FRAMES_PATH } from "../../../config/paths";

export class CommandFramePathResolver {

    constructor(readonly config: ICommandFrameProviderConfig) {}

    resolve(command: string): PathLike[] {
        const paths: PathLike[] = []

        const lookupPaths = this.config.builtinFrames ? 
            Object.values(this.config.htmlFramesPaths).concat(BUILTIN_FRAMES_PATH)
            : this.config.htmlFramesPaths

        for (let lookupPath of lookupPaths) {
            const files = readdirSync(lookupPath)
                                
            for (let file of files) {
            const referredCommand = getReferredCommand(file)
                if (referredCommand === command) {
                    const filePath = join(lookupPath.toString(), file)
                    paths.push(filePath)
                }
            }
        }

        return paths
    }   
}

export function getReferredCommand(fileName: string): string | undefined {
    const nameWithoutExt = fileName.split('.', 1)[0]
    if (!nameWithoutExt) {
        return undefined
    }
    return nameWithoutExt.split('#', 1)[0]
}