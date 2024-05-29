import { PathLike } from "fs";
import { join } from "path";
import { EnvironmentUtils } from "../../../util/environment";

export interface ICommandFrameProviderConfig {
    cache: boolean
    htmlFramesPaths: string[]
    builtinFrames: boolean
}


