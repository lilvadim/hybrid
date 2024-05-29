import { PathLike } from "fs";

export function pathLikeToString(path: PathLike): string {
    if (typeof path === 'string') {
        return path;
    } else if (Buffer.isBuffer(path)) {
        return path.toString();
    } else {
        throw new Error('Unsupported PathLike type');
    }
}