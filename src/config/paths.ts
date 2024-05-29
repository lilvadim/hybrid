import { join } from "path";
import { EnvironmentUtils } from "../util/environment";
import { homedir } from "os";


export const HYBRID_DIR = join(homedir(), '.hybrid')
export const BUILTIN_FRAMES_PATH = join(EnvironmentUtils.resourcePath, 'resources', 'cf')
