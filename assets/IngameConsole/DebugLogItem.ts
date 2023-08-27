import {_decorator, Button, Component, Label, math, Sprite} from "cc";
import {DebugLogEntry} from "db://assets/IngameConsole/DebugLogEntry";
const {ccclass, property} = _decorator;

@ccclass()
export class DebugLogItem extends Component {
    @property(Label)
    private logText: Label;
    @property(Sprite)
    private logTypeImg: Sprite;
    @property(Label)
    private logCountText: Label;
    @property(Button)
    private copyBtn: Button;
    @property(Sprite)
    private bg : Sprite;

    private logEntry: DebugLogEntry;
    private isExpanded : boolean;
    entryIndex: number;

    protected onLoad() {
        this.node.on("click",this.OnClick, this)
        this.copyBtn.node.on("click", this.OnCopy, this)
    }

    public SetContent(logEntry: DebugLogEntry, entryIndex: number) {
        this.logEntry = logEntry;
        this.entryIndex = entryIndex;
        this.isExpanded = false;

        this.logText.string = logEntry.logString;
        this.copyBtn.node.active = false;
        this.logTypeImg.spriteFrame = logEntry.logTypeSprite;
        if(this.node.getSiblingIndex() % 2 === 0){
            this.bg.color = math.color("5e5e5e5e");
        }else{
            this.bg.color = math.color("8A8A8A5E");
        }
    }


    public ShowCount(){
        this.logCountText.string = this.logEntry.count.toString();
        this.logCountText.node.parent.active = true;
    }

    public HideCount() {
        this.logCountText.node.parent.active = false;
    }

    private OnClick(){
        this.isExpanded = !this.isExpanded;
        if (this.isExpanded) {
            this.logText.string = this.logEntry.completeLog;
            this.copyBtn.node.active = true;
        } else {
            this.logText.string = this.logEntry.logString;
            this.copyBtn.node.active = false;
        }
    }
    
    private OnCopy(){
        navigator.clipboard.writeText(this.logText.string);
    }
}