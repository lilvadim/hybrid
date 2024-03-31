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
        return new Option([value])
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
        if (typeof value.option === 'string') {
            value.option = [value.option]
        }
        return new Option(value.option, value.description, value.values)
    }
}

const optionWithArgRegexp = /.*<[^\s<>]*>.*/

const optionFormatRegexp = /(-|--)[^\s<>]+(\s<[^\s<>]*>)*/

export class Option {
    readonly tag: Tag.OPTION
    readonly hasValue: boolean
    constructor(
        readonly optionPatterns: string[],
        readonly description?: string,
        readonly values?: string[],
    ) { 
        const validOptionFormat = this.optionPatterns.every(value => optionFormatRegexp.test(value))
        if (!validOptionFormat) {
            throw new Error(optionPatterns + ': Invalid option format')
        }
        const hasValue = values.length > 0 || this.optionPatterns.every(value => optionWithArgRegexp.test(value)) 
        this.hasValue = hasValue
    }
}

export interface IOption {
    option: string | string[],
    description?: string,
    values?: string[],
}

type OptionDescriptionType = string | string[] | IOption