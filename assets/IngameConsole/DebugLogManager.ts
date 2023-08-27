import {
    _decorator,
    Button,
    Component,
    EditBox,
    instantiate,
    Label, math,
    Node, ScrollView,
    Sprite,
    SpriteFrame
} from "cc";
import {DebugLogPopup} from "db://assets/IngameConsole/DebugLogPopup";
import {DebugLogEntry} from "db://assets/IngameConsole/DebugLogEntry";
import {DebugLogItem} from "db://assets/IngameConsole/DebugLogItem";
import {CommandType, DebugCommandData, DebugCommandItem} from "db://assets/IngameConsole/DebugCommandItem";
import {Debug} from "db://assets/IngameConsole/Debug";
import {DebugCommandWindow} from "db://assets/IngameConsole/DebugCommandWindow";

const {ccclass, property} = _decorator;

export enum LogType {
    None,
    Info = 1 << 1,
    Warning = 1 << 2,
    Error = 1 << 3,
    All = Info | Warning | Error,
}

@ccclass("DebugLogManager")
export class DebugLogManager extends Component {

    public static Instance: DebugLogManager;

    @property(EditBox)
    private searchBar: EditBox;
    @property(Node)
    private logWindow: Node;
    @property(DebugLogPopup)
    private popupManager: DebugLogPopup;
    @property(Button)
    private showCommandBtn: Button;
    @property(Button)
    private closeLogBtn: Button;
    @property(Button)
    private infoBtn: Button;
    @property(Label)
    private infoEntryCountText: Label;
    @property(Button)
    private warningBtn: Button;
    @property(Label)
    private warningEntryCountText: Label;
    @property(Button)
    private errorBtn: Button;
    @property(Label)
    private errorEntryCountText: Label;
    @property(Button)
    private clearBtn: Button;
    @property(Button)
    private collapseBtn: Button;

    @property(SpriteFrame)
    private infoLogSprite: SpriteFrame;
    @property(SpriteFrame)
    private warningLogSprite: SpriteFrame;
    @property(SpriteFrame)
    private errorLogSprite: SpriteFrame;
    @property(Node)
    private logItemTemplate : Node;
    @property(Node)
    private logItemPoolContent : Node;
    @property(Node)
    private logItemContent : Node;
    @property(ScrollView)
    private logScroll : ScrollView;
    @property(Label)
    private fpsTxt : Label;

    @property(DebugCommandWindow)
    private commandWindow : DebugCommandWindow;

    private static readonly maxLogLength: number = 5000;

    private logEntries: DebugLogEntry[] = [];
    private allLogIndex: number[] = [];
    private showLogIndex: number[] = [];
    private pooledLogEntries: DebugLogEntry[] = [];
    private logType2Sprite: Map<LogType, Sprite> = new Map<LogType, Sprite>();

    private isLogWindowShow: boolean = false;
    private infoEntryCount: number = 0;
    private warningEntryCount: number = 0;
    private errorEntryCount: number = 0;
    private searchStr : string = "";

    // 是否折叠
    private isCollapseOn: boolean = false;
    private isInSearchMode: boolean = false;
    private logFilter: LogType = LogType.None;

    private needProcessEntryIndex : number[] = [];

    private fpsTimer : number = 0;
    private frames : number = 0;

    private isCommandDirty : boolean = false;
    private menu2commands : Map<string, DebugCommandData[]> = new Map<string, DebugCommandData[]>();

    protected onLoad() {
        DebugLogManager.Instance = this;
        this.logType2Sprite[LogType.Info] = this.infoLogSprite;
        this.logType2Sprite[LogType.Warning] = this.warningLogSprite;
        this.logType2Sprite[LogType.Error] = this.errorLogSprite;
        this.searchBar.node.on("editing-did-ended",this.OnSearchStrChanged,this)
        this.infoBtn.node.on("click", this.FilterLogButtonPressed,this)
        this.warningBtn.node.on("click", this.FilterWarningButtonPressed,this)
        this.errorBtn.node.on("click", this.FilterErrorButtonPressed,this)
        this.collapseBtn.node.on("click", this.CollapseButtonPressed,this)
        this.clearBtn.node.on("click", this.ClearLogs,this)
        this.closeLogBtn.node.on("click", this.ShowLogPopup,this)
        this.showCommandBtn.node.on("click", this.CommandBtnClick, this)

        this.AddCommand("菜单/测试","(str,number)",(any)=>{
            this.log(any[0], any[1])
        })
    }

