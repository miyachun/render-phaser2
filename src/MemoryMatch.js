
import Phaser from 'phaser';
import { YouTubePlayables } from './YouTubePlayables';

const FRUITS = [
  'hamburger',
  'chicken',
  'fries',
  'coke'
];

export class MemoryMatch extends Phaser.Scene {
  constructor() {
    super('AngryCut');
  }

  preload() {
    for (const key of FRUITS) {
      this.load.image(key, `assets/fruits/${key}.png`);
    }  

    this.load.image('bomb', 'assets/fruits/bomb.png');
    this.load.image('bomb2', 'assets/fruits/bomb2.png');


    this.load.on('loaderror', (file) => {
      console.error('素材載入失敗：', file.src);
    });
  }

  create() {
    this.score = 0;
    this.seconds = 30;
    this.gameOver = false;
    this.items = [];
    this.lastPointer = null;
    this.spawnEvent = null;

    this.cameras.main.setBackgroundColor('#102a35');

    const w = this.scale.width;
    const h = this.scale.height;

    this.add.text(w / 2, 25, 'Angry Cut', {
      fontSize: '40px',
      fontStyle: 'bold',
      color: '#ffffff'
    }).setOrigin(0.5, 0);

    this.scoreText = this.add.text(18, 85, '得分：0', {
      fontSize: '26px',
      color: '#ffe082'
    });

    this.timeText = this.add.text(w - 18, 85, '時間：20', {
      fontSize: '26px',
      color: '#ffffff'
    }).setOrigin(1, 0);

    this.add.text(w / 2, h - 30, '滑動手指或滑鼠切水果！', {
      fontSize: '17px',
      color: '#b8d7dc'
    }).setOrigin(0.5);

    this.slashGraphics = this.add.graphics()
      .setDepth(20);

    this.overlay = this.add.container(0, 0)
      .setDepth(30);

    this.showPanel(
      '切切切大挑戰',
      '20 秒內盡可能切中食物！\n小心炸彈！',
      '開始遊戲',
      () => this.startGame()
    );

    this.input.on('pointerdown', (pointer) => {
      this.lastPointer = {
        x: pointer.x,
        y: pointer.y
      };
    });

    this.input.on('pointermove', (pointer) => {
      if (!pointer.isDown || this.gameOver) return;

      const current = {
        x: pointer.x,
        y: pointer.y
      };

      if (this.lastPointer) {
        this.cutBetween(this.lastPointer, current);
        this.drawSlash(this.lastPointer, current);
      }

      this.lastPointer = current;
    });

    this.input.on('pointerup', () => {
      this.lastPointer = null;
    });

    this.scale.on('resize', () => {
      if (this.gameOver) {
        this.showPanel(
          '切切切大挑戰',
          `得分：${this.score}`,
          '再玩一次',
          () => this.scene.restart()
        );
      }
    });

    YouTubePlayables.firstFrameReady();
    this.syncAudio();
  }

  syncAudio() {
    this.sound.setMute(!YouTubePlayables.isAudioEnabled());

    YouTubePlayables.setAudioChangeCallback((enabled) => {
      this.sound.setMute(!enabled);
    });
  }

  showPanel(title, subtitle, buttonLabel, callback) {
    this.overlay.removeAll(true);

    const w = this.scale.width;
    const h = this.scale.height;

    const shade = this.add.rectangle(
      w / 2, h / 2, w, h, 0x07151c, 0.88
    );

    const heading = this.add.text(
      w / 2, h * 0.36, title, {
        fontSize: '36px',
        fontStyle: 'bold',
        color: '#ffffff',
        align: 'center',
        wordWrap: { width: w - 32 }
      }
    ).setOrigin(0.5);

    const detail = this.add.text(
      w / 2, h * 0.46, subtitle, {
        fontSize: '25px',
        color: '#d5e9ee',
        align: 'center',
        lineSpacing: 10,
        wordWrap: { width: w - 40 }
      }
    ).setOrigin(0.5);

    const button = this.add.text(
      w / 2, h * 0.62, buttonLabel, {
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#16a34a',
        padding: { x: 24, y: 14 }
      }
    ).setOrigin(0.5).setInteractive({ useHandCursor: true });

    button.on('pointerdown', callback);

    this.overlay.add([shade, heading, detail, button]);
  }

