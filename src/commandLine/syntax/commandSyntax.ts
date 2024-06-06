export interface ICommandSyntax {
    command: string
    subcommands: string[]
    options: IOptionSyntax[]
}

export interface IOptionSyntax {
    optionSynonyms: string[]
    hasValue: boolean
}