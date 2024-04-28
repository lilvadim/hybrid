import { PathLike, fstatSync, readdirSync, stat, statSync } from "fs";
import { join } from "path";
import { ICommandFrameProviderConfig } from "./commandFrameProviderConfig";

export class CommandFramePathResolver {

    constructor(readonly config: ICommandFrameProviderConfig) {
        console.log('CommandPathResolverImpl#init', { config })
    }

    resolve(command: string): PathLike[] {
        const paths: PathLike[] = []

        for (let lookupPath of this.config.htmlFramesPaths) {
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