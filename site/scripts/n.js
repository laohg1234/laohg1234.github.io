(() => {
  "use strict";

  const SCALE = 15;
  const PLAYER_X_SPEED = 9;
  const GRAVITY = 30;
  const JUMP_SPEED = 16.5;
  const FLIGHT_SPEED = 8;
  const COYOTE_TIME = 0.1;
  const JUMP_BUFFER = 0.12;
  const SHORT_HOP_FACTOR = 0.5;

  const gameShell = document.querySelector("#gameShell");
  const messageElement = document.querySelector("#message");
  const pauseButton = document.querySelector("#pauseButton");
  const restartButton = document.querySelector("#restartButton");
  const levelValue = document.querySelector("#levelValue");
  const levelName = document.querySelector("#levelName");
  const coinValue = document.querySelector("#coinValue");
  const deathValue = document.querySelector("#deathValue");
  const pauseOverlay = document.querySelector("#pauseOverlay");
  const resultOverlay = document.querySelector("#resultOverlay");
  const resultLabel = document.querySelector("#resultLabel");
  const resultTitle = document.querySelector("#resultTitle");
  const resultCopy = document.querySelector("#resultCopy");
  const resultLevel = document.querySelector("#resultLevel");
  const resultCoins = document.querySelector("#resultCoins");
  const resultDeaths = document.querySelector("#resultDeaths");
  const resultButton = document.querySelector("#resultButton");

  const cheats = {
    invincible: false,
    flight: false
  };

  let audioContext = null;

  class Vec {
    constructor(x, y) {
      this.x = x;
      this.y = y;
    }

    plus(other) {
      return new Vec(this.x + other.x, this.y + other.y);
    }

    times(factor) {
      return new Vec(this.x * factor, this.y * factor);
    }
  }

  class Level {
    constructor(plan, name, hint) {
      const rows = plan.map((line) => [...line]);
      this.height = rows.length;
      this.width = rows[0].length;
      this.name = name;
      this.hint = hint;
      this.startActors = [];

      this.rows = rows.map((row, y) => row.map((character, x) => {
        const type = levelCharacters[character] || "empty";
        if (typeof type === "string") return type;
        this.startActors.push(type.create(new Vec(x, y), character));
        return "empty";
      }));

      const players = this.startActors.filter((actor) => actor.type === "player");
      if (players.length !== 1) throw new Error(`关卡“${name}”需要且只能有一个玩家出生点`);
    }

    touches(position, size, type) {
      const xStart = Math.floor(position.x);
      const xEnd = Math.ceil(position.x + size.x);
      const yStart = Math.floor(position.y);
      const yEnd = Math.ceil(position.y + size.y);

      for (let y = yStart; y < yEnd; y += 1) {
        for (let x = xStart; x < xEnd; x += 1) {
          const outside = x < 0 || x >= this.width || y < 0 || y >= this.height;
          const tile = outside ? (y >= this.height ? "lava" : "wall") : this.rows[y][x];
          if (tile === type) return true;
        }
      }
      return false;
    }
  }

  class State {
    constructor(level, actors, status, finishDelay, checkpoint) {
      this.level = level;
      this.actors = actors;
      this.status = status;
      this.finishDelay = finishDelay;
      this.checkpoint = checkpoint;
    }

    static start(level) {
      const player = level.startActors.find((actor) => actor.type === "player");
      return new State(level, level.startActors, "playing", 0, player.pos);
    }

    get player() {
      return this.actors.find((actor) => actor.type === "player");
    }

    update(time, keys) {
      if (this.status !== "playing") {
        return new State(this.level, this.actors, this.status, this.finishDelay - time, this.checkpoint);
      }

      let actors = this.actors.map((actor) => actor.update(time, this, keys));
      let state = new State(this.level, actors, "playing", 0, this.checkpoint);
      const player = state.player;

      if (this.level.touches(player.pos, player.size, "lava")) {
        if (!cheats.invincible) {
          return new State(this.level, actors, "lost", 0.65, this.checkpoint);
        }
        if (player.pos.y > this.level.height - 2) {
          const safeActors = actors.filter((actor) => actor.type !== "player");
          safeActors.push(Player.at(this.checkpoint));
          showMessage("无敌模式：已从熔岩中脱离", 1000);
          return new State(this.level, safeActors, "playing", 0, this.checkpoint);
        }
      }

      for (const actor of actors) {
        if (actor === player) continue;
        if (overlap(actor, player)) state = actor.collide(state);
      }
      return state;
    }

    respawn() {
      const actors = this.actors.filter((actor) => actor.type !== "player");
      actors.push(Player.at(this.checkpoint));
      return new State(this.level, actors, "playing", 0, this.checkpoint);
    }
  }

  class Player {
    constructor(position, speed, coyote, jumpBuffer, grounded) {
      this.pos = position;
      this.speed = speed;
      this.coyote = coyote;
      this.jumpBuffer = jumpBuffer;
      this.grounded = grounded;
    }

    get type() {
      return "player";
    }

    static create(position) {
      return Player.at(position.plus(new Vec(0, -0.5)));
    }

    static at(position) {
      return new Player(new Vec(position.x, position.y), new Vec(0, 0), 0, 0, false);
    }

    update(time, state, keys) {
      let position = this.pos;
      let xSpeed = 0;
      if (keys.left) xSpeed -= PLAYER_X_SPEED;
      if (keys.right) xSpeed += PLAYER_X_SPEED;

      if (cheats.flight) {
        let ySpeed = 0;
        if (keys.jump) ySpeed -= FLIGHT_SPEED;
        if (keys.down) ySpeed += FLIGHT_SPEED;

        const flyingX = position.plus(new Vec(xSpeed * time, 0));
        if (!state.level.touches(flyingX, this.size, "wall")) position = flyingX;

        const flyingY = position.plus(new Vec(0, ySpeed * time));
        if (!state.level.touches(flyingY, this.size, "wall")) position = flyingY;

        return new Player(position, new Vec(xSpeed, ySpeed), 0, 0, false);
      }

      const movedX = position.plus(new Vec(xSpeed * time, 0));
      if (!state.level.touches(movedX, this.size, "wall")) position = movedX;

      const supported = state.level.touches(position.plus(new Vec(0, 0.06)), this.size, "wall");
      let coyote = supported ? COYOTE_TIME : Math.max(0, this.coyote - time);
      let jumpBuffer = keys.jumpPressed ? JUMP_BUFFER : Math.max(0, this.jumpBuffer - time);
      let ySpeed = this.speed.y;

      if (jumpBuffer > 0 && coyote > 0) {
        ySpeed = -JUMP_SPEED;
        jumpBuffer = 0;
        coyote = 0;
      }

      if (keys.jumpReleased && ySpeed < -2) ySpeed *= SHORT_HOP_FACTOR;
      ySpeed += time * GRAVITY;
      const movedY = position.plus(new Vec(0, ySpeed * time));
      let grounded = false;

      if (!state.level.touches(movedY, this.size, "wall")) {
        position = movedY;
      } else {
        if (ySpeed > 0) {
          grounded = true;
          coyote = COYOTE_TIME;
        }
        ySpeed = 0;
      }

      return new Player(position, new Vec(xSpeed, ySpeed), coyote, jumpBuffer, grounded);
    }
  }

  Player.prototype.size = new Vec(0.8, 1.5);

  class Lava {
    constructor(position, speed, reset) {
      this.pos = position;
      this.speed = speed;
      this.reset = reset;
    }

    get type() {
      return "lava";
    }

    static create(position, character) {
      if (character === "=") return new Lava(position, new Vec(2, 0));
      if (character === "|") return new Lava(position, new Vec(0, 2));
      if (character === "v") return new Lava(position, new Vec(0, 3), position);
      throw new Error(`未知熔岩类型：${character}`);
    }

    update(time, state) {
      const newPosition = this.pos.plus(this.speed.times(time));
      if (!state.level.touches(newPosition, this.size, "wall")) {
        return new Lava(newPosition, this.speed, this.reset);
      }
      if (this.reset) return new Lava(this.reset, this.speed, this.reset);
      return new Lava(this.pos, this.speed.times(-1));
    }

    collide(state) {
      if (cheats.invincible) return state;
      return new State(state.level, state.actors, "lost", 0.65, state.checkpoint);
    }
  }

  Lava.prototype.size = new Vec(1, 1);

  class Coin {
    constructor(position, basePosition, wobble) {
      this.pos = position;
      this.basePos = basePosition;
      this.wobble = wobble;
    }

    get type() {
      return "coin";
    }

    static create(position) {
      const basePosition = position.plus(new Vec(0.2, 0.1));
      return new Coin(basePosition, basePosition, Math.random() * Math.PI * 2);
    }

    update(time) {
      const wobble = this.wobble + time * 8;
      const wobblePosition = Math.sin(wobble) * 0.07;
      return new Coin(this.basePos.plus(new Vec(0, wobblePosition)), this.basePos, wobble);
    }

    collide(state) {
      const filtered = state.actors.filter((actor) => actor !== this);
      const status = filtered.some((actor) => actor.type === "coin") ? "playing" : "won";
      if (status === "won") showMessage("金币收集完成", 1000);
      return new State(state.level, filtered, status, status === "won" ? 1.1 : 0, state.checkpoint);
    }
  }

  Coin.prototype.size = new Vec(0.6, 0.6);

  class Checkpoint {
    constructor(position, active) {
      this.pos = position.plus(new Vec(0.1, 0));
      this.active = active;
    }

    get type() {
      return "checkpoint";
    }

    static create(position) {
      return new Checkpoint(position, false);
    }

    update() {
      return this;
    }

    collide(state) {
      if (this.active) return state;
      const actors = state.actors.map((actor) => {
        if (actor.type !== "checkpoint") return actor;
        return new Checkpoint(actor.pos.plus(new Vec(-0.1, 0)), actor === this);
      });
      showMessage("检查点已激活", 1300);
      return new State(state.level, actors, state.status, state.finishDelay, this.pos.plus(new Vec(-0.1, -0.5)));
    }
  }

  Checkpoint.prototype.size = new Vec(0.8, 1.2);

  function overlap(actorA, actorB) {
    return actorA.pos.x + actorA.size.x > actorB.pos.x &&
      actorA.pos.x < actorB.pos.x + actorB.size.x &&
      actorA.pos.y + actorA.size.y > actorB.pos.y &&
      actorA.pos.y < actorB.pos.y + actorB.size.y;
  }

  const levelCharacters = {
    ".": "empty",
    " ": "empty",
    "#": "wall",
    "x": "wall",
    "+": "lava",
    "!": "lava",
    "@": Player,
    "o": Coin,
    "=": Lava,
    "|": Lava,
    "v": Lava,
    "c": Checkpoint
  };

  function element(name, attributes, ...children) {
    const dom = document.createElement(name);
    for (const [key, value] of Object.entries(attributes || {})) dom.setAttribute(key, value);
    for (const child of children) dom.appendChild(child);
    return dom;
  }

  function drawGrid(level) {
    return element("table", { class: "background", style: `width: ${level.width * SCALE}px` },
      ...level.rows.map((row) => element("tr", { style: `height: ${SCALE}px` },
        ...row.map((type) => element("td", { class: type }))
      ))
    );
  }

  function drawActors(actors) {
    const layer = element("div", {});
    for (const actor of actors) {
      const className = `actor ${actor.type}${actor.type === "checkpoint" && actor.active ? " active" : ""}`;
      const rectangle = element("div", { class: className });
      rectangle.style.width = `${actor.size.x * SCALE}px`;
      rectangle.style.height = `${actor.size.y * SCALE}px`;
      rectangle.style.left = `${actor.pos.x * SCALE}px`;
      rectangle.style.top = `${actor.pos.y * SCALE}px`;
      layer.appendChild(rectangle);
    }
    return layer;
  }

  class DOMDisplay {
    constructor(parent, level) {
      this.parent = parent;
      this.level = level;
      this.dom = element("div", { class: "game", tabindex: "0" }, drawGrid(level));
      this.actorLayer = null;
      parent.insertBefore(this.dom, parent.firstChild);
      this.resize();
    }

    clear() {
      this.dom.remove();
    }

    resize() {
      const width = Math.min(this.level.width * SCALE, this.parent.clientWidth);
      const height = Math.min(this.level.height * SCALE, this.parent.clientHeight);
      this.dom.style.width = `${width}px`;
      this.dom.style.height = `${height}px`;
      this.dom.style.marginTop = `${Math.max(0, Math.floor((this.parent.clientHeight - height) / 2))}px`;
    }

    syncState(state) {
      if (this.actorLayer) this.actorLayer.remove();
      this.actorLayer = drawActors(state.actors);
      this.dom.appendChild(this.actorLayer);
      const cheatClasses = [
        cheats.invincible ? "cheat-invincible" : "",
        cheats.flight ? "cheat-flight" : ""
      ].filter(Boolean).join(" ");
      this.dom.className = `game ${state.status} ${cheatClasses}`.trim();
      this.scrollPlayerIntoView(state.player);
    }

    scrollPlayerIntoView(player) {
      const width = this.dom.clientWidth;
      const height = this.dom.clientHeight;
      const margin = width / 3;
      const left = this.dom.scrollLeft;
      const right = left + width;
      const top = this.dom.scrollTop;
      const bottom = top + height;
      const center = player.pos.plus(player.size.times(0.5)).times(SCALE);

      if (center.x < left + margin) this.dom.scrollLeft = center.x - margin;
      else if (center.x > right - margin) this.dom.scrollLeft = center.x + margin - width;
      if (center.y < top + margin) this.dom.scrollTop = center.y - margin;
      else if (center.y > bottom - margin) this.dom.scrollTop = center.y + margin - height;
    }
  }

  function planBuilder(width, height, configure) {
    const grid = Array.from({ length: height }, () => Array(width).fill(" "));

    const paint = (character, x, y, blockWidth = 1, blockHeight = 1) => {
      for (let row = y; row < y + blockHeight; row += 1) {
        for (let column = x; column < x + blockWidth; column += 1) {
          if (grid[row] && column >= 0 && column < width) grid[row][column] = character;
        }
      }
    };

    configure({
      wall: (x, y, blockWidth = 1, blockHeight = 1) => paint("x", x, y, blockWidth, blockHeight),
      lava: (x, y, blockWidth = 1, blockHeight = 1) => paint("!", x, y, blockWidth, blockHeight),
      player: (x, y) => paint("@", x, y),
      coin: (x, y) => paint("o", x, y),
      checkpoint: (x, y) => paint("c", x, y),
      horizontalLava: (x, y) => paint("=", x, y),
      verticalLava: (x, y) => paint("|", x, y),
      drippingLava: (x, y) => paint("v", x, y)
    });

    return grid.map((row) => row.join(""));
  }

  const originalFirstLevel = [
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                                ",
    "                                                                  xxx           ",
    "                                                   xx      xx    xx!xx          ",
    "                                    o o      xx                  x!!!x          ",
    "                                                                 xx!xx          ",
    "                                   xxxxx                          xvx           ",
    "                                                                            xx  ",
    "  xx                                      o o                                x  ",
    "  x                     o                                                    x  ",
    "  x                                      xxxxx                             o x  ",
    "  x          xxxx       o                                                    x  ",
    "  x  @       x  x                                                xxxxx       x  ",
    "  xxxxxxxxxxxx  xxxxxxxxxxxxxxx   xxxxxxxxxxxxxxxxxxxx     xxxxxxx   xxxxxxxxx  ",
    "                              x   x                  x     x                    ",
    "                              x!!!x                  x!!!!!x                    ",
    "                              x!!!x                  x!!!!!x                    ",
    "                              xxxxx                  xxxxxxx                    ",
    "                                                                                ",
    "                                                                                "
  ];

  const levelDefinitions = [
    {
      name: "原始通道",
      hint: "保留原版第一关。长按可以跳上高平台，轻按则会提前收力。",
      plan: originalFirstLevel
    },
    {
      name: "熔岩工厂",
      hint: "从第二关开始提高难度：熔岩坑更宽，连续平台需要控制长跳和短跳。",
      plan: planBuilder(80, 26, ({ wall, lava, player, coin, checkpoint }) => {
        wall(1, 4, 1, 20); wall(78, 4, 1, 20);
        wall(1, 22, 11, 2); lava(12, 22, 5, 2); wall(17, 22, 13, 2);
        lava(30, 22, 6, 2); wall(36, 22, 13, 2); lava(49, 22, 6, 2);
        wall(55, 22, 24, 2);
        wall(7, 20, 4); wall(19, 19, 5); wall(26, 17, 4);
        wall(38, 20, 5); wall(44, 18, 4); wall(57, 20, 4); wall(65, 18, 5);
        player(4, 21);
        coin(8, 19); coin(20, 18); coin(27, 16); coin(40, 19);
        coin(45, 17); coin(58, 19); coin(67, 17); coin(75, 21);
        checkpoint(39, 18);
      })
    },
    {
      name: "阶梯井",
      hint: "台阶连续升降并穿插六到七格熔岩坑，移动熔岩需要看准时机。",
      plan: planBuilder(88, 28, ({ wall, lava, player, coin, checkpoint, verticalLava }) => {
        wall(1, 4, 1, 22); wall(86, 4, 1, 22);
        wall(1, 24, 12, 2); lava(13, 24, 6, 2); wall(19, 24, 13, 2);
        lava(32, 24, 6, 2); wall(38, 24, 14, 2); lava(52, 24, 7, 2);
        wall(59, 24, 12, 2); lava(71, 24, 6, 2); wall(77, 24, 10, 2);
        wall(7, 22, 4); wall(19, 21, 5); wall(25, 18, 4); wall(38, 22, 5);
        wall(46, 19, 4); wall(59, 22, 4); wall(65, 19, 4); wall(78, 21, 5);
        player(4, 23);
        coin(8, 21); coin(20, 20); coin(26, 17); coin(40, 21);
        coin(47, 18); coin(60, 21); coin(66, 18); coin(79, 20); coin(83, 23);
        checkpoint(41, 20);
        verticalLava(45, 15); verticalLava(80, 14);
      })
    },
    {
      name: "回流管道",
      hint: "巡逻熔岩横穿落脚区，别只盯着脚下；等待空档再连续通过。",
      plan: planBuilder(96, 26, ({ wall, lava, player, coin, checkpoint, horizontalLava }) => {
        wall(1, 4, 1, 20); wall(94, 4, 1, 20);
        wall(1, 22, 13, 2); lava(14, 22, 6, 2); wall(20, 22, 14, 2);
        lava(34, 22, 7, 2); wall(41, 22, 14, 2); lava(55, 22, 6, 2);
        wall(61, 22, 13, 2); lava(74, 22, 7, 2); wall(81, 22, 14, 2);
        wall(8, 20, 4); wall(22, 19, 5); wall(29, 17, 4); wall(42, 20, 5);
        wall(49, 18, 4); wall(63, 20, 4); wall(69, 17, 4); wall(82, 19, 5);
        wall(18, 12, 18); wall(58, 11, 18);
        player(4, 21);
        coin(9, 19); coin(23, 18); coin(30, 16); coin(44, 19);
        coin(50, 17); coin(64, 19); coin(70, 16); coin(83, 18); coin(91, 21);
        checkpoint(45, 18);
        horizontalLava(20, 11); horizontalLava(61, 10);
      })
    },
    {
      name: "熔滴长廊",
      hint: "熔滴落点覆盖主要平台，先看下落节奏，再决定冲刺或停在平台边缘。",
      plan: planBuilder(104, 29, ({ wall, lava, player, coin, checkpoint, drippingLava }) => {
        wall(1, 4, 1, 23); wall(102, 4, 1, 23);
        wall(1, 25, 13, 2); lava(14, 25, 6, 2); wall(20, 25, 13, 2);
        lava(33, 25, 7, 2); wall(40, 25, 14, 2); lava(54, 25, 6, 2);
        wall(60, 25, 13, 2); lava(73, 25, 7, 2); wall(80, 25, 23, 2);
        wall(8, 23, 4); wall(21, 21, 5); wall(28, 18, 4); wall(41, 23, 5);
        wall(49, 20, 4); wall(61, 23, 4); wall(67, 20, 4); wall(81, 22, 5); wall(91, 19, 5);
        player(4, 24);
        coin(9, 22); coin(22, 20); coin(29, 17); coin(43, 22); coin(50, 19);
        coin(62, 22); coin(68, 19); coin(82, 21); coin(92, 18); coin(99, 24);
        checkpoint(44, 21);
        drippingLava(10, 7); drippingLava(24, 6); drippingLava(44, 7);
        drippingLava(63, 6); drippingLava(83, 7); drippingLava(94, 6);
      })
    },
    {
      name: "高温核心",
      hint: "机关开始混合出现；检查点就在中段安全平台上，不需要冒险碰触墙体。",
      plan: planBuilder(110, 30, ({ wall, lava, player, coin, checkpoint, horizontalLava, verticalLava, drippingLava }) => {
        wall(1, 3, 1, 25); wall(108, 3, 1, 25);
        wall(1, 26, 12, 2); lava(13, 26, 7, 2); wall(20, 26, 13, 2);
        lava(33, 26, 6, 2); wall(39, 26, 14, 2); lava(53, 26, 7, 2);
        wall(60, 26, 13, 2); lava(73, 26, 7, 2); wall(80, 26, 12, 2);
        lava(92, 26, 7, 2); wall(99, 26, 10, 2);
        wall(7, 24, 4); wall(21, 22, 5); wall(28, 19, 4); wall(40, 24, 5);
        wall(47, 21, 4); wall(61, 24, 4); wall(67, 20, 4); wall(81, 23, 4);
        wall(87, 19, 4); wall(100, 22, 5);
        wall(23, 11, 14); wall(63, 10, 14);
        player(4, 25);
        coin(8, 23); coin(22, 21); coin(29, 18); coin(42, 23); coin(48, 20);
        coin(62, 23); coin(68, 19); coin(82, 22); coin(88, 18); coin(101, 21); coin(106, 25);
        checkpoint(43, 22); checkpoint(83, 21);
        horizontalLava(25, 10); horizontalLava(66, 9);
        verticalLava(63, 17); drippingLava(90, 8); drippingLava(103, 7);
      })
    },
    {
      name: "碎岛熔海",
      hint: "落脚岛变窄、间距变长。保持助跑，但落地前要及时松开方向键。",
      plan: planBuilder(112, 30, ({ wall, lava, player, coin, checkpoint, drippingLava }) => {
        wall(1, 3, 1, 25); wall(110, 3, 1, 25);
        wall(1, 26, 12, 2); lava(13, 26, 6, 2); wall(19, 26, 5, 2);
        lava(24, 26, 7, 2); wall(31, 26, 5, 2); lava(36, 26, 7, 2);
        wall(43, 26, 6, 2); lava(49, 26, 7, 2); wall(56, 26, 7, 2);
        lava(63, 26, 7, 2); wall(70, 26, 5, 2); lava(75, 26, 7, 2);
        wall(82, 26, 5, 2); lava(87, 26, 7, 2); wall(94, 26, 17, 2);
        wall(20, 23, 3); wall(32, 22, 3); wall(44, 23, 4); wall(57, 22, 5);
        wall(71, 22, 3); wall(83, 22, 3); wall(96, 23, 4); wall(104, 20, 4);
        player(4, 25);
        coin(10, 25); coin(20, 22); coin(32, 21); coin(45, 22); coin(59, 21);
        coin(71, 21); coin(83, 21); coin(97, 22); coin(105, 19); coin(108, 25);
        checkpoint(58, 20);
        drippingLava(34, 7); drippingLava(60, 6); drippingLava(85, 7); drippingLava(106, 6);
      })
    },
    {
      name: "逆压升降井",
      hint: "高低差、熔岩坑和升降熔岩同时出现，优先寻找下一块宽平台。",
      plan: planBuilder(116, 31, ({ wall, lava, player, coin, checkpoint, verticalLava, horizontalLava }) => {
        wall(1, 3, 1, 26); wall(114, 3, 1, 26);
        wall(1, 27, 12, 2); lava(13, 27, 7, 2); wall(20, 27, 12, 2);
        lava(32, 27, 7, 2); wall(39, 27, 13, 2); lava(52, 27, 7, 2);
        wall(59, 27, 12, 2); lava(71, 27, 7, 2); wall(78, 27, 12, 2);
        lava(90, 27, 7, 2); wall(97, 27, 18, 2);
        wall(7, 25, 4); wall(20, 23, 4); wall(27, 20, 4); wall(40, 24, 4);
        wall(46, 21, 4); wall(60, 24, 4); wall(66, 20, 4); wall(79, 23, 4);
        wall(85, 19, 4); wall(98, 23, 4); wall(106, 19, 5);
        wall(18, 10, 16); wall(74, 10, 18);
        player(4, 26);
        coin(8, 24); coin(21, 22); coin(28, 19); coin(41, 23); coin(47, 20);
        coin(61, 23); coin(67, 19); coin(80, 22); coin(86, 18); coin(99, 22); coin(108, 18); coin(112, 26);
        checkpoint(61, 22);
        verticalLava(43, 16); verticalLava(100, 15);
        horizontalLava(20, 9); horizontalLava(77, 9);
      })
    },
    {
      name: "红区警报",
      hint: "第九关几乎没有休息区。利用检查点拆分路线，不要一次贪多个金币。",
      plan: planBuilder(122, 31, ({ wall, lava, player, coin, checkpoint, horizontalLava, verticalLava, drippingLava }) => {
        wall(1, 3, 1, 26); wall(120, 3, 1, 26);
        wall(1, 27, 11, 2); lava(12, 27, 7, 2); wall(19, 27, 11, 2);
        lava(30, 27, 7, 2); wall(37, 27, 12, 2); lava(49, 27, 7, 2);
        wall(56, 27, 12, 2); lava(68, 27, 7, 2); wall(75, 27, 11, 2);
        lava(86, 27, 7, 2); wall(93, 27, 11, 2); lava(104, 27, 7, 2);
        wall(111, 27, 10, 2);
        wall(6, 24, 4); wall(20, 23, 4); wall(26, 20, 3); wall(38, 24, 4);
        wall(44, 20, 4); wall(57, 23, 4); wall(63, 19, 4); wall(76, 23, 4);
        wall(82, 19, 4); wall(94, 23, 4); wall(100, 19, 4); wall(112, 22, 5);
        wall(17, 9, 15); wall(73, 9, 16);
        player(4, 26);
        coin(7, 23); coin(21, 22); coin(27, 19); coin(39, 23); coin(45, 19);
        coin(58, 22); coin(64, 18); coin(77, 22); coin(83, 18); coin(95, 22);
        coin(101, 18); coin(113, 21); coin(118, 26);
        checkpoint(58, 21); checkpoint(95, 21);
        horizontalLava(19, 8); horizontalLava(76, 8);
        verticalLava(59, 15); verticalLava(114, 14);
        drippingLava(28, 6); drippingLava(65, 6); drippingLava(102, 6);
      })
    },
    {
      name: "终极熔炉",
      hint: "最终关综合全部机关，并使用最长熔岩坑与窄平台。两个检查点会保存进度。",
      plan: planBuilder(132, 32, ({ wall, lava, player, coin, checkpoint, horizontalLava, verticalLava, drippingLava }) => {
        wall(1, 3, 1, 27); wall(130, 3, 1, 27);
        wall(1, 28, 11, 2); lava(12, 28, 7, 2); wall(19, 28, 10, 2);
        lava(29, 28, 8, 2); wall(37, 28, 11, 2); lava(48, 28, 7, 2);
        wall(55, 28, 11, 2); lava(66, 28, 8, 2); wall(74, 28, 11, 2);
        lava(85, 28, 7, 2); wall(92, 28, 10, 2); lava(102, 28, 8, 2);
        wall(110, 28, 21, 2);
        wall(6, 25, 4); wall(20, 24, 4); wall(26, 20, 3); wall(38, 24, 4);
        wall(44, 20, 3); wall(56, 24, 4); wall(62, 20, 3); wall(75, 23, 4);
        wall(81, 19, 3); wall(93, 23, 4); wall(99, 19, 3); wall(111, 23, 4);
        wall(118, 19, 4); wall(125, 23, 4);
        wall(17, 9, 16); wall(70, 9, 17); wall(108, 8, 18);
        player(4, 27);
        coin(7, 24); coin(21, 23); coin(27, 19); coin(39, 23); coin(45, 19);
        coin(57, 23); coin(63, 19); coin(76, 22); coin(82, 18); coin(94, 22);
        coin(100, 18); coin(112, 22); coin(119, 18); coin(126, 22); coin(128, 27);
        checkpoint(57, 22); checkpoint(94, 21);
        horizontalLava(19, 8); horizontalLava(73, 8); horizontalLava(111, 7);
        verticalLava(58, 15); verticalLava(114, 14);
        drippingLava(28, 6); drippingLava(64, 6); drippingLava(83, 6); drippingLava(120, 5);
      })
    }
  ];

  const levels = levelDefinitions.map((definition) => new Level(definition.plan, definition.name, definition.hint));

  const keys = {
    left: false,
    right: false,
    down: false,
    jump: false,
    jumpPressed: false,
    jumpReleased: false,
    clearTransient() {
      this.jumpPressed = false;
      this.jumpReleased = false;
    }
  };

  function setControl(control, active) {
    if (control === "left" || control === "right" || control === "down") keys[control] = active;
    if (control === "jump") {
      if (active && !keys.jump) keys.jumpPressed = true;
      if (!active && keys.jump) keys.jumpReleased = true;
      keys.jump = active;
    }
  }

  function releaseControls() {
    keys.left = false;
    keys.right = false;
    keys.down = false;
    keys.jump = false;
    keys.clearTransient();
  }

  const keyMap = new Map([
    ["ArrowLeft", "left"], ["KeyA", "left"],
    ["ArrowRight", "right"], ["KeyD", "right"],
    ["ArrowUp", "jump"], ["KeyW", "jump"],
    ["ArrowDown", "down"], ["KeyS", "down"]
  ]);

  let controller = null;
  let messageTimer = 0;

  function showMessage(text, duration = 1800) {
    window.clearTimeout(messageTimer);
    messageElement.textContent = text;
    messageElement.classList.add("visible");
    messageTimer = window.setTimeout(() => messageElement.classList.remove("visible"), duration);
  }

  function playTone(frequency, delay, duration, type = "square", volume = 0.045) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    if (!audioContext) audioContext = new AudioContext();
    audioContext.resume?.();

    const start = audioContext.currentTime + delay;
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(start);
    oscillator.stop(start + duration);
  }

  function playCheatSound(mode) {
    const sounds = {
      invincible: [
        [220, 0, 0.12, "square"], [330, 0.1, 0.12, "square"],
        [440, 0.2, 0.18, "square"], [660, 0.34, 0.24, "triangle"]
      ],
      flight: [
        [330, 0, 0.18, "sine"], [495, 0.09, 0.2, "sine"],
        [660, 0.18, 0.24, "sine"], [990, 0.32, 0.28, "triangle"]
      ],
      pass: [
        [520, 0, 0.09, "triangle"], [660, 0.07, 0.09, "triangle"],
        [780, 0.14, 0.1, "triangle"], [1040, 0.23, 0.25, "square"]
      ],
      off: [
        [620, 0, 0.1, "triangle"], [465, 0.08, 0.12, "triangle"],
        [310, 0.18, 0.2, "sine"]
      ]
    };
    sounds[mode].forEach(([frequency, delay, duration, type]) => playTone(frequency, delay, duration, type));
  }

  function playResultSound(final = false) {
    const notes = final ? [
      [392, 0, 0.16, "triangle", 0.05], [523, 0.12, 0.18, "triangle", 0.05],
      [659, 0.25, 0.2, "triangle", 0.055], [784, 0.4, 0.22, "square", 0.045],
      [1047, 0.57, 0.5, "sine", 0.06]
    ] : [
      [440, 0, 0.12, "triangle", 0.045], [554, 0.1, 0.13, "triangle", 0.045],
      [659, 0.2, 0.18, "triangle", 0.05], [880, 0.34, 0.32, "sine", 0.055]
    ];
    notes.forEach(([frequency, delay, duration, type, volume]) => playTone(frequency, delay, duration, type, volume));
  }

  let cheatBuffer = "";
  let lastCheatKeyAt = 0;

  function registerCheatKey(key) {
    const now = performance.now();
    if (now - lastCheatKeyAt > 2500) cheatBuffer = "";
    lastCheatKeyAt = now;
    cheatBuffer = `${cheatBuffer}${key}`.slice(-6);

    if (cheatBuffer.endsWith("FLAVOR")) {
      cheatBuffer = "";
      controller?.toggleCheat("invincible");
      return true;
    }
    if (cheatBuffer.endsWith("STUDIO")) {
      cheatBuffer = "";
      controller?.toggleCheat("flight");
      return true;
    }
    if (cheatBuffer.endsWith("PASS")) {
      cheatBuffer = "";
      controller?.passLevel();
      return true;
    }
    return false;
  }

  class GameController {
    constructor(gameLevels) {
      this.levels = gameLevels;
      this.levelIndex = 0;
      this.deaths = 0;
      this.paused = false;
      this.completed = false;
      this.awaitingResult = false;
      this.autoAdvance = false;
      this.display = null;
      this.state = null;
      this.lastTime = null;
      this.loadLevel(0);
      requestAnimationFrame((time) => this.frame(time));
    }

    loadLevel(index) {
      if (this.display) this.display.clear();
      this.paused = false;
      this.completed = false;
      this.awaitingResult = false;
      this.autoAdvance = false;
      pauseOverlay.hidden = true;
      resultOverlay.hidden = true;
      resultOverlay.classList.remove("final");
      pauseButton.textContent = "暂停";
      releaseControls();
      this.levelIndex = index;
      const level = this.levels[index];
      this.state = State.start(level);
      this.display = new DOMDisplay(gameShell, level);
      this.display.syncState(this.state);
      levelValue.textContent = `${index + 1} / ${this.levels.length}`;
      levelName.textContent = level.name;
      this.updateHud();
    }

    updateHud() {
      const totalCoins = this.state.level.startActors.filter((actor) => actor.type === "coin").length;
      const remainingCoins = this.state.actors.filter((actor) => actor.type === "coin").length;
      coinValue.textContent = `${totalCoins - remainingCoins} / ${totalCoins}`;
      deathValue.textContent = String(this.deaths);
    }

    step(time) {
      if (this.paused || this.completed || this.awaitingResult) return;
      this.state = this.state.update(time, keys);
      this.display.syncState(this.state);
      this.updateHud();

      if (this.state.status === "lost" && this.state.finishDelay <= 0) {
        this.deaths += 1;
        this.state = this.state.respawn();
        this.display.syncState(this.state);
        this.updateHud();
        showMessage("已返回最近的检查点", 1000);
      }

      if (this.state.status === "won" && this.state.finishDelay <= 0) {
        this.finishLevel();
      }
    }

    finishLevel() {
      const final = this.levelIndex + 1 >= this.levels.length;
      if (this.autoAdvance && !final) {
        this.loadLevel(this.levelIndex + 1);
        return;
      }

      this.autoAdvance = false;
      this.awaitingResult = true;
      this.completed = final;
      releaseControls();

      const totalCoins = this.state.level.startActors.filter((actor) => actor.type === "coin").length;
      resultOverlay.hidden = false;
      resultOverlay.classList.toggle("final", final);
      resultLabel.textContent = final ? "ALL LEVELS CLEAR" : "LEVEL CLEAR";
      resultTitle.textContent = final ? "熔炉已征服" : `第 ${this.levelIndex + 1} 关完成`;
      resultCopy.textContent = final
        ? "十个关卡的金币已全部收入囊中。你已经穿过整座熔岩工厂。"
        : `“${this.state.level.name}”的金币已全部收集，下一段路线已经开放。`;
      resultLevel.textContent = `${this.levelIndex + 1} / ${this.levels.length}`;
      resultCoins.textContent = `${totalCoins} / ${totalCoins}`;
      resultDeaths.textContent = String(this.deaths);
      resultButton.textContent = final ? "再玩一次 ↻" : "进入下一关 →";
      playResultSound(final);
    }

    continueFromResult() {
      if (resultOverlay.hidden) return;
      resultOverlay.hidden = true;

      if (this.completed) {
        cheats.invincible = false;
        cheats.flight = false;
        this.deaths = 0;
        this.loadLevel(0);
        return;
      }

      this.loadLevel(this.levelIndex + 1);
    }

    frame(time) {
      if (this.lastTime !== null) {
        let elapsed = Math.min(time - this.lastTime, 100) / 1000;
        let firstStep = true;
        while (elapsed > 0) {
          const step = Math.min(elapsed, 0.02);
          this.step(step);
          elapsed -= step;
          if (firstStep) {
            keys.clearTransient();
            firstStep = false;
          }
        }
      }
      this.lastTime = time;
      requestAnimationFrame((nextTime) => this.frame(nextTime));
    }

    restartCurrent() {
      if (this.completed) {
        cheats.invincible = false;
        cheats.flight = false;
        this.deaths = 0;
        this.loadLevel(0);
        return;
      }
      resultOverlay.hidden = true;
      this.awaitingResult = false;
      this.deaths += 1;
      this.loadLevel(this.levelIndex);
      this.updateHud();
      showMessage("当前关卡已重开", 1000);
    }

    togglePause() {
      if (this.completed || this.awaitingResult) return;
      this.paused = !this.paused;
      pauseButton.textContent = this.paused ? "继续" : "暂停";
      pauseOverlay.hidden = !this.paused;
      if (this.paused) releaseControls();
      showMessage(this.paused ? "游戏已暂停" : "继续游戏", 900);
    }

    resize() {
      this.display?.resize();
    }

    toggleCheat(mode) {
      if (mode !== "invincible" && mode !== "flight") return;
      const enabled = !cheats[mode];
      cheats[mode] = enabled;

      if (enabled) playCheatSound(mode);
      else playCheatSound("off");

      if (mode === "invincible") {
        showMessage(`已${enabled ? "开启" : "关闭"}作弊模式:无敌`, 3200);
      }
      if (mode === "flight") {
        showMessage(enabled
          ? "已开启作弊模式:飞行（W/↑上升，S/↓下降）"
          : "已关闭作弊模式:飞行", 3800);
      }
      this.display.syncState(this.state);
    }

    passLevel() {
      if (this.completed || this.awaitingResult || this.state.status === "won") return;
      if (this.paused) {
        this.paused = false;
        pauseOverlay.hidden = true;
        pauseButton.textContent = "暂停";
      }
      const actors = this.state.actors.filter((actor) => actor.type !== "coin");
      this.state = new State(this.state.level, actors, "won", 0.85, this.state.checkpoint);
      this.autoAdvance = true;
      this.display.syncState(this.state);
      this.updateHud();
      playCheatSound("pass");
      showMessage("已开启作弊模式:跳过关卡", 2200);
    }

    debugState() {
      const player = this.state.player;
      return {
        level: this.levelIndex + 1,
        levelName: this.state.level.name,
        status: this.state.status,
        paused: this.paused,
        awaitingResult: this.awaitingResult,
        completed: this.completed,
        deaths: this.deaths,
        cheats: { ...cheats },
        player: { x: player.pos.x, y: player.pos.y, vx: player.speed.x, vy: player.speed.y, grounded: player.grounded },
        coins: {
          remaining: this.state.actors.filter((actor) => actor.type === "coin").length,
          total: this.state.level.startActors.filter((actor) => actor.type === "coin").length
        },
        checkpoint: { x: this.state.checkpoint.x, y: this.state.checkpoint.y }
      };
    }
  }

  window.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !event.repeat && controller && !controller.awaitingResult && !controller.completed) {
      event.preventDefault();
      controller.togglePause();
      return;
    }

    if (event.key.length === 1 && /[a-z]/i.test(event.key)) {
      const activated = registerCheatKey(event.key.toUpperCase());
      if (activated) {
        event.preventDefault();
        return;
      }
    }

    const control = keyMap.get(event.code);
    if (control) {
      event.preventDefault();
      setControl(control, true);
    }
    if (event.code === "KeyR") {
      event.preventDefault();
      controller?.restartCurrent();
    }
    if (event.code === "Escape") {
      event.preventDefault();
      controller?.togglePause();
    }
  });

  window.addEventListener("keyup", (event) => {
    const control = keyMap.get(event.code);
    if (!control) return;
    event.preventDefault();
    setControl(control, false);
  });

  document.querySelectorAll("[data-control]").forEach((button) => {
    const control = button.dataset.control;
    const activate = (event) => {
      event.preventDefault();
      button.setPointerCapture?.(event.pointerId);
      button.classList.add("active");
      setControl(control, true);
    };
    const deactivate = (event) => {
      event.preventDefault();
      button.classList.remove("active");
      setControl(control, false);
    };
    button.addEventListener("pointerdown", activate);
    button.addEventListener("pointerup", deactivate);
    button.addEventListener("pointercancel", deactivate);
    button.addEventListener("lostpointercapture", deactivate);
  });

  pauseButton.addEventListener("click", () => controller?.togglePause());
  restartButton.addEventListener("click", () => controller?.restartCurrent());
  resultButton.addEventListener("click", () => controller?.continueFromResult());
  window.addEventListener("resize", () => controller?.resize());
  window.addEventListener("blur", releaseControls);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && controller && !controller.paused) controller.togglePause();
  });

  window.__lavaGame = Object.freeze({
    physics: {
      gravity: GRAVITY,
      runSpeed: PLAYER_X_SPEED,
      flightSpeed: FLIGHT_SPEED,
      jumpSpeed: JUMP_SPEED,
      jumpHeight: Number((JUMP_SPEED * JUMP_SPEED / (2 * GRAVITY)).toFixed(2)),
      coyoteTime: COYOTE_TIME,
      jumpBuffer: JUMP_BUFFER
    },
    getState: () => controller?.debugState(),
    loadLevel: (number) => {
      const index = Math.max(0, Math.min(levels.length - 1, Number(number) - 1));
      controller.loadLevel(index);
      return controller.debugState();
    },
    restart: () => controller?.restartCurrent(),
    levelCount: levels.length,
    validate: () => levelDefinitions.map((definition, index) => ({
      level: index + 1,
      name: definition.name,
      width: definition.plan[0].length,
      height: definition.plan.length,
      equalRows: definition.plan.every((row) => row.length === definition.plan[0].length),
      players: definition.plan.join("").split("@").length - 1,
      coins: definition.plan.join("").split("o").length - 1
    }))
  });

  controller = new GameController(levels);
})();
