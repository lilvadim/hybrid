export type CommandOptions = (Either | Option)[] | { [category: string]: CommandOptions }

export enum Tag {
    OPTION,
    EITHER
}

export class Either {
    readonly tag: Tag.EITHER
    constructor(readonly options: CommandOptions) { }
}

export function either(options: CommandOptions): Either {
    return new Either(options)
}

export function opt(value: OptionDescriptionType): Option {
    if (typeof value === 'string') {
        return new Option(value)
    }
    if (Array.isArray(value)) {
        if (value.length === 0) {
            throw Error("Empty array passed as options")
        }
        if (value.every(value => typeof value === 'string')) {
            return new Option(value)
        }
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
        return new Option(value.option, value.description, value.values)
    }
}

export class Option implements IOption {
    readonly tag: Tag.OPTION
    constructor(
        readonly option: string | string[],
        readonly description?: string,
        readonly values?: string[],
    ) { }
}

export interface IOption {
    option: string | string[],
    description?: string,
    values?: string[]
}

type OptionDescriptionType = string | string[] | IOption