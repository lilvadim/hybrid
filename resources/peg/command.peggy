command_line 
    = _ 
      env:(env:(envVar:env_var_name '=' value:value { return { envVar, value } }) ws { return env })*
      command:simple_command
      op_c:(_ op:command_op _ op_c:simple_command !redirect_op { return { operator: op, command: op_c } })*
      redir_c:(_ op:redirect_op _ op_v:value { return { operator: op, value: op_v } })?
      _
      { return { env, command, operations: op_c, redirect: redir_c ?? undefined } }
      
complex_command 
    = command:top_level_command 
      rest:(ws subcommand:simple_command { return subcommand })?
      { return { command, subcommand: rest } } 
      
top_level_command 
    = command:command_name 
      rest:(ws options:option_key_value { return options })* 
      { return { command, options: rest } }
      
simple_command 
    = command:command_name 
      commandArgs:(ws arg:value { return arg })*
      options:(ws options:option_with_value args:(ws arg:value { return arg })* { return { option: options.option, delimiter: options.delimiter, value: options.value, subsequentArgs: args }})* 
      { return { command, precedingArgs: commandArgs, options } } 
      
env_var_name = [a-zA-Z_][a-zA-Z0-9_]* { return text() }
command_name = [a-zA-Z_][a-zA-Z0-9_.\-]* { return text() }

option_key_value 
    = option:option 
      value:(delimiter:delimiter? value:value { return { delimiter: delimiter ?? undefined, value: value ?? undefined } })? 
      { return { option, delimiter: value?.delimiter, value: value?.value } }
option_with_value 
    = option:option 
      value:(delimiter:(delimiter / ws)? value:value { return { delimiter: delimiter ?? undefined, value: value ?? undefined }})?
      { return { option, delimiter: value?.delimiter, value: value?.value }}
option = gnu_option / unix_option / non_std_option 

unix_option = prefix:"-" words:[a-zA-Z]+ { return { type: 'UNIX', option: text(), prefix, words } }
gnu_option = "--"[a-z][a-zA-Z\-]* { return { type: 'GNU', option: text() } }
non_std_option = "-"[a-zA-Z,=\-]* { return { type: 'NON-STD', option: text() } }

value = quoted_argument / unquoted_argument

delimiter = "=" / ":" { return text() }
ws = [ \t\n\r]+ { return ' ' }
_ = [ \t\n\r]* { return ' ' }

unquoted_argument = !op !"-" chars:char+ { return text() }

char = [a-zA-Z0-9-_./$\\*?&%=+@!#]
  
quoted_argument 
    = '"' chars:double_quoted_char* '"' { return chars.join('') }
      / "'" chars:single_quoted_char* "'" { return chars.join('') }

double_quoted_char = variable / escaped_char / [^"\\]

single_quoted_char = escaped_char / [^']

variable = "$" var_name:(env_var_name) { return text() }

command_op = semicolon_op / and_op / or_op / pipe_op / async_op
op = command_op / redirect_op

semicolon_op = ";" { return text() }
async_op = !redirect_op "&" { return text() }
and_op = !redirect_op "&&" { return text() }
or_op = !pipe_op "||" { return text() }

pipe_op
  = "|&" { return text() }
  / "|" { return text() }
  
redirect_op
  = [0-9]* ">" "&" [0-9]+ { return text() }
  / [0-9]* ">&" [0-9]+ { return text() }
  / [0-9]* ">" ">" { return text() }
  / [0-9]* ">" { return text() }
  / [0-9]* "<" { return text() }
  / [0-9]* ">>" { return text() }
  / "&>" { return text() }
  / "&>>" { return text() }
  / "<<<" { return text() }

escaped_char = "\\" char:. { return char }