    private log(name : string, age : number)
    {
        Debug.Log(name, ++age)
    }

    private OnSearchStrChanged() {
        this.searchStr = this.searchBar.string.trim();
        let isInSearchMode = this.searchStr.length > 0;
        if(isInSearchMode || this.isInSearchMode)
        {
            this.isInSearchMode = isInSearchMode;
            this.FilterLogs();
        }
    }

    public ShowLogWindow() {
        this.isLogWindowShow = true;
        this.logWindow.active = true;
        this.popupManager.node.active = false;
        this.FilterLogs();
    }

    private CommandBtnClick() {
        let isCmdWindowShow = this.commandWindow.node.active;
        this.commandWindow.node.active = !isCmdWindowShow;
        if(!isCmdWindowShow)
            this.commandWindow.ShowWindow(this.menu2commands);
    }

    public ShowLogPopup(){
        this.isLogWindowShow = false;
        this.logWindow.active = false;
        this.popupManager.node.active = true;
    }

    public AddCommand(name: string,desc : string, action : CommandType)
    {
        for (const commands of this.menu2commands.values()) {
            for (const command of commands) {
                if(command.name === name)
                {
                    Debug.Warning(`添加了相同的命令${name}`);
                    return;
                }
            }
        }
        this.isCommandDirty = true;
        let menuIndex = name.indexOf("/");
        let menu : string = ""
        if(menuIndex <= 0)
        {
            menu = "Default";
        }else {
            menu = name.substring(0, menuIndex);
            name = name.substring(menuIndex);
        }
        let cmds =  this.menu2commands.get(menu);
        if(cmds === undefined)
        {
            cmds = [];
            this.menu2commands.set(menu, cmds);
        }
        cmds.push(new DebugCommandData(name, action, desc));
    }

    public RemoveCommand(name : string)
    {
        let menuIndex = name.indexOf("/");
        let menu : string = ""
        if(menuIndex <= 0)
        {
            menu = "Default";
        }else {
            menu = name.substring(0, menuIndex);
        }
        let cmds =  this.menu2commands.get(menu);
        if(cmds === undefined)
        {
            Debug.Error(`尝试移除不存在的命令${name}`)
            return;
        }
        for (let i = 0; i < cmds.length; i++) {
            if(cmds[i].name === name)
            {
                cmds.splice(i,1);
                return;
            }
        }
        Debug.Error(`尝试移除不存在的命令${name}`)
    }

    public ReceivedLog(logStr: string, trace: string, logType: LogType) {
        let logLength = logStr.length;
        // 限制一下显示的长度，不然会有bug
        if (trace === null) {
            if (logLength > DebugLogManager.maxLogLength) {
                logStr = logStr.slice(0, DebugLogManager.maxLogLength - 10);
            }
        } else {
            logLength += trace.length;
            if (logLength > DebugLogManager.maxLogLength) {
                let halfMaxLogLength = DebugLogManager.maxLogLength / 2;
                if (logStr.length >= halfMaxLogLength) {
                    if (trace.length >= halfMaxLogLength) {
                        logStr = logStr.slice(0, halfMaxLogLength - 10);
                        trace = trace.slice(0, halfMaxLogLength - 10);
                    } else {

                        logStr = logStr.slice(0, halfMaxLogLength - 10);
                    }
                } else {
                    trace = trace.slice(0, halfMaxLogLength - 10);
                }
            }
        }

        let logEntry: DebugLogEntry;
        if (this.pooledLogEntries.length > 0) {
            logEntry = this.pooledLogEntries.pop();
        } else {
            logEntry = new DebugLogEntry();
        }

        logEntry.Init(logStr, trace);
        // 找是否有相同的entry
        let entryIndex = -1;
        for (let i = 0; i < this.logEntries.length; i++) {
            if (this.logEntries[i].GetHashCode() === logEntry.GetHashCode()) {
                entryIndex = i;
                break
            }
        }
        if (entryIndex !== -1) {
            this.pooledLogEntries.push(logEntry);
            logEntry = this.logEntries[entryIndex];
            logEntry.count++;
        } else {
            entryIndex = this.logEntries.length;
            this.logEntries.push(logEntry);
            logEntry.logTypeSprite = this.logType2Sprite[logType];
        }
        this.allLogIndex.push(entryIndex);
        this.needProcessEntryIndex.push(entryIndex);

        if (logType === LogType.Info) {
            this.infoEntryCount++;
            this.infoEntryCountText.string = this.infoEntryCount.toString();
            if (!this.isLogWindowShow)
                this.popupManager.NewInfoArrived();
        } else if (logType === LogType.Warning) {
            this.warningEntryCount++;
            this.warningEntryCountText.string = this.warningEntryCount.toString();
            if (!this.isLogWindowShow)
                this.popupManager.NewWarningArrived();
        } else if (logType === LogType.Error) {
            this.errorEntryCount++;
            this.errorEntryCountText.string = this.errorEntryCount.toString();
            if (!this.isLogWindowShow)
                this.popupManager.NewErrorArrived();
        }
    }

