import { ICommandDescription, IShellCommand, isOption, shellCommand, tokenize } from "./shellCommand"

test('parse ls', () => {
    const shellCommandLs: IShellCommand = {
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

    expect(shellCommand.commandLine(shellCommandLs)).toEqual('ls -l "Dir Name"')
})

test('toString git commit', () => {
    const shellCommandGit: IShellCommand = {
        executable: {
            executable: 'git',
            subcommand: 'commit'
        },
        options: [{
            index: 2,
            option: '-m',
            value: 'Commit Message',
        }],
        args: [],
        invalidTokens: []
    }

    expect(shellCommand.commandLine(shellCommandGit)).toEqual('git commit -m "Commit Message"')
})

const lsDesc: ICommandDescription = {
    command: 'ls',
    options: [{
        optionPatterns: [{ pattern: '-l' }],
        hasValue: false
    },
    {
        optionPatterns: [{ pattern: '-t' }],
        hasValue: false
    }],
}

test('parse ls 2 options', () => {
    const commandLineLs = 'ls -t -l "Dir Name"'
    const expected: IShellCommand = {
        executable: {
            executable: 'ls',
            subcommand: undefined
        },
        options: [{
            index: 1,
            option: '-t'
        },
        {
            index: 2,
            option: '-l'
        }],
        args: [{
            index: 3,
            value: 'Dir Name'
        }],
        invalidTokens: []
    }

    const actual = shellCommand.parsed(commandLineLs, lsDesc)

    expect(actual).toEqual(expected)
})

test('parse ls invalid', () => {
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

    const actual = shellCommand.parsed(commandLine, lsDesc)

    expect(actual).toEqual(expected)
})

test('parse ls other', () => {
    const commandLine = 'ls -m -l -t'
    const expected: IShellCommand = {
        executable: {
            executable: 'ls',
            subcommand: undefined
        },
        options: [{
            index: 2,
            option: '-l'
        },
        {
            index: 3,
            option: '-t'
        }],
        args: [],
        invalidTokens: [{
            index: 1,
            value: "-m"
        }]
    }

    const actual = shellCommand.parsed(commandLine, lsDesc)

    expect(actual).toEqual(expected)
})

test('toString ls invalid', () => {
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
    const actual = shellCommand.commandLine(command)

    expect(actual).toEqual(expected)
})

test('toString ls not indexed options', () => {
    const command: IShellCommand = {
        executable: {
            executable: 'ls',
            subcommand: undefined
        },
        options: [{
            index: 2,
            option: '-l'
        },
        {
            index: undefined,
            option: '-t'
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

    const expected = 'ls -l -t "Dir Name" -m'
    const actual = shellCommand.commandLine(command)
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

test('parse git commit', () => {
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
        }],
        args: [],
        invalidTokens: []
    }

    const actual = shellCommand.parsed(testString, gitCommitDesc)

    expect(actual).toEqual(expected)
})

test('parse git commit -m without whitespace', () => {
    const testString = 'git commit -m"Commit Message"'
    const expected: IShellCommand = {
        executable: {
            executable: 'git',
            subcommand: 'commit'
        },
        options: [{
            index: 2,
            option: '-m',
            value: 'Commit Message',
        }],
        args: [],
        invalidTokens: []
    }

    const actual = shellCommand.parsed(testString, gitCommitDesc)

    expect(actual).toEqual(expected)
})

test('tokenize', () => {
    const testString = 'ls -l "Dir Name"'
    const expected = ['ls', '-l', 'Dir Name']
    const actual = tokenize(testString)

    expect(actual).toEqual(expected)
})

test('tokenize unclosed quotes', () => {
    const testString = 'ls -l "Dir Name'
    const expected = ['ls', '-l', 'Dir Name']
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