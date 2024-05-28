import { ICommand } from "./command"

export interface ICommandLine {
    env: IEnvVarAssignment[] | undefined
    command: ICommand
    operations: IOperation[] | undefined
    redirect: IRedirect | undefined
}

export interface IEnvVarAssignment {
    envVar: string
    value: string
}

export interface IOperation {
    operator: string 
    command: ICommand
}

export interface IRedirect {
    operator: string
    value: string
}