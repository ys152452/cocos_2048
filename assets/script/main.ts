import {
  _decorator,
  Component,
  tween,
  log,
  input,
  Input,
  EventTouch,
  math,
  Canvas,
  view,
  Prefab,
  Node,
  Label,
  instantiate,
  randomRangeInt,
  Graphics,
  Vec3,
} from "cc";
const { Vec2 } = math;
const { ccclass, property } = _decorator;
const ROWS = 4;
const NUMBERS = [2, 4];
const MIN_LENGTH = 50;
const MOVE_DURATION = 0.1;
@ccclass("TouchEvent")
export class TouchEvent extends Component {
  // 鼠标事件的开始和结束坐标
  private startPoint: any = null;
  private endPoint: any = null;
  // private score: number = 0;
  private moving: boolean = false;
  // 维护一个坐标拼接字符串，对于已经合并过的格子禁止再次合并，处理2+2+4=8的情况
  private lastMerge: string = "";
  private gap: number = 16;
  private data: number[][] = [];
  @property(Prefab)
  private blockPrefab: Prefab = null;
  @property(Node)
  private bdBoard: Node = null;
  // @property(Label)
  // private scoreLabel: Label = null;
  private blockLabel: Label = null;
  // 每个格子的节点元素
  private blocks: any[][] = [];
  // 每个格子的值
  private datas: any[][] = [];
  // 每个格子的位置
  private positions: any[][] = [];
  
  start() {
    this.drawBgBlocks();
    this.init();
    this.addEventHandler();
  }
  // 绘制格子
  drawBgBlocks() {
    for (let i = 0; i < 4; i++) {
      this.positions[i] = [];
      for (let j = 0; j < 4; j++) {
        let x = this.gap * (i + 1) + 140 * i + 70;
        let y = this.gap * (j + 1) + 140 * j + 70;
        let block = instantiate(this.blockPrefab);
        this.bdBoard.addChild(block);
        block.setPosition(x, y);
        this.positions[i][j] = new Vec2(x, y);
        block.getComponent("block").setNumber(0);
      }
    }
  }
  // 重置
  init() {
    // this.uptScore(0);
    if (this.blocks && this.blocks.length) {
      this.blocks.forEach((_blocks, i) => {
        if (_blocks && _blocks.length) {
          _blocks.forEach((block, j) => {
            if (block) {
              this.blocks[i][j].destroy();
            }
          });
        }
      });
    }
    this.datas = [];
    this.blocks = [];
    this.lastMerge = '';
    this.moving = false;
    for (let i = 0; i < 4; i++) {
      this.blocks.push([null, null, null, null]);
      this.datas.push([0, 0, 0, 0]);
    }
    this.addBlock();
    this.addBlock();
    this.addBlock();
  }
  // uptScore(score: number) {
  //   this.score = score;
  //   this.scoreLabel.string = String(score);
  // }
  // 获取空格子
  getEmptyBlocks() {
    const emptys: object[] = [];
    this.blocks.forEach((_blocks, i) => {
      _blocks.forEach((block, j) => {
        if (block === null) {
          emptys.push({ x: i, y: j });
        }
      });
    });
    return emptys;
  }
  // 生成一个格子
  addBlock() {
    const emptys: any[] = this.getEmptyBlocks();
    if (!emptys || !emptys.length) return;
    const pos = randomRangeInt(0, emptys.length);
    const { x, y } = emptys[pos];
    let posistion = this.positions[x][y];
    let block = instantiate(this.blockPrefab);
    this.bdBoard.addChild(block);
    block.setPosition(posistion.x, posistion.y);
    const number: number = NUMBERS[randomRangeInt(0, 2)];
    block.getComponent("block").setNumber(number);
    this.blocks[x][y] = block;
    this.datas[x][y] = number;
  }
// 注册事件
  addEventHandler() {
    input.on(
      Input.EventType.TOUCH_START,
      (event) => {
        this.startPoint = event.getLocation();
      },
      this
    );
    input.on(
      Input.EventType.TOUCH_END,
      (event) => {
        this.endPoint = event.getLocation();
        let vec = this.endPoint.subtract(this.startPoint);
        let distance = Vec2.distance(this.endPoint, this.startPoint);
        if (distance > MIN_LENGTH && !this.moving) {
          this.moving = true;
          const toMove = [];
          this.datas.forEach((_datas, i) => {
            if (_datas && _datas.length) {
              _datas.forEach((data, j) => {
                if (data) {
                  toMove.push({ x: i, y: j, key: `${i}_${j}` });
                }
              });
            }
          });
          if (Math.abs(vec.x) > Math.abs(vec.y)) {
            //x
            if (vec.x > 0) {
              toMove.sort((a: any, b: any) => {
                if (a.y == b.y) {
                  return b.x - a.x;
                } else {
                  return b.y - a.y;
                }
              });
              this.moveRight(toMove);
            } else {
              toMove.sort((a: any, b: any) => {
                if (a.y == b.y) {
                  return a.x - b.x;
                } else {
                  return b.y - a.y;
                }
              });
              this.moveLeft(toMove);
            }
          } else {
            //y
            if (vec.y > 0) {
              toMove.sort((a: any, b: any) => {
                if (a.x == b.x) {
                  return b.y - a.y;
                } else {
                  return a.x - b.x;
                }
              });
              console.log(toMove)
              this.moveUp(toMove);
            } else {
              toMove.sort((a: any, b: any) => {
                if (a.x == b.x) {
                  return a.y - b.y;
                } else {
                  return b.x - a.x;
                }
              });
              console.log(toMove)
              this.moveDown(toMove);
            }
          }
        }
      },
      this
    );
  }
  // 格子的移动
  doMove(block, pos, cb) {
    tween(block)
      .to(0.08, {
        position: new Vec3(pos.x, pos.y, 0),
      }, {
        onComplete: (target?: object) => {                  // 回调，当缓动动作更新时触发。
          cb && cb();
        },
      })
      .start();
  }

