import { _decorator, Component, Label, Sprite } from "cc";
const { ccclass, property } = _decorator;
import colors from "./colors.js";
@ccclass("block")
export class block extends Component {
  @property(Sprite)
  private bg: Sprite = null;
  @property(Label)
  private numLabel: Label = null;
  start() {}

  public setNumber(num: number) {
    if (num == 0) {
      this.numLabel.node.active = false;
    }
    this.numLabel.string = String(num);
    this.bg.color = colors[num];
  }

  update(deltaTime: number) {}
}
