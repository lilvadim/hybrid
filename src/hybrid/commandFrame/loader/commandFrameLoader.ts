import { ICommandFrame } from "../commandFrame";

export class CommandFrameLoader {

    /**
     * load command frame scripts
     */
    load(commandFrame: ICommandFrame) {
        const loadableScripts = Array.from(commandFrame.frame.getElementsByTagName('script'))
        if (!loadableScripts || loadableScripts.length === 0) {
            return
        }
        const script = document.createElement('script')
        script.innerText = ""
        loadableScripts.forEach(it => {
            script.innerText += it.innerText
            it.innerText = ""
        })
        document.head.appendChild(script)
        commandFrame.isLoaded = true
    }
}