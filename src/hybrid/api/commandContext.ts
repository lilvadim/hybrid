import { ICommandDescriptor } from "../commandDescription/commandDescriptor";


export interface ICommandContext {
    readonly descriptor: ICommandDescriptor;
}
