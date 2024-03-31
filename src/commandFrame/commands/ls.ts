import { CommandOptions, either, opt } from "../types";

export const ls: CommandOptions = {

    filter: [
        either([
            opt('-a'),
            opt('-A')
        ]),
        opt('-d'),
        opt({ option: '-R', description: 'Recurse into subdirectories' })
    ],
    format: [
        opt('author'),
        opt({ option: '-block-size=%s', values: ['K', 'M', 'G', 'T', 'KB', 'MB', 'GB', 'TB'], description: 'Units to use' }),
        opt('-i'),
        opt('-s'),
        opt('-k'),
        opt('-H'),
        opt('-L'),
        either({
            short: [opt('-C')],
            list: [opt('-m')]
        })
    ],
    sort: [
        opt('-S'),
        opt('-t'),
        opt('-f'),
        opt('-r')
    ],
}