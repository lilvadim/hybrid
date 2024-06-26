import { clearChildren } from "../../../util/html";
import { ICommandFrame } from "../commandFrame";

export class CommandFrameRenderer {

    constructor(
        readonly container: HTMLElement
    ) {}

    render(frames: ICommandFrame[]): boolean {
        this.renderEmpty()
        frames.forEach(it => this.container.appendChild(it.frame))
        return true
    }

    renderEmpty(): boolean {
        clearChildren(this.container)
        return true
    }
    
}