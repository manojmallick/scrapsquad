import Phaser from "phaser";

/**
 * ScrapSquad.io MVP — local arena prototype (1 player + AI scraps).
 * Full 4v4 netcode is the product roadmap; this proves the loop.
 */

type Team = "you" | "ai";

interface Scrap {
  id: string;
  team: Team;
  hp: number;
  sprite: Phaser.Physics.Arcade.Image;
  label: Phaser.GameObjects.Text;
}

export class MainScene extends Phaser.Scene {
  private scraps: Scrap[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key };
  private player!: Scrap;
  private loot!: Phaser.Physics.Arcade.Group;
  private scoreYou = 0;
  private scoreAi = 0;
  private hud!: Phaser.GameObjects.Text;
  private round = 1;
  private timeLeft = 60;
  private over = false;

  constructor() {
    super("MainScene");
  }

  preload() {
    const g = this.make.graphics({ x: 0, y: 0 });
    g.fillStyle(0x38bdf8);
    g.fillRoundedRect(0, 0, 28, 28, 6);
    g.generateTexture("you", 28, 28);
    g.clear();
    g.fillStyle(0xf43f5e);
    g.fillRoundedRect(0, 0, 28, 28, 6);
    g.generateTexture("ai", 28, 28);
    g.clear();
    g.fillStyle(0xfbbf24);
    g.fillCircle(8, 8, 8);
    g.generateTexture("loot", 16, 16);
    g.destroy();
  }

  create() {
    const w = this.scale.width;
    const h = this.scale.height;
    this.add.rectangle(w / 2, h / 2, w, h, 0x0f172a);
    // arena
    this.add.rectangle(w / 2, h / 2, w - 40, h - 80, 0x1e293b).setStrokeStyle(3, 0x64748b);

    this.add
      .text(20, 12, "ScrapSquad.io", {
        fontFamily: "system-ui",
        fontSize: "20px",
        color: "#e2e8f0",
        fontStyle: "bold",
      });
    this.hud = this.add.text(20, 40, "", {
      fontFamily: "system-ui",
      fontSize: "14px",
      color: "#94a3b8",
    });

    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys("W,A,S,D") as typeof this.wasd;

    this.player = this.spawn("you", w * 0.3, h * 0.5);
    this.spawn("ai", w * 0.7, h * 0.35);
    this.spawn("ai", w * 0.7, h * 0.65);

    this.loot = this.physics.add.group();
    for (let i = 0; i < 8; i++) this.spawnLoot();

    this.physics.add.overlap(this.player.sprite, this.loot, (_p, l) => {
      (l as Phaser.Physics.Arcade.Image).destroy();
      this.scoreYou += 1;
      this.spawnLoot();
    });

    this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.over) return;
        this.timeLeft -= 1;
        if (this.timeLeft <= 0) this.endRound();
      },
    });

    this.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      if (this.over) return;
      // melee pulse
      this.scraps
        .filter((s) => s.team === "ai")
        .forEach((s) => {
          const d = Phaser.Math.Distance.Between(
            this.player.sprite.x,
            this.player.sprite.y,
            s.sprite.x,
            s.sprite.y,
          );
          if (d < 48) {
            s.hp -= 1;
            if (s.hp <= 0) {
              s.sprite.destroy();
              s.label.destroy();
              this.scraps = this.scraps.filter((x) => x !== s);
              this.scoreYou += 3;
            }
          }
        });
      // visual
      const ring = this.add.circle(p.worldX, p.worldY, 8, 0x38bdf8, 0.4);
      this.tweens.add({
        targets: ring,
        scale: 3,
        alpha: 0,
        duration: 200,
        onComplete: () => ring.destroy(),
      });
    });
  }

  private spawn(team: Team, x: number, y: number): Scrap {
    const sprite = this.physics.add.image(x, y, team === "you" ? "you" : "ai");
    sprite.setCollideWorldBounds(true);
    (sprite.body as Phaser.Physics.Arcade.Body).setDrag(600, 600);
    const label = this.add
      .text(x, y - 22, team === "you" ? "YOU" : "AI", {
        fontSize: "11px",
        color: "#cbd5e1",
        fontFamily: "system-ui",
      })
      .setOrigin(0.5);
    const scrap: Scrap = {
      id: `${team}_${Math.random().toString(36).slice(2, 6)}`,
      team,
      hp: 3,
      sprite,
      label,
    };
    this.scraps.push(scrap);
    return scrap;
  }

  private spawnLoot() {
    const x = 60 + Math.random() * (this.scale.width - 120);
    const y = 80 + Math.random() * (this.scale.height - 140);
    this.loot.create(x, y, "loot");
  }

  private endRound() {
    this.over = true;
    // AI scrap score from remaining loot proximity is simplified
    this.scoreAi += this.scraps.filter((s) => s.team === "ai").length * 2;
    const win = this.scoreYou >= this.scoreAi;
    this.add
      .text(
        this.scale.width / 2,
        this.scale.height / 2,
        win
          ? `Round ${this.round} WIN\nYou ${this.scoreYou} — AI ${this.scoreAi}\n(4v4 multiplayer coming)`
          : `Round ${this.round} LOSS\nYou ${this.scoreYou} — AI ${this.scoreAi}`,
        {
          fontFamily: "system-ui",
          fontSize: "24px",
          color: "#f8fafc",
          align: "center",
          backgroundColor: "#020617cc",
          padding: { x: 16, y: 12 },
        },
      )
      .setOrigin(0.5);
  }

  update(_t: number, dt: number) {
    this.hud.setText(
      `Round ${this.round} · ${this.timeLeft}s · You ${this.scoreYou} · scraps left ${this.scraps.filter((s) => s.team === "ai").length} · WASD/arrows · click melee`,
    );
    if (this.over) return;

    const speed = 220;
    let vx = 0;
    let vy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown) vx += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown) vy += 1;
    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (vx || vy) {
      const len = Math.hypot(vx, vy);
      body.setVelocity((vx / len) * speed, (vy / len) * speed);
    }

    this.player.label.setPosition(this.player.sprite.x, this.player.sprite.y - 22);

    // dumb AI: chase nearest loot or player
    this.scraps
      .filter((s) => s.team === "ai")
      .forEach((s) => {
        const target = this.player.sprite;
        const angle = Phaser.Math.Angle.Between(
          s.sprite.x,
          s.sprite.y,
          target.x,
          target.y,
        );
        (s.sprite.body as Phaser.Physics.Arcade.Body).setVelocity(
          Math.cos(angle) * 120,
          Math.sin(angle) * 120,
        );
        s.label.setPosition(s.sprite.x, s.sprite.y - 22);
        // bump damage
        const d = Phaser.Math.Distance.Between(
          s.sprite.x,
          s.sprite.y,
          this.player.sprite.x,
          this.player.sprite.y,
        );
        if (d < 30 && Math.random() < 0.02 * (dt / 16)) {
          this.player.hp -= 1;
          if (this.player.hp <= 0) {
            this.scoreAi += 5;
            this.player.hp = 3;
            this.player.sprite.setPosition(
              this.scale.width * 0.3,
              this.scale.height * 0.5,
            );
          }
        }
      });
  }
}
