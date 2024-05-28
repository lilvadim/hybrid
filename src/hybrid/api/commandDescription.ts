export interface ICommandDescription {
    command: string
    subcommands: string[]
    options: IOptionDescription[]
}

export interface IOptionDescription {
    optionSynonyms: string[]
    hasValue: boolean
}