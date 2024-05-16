
export interface ICommandDescription {
    command: string;
    subcommand?: string;
    options: ICommandOptionDescription[];
}

export interface ICommandOptionDescription {
    optionPatterns: IOptionPattern[];
    hasValue: boolean;
}

export interface IOptionPattern {
    pattern: string;
}
