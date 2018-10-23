let score;
let highest;
let status;
let bullets;
let bulletImg;
let bulletSpeedRate;
let character;
let characterImg;
let characterSound;
let scoreCount;
let bgm;
let addSpeedHint;
let framesEveryBullet;
let bulletMaxSpeed;
let bulletMinSpeed;
let bulletSound;
let font;
let barrages;

// game configuration
const INIT_BULLET_SPEED_RATE = 1;
const INIT_FRAMES_EVERY_BULLET = 18;
const INIT_BULLET_MAX_SPEED = 6;
const INIT_BULLET_MIN_SPEED = 4;
const BULLET_WIDTH = 20;
const BULLET_HEIGHT = 13;
const BULLET_IMG_SRC = './assets/bullet.png';
const COLLISION_BOUNDARY = 5;
const CHARACTER_WIDTH = 35;
const CHARACTER_HEIGHT = 35;
const CHARACTER_SPEED = 4;
const CHARACTER_IMG_SRC = './assets/man.png';
const CHARACTER_SOUND_SRC = './assets/dead.mp3';
const BGM_SRC = './assets/yexi.mp3';
const ADD_SPEED_MUSIC_SRC = './assets/wolf.mp3';
const BULLET_SOUND_SRC = './assets/shoot.mp3';
const FONT_SRC = 'assets/NotoSansTC-Regular.otf';

function preload() {
  soundFormats('mp3');
  bgm = loadSound(BGM_SRC);
  font = loadFont(FONT_SRC);
  addSpeedHint = loadSound(ADD_SPEED_MUSIC_SRC);
  bulletSound = loadSound(BULLET_SOUND_SRC);
  characterSound = loadSound(CHARACTER_SOUND_SRC);
}

// invoke one time to setup canvas
function setup() {
  // global width, height!!
  createCanvas(1000, 800).parent('game');
  background(51);
  barrages = new Barrages();
  bullets = new Bullets();
  characterImg = loadImage(CHARACTER_IMG_SRC);
  bulletImg = loadImage(BULLET_IMG_SRC);
  status = 'stopped';
  score = document.querySelector('#score');
  bgm.loop();
  if (!localStorage.getItem('highest')) {
    highest = 0;
    localStorage.setItem('highest', 0);
  } else {
    highest = localStorage.getItem('highest');
  }
  fill(255);
  textFont(font);
  textAlign(CENTER, CENTER);
  textSize(80);
  text('閃避（點擊）\n暫停（P）\n開始（空白鍵）', width * 0.5, height * 0.5);
}

function reset() {
  barrages.clear();
  bullets.clear();
  character = new Character();
  scoreCount = 0;
  status = 'started';
  bulletSpeedRate = INIT_BULLET_SPEED_RATE;
  framesEveryBullet = INIT_FRAMES_EVERY_BULLET;
  bulletMaxSpeed = INIT_BULLET_MAX_SPEED;
  bulletMinSpeed = INIT_BULLET_MIN_SPEED;
  loop();
}

function pause() {
  if (status === 'started') {
    status = 'paused';
    score.innerHTML += ' （暫停）';
  } else if (status === 'paused') {
    status = 'started';
  }
}

// invoke every frame by loop function
function draw() {
  if (status === 'started') {
    background(51);
    barrages.generate();
    character.update();
    character.show();
    if (!bullets.next() && status === 'started') {
      checkHighScore();
      setTimeout(function() {
        score.innerHTML += ' 鍵入空白再來一把';
      }, 1000);
      fetch(`${location.href}score?score=${scoreCount}`);
      characterSound.play();
      status = 'stopped';
      noLoop(); // stop loop
    }
    if (scoreCount && scoreCount % 1000 === 0) {
      addSpeedHint.play();
    }
    if ((scoreCount + 50) % 300 === 0) {
      bulletSound.play();
    }
    if (scoreCount === 1) {
      barrages.add(bigChase(300), -1);
      barrages.add(regular(INIT_FRAMES_EVERY_BULLET), 300);
    }
    if (scoreCount === 350) {
      barrages.add(wave(200), 2250);
    }
    scoreCount += 1;
    score.innerHTML = scoreCount;
  }
}

