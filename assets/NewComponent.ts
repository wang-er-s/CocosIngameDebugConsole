import {_decorator, Component, EventKeyboard, Input, input, KeyCode, math} from 'cc';
import {DebugLogManager, LogType} from "db://assets/IngameConsole/DebugLogManager";
import {Debug} from "db://assets/IngameConsole/Debug";

const { ccclass, property } = _decorator;

@ccclass('NewComponent')
export class NewComponent extends Component {
    protected onLoad() {
    }

    start() {
        input.on(Input.EventType.KEY_DOWN, this.OnKeyDown, this)
    }

    update(deltaTime: number) {
        
    }

    private OnKeyDown(key: EventKeyboard) {
        if (key.keyCode === KeyCode.SPACE) {
            let i = math.randomRangeInt(1, 4);
            if (i === 1) {
                Debug.Log("Info");
            } else if (i === 2) {
                Debug.Warning("Warning");
            } else if (i === 3) {
                Debug.Error("Error");
            }
        }
    }
}


