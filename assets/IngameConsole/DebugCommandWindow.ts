import {_decorator, Button, Component, instantiate, Label, Node} from "cc";
import {CommandType, DebugCommandData, DebugCommandItem} from "db://assets/IngameConsole/DebugCommandItem";
const {ccclass, property} = _decorator;

@ccclass()
export class DebugCommandWindow extends Component{
    @property(DebugCommandItem)
    private commandItemTemplate : DebugCommandItem;
    @property(Node)
    private commandItemContent : Node;
    @property(Button)
    private commandMenuItemTemplate : Button;
    @property(Node)
    private commandMenuItemContent : Node;
    private menu2Commands : Map<string, DebugCommandData[]>;

    public ShowWindow(menu2commands : Map<string, DebugCommandData[]>) {
        this.menu2Commands = menu2commands;
        this.commandMenuItemContent.destroyAllChildren();
        let firstMenu: string = null;
        for (const commands of menu2commands) {
            let menuItem = instantiate(this.commandMenuItemTemplate.node);
            this.commandMenuItemContent.addChild(menuItem);
            let menu = commands[0];
            if (firstMenu === null)
                firstMenu = menu;
            menuItem.getComponentInChildren(Label).string = menu;
            menuItem.on("click", () => this.OnMenuClick(menu), this);
        }
        if (firstMenu !== null)
            this.OnMenuClick(firstMenu);
    }

    private OnMenuClick(menu: string)
    {
        this.commandItemContent.destroyAllChildren();
        let cmds = this.menu2Commands.get(menu);
        if(cmds === undefined) return;
        for (const command of cmds) {
            let item = instantiate(this.commandItemTemplate.node).getComponent(DebugCommandItem);
            item.SetData(command);
            this.commandItemContent.addChild(item.node);
        }
    }
}