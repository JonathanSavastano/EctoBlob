import { Application, Sprite, Assets, Container, Text, TextStyle } from "pixi.js";

// check collision
function checkCollision(spriteA, spriteB) {
  const boundsA = spriteA.getBounds();
  const boundsB = spriteB.getBounds();

  return(
    boundsA.x < boundsB.x + boundsB.width &&
    boundsA.x + boundsA.width > boundsB.x &&
    boundsA.y < boundsB.y + boundsB.height &&
    boundsA.y + boundsA.height > boundsB.y
  );
}


(async () => {
  // Create a new application
  const app = new Application();

  // Initialize the application
  await app.init({ background: "#f2f2f2", width: 800, height: 600, resizeTo: window });

  // Append the application canvas to the document body
  document.getElementById("pixi-container").appendChild(app.canvas);

  // CONTAINER
  const container = new Container();
  container.x = app.screen.width / 2;
  container.y = app.screen.height / 2;
  app.stage.addChild(container);

  // BACKGROUND
  const bgTexture = await(Assets.load('assets/backgrounds/tiles.png'));
  const bgSprite = new Sprite(bgTexture);
  container.addChild(bgSprite);
  bgSprite.anchor.set(0.5);
  bgSprite.width = window.innerWidth;
  bgSprite.height = window.innerHeight;
  const bgBounds = bgSprite.getBounds();

  // GROW POTION
  const growpotTexture = await(Assets.load('assets/items/growpot.png'));
  const growpotNum = 5;
  let growpotSprites = [];

  function spawnGrowPots() {
    for (let i = 0; i < growpotNum; i++) {
      const growpotSprite = new Sprite(growpotTexture);
      growpotSprite.scale.set(0.25);
      growpotSprite.anchor.set(0.5);
      growpotSprite.x = Math.random() * window.innerWidth - window.innerWidth / 2;
      growpotSprite.y = Math.random() * window.innerHeight - window.innerHeight / 2;
      container.addChild(growpotSprite);
      growpotSprites.push(growpotSprite);
    }
  }

  spawnGrowPots();

  // If all growpotSprites are invisible, spawn more
  app.ticker.addOnce(() => {
    app.ticker.add(() => {
      if (growpotSprites.every(sprite => !sprite.visible)) {
        // Remove old sprites from container
        growpotSprites.forEach(sprite => container.removeChild(sprite));
        growpotSprites = [];
        spawnGrowPots();
      }
    });
  });
  

  // Load all blob textures asynchronously
  const textures = await Promise.all([
    Assets.load('assets/Character/Blob.png'),
    Assets.load('assets/Character/Blob1.png'),
    Assets.load('assets/Character/Blob2.png'),
    Assets.load('assets/Character/Blob3.png'),
    Assets.load('assets/Character/Blob4.png'),
  ]);

  // splash
  const splashTextures = await Promise.all([
    Assets.load('assets/backgrounds/splash.png'),
    Assets.load('assets/backgrounds/splash1.png'),
    Assets.load('assets/backgrounds/splash2.png'),
    Assets.load('assets/backgrounds/splash3.png'),
    Assets.load('assets/backgrounds/splash4.png'),
    Assets.load('assets/backgrounds/splash5.png'),
  ]);

  const splashSprite = new Sprite(splashTextures[0]);

  // Create a single blob sprite using the first texture
  const blob = new Sprite(textures[0]);
  blob.anchor.set(0.5);
  blob.x = 0;
  blob.y = 0;
  container.addChild(blob);

  // fps vars
  let frame = 0;
  let elapsed = 0;
  const times = [];
  let fps = 0;

  // displaying FPS
  const fpsText = new Text({
    text: "FPS: 0",
    style: new TextStyle({
      fontFamily: "Arial",
      fontSize: 24,
      fill: "#000000",
    }),
  });
  fpsText.x = 10;
  fpsText.y = 10;
  app.stage.addChild(fpsText);

  function refreshLoop() {
    window.requestAnimationFrame(() => {
      const now = performance.now();
      while (times.length > 0 && times[0] <= now - 1000) {
        times.shift();
      }
      times.push(now);
      fps = times.length;
      `${fps}`;
      refreshLoop();
    });
  }
  refreshLoop();

  // Movement handling
  const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
  };
  const speed = 5;
  window.addEventListener("keydown", (e) => {
    if (e.key in keys) keys[e.key] = true;
  });
  window.addEventListener("keyup", (e) => {
    if (e.key in keys) keys[e.key] = false;
  });

  // set initial blob scale
  blob.scale.set(2);

  // MAIN RENDERING UPDATE LOOP
  app.ticker.add((delta) => {
    fpsText.text = `FPS: ${fps}`;
    elapsed += delta;
    // Shrink the blob every 2 seconds
    if (!app.lastShrinkTime) app.lastShrinkTime = app.ticker.lastTime;
    if (app.ticker.lastTime - app.lastShrinkTime >= 2000) {
      blob.scale.x = Math.max(0.10, blob.scale.x - 0.50);
      blob.scale.y = Math.max(0.10, blob.scale.y - 0.50);
      app.lastShrinkTime = app.ticker.lastTime;
    }

    // Check for lose condition
    if (blob.scale.x <= 0.10 || blob.scale.y <= 0.10) {
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
        strokeThickness: 6,
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
      let growBy = 0.50;
      blob.scale.x += growBy;
      blob.scale.y += growBy;
      growpotSprites[i].visible = false;
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
        strokeThickness: 6,
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
    if (Math.floor(app.ticker.lastTime / frameDuration) % textures.length !== frame) {
      frame = Math.floor(app.ticker.lastTime / frameDuration) % textures.length;
      blob.texture = textures[frame];
    }
  });
})();
