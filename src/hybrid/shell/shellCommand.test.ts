import { ICommandDescription, IShellCommand, isOption, parseString, tokenize, translateToString } from "./shellCommand"

test('translateToString ls', () => {
    const shellCommand: IShellCommand = {
        executable: {
            executable: 'ls'
        },
        options: [{
            index: 1,
            option: '-l'
        }],
        args: [{
            index: 2,
            value: 'Dir Name'
        }],
        invalidTokens: []
    }

    expect(translateToString(shellCommand)).toEqual('ls -l "Dir Name"')
})

test('translateToString git commit', () => {
    const shellCommand: IShellCommand = {
        executable: {
            executable: 'git',
            subcommand: 'commit'
        },
        options: [{
            index: 2,
            option: '-m',
            value: 'Commit Message',
            spaceSep: true
        }],
        args: [],
        invalidTokens: []
    }

    expect(translateToString(shellCommand)).toEqual('git commit -m "Commit Message"')
})

const lsDesc: ICommandDescription = {
    command: 'ls',
    options: [{
        optionPatterns: [{ pattern: '-l' }],
        hasValue: false
    }],
}

test('parseString ls', () => {
    const commandLine = 'ls -l "Dir Name"'
    const expected: IShellCommand = {
        executable: {
            executable: 'ls',
            subcommand: undefined
        },
        options: [{
            index: 1,
            option: '-l'
        }],
        args: [{
            index: 2,
            value: 'Dir Name'
        }],
        invalidTokens: []
    }

    const actual = parseString(commandLine, lsDesc)

    expect(actual).toEqual(expected)
})

test('parseString ls invalid', () => {
    const commandLine = 'ls -m -l "Dir Name"'
    const expected: IShellCommand = {
        executable: {
            executable: 'ls',
            subcommand: undefined
        },
        options: [{
            index: 2,
            option: '-l'
        }],
        args: [{
            index: 3,
            value: 'Dir Name'
        }],
        invalidTokens: [{
            index: 1,
            value: "-m"
        }]
    }

    const actual = parseString(commandLine, lsDesc)
    
    expect(actual).toEqual(expected)
})

test('translateToString ls invalid', () => {
    const command: IShellCommand = {
        executable: {
            executable: 'ls',
            subcommand: undefined
        },
        options: [{
            index: 2,
            option: '-l'
        }],
        args: [{
            index: 3,
            value: 'Dir Name'
        }],
        invalidTokens: [{
            index: 1,
            value: "-m"
        }]
    }
    const expected = 'ls -l "Dir Name" -m'
    const actual = translateToString(command)

    expect(actual).toEqual(expected)
})

const gitCommitDesc: ICommandDescription = {
    command: 'git',
    subcommand: 'commit',
    options: [{
        optionPatterns: [{ pattern: '-m <arg>' }, { pattern: '--message <arg>' }],
        hasValue: true
    }]
}

test('parseString git commit', () => {
    const testString = 'git commit -m "Commit Message"'
    const expected: IShellCommand = {
        executable: {
            executable: 'git',
            subcommand: 'commit'
        },
        options: [{
            index: 2,
            option: '-m',
            value: 'Commit Message',
            spaceSep: true
        }],
        args: [],
        invalidTokens: []
    }

    const actual = parseString(testString, gitCommitDesc)

    expect(expected).toEqual(actual)
})

test('tokenize', () => {
    const testString = 'ls -l "Dir Name"'
    const expected = ['ls', '-l', 'Dir Name']
    const actual = tokenize(testString)

    expect(actual).toEqual(expected)
})

test('tokenize unclosed quotes', () => {
    const testString = 'ls -l "Dir Name'
    const expected = ['ls', '-l', '"Dir', 'Name']
    const actual = tokenize(testString)

    expect(actual).toEqual(expected)
})

test('tokenize many white spaces', () => {
    const testString = 'ls\t-l      "Dir Name"'
    const expected = ['ls', '-l', 'Dir Name']
    const actual = tokenize(testString)

    expect(actual).toEqual(expected)
})

test('isOption', () => {
    let testString = '--option'
    let actual = isOption(testString)
    expect(actual).toEqual(true)

    testString = '-o'
    actual = isOption(testString)
    expect(actual).toEqual(true)

    testString = 'option'
    actual = isOption(testString)
    expect(actual).toEqual(false)
})