  startGame() {
    this.overlay.removeAll(true);
    this.gameOver = false;
    this.score = 0;
    this.seconds = 30;

    this.scoreText.setText('得分：0');
    this.timeText.setText('時間：30');

    this.items.forEach(item => item.destroy());
    this.items = [];

    YouTubePlayables.gameReady();

    this.spawnEvent = this.time.addEvent({
      delay: 1100,
      loop: true,
      callback: () => this.spawnFruit()
    });

    this.clock = this.time.addEvent({
      delay: 1000,
      loop: true,
      callback: () => {
        if (this.gameOver) return;

        this.seconds--;
        this.timeText.setText(`時間：${this.seconds}`);

        if (this.seconds <= 0) {
          this.finishGame();
        }
      }
    });
  }

  
spawnFruit() {
  if (this.gameOver) return;

  const w = this.scale.width;
  const h = this.scale.height;

  const isBomb = Math.random() < 0.40;

  const BOMB_TYPES = ['bomb', 'bomb2'];
  
  const key = isBomb
    ? Phaser.Utils.Array.GetRandom(BOMB_TYPES)
    : Phaser.Utils.Array.GetRandom(FRUITS);

  const margin = Math.min(45, w / 2);
  const x = Phaser.Math.Between(
    Math.ceil(margin),
    Math.max(Math.ceil(margin), Math.floor(w - margin))
  );
  const y = h + 45;
  const size = Math.min(200, w * 0.19);


  const sprite = this.add.image(x, y, key);

  sprite.setDisplaySize(size, size);
  sprite.setDepth(5);
  sprite.setData('fruitKey', key);
  sprite.setData('isBomb', isBomb);
  sprite.setData('cut', false);

  this.items.push(sprite);

 
  const velocityX = Phaser.Math.Between(-150, 150);
  const peakY = Phaser.Math.Between(
    Math.max(100, h * 0.2),
    Math.max(120, h * 0.5)
  );

  this.tweens.add({
    targets: sprite,
    x: Phaser.Math.Clamp(x + velocityX, size / 2, w - size / 2),
    y: peakY,
    angle: Phaser.Math.Between(-180, 180),
    duration: 650,
    ease: 'Quad.easeOut',
    onComplete: () => {
      if (!sprite.active || this.gameOver) return;

      this.tweens.add({
        targets: sprite,
        y: h + size,
        angle: sprite.angle + Phaser.Math.Between(-180, 180),
        duration: 850,
        ease: 'Quad.easeIn',
        onComplete: () => {
          this.items = this.items.filter(
            item => item !== sprite
          );
          sprite.destroy();
        }
      });
    }
  });
}


  cutBetween(a, b) {
    for (const item of [...this.items]) {
      if (!item.active || item.getData('cut')) continue;

      const distance = this.distanceToSegment(
        item.x, item.y, a.x, a.y, b.x, b.y
      );

      if (distance < item.displayWidth * 0.42) {
        item.setData('cut', true);

        if (item.getData('isBomb')) {
          this.finishGame();
          return;
        }

        this.score += 10;
        this.scoreText.setText(`得分：${this.score}`);

        this.createJuice(item.x, item.y);
        this.items = this.items.filter(value => value !== item);
        item.destroy();
      }
    }
  }

  distanceToSegment(px, py, ax, ay, bx, by) {
    const dx = bx - ax;
    const dy = by - ay;
    const lengthSq = dx * dx + dy * dy;

    if (lengthSq === 0) {
      return Phaser.Math.Distance.Between(px, py, ax, ay);
    }

    const t = Phaser.Math.Clamp(
      ((px - ax) * dx + (py - ay) * dy) / lengthSq,
      0, 1
    );

    return Phaser.Math.Distance.Between(
      px, py, ax + t * dx, ay + t * dy
    );
  }

  drawSlash(a, b) {
    this.slashGraphics.clear();
    this.slashGraphics.lineStyle(6, 0x9ffcff, 0.9);
    this.slashGraphics.beginPath();
    this.slashGraphics.moveTo(a.x, a.y);
    this.slashGraphics.lineTo(b.x, b.y);
    this.slashGraphics.strokePath();

    this.time.delayedCall(90, () => {
      if (this.slashGraphics.active) {
        this.slashGraphics.clear();
      }
    });
  }

  createJuice(x, y) {
    const colors = [0xff4d6d, 0xffc857, 0x60d394, 0x70d6ff];

    for (let i = 0; i < 8; i++) {
      const dot = this.add.circle(
        x, y, Phaser.Math.Between(3, 7),
        Phaser.Utils.Array.GetRandom(colors)
      ).setDepth(15);

      this.tweens.add({
        targets: dot,
        x: x + Phaser.Math.Between(-55, 55),
        y: y + Phaser.Math.Between(-55, 55),
        alpha: 0,
        scale: 0.2,
        duration: 350,
        onComplete: () => dot.destroy()
      });
    }
  }

  finishGame() {
    if (this.gameOver) return;

    this.gameOver = true;
    this.spawnEvent?.remove();
    this.clock?.remove();

    const best = Math.max(
      this.score,
      Number(this.registry.get('bestScore') || 0)
    );

    this.registry.set('bestScore', best);

    YouTubePlayables.sendScore(this.score);
    void YouTubePlayables.saveData({ bestScore: best });

    this.showPanel(
      '遊戲結束',
      `最終得分：${this.score}\n最高紀錄：${best}`,
      '再玩一次',
      () => this.scene.restart()
    );
  }
}
