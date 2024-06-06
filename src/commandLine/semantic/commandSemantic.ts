import { IAddOption, IRemoveOption } from "../util/options"

export interface ICommandSemantic {
    command: string
    options: IOptionSemantic[]
}

export interface IOptionSemantic {
    option: string
    whenAdded: {
        remove: IRemoveOption[]
        add: IAddOption[]
    },
    whenRemoved: {
        remove: IRemoveOption[]
        add: IAddOption[]
    }
}