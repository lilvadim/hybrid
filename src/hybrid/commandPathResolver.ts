import { PathLike, fstatSync, readdirSync, stat, statSync } from "fs";

export interface ICommandPathResolveConfig {
    htmlFramesPaths: PathLike[]
}

export interface ICommandPathResolver { 
    config: ICommandPathResolveConfig
    resolve(executable: string): PathLike[]
}

export class CommandPathResolverImpl implements ICommandPathResolver {

    constructor(readonly config: ICommandPathResolveConfig) {}

    resolve(command: string): PathLike[] {
        const paths: PathLike[] = []

        for (let lookupPath of this.config.htmlFramesPaths) {
            const files = readdirSync(lookupPath)
                                .filter(file => !statSync(file).isDirectory()) 
            for (let file of files) {
                const firstNameToken = file.split('#')[0]
                if (firstNameToken === command) {
                    paths.push(file)
                }
            }
        }

        return paths
    }
}