import Phaser from "phaser";
import { MainScene } from "./logic/MainScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "game",
  width: 900,
  height: 540,
  backgroundColor: "#0f172a",
  physics: {
    default: "arcade",
    arcade: { debug: false },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
};

new Phaser.Game(config);
