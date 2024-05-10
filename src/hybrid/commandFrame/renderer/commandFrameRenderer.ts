import { IHybridCommandFrameApi } from "../../../hybrid/api/api";
import { clearChildren } from "../../../util/html";
import { ICommandFrame } from "../commandFrame";

export class CommandFrameRenderer implements IHybridCommandFrameApi {

    constructor(
        readonly container: HTMLElement
    ) {}

    render(frames: ICommandFrame[]): boolean {
        this.renderEmpty()
        for (let commandFrame of frames) {
            this.container.appendChild(commandFrame.frame)
        }
        return true
    }

    renderEmpty(): boolean {
        clearChildren(this.container)
        return true
    }
    
}