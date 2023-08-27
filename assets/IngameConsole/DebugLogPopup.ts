import {_decorator, Button, Component, Label, Node, NodeEventType} from "cc";
import {DebugLogManager} from "db://assets/IngameConsole/DebugLogManager";

const {ccclass, property} = _decorator;

@ccclass()
export class DebugLogPopup extends Component {

    @property(Node)
    private debugLogManager: Node

    @property(Label)
    private newInfoCountText : Label;

    @property(Label)
    private newWarningCountText : Label;

    @property(Label)
    private newErrorCountText : Label;

    private newInfoCount : number = 0;
    private newWarningCount : number = 0;
    private newErrorCount : number = 0;

    private selfBtn : Button;

    protected onLoad() {
        this.selfBtn = this.node.getComponent(Button);
        this.node.on("click",this.OpenLogWindow, this)
    }

    private OpenLogWindow(){
        this.debugLogManager.getComponent(DebugLogManager).ShowLogWindow();
        this.Reset();
    }

    public NewInfoArrived(){
        this.newInfoCount++;
        this.newInfoCountText.string = this.newInfoCount.toString();
    }

    public NewWarningArrived(){
        this.newWarningCount++;
        this.newWarningCountText.string = this.newWarningCount.toString();
    }

    public NewErrorArrived(){
        this.newErrorCount++;
        this.newErrorCountText.string = this.newErrorCount.toString();
    }

    public Reset(){
        this.newErrorCount = 0;
        this.newWarningCount = 0;
        this.newErrorCount = 0;
        this.newInfoCountText.string = "0";
        this.newWarningCountText.string = "0";
        this.newErrorCountText.string = "0";
    }
}