  moveLeft(toMove) {
    let hasMoved = false;
    let hasScore = false;
    // 次数标记，与需要移动的格子总数对比
    let counter: number = 0;
    const move = (x, y, cb) => {
      const curData = this.datas[x][y];
      const nextData = x == 0 ? 0 : this.datas[x - 1][y];
      if (x == 0 || curData == 0) {
        cb && cb();
        return;
      } else if (nextData == 0) {
        hasMoved = true;
        let block = this.blocks[x][y];
        let position = this.positions[x - 1][y];
        this.blocks[x - 1][y] = block;
        this.datas[x - 1][y] = curData;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x - 1, y, cb);
        });
      } else if (
        this.datas[x][y] == this.datas[x - 1][y] &&
        (!this.lastMerge || this.lastMerge.indexOf(`${x - 1}_${y}`) == -1)
      ) {
        hasMoved = true;
        hasScore = true;
        let block = this.blocks[x][y];
        let position = this.positions[x - 1][y];
        this.datas[x - 1][y] *= 2;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.blocks[x - 1][y]
          .getComponent("block")
          .setNumber(this.datas[x - 1][y]);
        this.lastMerge += ` ${x - 1}_${y}`;
        this.doMove(block, position, () => {
          block.destroy();
          cb && cb();
        });
      } else {
        cb && cb();
        return;
      }
    };
    toMove.forEach((item, idx) => {
      const { x, y } = item;
      move(x, y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, hasScore);
        }
      });
    });
  }
  moveRight(toMove) {
    let hasMoved = false;
    let hasScore = false;
    let counter: number = 0;
    console.log(toMove);
    const move = (x, y, cb) => {
      const curData = this.datas[x][y];
      const nextData = x == 3 ? 0 : this.datas[x + 1][y];
      if (x == 3 || curData == 0) {
        cb && cb();
        return;
      } else if (nextData == 0) {
        hasMoved = true;
        let block = this.blocks[x][y];
        let position = this.positions[x + 1][y];
        this.blocks[x + 1][y] = block;
        this.datas[x + 1][y] = curData;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x + 1, y, cb);
        });
      } else if (
        this.datas[x][y] == this.datas[x + 1][y] &&
        (!this.lastMerge || this.lastMerge.indexOf(`${x + 1}_${y}`) == -1)
      ) {
        hasMoved = true;
        hasScore = true;
        let block = this.blocks[x][y];
        let position = this.positions[x + 1][y];
        this.datas[x + 1][y] *= 2;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.blocks[x + 1][y]
          .getComponent("block")
          .setNumber(this.datas[x + 1][y]);
        this.lastMerge += ` ${x + 1}_${y}`;
        this.doMove(block, position, () => {
          block.destroy();
          cb && cb();
        });
      } else {
        cb && cb();
        return;
      }
    };
    toMove.forEach((item) => {
      const { x, y } = item;
      move(x, y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, hasScore);
        }
      });
    });
  }
  moveUp(toMove) {
    let hasMoved = false;
    let hasScore = false;
    let counter: number = 0;
    const move = (x, y, cb) => {
      const curData = this.datas[x][y];
      const nextData = y == 3 ? 0 : this.datas[x][y + 1];
      if (y == 3 || curData == 0) {
        cb && cb();
        return;
      } else if (nextData == 0) {
        hasMoved = true;
        let block = this.blocks[x][y];
        let position = this.positions[x][y + 1];
        this.blocks[x][y + 1] = block;
        this.datas[x][y + 1] = curData;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x, y + 1, cb);
        });
      } else if (
        this.datas[x][y] == this.datas[x][y + 1] &&
        (!this.lastMerge || this.lastMerge.indexOf(`${x}_${y + 1}`) == -1)
      ) {
        hasMoved = true;
        hasScore = true;
        let block = this.blocks[x][y];
        let position = this.positions[x][y + 1];
        this.datas[x][y + 1] *= 2;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.blocks[x][y + 1]
          .getComponent("block")
          .setNumber(this.datas[x][y + 1]);
        this.lastMerge += ` ${x}_${y + 1}`;
        this.doMove(block, position, () => {
          block.destroy();
          cb && cb();
        });
      } else {
        cb && cb();
        return;
      }
    };
    toMove.forEach((item, idx) => {
      const { x, y } = item;
      move(x, y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, hasScore);
        }
      });
    });
  }
  moveDown(toMove) {
    let hasMoved = false;
    let hasScore = false;
    let counter: number = 0;
    const move = (x, y, cb) => {
      const curData = this.datas[x][y];
      const nextData = y == 0 ? 0 : this.datas[x][y - 1];
      if (y == 0 || curData == 0) {
        cb && cb();
        return;
      } else if (nextData == 0) {
        hasMoved = true;
        let block = this.blocks[x][y];
        let position = this.positions[x][y - 1];
        this.blocks[x][y - 1] = block;
        this.datas[x][y - 1] = curData;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.doMove(block, position, () => {
          move(x, y - 1, cb);
        });
      } else if (
        this.datas[x][y] == this.datas[x][y - 1] &&
        (!this.lastMerge || this.lastMerge.indexOf(`${x}_${y - 1}`) == -1)
      ) {
        hasMoved = true;
        hasScore = true;
        let block = this.blocks[x][y];
        let position = this.positions[x][y - 1];
        this.datas[x][y - 1] *= 2;
        this.datas[x][y] = 0;
        this.blocks[x][y] = null;
        this.blocks[x][y - 1]
          .getComponent("block")
          .setNumber(this.datas[x][y - 1]);
        this.lastMerge += ` ${x}_${y - 1}`;
        this.doMove(block, position, () => {
          block.destroy();
          cb && cb();
        });
      } else {
        cb && cb();
        return;
      }
    };
    toMove.forEach((item, idx) => {
      const { x, y } = item;
      move(x, y, () => {
        counter++;
        if (counter == toMove.length) {
          this.afterMove(hasMoved, hasScore);
        }
      });
    });
  }
  // 检查是否失败
  checkFail() {
    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        let n = this.datas[i][j];
        if (n == 0) return false;
        if (j < 3 && this.datas[i][j + 1] == n) return false;
        if (i < 3 && this.datas[i + 1][j] == n) return false;
      }
    }
    return true;
  }
  // 每次移动之后触发
  afterMove(hasMoved, hasScore) {
    if (this.checkFail()) {
      this.init();
    }
    if (hasMoved) {
      this.addBlock();
    }
    if (hasScore) {
      // let score: number = 0;
      // this.datas.forEach((_data) => {
      //   _data.forEach((data) => {
      //     score += data;
      //   });
      // });
      // this.uptScore(score);
    }
    this.lastMerge = '';
    this.moving = false;
  }
  update(deltaTime: number) {}
}
