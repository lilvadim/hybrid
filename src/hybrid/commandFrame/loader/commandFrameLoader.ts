import { ICommandFrame } from "../commandFrame";

export class CommandFrameLoader {

    load(commandFrame: ICommandFrame) {
        const loadableScript = commandFrame.frame.getElementsByTagName('script')[0]
        if (!loadableScript) {
            return
        }
        const script = document.createElement('script')
        script.innerText = loadableScript.innerText
        document.head.appendChild(script)
        commandFrame.isLoaded = true
    }
}