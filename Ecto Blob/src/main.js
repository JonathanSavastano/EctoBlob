import {
  Application,
  Sprite,
  Assets,
  Container,
  Text,
  TextStyle,
} from "pixi.js";
import { Howl } from "howler";

// sound effects
var glassBreak = new Howl({
  src: ["assets/sounds/Bottle Break.wav"],
  volume: 0.5,
});
var glassGet = new Howl({
  src: ["assets/sounds/impsplat/impactsplat08.mp3"],
});
var bumpGuy = new Howl({
  src: ["assets/sounds/impsplat/impactsplat03.mp3"],
  volume: 0.5,
});
var loseSound = new Howl({
  src: ["assets/sounds/impsplat/impactsplat01.mp3"],
});

// check collision
function checkCollision(spriteA, spriteB) {
  const boundsA = spriteA.getBounds();
  const boundsB = spriteB.getBounds();

  return (
    boundsA.x < boundsB.x + boundsB.width &&
    boundsA.x + boundsA.width > boundsB.x &&
    boundsA.y < boundsB.y + boundsB.height &&
    boundsA.y + boundsA.height > boundsB.y
  );
}

let gameStarted = false;

(async () => {
  // Create a new application
  const app = new Application();
  // Initialize the application
  await app.init({
    background: "#f2f2f2",
    width: 800,
    height: 600,
    resizeTo: window,
  });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // Disable movement and gameplay until click
  function startGame() {
    const instructions = document.getElementById("remove-me");
    instructions.style.display = "none";
    if (gameStarted) return;
    gameStarted = true;

    // Start the main ticker loop
    app.ticker.start();
  }

  // Pause ticker initially
  app.ticker.stop();
  window.addEventListener("click", startGame, { once: true });

  // CONTAINER
  const container = new Container();
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;
  app.stage.addChild(container);

  // BACKGROUND
  const bgTexture = await Assets.load("assets/backgrounds/tiles.png");
  const bgSprite = new Sprite(bgTexture);
  container.addChild(bgSprite);
  bgSprite.anchor.set(0.5);
  bgSprite.width = window.innerWidth;
  bgSprite.height = window.innerHeight;
  const bgBounds = bgSprite.getBounds();

  // GROW POTION
  const growpotTexture = await Assets.load("assets/items/growpot.png");
  const growpotNum = 5;
  let growpotSprites = [];
  let growpotPositions = [];

  function spawnGrowPots() {
    // Clear previous positions
    growpotPositions = [];
    for (let i = 0; i < growpotNum; i++) {
      const growpotSprite = new Sprite(growpotTexture);
      growpotSprite.scale.set(0.25);
      growpotSprite.anchor.set(0.5);
      growpotSprite.x =
        Math.random() * window.innerWidth - window.innerWidth / 2;
      growpotSprite.y =
        Math.random() * window.innerHeight - window.innerHeight / 2;
      container.addChild(growpotSprite);
      growpotSprites.push(growpotSprite);
      growpotPositions.push({ x: growpotSprite.x, y: growpotSprite.y });
    }
  }

  spawnGrowPots();

  // If all growpotSprites are invisible, spawn more
  app.ticker.addOnce(() => {
    app.ticker.add(() => {
      if (growpotSprites.every((sprite) => !sprite.visible)) {
        // Remove old sprites from container
        growpotSprites.forEach((sprite) => container.removeChild(sprite));
        growpotSprites = [];
        spawnGrowPots();
      }
    });
  });

  // Load all blob textures asynchronously
  const textures = await Promise.all([
    Assets.load("assets/Character/Blob.png"),
    Assets.load("assets/Character/Blob1.png"),
    Assets.load("assets/Character/Blob2.png"),
    Assets.load("assets/Character/Blob3.png"),
    Assets.load("assets/Character/Blob4.png"),
  ]);

  // Lab Guy texture and sprite
  const maxLabGuys = 3;
  let labGuySprites = [];
  const labGuyTexture = await Assets.load("assets/Character/labguy.png");

  function spawnLabGuys() {
    for (let i = 0; i < maxLabGuys; i++) {
      const labGuySprite = new Sprite(labGuyTexture);
      labGuySprite.scale.set(0.25);
      labGuySprite.anchor.set(0.5);
      labGuySprite.x =
        Math.random() * window.innerWidth - window.innerWidth / 2;
      labGuySprite.y =
        Math.random() * window.innerHeight - window.innerHeight / 2;
      container.addChild(labGuySprite);
      labGuySprites.push(labGuySprite);
    }
  }

  spawnLabGuys();

  // splash
  const splashTextures = await Promise.all([
    Assets.load("assets/backgrounds/splash.png"),
    Assets.load("assets/backgrounds/splash1.png"),
    Assets.load("assets/backgrounds/splash2.png"),
    Assets.load("assets/backgrounds/splash3.png"),
    Assets.load("assets/backgrounds/splash4.png"),
    Assets.load("assets/backgrounds/splash5.png"),
  ]);

  const splashSprite = new Sprite(splashTextures[0]);

  // Create a single blob sprite using the first texture
  const blob = new Sprite(textures[0]);
  blob.anchor.set(0.5);
  blob.x = 0;
  blob.y = 0;
  container.addChild(blob);

  let frame = 0;

  // set initial blob scale
  blob.scale.set(2);

  // Movement handling
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
  };
  const speed = 5;
  window.addEventListener("keydown", (e) => {
    if (!gameStarted) return;
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (!gameStarted) return;
    if (e.key in keys) keys[e.key] = false;
  });

  // MAIN RENDERING UPDATE LOOP
  app.ticker.add(() => {
    if (!gameStarted) return;
    // Shrink the blob every 2 seconds
    if (!app.lastShrinkTime) app.lastShrinkTime = app.ticker.lastTime;
    if (app.ticker.lastTime - app.lastShrinkTime >= 2000) {
      blob.scale.x = Math.max(0.1, blob.scale.x - 0.5);
      blob.scale.y = Math.max(0.1, blob.scale.y - 0.5);
      app.lastShrinkTime = app.ticker.lastTime;
    }

    // Check for lose condition
    if (blob.scale.x <= 0.1 || blob.scale.y <= 0.1) {
      loseSound.play();
      container.addChild(splashSprite);
      splashSprite.anchor = 0.5;
      app.ticker.stop();
      const loseText = new Text({
        text: "YOU LOSE!",
        style: new TextStyle({
          fontFamily: "Arial",
          fontSize: 64,
          fill: "#AA0000",
          fontWeight: "bold",
          stroke: "#FFFFFF",
          strokeDeprecated: { thickness: 6 },
        }),
      });
      loseText.anchor.set(0.5);
      loseText.x = app.screen.width / 2;
      loseText.y = app.screen.height / 2;
      app.stage.addChild(loseText);
    }
    // handle grow pot collision
    for (let i = 0; i < growpotSprites.length; i++) {
      if (checkCollision(blob, growpotSprites[i])) {
        glassGet.play();
        let growBy = 0.65;
        blob.scale.x += growBy;
        blob.scale.y += growBy;
        growpotSprites[i].visible = false;
      }
      for (let j = 0; j < labGuySprites.length; j++) {
        if (checkCollision(labGuySprites[j], growpotSprites[i])) {
          glassBreak.play();
          growpotSprites[i].visible = false;
        }
      }
    }
    for (let i = 0; i < labGuySprites.length; i++) {
      // Handle collision between labGuySprites to prevent overlap
      for (let j = 0; j < labGuySprites.length; j++) {
        if (i === j) continue;
        const otherLabGuy = labGuySprites[j];
        if (checkCollision(labGuySprites[i], otherLabGuy)) {
          // Calculate direction to push them apart
          const dx = labGuySprites[i].x - otherLabGuy.x;
          const dy = labGuySprites[i].y - otherLabGuy.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          // Move each labGuy slightly away from each other
          const pushAmount = 2;
          labGuySprites[i].x += (dx / dist) * pushAmount;
          labGuySprites[i].y += (dy / dist) * pushAmount;
          otherLabGuy.x -= (dx / dist) * pushAmount;
          otherLabGuy.y -= (dy / dist) * pushAmount;
        }
        if (checkCollision(blob, labGuySprites[i])) {
          bumpGuy.play();
          // Calculate direction from blob to labGuy
          const dx = labGuySprites[i].x - blob.x;
          const dy = labGuySprites[i].y - blob.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          // Knock the labGuy away from the blob
          const knockback = 80;
          labGuySprites[i].x += (dx / dist) * knockback;
          labGuySprites[i].y += (dy / dist) * knockback;
        }
      }
      const labGuy = labGuySprites[i];
      // Find the closest visible growpot (use sprite position, not growpotPositions)
      let minDist = Infinity;
      let target = null;
      for (let j = 0; j < growpotSprites.length; j++) {
        if (!growpotSprites[j].visible) continue;
        const sprite = growpotSprites[j];
        const dx = sprite.x - labGuy.x;
        const dy = sprite.y - labGuy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          target = sprite;
        }
      }
      if (target) {
        const dx = target.x - labGuy.x;
        const dy = target.y - labGuy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 1) {
          const moveX = (dx / dist) * 2;
          const moveY = (dy / dist) * 2;
          labGuy.x += moveX;
          labGuy.y += moveY;
        }
      }
    }

    // Check if blob's bounds exceed the screen size (win condition)
    const blobBounds = blob.getBounds();
    if (
      blobBounds.width >= app.screen.width ||
      blobBounds.height >= app.screen.height
    ) {
      app.ticker.stop();
      const winText = new Text({
        text: "YOU WON!",
        style: new TextStyle({
          fontFamily: "Arial",
          fontSize: 64,
          fill: "#00AA00",
          fontWeight: "bold",
          stroke: "#FFFFFF",
          strokeDeprecated: { thickness: 6 },
        }),
      });
      winText.anchor.set(0.5);
      winText.x = app.screen.width / 2;
      winText.y = app.screen.height / 2;
      app.stage.addChild(winText);
    }

    // movement handling
    let dx = 0;
    let dy = 0;
    if (keys.w) dy -= 1;
    if (keys.s) dy += 1;
    if (keys.a) dx -= 1;
    if (keys.d) dx += 1;
    // keep movement speed the same even on diagonals
    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
    }
    blob.x += dx * speed;
    blob.y += dy * speed;

    const halfBlobWidth = blob.width / 2;
    const halfBlobHeight = blob.height / 2;
    // Calculate min/max positions relative to container center
    const minX = bgBounds.x - container.x + halfBlobWidth;
    const maxX = bgBounds.x - container.x + bgBounds.width - halfBlobWidth;
    const minY = bgBounds.y - container.y + halfBlobHeight;
    const maxY = bgBounds.y - container.y + bgBounds.height - halfBlobHeight;
    // Clamp blob position to keep him on screen
    blob.x = Math.max(minX, Math.min(maxX, blob.x));
    blob.y = Math.max(minY, Math.min(maxY, blob.y));

    // Animate texture frame (for blob)
    const frameDuration = 600; // milliseconds per frame (increase for slower change)
    if (
      Math.floor(app.ticker.lastTime / frameDuration) % textures.length !==
      frame
    ) {
      frame = Math.floor(app.ticker.lastTime / frameDuration) % textures.length;
      blob.texture = textures[frame];
    }
  });
})();