    protected update(dt: number) {
        this.frames ++;
        this.fpsTimer += dt;
        if(this.fpsTimer >= 0.5)
        {
            let fps = this.frames / this.fpsTimer;
            this.frames = 0;
            this.fpsTimer = 0;
            this.fpsTxt.string = `fps:${fps.toFixed(1)}`;
        }
    }

    protected lateUpdate(dt: number) {
        if(this.needProcessEntryIndex.length <= 0) return;
        if(!this.isLogWindowShow){
            this.needProcessEntryIndex.length = 0;
            return;
        }
        while (this.needProcessEntryIndex.length > 0) {
            let entryIndex = this.needProcessEntryIndex.pop();
            // 如果是折叠状态并且展示的已经有了
            if (this.isCollapseOn && this.showLogIndex.indexOf(entryIndex) >= 0) {
                for (let item of this.logItemContent.getComponentsInChildren(DebugLogItem)) {
                    if (item.entryIndex === entryIndex) {
                        item.ShowCount();
                        break
                    }
                }
            } else {
                this.showLogIndex.push(entryIndex);
                this.AddLogItemToWindow(entryIndex);
            }
        }
    }

    private CollapseButtonPressed() {
        this.isCollapseOn = !this.isCollapseOn;
        this.PressButton(this.collapseBtn, this.isCollapseOn)
        this.FilterLogs();
    }

    private FilterLogButtonPressed() {
        this.logFilter = this.logFilter ^ LogType.Info
        this.PressButton(this.infoBtn, this.HasFlag(this.logFilter, LogType.Info))
        this.FilterLogs();
    }

    private FilterWarningButtonPressed() {
        this.logFilter = this.logFilter ^ LogType.Warning
        this.PressButton(this.warningBtn, this.HasFlag(this.logFilter, LogType.Warning))
        this.FilterLogs();
    }

    private FilterErrorButtonPressed() {
        this.logFilter = this.logFilter ^ LogType.Error
        this.PressButton(this.errorBtn, this.HasFlag(this.logFilter, LogType.Error))
        this.FilterLogs();
    }

