import { ICommandFrame } from "../../hybrid/commandFrame";

export interface ICommandFrameCompiler {
    compile(...sources: any): ICommandFrame
}