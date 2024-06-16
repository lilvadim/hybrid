export interface IComplexCommand {
    command: ICommand
    subcommand: ICommand
}

export interface ICommand {
    command: string
    precedingArgs?: string[] | undefined
    options: IOption[]
}

export interface IOption {
    option: {
        type: 'UNIX' | 'GNU' | 'NON-STD'
        option: string
        prefix?: string | undefined
        words?: string[] | undefined
    }
    delimiter?: string | undefined
    value?: string | undefined
    subsequentArgs: string[] | undefined
}