    private FilterLogs() {
        this.showLogIndex.length = 0;

        if (this.logFilter === LogType.All || this.logFilter === LogType.None) {
            //如果在折叠状态
            if (this.isCollapseOn) {
                if (!this.isInSearchMode) {
                    for (let i = 0; i < this.logEntries.length; i++) {
                        this.showLogIndex.push(i);
                    }
                } else {
                    for (let i = 0; i < this.logEntries.length; i++) {
                        if (this.logEntries[i].MatchesSearchTerm(this.searchStr))
                            this.showLogIndex.push(i);
                    }
                }
            }
            //如果没在折叠状态
            else {
                if (!this.isInSearchMode) {
                    for (let i = 0; i < this.allLogIndex.length; i++) {
                        this.showLogIndex.push(this.allLogIndex[i]);
                    }
                } else {
                    for (let i = 0; i < this.allLogIndex.length; i++) {
                        if (this.logEntries[this.allLogIndex[i]].MatchesSearchTerm(this.searchStr))
                            this.showLogIndex.push(this.allLogIndex[i]);
                    }
                }
            }
        } else {
            let isInfoEnable = this.HasFlag(this.logFilter, LogType.Info);
            let isWarningEnable = this.HasFlag(this.logFilter, LogType.Warning);
            let isErrorEnable = this.HasFlag(this.logFilter, LogType.Error);
            if (this.isCollapseOn) {
                for (let i = 0; i < this.logEntries.length; i++) {
                    let entry = this.logEntries[i];
                    if (this.isInSearchMode && !entry.MatchesSearchTerm(this.searchStr))
                        continue;
                    if (entry.logTypeSprite === this.infoLogSprite && isInfoEnable) {
                        this.showLogIndex.push(i);
                    } else if (entry.logTypeSprite === this.warningLogSprite && isWarningEnable) {
                        this.showLogIndex.push(i);
                    } else if (entry.logTypeSprite === this.errorLogSprite && isErrorEnable) {
                        this.showLogIndex.push(i);
                    }
                }
            } else {
                for (let i = 0; i < this.allLogIndex.length; i++) {
                    let entry = this.logEntries[this.allLogIndex[i]];
                    if (this.isInSearchMode && !entry.MatchesSearchTerm(this.searchStr))
                        continue;
                    if (entry.logTypeSprite === this.infoLogSprite && isInfoEnable) {
                        this.showLogIndex.push(this.allLogIndex[i]);
                    } else if (entry.logTypeSprite === this.warningLogSprite && isWarningEnable) {
                        this.showLogIndex.push(this.allLogIndex[i]);
                    } else if (entry.logTypeSprite === this.errorLogSprite && isErrorEnable) {
                        this.showLogIndex.push(this.allLogIndex[i]);
                    }
                }
            }
        }

        // 根据 showLogIndex来显示ui
        this.RefreshWindow();
    }

    private logItemPool : Node[] = [];

    private RefreshWindow() {
        if (!this.isLogWindowShow) return;
        for (let componentsInChild of this.logItemContent.getComponentsInChildren(DebugLogItem)) {
            let child = componentsInChild.node;
            this.logItemPoolContent.addChild(child);
            this.logItemPool.push(child);
        }
        for (const showLogIndex of this.showLogIndex) {
            this.AddLogItemToWindow(showLogIndex);
        }
    }

    private AddLogItemToWindow(entryIndex : number)
    {
        let entry = this.logEntries[entryIndex];
        let logItem : DebugLogItem = null;
        if(this.logItemPool.length > 0)
        {
            logItem = this.logItemPool.pop().getComponent(DebugLogItem);
        }else{
            logItem = (instantiate(this.logItemTemplate)).getComponent(DebugLogItem);
        }
        this.logItemContent.addChild(logItem.node);
        logItem.SetContent(entry, entryIndex);
        logItem.node.active = true;
        logItem.node.name = entryIndex.toString()
        if(this.isCollapseOn)
        {
            logItem.ShowCount();
        }else{
            logItem.HideCount();
        }
        logItem.node.setSiblingIndex(this.logItemContent.children.length);
        this.logScroll.scrollToBottom();
    }

    private ClearLogs() {
        this.infoEntryCount = 0;
        this.warningEntryCount = 0;
        this.errorEntryCount = 0;

        this.infoEntryCountText.string = "0";
        this.warningEntryCountText.string = "0";
        this.errorEntryCountText.string = "0";
        this.showLogIndex.length = 0;

        this.allLogIndex.length = 0;
        for (const logEntry of this.logEntries) {
            if (this.pooledLogEntries.length < 100) {
                this.pooledLogEntries.push(logEntry)
            }
        }
        this.logEntries.length = 0;
        for (let componentsInChild of this.logItemContent.getComponentsInChildren(DebugLogItem)) {
            let child = componentsInChild.node;
            this.logItemPoolContent.addChild(child);
            this.logItemPool.push(child);
        }
    }

    private HasFlag(value: number, flag: number): boolean {
        return (value & flag) !== 0;
    }

    private PressButton(btn:Button, isPressed : boolean)
    {
        if(isPressed)
        {
            btn.getComponent(Sprite).color = math.Color.GREEN;
        }else{
            btn.getComponent(Sprite).color = math.color("5E5E5E");
        }
    }
}