function checkHighScore() {
  if (highest < scoreCount) {
    highest = scoreCount;
    localStorage.setItem('highest', highest);
    score.innerHTML += ` <span class="red bold">NEW BEST: ${highest}!!!</span>`;
  } else {
    score.innerHTML += ` 最高: <span class="bold">${highest}</span>`;
  }
}

function keyPressed() {
  switch (key) {
    case ' ':
      if (status === 'stopped') {
        reset();
      }
      break;
    case 'p':
      pause();
      break;
  }
}
function mouseClicked(e) {
  if (e.target.className === 'p5Canvas' && status === 'started') {
    character.yspeed = -character.yspeed;
  }
}
function touchStarted() {
  if (screen.width >= 768) return;
  if (status === 'started') {
    character.yspeed = -character.yspeed;
  } else {
    reset();
  }
}

class Bullet {
  constructor(x, y, w, h, xs, ys) {
    this.w = w || BULLET_WIDTH;
    this.h = h || BULLET_HEIGHT;
    this.x = x || width;
    this.y = y || height / 2;
    this.xspeed =
      xs || -random(bulletMinSpeed, bulletMaxSpeed) * bulletSpeedRate;
    this.yspeed = ys || 0;
  }
  update() {
    this.x += this.xspeed;
    this.y += this.yspeed;
  }

  // draw bullet
  show() {
    fill(255);
    image(bulletImg, this.x, this.y, this.w, this.h);
  }
}

class FatalBullet extends Bullet {
  constructor() {
    super();
    this.w = BULLET_WIDTH + 10;
    this.h = BULLET_HEIGHT + 10;
    this.y = character ? character.y : random(this.h / 2, height - this.h / 2);
    this.yspeed = character ? character.yspeed : 0;
  }

  update() {
    this.x += 2 * this.xspeed;
    this.y += this.yspeed;

    // map boundary = 1
    if (this.y + this.h > height - 1) {
      this.y = height - 1 - this.h;
      this.yspeed = -this.yspeed;
    }
    if (this.y < 1) {
      this.y = 1;
      this.yspeed = -this.yspeed;
    }
  }
}

class Character {
  constructor() {
    // start position
    this.x = 50;
    this.y = 100;
    this.w = CHARACTER_WIDTH;
    this.h = CHARACTER_HEIGHT;
    this.xspeed = 0;
    this.yspeed = CHARACTER_SPEED;
  }

  update() {
    this.x += this.xspeed;
    this.y += this.yspeed;

    // map boundary = 1
    if (this.y + this.h > height - 1) {
      this.y = height - 1 - this.h;
      this.yspeed = -this.yspeed;
    }
    if (this.y < 1) {
      this.y = 1;
      this.yspeed = -this.yspeed;
    }
  }

  // draw character
  show() {
    fill(255);
    image(characterImg, this.x, this.y, this.w, this.h);
  }
}

function isColliding(a, b, boundary) {
  return (
    a.x - b.x < b.w - boundary &&
    b.x - a.x < a.w - boundary &&
    a.y - b.y < b.h - boundary &&
    b.y - a.y < a.h - boundary
  );
}

class Bullets {
  constructor() {
    this.bullets = [];
  }
  add(bullet) {
    this.bullets.push(bullet);
  }
  next() {
    let collision = 0;
    for (let i = 0; i < this.bullets.length; i++) {
      let bullet = this.bullets[i];
      if (bullet.x + bullet.w < 1) {
        this.bullets.splice(i, 1);
        i -= 1;
        continue;
      }
      bullet.update();
      bullet.show();
      collision += isColliding(bullet, character, COLLISION_BOUNDARY) ? 1 : 0;
    }
    return collision === 0;
  }
  clear() {
    this.bullets = [];
  }
}

class Barrages {
  constructor() {
    this.barrages = [];
  }
  add(fn, tillScore) {
    this.barrages.push(new Barrage(fn, tillScore));
  }
  removeBarrage(fn) {
    this.barrages = this.barrages.filter(b => b.fn !== fn);
  }
  generate() {
    this.barrages = this.barrages.filter(b => {
      b.fn();
      return b.stopScore !== scoreCount;
    });
  }
  clear() {
    this.barrages = [];
  }
}

class Barrage {
  constructor(fn, stopScore) {
    this.fn = fn;
    this.stopScore = stopScore;
  }
}
