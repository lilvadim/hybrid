import { Cacheable } from "typescript-cacheable";
import { ICommandLine } from "../commandLine";
import { serializeCommandLine } from "./serialize";

export class CommandLineSerializer {

    @Cacheable()
    public static getCached(): CommandLineSerializer {
        return new CommandLineSerializer()
    }

    @Cacheable()
    serializeCommandLine(
        commandLine: ICommandLine
    ): string {
        return serializeCommandLine(commandLine)
    }
}