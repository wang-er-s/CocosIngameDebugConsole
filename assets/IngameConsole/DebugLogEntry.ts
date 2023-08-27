import {Sprite, SpriteFrame} from "cc";

export class DebugLogEntry {
    public logString : string;
    public stackTrace : string;
    public count : number;
    logTypeSprite : SpriteFrame;
    private hashValue : number;

    private static readonly HASH_DEFAULT : number= -623218;

    public Init(logStr : string, trace : string) : void
    {
        this.logString = logStr;
        this.stackTrace = trace;

        this.count = 1;
        this.hashValue = DebugLogEntry.HASH_DEFAULT;
    }

    public get completeLog(){
        return `${this.logString}\n${this.stackTrace}`;
    }

    // 检查是否包含查询的字符串
    public MatchesSearchTerm(search : string) : boolean {
        return (this.logString !== undefined && this.logString.indexOf(search) >= 0) || (this.stackTrace !== undefined && this.stackTrace.indexOf(search) >= 0)
    }

    public GetHashCode() : number
    {
        if(this.hashValue === DebugLogEntry.HASH_DEFAULT)
        {
            this.hashValue = 17;
            this.hashValue = this.hashValue * 23 + (this.logString === undefined ? 0 : this.strHash(this.logString));
            this.hashValue = this.hashValue * 23 + (this.stackTrace === undefined ? 0 : this.strHash(this.stackTrace));
        }
        return this.hashValue;
    }

    private strHash(str : string) {
        let hash : number = 0
        if (str.length === 0) return hash;
        for (let i = 0; i < str.length; i++) {
            let chr = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + chr;
            hash |= 0; // Convert to 32bit integer
        }
        return hash;
    }
}