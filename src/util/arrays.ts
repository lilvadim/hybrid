export function distinctBy<T, K extends string | number | symbol>(array: T[], map: (it: T) => K) {
    const record: { [key: string | number | symbol]: T } = {}
    array.forEach(it => record[map(it)] = it)
    return Object.values(record)
}

export function arraysEq(arr: any[], otherArr: any[]): boolean {
    return arr.toString() === otherArr.toString()
}
