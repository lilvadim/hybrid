import { ICommandLine } from "../commandLine"
import { serializeCommandLine } from "./serialize"

test('serialize command', () => {
    const command: ICommandLine = {
      env: [
        {
          envVar: 'VAR1',
          value: 'value'
        },
        {
          envVar: 'VAR2',
          value: 'value'
        }
      ],
      command: {
        command: 'git',
        precedingArgs: [],
        options: [
          {
            option: {
              type: 'UNIX',
              option: '-m',
              prefix: '-',
              words: [
                'm'
              ]
            },
            delimiter: undefined,
            value: undefined,
            subsequentArgs: []
          },
          {
            option: {
              type: 'GNU',
              option: '--option'
            },
            delimiter: undefined,
            value: 'val',
            subsequentArgs: []
          },
          {
            option: {
              type: 'GNU',
              option: '--key'
            },
            delimiter: '=',
            value: 'kv',
            subsequentArgs: []
          },
          {
            option: {
              type: 'NON-STD',
              option: '-Dj'
            },
            delimiter: undefined,
            value: undefined,
            subsequentArgs: []
          },
          {
            option: {
              type: 'UNIX',
              option: '-fp',
              prefix: '-',
              words: [
                'f',
                'p'
              ]
            },
            delimiter: ' ',
            value: 'commit',
            subsequentArgs: []
          },
          {
            option: {
              type: 'GNU',
              option: '--option'
            },
            delimiter: ' ',
            value: 'Option $VAR Value String',
            subsequentArgs: []
          },
          {
            option: {
              type: 'UNIX',
              option: '-p',
              prefix: '-',
              words: [
                'p'
              ]
            },
            delimiter: ' ',
            value: 'pValue',
            subsequentArgs: []
          },
          {
            option: {
              type: 'UNIX',
              option: '-m',
              prefix: '-',
              words: [
                'm'
              ]
            },
            delimiter: undefined,
            value: 'Msg',
            subsequentArgs: []
          },
          {
            option: {
              type: 'UNIX',
              option: '-l',
              prefix: '-',
              words: [
                'l'
              ]
            },
            delimiter: undefined,
            value: undefined,
            subsequentArgs: []
          },
          {
            option: {
              type: 'UNIX',
              option: '-a',
              prefix: '-',
              words: [
                'a'
              ]
            },
            delimiter: ' ',
            value: 'value',
            subsequentArgs: [
              'arg1'
            ]
          },
          {
            option: {
              type: 'UNIX',
              option: '-x',
              prefix: '-',
              words: [
                'x'
              ]
            },
            delimiter: '=',
            value: 'value',
            subsequentArgs: []
          },
          {
            option: {
              type: 'NON-STD',
              option: '-Xms'
            },
            delimiter: ' ',
            value: 'arg',
            subsequentArgs: [
              'arg2'
            ]
          }
        ]
      },
      operations: [
        {
          operator: '|',
          command: {
            command: 'cat',
            precedingArgs: [
              'dir'
            ],
            options: []
          }
        },
        {
          operator: '|',
          command: {
            command: 'echo',
            precedingArgs: [],
            options: []
          }
        }
      ],
      redirect: {
        operator: '2>',
        value: 'file'
      }
    }

    const expected = 'VAR1=value VAR2=value git -m --option val --key=kv -Dj -fp commit --option "Option $VAR Value String" -p pValue -m Msg -l -a value arg1 -x=value -Xms arg arg2 | cat dir | echo 2> file'
    const serialized = serializeCommandLine(command)
    console.log(serialized)
    expect(serialized).toEqual(expected)
})