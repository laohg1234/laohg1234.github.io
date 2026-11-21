(() => {
  'use strict';

  const F = FG;
  const width = 9;
  const height = 6;
  const tileSize = 72;
  const boardX = 36;
  const boardY = 104;
  const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]];
  const colors = ['', '#ff6565', '#6bffa2', '#ffd66e', '#79aaff', '#ed90ff', '#76f8ec', '#fff4dc'];
  const names = ['', '红光', '绿光', '黄光', '蓝光', '紫光', '青光', '白光'];
  const point = (x, y) => [boardX + (x + .5) * tileSize, boardY + (y + .5) * tileSize];
  const idAt = (x, y) => y * width + x;
  const mirror = (x, y, answer, start = answer ^ 1) => ({x, y, type: 'mirror', answer, start});
  const splitter = (x, y, answer, start = answer ^ 1) => ({x, y, type: 'splitter', answer, start});
  const filter = (x, y, mask, answer, start = answer ^ 1) => ({x, y, type: 'filter', mask, answer, start});
  const source = (x, y, mask, direction = 0) => ({x, y, type: 'source', mask, direction});
  const receiver = (x, y, mask) => ({x, y, type: 'receiver', mask});
  const block = (x, y) => ({x, y, type: 'block'});

  const levels = [
    {
      title: '校准室', subtitle: '反光镜改变光束方向',
      explanation: '转动两面银色反光镜，让青色光束绕过隔板。',
      cells: [source(0,4,6), receiver(7,1,6), mirror(3,4,0), mirror(3,1,0), block(6,4), block(6,3), block(6,2), block(1,1)]
    },
    {
      title: '双路供能', subtitle: '棱镜同时透射和反射',
      explanation: '金色棱镜会把一束光分成两路。直行的一路还能继续转弯。',
      cells: [source(4,5,3,3), receiver(8,3,3), receiver(1,1,3), splitter(4,3,0), mirror(4,1,1), mirror(6,1,0,0), block(4,0), block(7,2), block(2,4), block(1,4)]
    },
    {
      title: '色谱分流', subtitle: '滤镜只通过指定颜色',
      explanation: '白光中含有红、绿、蓝。滤镜的亮线表示通光方向。',
      cells: [source(0,3,7), receiver(8,3,1), receiver(8,5,4), splitter(3,3,1), mirror(3,5,1), filter(5,3,1,0), filter(5,5,4,0), block(3,0), block(6,4), block(7,4), block(6,2)]
    },
    {
      title: '合束塔', subtitle: '不同颜色可以叠加',
      explanation: '紫色接收器需要红光和蓝光同时抵达。另一条绿光单独供电。',
      cells: [source(0,1,1), source(0,4,4), source(8,4,2,2), receiver(5,2,5), receiver(7,0,2), mirror(5,1,1), mirror(5,4,0), mirror(7,4,1), block(2,2), block(2,3), block(4,3), block(8,1)]
    },
    {
      title: '隔离廊桥', subtitle: '经过狭窄的通光窗口',
      explanation: '把绿光送到上层。下层的红光需要沿另一路穿过隔板。',
      cells: [source(0,2,7), splitter(2,2,1), mirror(2,4,1), filter(4,4,1,0), receiver(8,4,1), mirror(5,2,0), filter(5,1,2,1), mirror(5,0,0), receiver(8,0,2), mirror(4,1,0,0), block(3,1), block(3,3), block(4,3), block(5,3), block(6,2), block(6,1), block(7,1), block(1,0), block(2,0)]
    },
    {
      title: '主反应堆', subtitle: '分光、滤色与汇合',
      explanation: '顶层维持红光支路。把红、绿、蓝三路一起引入中央接收器。',
      cells: [source(0,2,7), splitter(3,2,0), filter(3,1,1,1), mirror(3,0,0), splitter(6,0,1), receiver(8,0,1), filter(5,2,2,0), mirror(7,2,1), mirror(7,3,0), source(0,5,4), mirror(6,5,0), receiver(6,3,7), block(1,0), block(1,1), block(1,3), block(2,3), block(4,1), block(5,1), block(8,1), block(8,4), block(4,4), block(5,4)]
    }
  ];

  function trace(cells, turns) {
    const queue = [];
    const visited = new Set();
    const received = new Map();
    const segments = new Map();

    function add(x, y, direction, mask) {
      const key = `${x},${y},${direction},${mask}`;
      if (!mask || visited.has(key)) return;
      visited.add(key);
      queue.push({x, y, direction, mask});
    }

    for (const cell of cells.values()) {
      if (cell.type === 'source') add(cell.x, cell.y, cell.direction, cell.mask);
    }
    for (const {x, y, direction, mask} of queue) {
      const [dx, dy] = directions[direction];
      const nx = x + dx;
      const ny = y + dy;
      const from = point(x, y);
      const to = point(nx, ny);
      const outside = nx < 0 || nx >= width || ny < 0 || ny >= height;
      if (outside) {
        to[0] -= dx * tileSize * .55;
        to[1] -= dy * tileSize * .55;
      }
      const edge = [from, to].map(pos => pos.join(':')).sort().join('/');
      const previous = segments.get(edge);
      segments.set(edge, {from, to, mask: mask | (previous?.mask || 0)});
      if (outside) continue;

      const id = idAt(nx, ny);
      const cell = cells.get(id);
      const turn = turns.get(id) || 0;
      if (cell?.type === 'block' || cell?.type === 'source') continue;
      if (cell?.type === 'receiver') {
        received.set(id, mask | (received.get(id) || 0));
        continue;
      }
      if (cell?.type === 'mirror' || cell?.type === 'splitter') {
        const reflected = (turn ? 1 : 3) - direction;
        add(nx, ny, (reflected + 4) % 4, mask);
        if (cell.type === 'mirror') continue;
      }
      if (cell?.type === 'filter') {
        if (direction % 2 === turn) add(nx, ny, direction, mask & cell.mask);
        continue;
      }
      add(nx, ny, direction, mask);
    }
    return {received, segments};
  }

  function create(api) {
    let stage = 0;
    let cells, turns, angles, receivers, signal;
    let history, moves, completed, focus;
    let time = 0;
    let stageMoves = 0;
    let hints = 0;
    let solved = 0;
    let hintId = null;
    let hintText = '';
    let hovered = null;
    let keyboard = false;
    let charge = 0;
    let runFinished = false;
    let background;
    const controls = {
      undo: {x: 722, y: 445, w: 79, h: 46, title: '撤销'},
      reset: {x: 811, y: 445, w: 79, h: 46, title: '重置'},
      hint: {x: 900, y: 445, w: 79, h: 46, title: '提示'},
      advance: {x: 722, y: 510, w: 257, h: 55, title: '下一关'}
    };

    function prepare() {
      cells = new Map(levels[stage].cells.map(cell => [idAt(cell.x, cell.y), cell]));
      turns = new Map();
      angles = new Map();
      receivers = [...cells.values()].filter(cell => cell.type === 'receiver');
      for (const [id, cell] of cells) {
        if (cell.start === undefined) continue;
        turns.set(id, cell.start);
        angles.set(id, (cell.start + (cell.type === 'filter' ? 0 : -.5)) * Math.PI / 2);
      }
      history = [];
      moves = 0;
      completed = false;
      charge = 0;
      hintId = null;
      hintText = '';
      hovered = null;
      focus = turns.keys().next().value;
      signal = trace(cells, turns);
    }

    function activeReceivers() {
      return receivers.filter(cell => signal.received.get(idAt(cell.x, cell.y)) === cell.mask).length;
    }

    function recompute() {
      signal = trace(cells, turns);
      const powered = activeReceivers();
      api.setScore?.(solved * 1000 + powered * 60);
      if (powered !== receivers.length) return;
      completed = true;
      api.sound('skill');
    }

    function rotate(id) {
      if (completed || !turns.has(id)) return;
      const before = turns.get(id);
      history.push([id, before]);
      turns.set(id, before ^ 1);
      focus = id;
      if (hintId === id) {
        hintId = null;
        hintText = '';
      }
      moves++;
      stageMoves++;
      api.sound('click');
      recompute();
    }

    function activate(action) {
      if (runFinished) return;
      if (completed) {
        if (action !== 'advance') return;
        solved++;
        if (solved < levels.length) {
          stage++;
          prepare();
          api.setScore?.(solved * 1000);
        } else {
          runFinished = true;
          const score = Math.max(6000, 8200 - stageMoves * 24 - hints * 100);
          api.finish(true, score, `六间机房全部恢复供电。共操作 ${stageMoves} 次，使用 ${hints} 次提示。`);
        }
        return;
      }
      if (action === 'undo' && history.length) {
        const [id, before] = history.pop();
        turns.set(id, before);
        focus = id;
        hintId = null;
        hintText = '';
        moves++;
        stageMoves++;
        api.sound('click');
        recompute();
      }
      if (action === 'reset') {
        prepare();
        recompute();
        api.sound('click');
      }
      if (action === 'hint') {
        if (hintId !== null) return;
        const changed = [...turns].find(([id, turn]) => turn !== cells.get(id).answer);
        if (!changed) return;
        hintId = changed[0];
        const cell = cells.get(hintId);
        const part = {mirror: '反光镜', splitter: '棱镜', filter: '滤镜'}[cell.type];
        hintText = `试试转动高亮的${part}。`;
        hints++;
        api.sound('click');
      }
    }

    function drawBackground(ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 1000, 620);
      gradient.addColorStop(0, '#1f302c');
      gradient.addColorStop(.6, '#101d1b');
      gradient.addColorStop(1, '#192520');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 1000, 620);
      for (let x = 19; x < 1000; x += 31) {
        for (let y = 19; y < 620; y += 31) {
          ctx.fillStyle = '#8da89720';
          ctx.fillRect(x, y, 1, 1);
        }
      }
      F.rect(ctx, boardX - 10, boardY - 10, 668, 452, '#0c1412', 12);
      F.rect(ctx, boardX - 5, boardY - 5, 658, 442, '#597066', 7);
      F.rect(ctx, boardX - 2, boardY - 2, 652, 436, '#101c18', 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const px = boardX + x * tileSize;
          const py = boardY + y * tileSize;
          F.rect(ctx, px + 1, py + 1, tileSize - 2, tileSize - 2, (x + y) % 2 ? '#1b2924' : '#1d2c27', 3);
          F.line(ctx, px + 5, py + 5, px + 16, py + 5, '#728a7738', 1);
          F.line(ctx, px + 5, py + 5, px + 5, py + 15, '#728a7738', 1);
        }
      }
      F.line(ctx, 25, 86, 984, 86, '#667e6a77', 1);
      F.line(ctx, 707, 96, 707, 605, '#667e6a77', 1);
      F.line(ctx, 25, 561, 695, 561, '#667e6a77', 1);
      for (const [x, y] of [[21, 88], [699, 88], [21, 553], [699, 553], [986, 88], [986, 599]]) {
        F.circle(ctx, x, y, 4, '#0c1611');
        F.line(ctx, x - 2, y + 1, x + 2, y - 1, '#758c79', 1);
      }
    }

    function drawBeam(ctx, {from, to, mask}) {
      const color = colors[mask];
      ctx.lineCap = 'round';
      F.line(ctx, ...from, ...to, color + '20', 19);
      F.line(ctx, ...from, ...to, color + '69', 9);
      F.line(ctx, ...from, ...to, color, 4);
      F.line(ctx, ...from, ...to, '#ffffe4cf', 1.4);
      for (let i = 0; i < 3; i++) {
        if (api.reduceMotion) break;
        const p = (time * .65 + i / 3) % 1;
        F.circle(ctx, from[0] + (to[0] - from[0]) * p, from[1] + (to[1] - from[1]) * p, 1.8, '#fffbea');
      }
    }

    function drawCell(ctx, id, cell) {
      const [x, y] = point(cell.x, cell.y);
      const color = colors[cell.mask] || '#c5e6d5';
      ctx.save();
      ctx.translate(x, y);
      if (cell.type === 'block') {
        F.rect(ctx, -31, -31, 62, 64, '#0d1713', 6);
        F.rect(ctx, -29, -30, 58, 57, '#35443b', 5);
        F.rect(ctx, -24, -25, 48, 47, '#26362e', 3);
        for (let i = -16; i <= 16; i += 8) F.line(ctx, -17, i, 17, i, '#44574b', 2.5);
        F.circle(ctx, -24, -25, 2, '#839482');
        F.circle(ctx, 24, 23, 2, '#839482');
      } else if (cell.type === 'source') {
        ctx.rotate(cell.direction * Math.PI / 2);
        F.rect(ctx, -27, -24, 48, 52, '#091310', 8);
        F.rect(ctx, -26, -27, 49, 46, '#53695d', 7);
        F.rect(ctx, -23, -23, 35, 38, '#182a24', 4);
        F.rect(ctx, 7, -12, 20, 17, color, 5);
        F.rect(ctx, 9, -8, 14, 9, '#fff6dc', 3);
        F.poly(ctx, [[-15,-13], [-4,-4], [-15,5]], color);
        F.line(ctx, -23, 22, 18, 22, '#a0b8a060', 2);
      } else if (cell.type === 'receiver') {
        const actual = signal.received.get(id) || 0;
        const charged = actual === cell.mask;
        if (charged) F.circle(ctx, 0, 0, 32 + (api.reduceMotion ? 0 : Math.sin(time * 5) * 2), color + '45');
        F.circle(ctx, 0, 3, 27, '#07140f');
        F.circle(ctx, 0, 0, 25, color);
        F.circle(ctx, 0, 0, 21, '#1a2a24');
        F.circle(ctx, 0, 0, 12, actual ? colors[actual] : '#30473b');
        if (charged) {
          F.line(ctx, -6, 0, -1, 5, '#102b22', 3);
          F.line(ctx, -1, 5, 8, -6, '#102b22', 3);
        }
        for (let i = 0; i < 4; i++) {
          const a = i * Math.PI / 2 + Math.PI / 4;
          F.circle(ctx, Math.cos(a) * 21, Math.sin(a) * 21, 2, '#b1cab6');
        }
        F.text(ctx, names[cell.mask][0], 0, 30, 12, color, 'center');
      } else {
        const focused = keyboard && focus === id;
        const highlight = hovered === id || focused || hintId === id;
        if (highlight) {
          F.rect(ctx, -33, -33, 66, 66, hintId === id ? '#ffcd6a' : '#9dedc1', 6);
          F.rect(ctx, -31, -31, 62, 62, '#283d33', 4);
        }
        F.circle(ctx, 0, 2, 24, '#0c1711');
        F.circle(ctx, 0, 0, 23, '#608071');
        F.circle(ctx, 0, 0, 20, '#2c4038');
        for (let i = 0; i < 8; i++) {
          const a = i * Math.PI / 4;
          F.circle(ctx, Math.sin(a) * 18, Math.cos(a) * 18, 1.3, '#86a992');
        }
        ctx.rotate(angles.get(id));
        if (cell.type === 'mirror') {
          F.rect(ctx, -26, -6, 52, 15, '#112e2b', 4);
          F.rect(ctx, -26, -7, 52, 11, '#b5e0df', 3);
          F.rect(ctx, -22, -5, 44, 3, '#f4ffe7', 2);
          F.line(ctx, -20, 7, 21, 7, '#599e9d', 2);
        } else if (cell.type === 'splitter') {
          F.poly(ctx, [[-26,0], [0,-16], [26,0], [0,16]], '#d4a254', '#ffde91');
          F.poly(ctx, [[-26,0], [0,-16], [26,0], [0,3]], '#ffe29e');
          F.line(ctx, -24, 0, 24, 0, '#fff5cf', 2);
        } else {
          F.rect(ctx, -24, -10, 48, 20, '#152721', 5);
          F.rect(ctx, -20, -7, 40, 14, color + '9b', 3);
          F.line(ctx, -18, 0, 18, 0, color, 3);
          F.line(ctx, -24, -12, -24, 12, '#adbdab', 3);
          F.line(ctx, 24, -12, 24, 12, '#adbdab', 3);
        }
      }
      ctx.restore();
    }

    function button(ctx, command, label, enabled, primary = false) {
      const {x, y, w, h} = controls[command];
      F.rect(ctx, x, y, w, h, enabled ? (primary ? '#a8ecc6' : '#536c5c') : '#32443a', 6);
      F.rect(ctx, x + 1, y + 1, w - 2, h - 2, enabled ? (primary ? '#a8ecc6' : '#253a31') : '#1b2a24', 5);
      F.text(ctx, label, x + w / 2, y + h / 2, primary ? 19 : 16,
        enabled ? (primary ? '#153026' : '#e2e9d9') : '#738678', 'center');
    }

    function draw(ctx) {
      if (!background && typeof document !== 'undefined') {
        background = document.createElement('canvas');
        background.width = 1000;
        background.height = 620;
        drawBackground(background.getContext('2d'));
      }
      if (background) ctx.drawImage(background, 0, 0);
      else drawBackground(ctx);
      const level = levels[stage];
      F.text(ctx, level.title, 34, 38, 29, '#f3f2de');
      F.text(ctx, level.subtitle, 34, 67, 15, '#afd0bc');
      for (let i = 0; i < levels.length; i++) {
        const x = 748 + i * 41;
        F.rect(ctx, x, 27, 33, 30, i === stage ? '#a8ecc6' : i < stage ? '#4e8568' : '#293e34', 4);
        F.text(ctx, String(i + 1), x + 16.5, 43, 15, i === stage ? '#132920' : '#c8decb', 'center');
      }
      ctx.save();
      ctx.beginPath();
      ctx.rect(boardX, boardY, width * tileSize, height * tileSize);
      ctx.clip();
      for (const segment of signal.segments.values()) drawBeam(ctx, segment);
      for (const [id, cell] of cells) drawCell(ctx, id, cell);
      ctx.restore();

      F.text(ctx, '接收器', 723, 123, 20, '#f4f3de');
      F.text(ctx, `${activeReceivers()} / ${receivers.length}`, 973, 123, 17, '#a8ecc6', 'right');
      receivers.forEach((cell, index) => {
        const y = 165 + index * 54;
        const actual = signal.received.get(idAt(cell.x, cell.y)) || 0;
        const done = actual === cell.mask;
        F.rect(ctx, 722, y - 19, 257, 44, '#25382e', 5);
        F.circle(ctx, 743, y + 3, 7, colors[cell.mask]);
        F.text(ctx, names[cell.mask], 759, y + 3, 17, '#f1f0de');
        F.text(ctx, done ? '已供电' : actual ? `收到${names[actual]}` : '待供电', 967, y + 3, 15,
          done ? '#a8ecc6' : actual ? '#ffd992' : '#a0b3a1', 'right');
      });
      F.line(ctx, 722, 275, 979, 275, '#667e6a77', 1);
      F.wrapText(ctx, level.explanation, 723, 302, 250, 18, '#e4eddc', 27);
      if (hintText) F.wrapText(ctx, hintText, 723, 380, 250, 17, '#ffdb8c', 23);
      F.text(ctx, `本关操作 ${moves} 次`, 723, 419, 15, '#a5bba8');
      button(ctx, 'undo', '↶ 撤销', !!history.length && !completed);
      button(ctx, 'reset', '⟳ 重置', !completed);
      button(ctx, 'hint', '◇ 提示', !completed);
      button(ctx, 'advance', stage === levels.length - 1 ? '完成检修  ✓' : '进入下一关  →', completed, true);
      const legends = [['反光镜', '#c5e6d5'], ['分光棱镜', '#ffd88b'], ['滤镜', '#8cf2aa'], ['接收器', '#9ad5ff']];
      legends.forEach(([name, color], i) => {
        const x = 44 + i * 154;
        F.circle(ctx, x, 585, 5, color);
        F.text(ctx, name, x + 13, 585, 16, '#cce0ce');
      });
      if (completed) {
        F.rect(ctx, 722, 570, 257 * Math.min(1, charge), 3, '#a8ecc6', 2);
        F.text(ctx, '线路全部接通', 723, 590, 17, '#a8ecc6');
      }
    }

    function cellAt(x, y) {
      const col = Math.floor((x - boardX) / tileSize);
      const row = Math.floor((y - boardY) / tileSize);
      if (col < 0 || col >= width || row < 0 || row >= height) return null;
      return idAt(col, row);
    }

    prepare();
    return {
      update(dt) {
        time += dt;
        if (completed) charge += dt * 2.4;
        for (const [id, turn] of turns) {
          const offset = cells.get(id).type === 'filter' ? 0 : -.5;
          const to = (turn + offset) * Math.PI / 2;
          angles.set(id, api.reduceMotion ? to : angles.get(id) + (to - angles.get(id)) * Math.min(1, 20 * dt));
        }
      },
      draw,
      pointer(x, y, type) {
        keyboard = false;
        const id = cellAt(x, y);
        hovered = turns.has(id) ? id : null;
        if (type !== 'down') return;
        for (const [action, box] of Object.entries(controls)) {
          if (F.hit(x, y, box.x, box.y, box.w, box.h)) {
            activate(action);
            return;
          }
        }
        rotate(id);
      },
      key(code) {
        keyboard = true;
        if (code === 'Enter') activate('advance');
        else if (code === 'Space') rotate(focus);
        else if (code === 'KeyZ') activate('undo');
        else if (code === 'KeyR') activate('reset');
        else if (code === 'KeyH') activate('hint');
        else if (['ArrowUp', 'ArrowLeft', 'ArrowDown', 'ArrowRight'].includes(code)) {
          const nodes = [...turns.keys()].sort((a, b) => a - b);
          const delta = code === 'ArrowLeft' || code === 'ArrowUp' ? -1 : 1;
          focus = nodes[(nodes.indexOf(focus) + delta + nodes.length) % nodes.length];
        }
      }
    };
  }

  F.register({
    id: 'optics-relay', title: '光路工坊', en: 'Optics Workshop', genre: '光路解谜', category: '解谜实验',
    description: '转动反光镜、分光棱镜和滤镜，让六间机房恢复供电。',
    rules: '接收器必须收到与边框相同的颜色。反光镜改变方向，棱镜分出直行和反射两路，滤镜只允许指定的颜色通过。多束不同颜色可以在接收器叠加。接通一关后继续下一关。',
    controls: '点按元件旋转。方向键切换元件，空格旋转，回车进入下一关。Z 撤销，R 重置，H 提示。',
    mechanic: 'authored optical-routing campaign with directional reflectors, additive spectral mixing, splitting and filters',
    duration: '约 5 分钟', featured: true, touchControls: {direction: false, keys: {}}, create
  });
})();
