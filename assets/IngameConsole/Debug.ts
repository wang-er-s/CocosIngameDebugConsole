import {DebugLogManager, LogType} from "db://assets/IngameConsole/DebugLogManager";

export class Debug {

    public static FilterLog : LogType = LogType.None;

    public static Log(...data: any[])
    {
        if(this.FilterLog >= LogType.Info) return;
        console.log(data);
        DebugLogManager.Instance?.ReceivedLog(`${data.join("\t")}`,new Error("Log").stack, LogType.Info);
    }

    public static Warning(...data: any[])
    {
        if(this.FilterLog >= LogType.Warning) return;
        console.warn(data);
        DebugLogManager.Instance?.ReceivedLog(`${data.join("\t")}`,new Error("Warning").stack, LogType.Warning);
    }

    public static Error(...data: any[])
    {
        if(this.FilterLog >= LogType.Error) return;
        console.error(data);
        DebugLogManager.Instance?.ReceivedLog(`${data.join("\t")}`,new Error("Error").stack, LogType.Error);
    }
}