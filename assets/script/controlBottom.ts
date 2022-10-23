import { _decorator, Component, Node, screen, Vec3 } from "cc";
const { ccclass, property } = _decorator;

@ccclass("controlBottom")
export class controlBottom extends Component {
  @property(Node)
  private controlBottom: Node = null;
  @property(Node)
  private backpack: Node = null;
  @property(Node)
  private workbench: Node = null;
  @property(Node)
  private exit: Node = null;
  private winHeight: number = screen.windowSize.height;
  start() {
    this.init();
    this.addEventHandler();
  }
  init() {
    console.log("Mouse down");
  }
  addEventHandler() {
    this.backpack.on(
      Node.EventType.TOUCH_END,
      (event) => {
        console.log("Mouse down");
      },
      this
    );
  }
  update(deltaTime: number) {}
}
