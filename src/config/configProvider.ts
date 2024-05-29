import { PathLike, existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { IConfig, IPartialConfig } from "./config";
import { dirname, join } from "path";
import { pathLikeToString } from "../util/path";
import { Cacheable } from "typescript-cacheable";
import { isObject } from "../util/objects";
import { isBlank } from "../util/strings";
import { HYBRID_DIR } from "./paths";
import { ux } from "../log/log";

export class ConfigProvider {

    @Cacheable()
    public static getCached(): ConfigProvider {
        return new ConfigProvider()
    }

    @Cacheable()
    getExternalConfig(path: PathLike = join(HYBRID_DIR, 'hybrid_config.json')): IPartialConfig {
        const pathStr = pathLikeToString(path)
        const dir = dirname(pathStr)
        if (!existsSync(dir)) {
            mkdirSync(dir, { recursive: true })
        }
        if (!existsSync(path)) {
            writeFileSync(path, '')
        }
        const json = readFileSync(path).toString()
        if (!json || isBlank(json)) {
            return {}
        }
        const config = JSON.parse(json)
        return config
    }

    @Cacheable()
    getDefault(): IConfig {
        return {
            terminalControl: {
                syncOnSpace: true,
            },
            commandFrameProvider: {
                htmlFramesPaths: [],
                cache: true,
                builtinFrames: true
            },
            shellLaunchConfig: {
                executable: 'zsh',
                env: {}
            }
        }
    }

    @Cacheable()
    getOverridden(): IConfig {
        const config: IConfig = mergeDefaults(this.getExternalConfig(), this.getDefault())
        console.info('Config:', config)
        ux.info("Config", config)
        return config
    }

}

function mergeDefaults(target: any, defaults: any): any {
    for (const key in defaults) {
        if (defaults.hasOwnProperty(key)) {
            if (typeof defaults[key] === 'object' && defaults[key] !== null && !Array.isArray(defaults[key])) {
                if (!target[key] || typeof target[key] !== 'object') {
                    target[key] = {};
                }
                mergeDefaults(target[key], defaults[key]);
            } else if (target[key] === undefined) {
                target[key] = defaults[key];
            }
        }
    }
    return target;
}
