import {_decorator, Button, Component, EditBox, Label, math, Sprite} from "cc";
const {ccclass, property} = _decorator;

export type CommandType = (...data : any[])=> void;

export class DebugCommandData
{
    name : string;
    cmd : CommandType;
    desc : string;

    constructor(name: string, cmd: CommandType, desc: string) {
        this.name = name;
        this.cmd = cmd;
        this.desc = desc;
    }
}

@ccclass()
export class DebugCommandItem extends Component{
    @property(Button)
    private executeBtn : Button;
    @property(EditBox)
    private parmInput : EditBox;
    @property(Label)
    private descTxt : Label;
    @property(Sprite)
    private bg : Sprite;

    private cmd : CommandType;

    protected onLoad() {
        this.executeBtn.node.on("click",this.OnClick, this)
    }

    public SetData(data : DebugCommandData) {
        this.cmd = data.cmd;
        this.executeBtn.getComponentInChildren(Label).string = data.name;
        this.descTxt.string = data.desc;
        if(this.node.getSiblingIndex() % 2 === 0){
            this.bg.color = math.color("5e5e5e5e");
        }else{
            this.bg.color = math.color("8A8A8A5E");
        }
    }

    private OnClick(){
        if(this.parmInput.string.length === 0){
            this.cmd()
        }else{
            let param = this.parmInput.string.split(" ");
            this.cmd(param);
        }
    }
}