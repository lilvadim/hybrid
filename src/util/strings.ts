export const isBlank = (value: string) => /^\s*$/.test(value)
export const isWhitespace = (value: string) => /\s/.test(value)
export const isQuote = (value: string) => /'|"/.test(value)
