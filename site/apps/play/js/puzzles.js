/* FlavorWebGames — 60 independent interactive laboratory puzzles. */
(function () {
  'use strict';
  const G = FG, ink = '#e7edf7', muted = '#8391a9', green = '#c8f183', blue = '#70caff', pink = '#ee93bf', orange = '#ffbd7b';
  const T = G.text;
  let visualId=0,visualTime=0;
  const R=(c,x,y,w,h,color,r=10)=>{G.rect(c,x,y,w,h,color,r);if(!G.art||w<22||h<20||w>850)return;c.save();c.beginPath();c.roundRect(x,y,w,h,Math.min(r,w/3,h/3));c.clip();const g=c.createLinearGradient(x,y,x,y+h);g.addColorStop(0,'#d3edff2b');g.addColorStop(.5,'#ffffff00');g.addColorStop(1,'#06162959');c.fillStyle=g;c.fillRect(x,y,w,h);c.restore();};
  const O=(c,x,y,r,color)=>{G.circle(c,x,y,r,color);if(!G.art||r<10||r>115)return;c.save();const g=c.createRadialGradient(x-r*.3,y-r*.4,r*.05,x,y,r);g.addColorStop(0,'#ffffff66');g.addColorStop(.55,'#ffffff00');g.addColorStop(1,'#06162955');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();c.restore();};
  const L=(c,x,y,X,Y,color,width=2)=>{if(G.art&&width>=4){c.save();c.shadowColor=color;c.shadowBlur=width*1.8;G.line(c,x,y,X,Y,color,width);c.restore();}else G.line(c,x,y,X,Y,color,width);};
  const DISPLAY_NAMES=['激光迷宫','彩光工坊','消除噪音','管道接龙','电路拼图','齿轮机关','网络防守','密码追踪','机器人排班','编程小机器人','镜像双人','分身机关','重力迷宫','折纸解密','编织线路','传送门迷宫','磁铁阵列','卫星对接','树枝生长','积木投影','滤镜调色','量子电路','数字倒带','DNA拼接','化学反应','气压平衡','电台调频','波形拼图','三角定位','透视拼图','连线不交叉','火车调度','电梯装箱','水坝工程','城市供电','天线转向','连锁机关','时间旅行','机器人指令','基因拼图','空间切割','密码转盘','影子拼图','分形迷宫','条纹解密','无线电寻宝','蚂蚁找路','温室花园','压缩密码','纠错密码','数字魔方','内存拼图','机械绘图','音波共振','货船平衡','搭建桥梁','四维迷宫','环形迷宫','双人开锁','节奏编曲'];
  const sceneFor=n=>[8,10,11,12,13,16,18,29,31,32,33,34,41,44,47,48,55,56,57,58].includes(n)?([32,33,34,55,56].includes(n)?'sea':[10,11,12,13,47,48].includes(n)?'garden':'dungeon'):'lab';
  const deviceFor=n=>n===6?'gear':[1,21,30,43,45].includes(n)?'mirror':[7,8,9,19,22,23,38,39,40,49,50,51,52,59].includes(n)?'server':[5,14,15,25,26,35,37].includes(n)?'battery':[2,20,24,28].includes(n)?'prism':'switch';
  const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const sum = a => a.reduce((s, v) => s + v, 0);
  const mod = (a, b) => ((a % b) + b) % b;
  const xy = (i, cols, x = 300, y = 180, step = 60) => [x + i % cols * step, y + Math.floor(i / cols) * step];
  const bits = (n, k = 4) => Array.from({ length: k }, (_, i) => n >> i & 1);
  const positions = n => Array.from({ length: n }, (_, i) => ({ x: 500 + Math.cos(i / n * Math.PI * 2 - Math.PI / 2) * 200, y: 320 + Math.sin(i / n * Math.PI * 2 - Math.PI / 2) * 150 }));
  function wrap(c, s, x, y, width = 900, size = 17, color = muted) {
    c.font = size + 'px "Segoe UI", "Microsoft YaHei", sans-serif';
    let line = ''; for (const ch of s) { if (c.measureText(line + ch).width > width) { T(c, line, x, y, size, color); y += 25; line = ''; } line += ch; } T(c, line, x, y, size, color);
  }
  function add(n, title, en, description, rules, mechanic, build) {
    G.register({ id: 'puzzle-' + String(n).padStart(2, '0'), title:DISPLAY_NAMES[n-1]||title, originalTitle:title, en, genre:DISPLAY_NAMES[n-1]||title, category: '解谜实验', color: [blue, pink, green, orange][n % 4], description, rules,
      controls: '点击画面中的节点、按钮或格子操作；按游戏内提示完成实验。', mechanic, duration: '1–5 分钟',
      create(api) {
        let buttons = [], age = 0, moves = 0, ended = false;
        const p = { hint: rules, api, moves: () => moves,
          button(c, label, x, y, w, fn, color = green, h = 43) { if(G.art)G.art.panel(c,x,y,w,h);else R(c,x,y,w,h,'#223042',9); R(c, x, y, 3, h, color, 1); T(c, label, x + w / 2, y + h / 2+1, 17, color, 'center'); buttons.push({ x, y, w, h, fn }); },
          tile(c, label, x, y, w, h, fn, color = '#27344b', textColor = ink) {if(G.art){G.art.shadow(c,x+w/2,y+h-1,w*.4,h*.12,.2);if(n===1){G.art.device(c,'mirror',x+w/2,y+h/2,Math.min(w,h),blue,age);}else R(c,x,y,w,h,color,9);}else R(c,x,y,w,h,color,9); T(c, label, x + w / 2, y + h / 2+1, 20, textColor, 'center'); if (fn) buttons.push({ x, y, w, h, fn }); },
          node(c, label, x, y, r, fn, color = blue) { if(G.art){G.art.device(c,deviceFor(n),x,y,r*2.15,color,age);G.art.panel(c,x-r*.9,y+r*.64,r*1.8,22,'dark');T(c,label,x,y+r*.64+11,Math.min(15,r*.5),'#eaf5f3','center');}else{O(c, x, y, r + 4, '#172333'); O(c, x, y, r, color); T(c, label, x, y + 6, 17, '#10202b', 'center');} if (fn) buttons.push({ x: x - r, y: y - r, w: r * 2, h: G.art?r*2+16:r*2, fn }); },
          adjust(c, label, v, x, y, fn, step = 1, unit = '') { T(c, label, x + 70, y, 17, muted, 'center'); p.button(c, '−', x, y + 15, 45, () => fn(v - step)); T(c, String(v) + unit, x + 90, y + 44, 25, ink, 'center'); p.button(c, '+', x + 135, y + 15, 45, () => fn(v + step)); },
          win(message = '实验完成！', score) { if (!ended) { ended = true; api.finish(true, score === undefined ? Math.max(100, 2000 - moves * 12 - Math.floor(age * 2)) : score, message); } },
          fail(message = '实验中断，请重新尝试。') { if (!ended) { ended = true; api.finish(false, Math.max(0, 300 - moves), message); } },
          note(message) { p.hint = message; api.sound('click'); }
        };
        const game = build(p);
        return {
          update(dt) { if (ended) return; age += dt; if (game.update) game.update(dt); if (age > 300) p.fail('实验时间结束。重开后可以尝试新的方案。'); },
          draw(c) {visualId=n;visualTime=age;if(G.art){G.art.scene(c,sceneFor(n),age);G.art.panel(c,32,112,936,425,'glass');G.art.panel(c,32,17,936,82);G.art.device(c,deviceFor(n),921,61,45,green,age);}else G.bg(c); buttons = []; T(c, en.toUpperCase(), 48, 40, 11, green); T(c, DISPLAY_NAMES[n-1]||title, 48, 76, 27, ink); if (game.draw) game.draw(c); if(G.art)G.art.panel(c,32,552,936,51);else R(c, 32, 552, 936, 51, '#182230', 10); wrap(c, p.hint, 48, 577, 800, 15, '#d4e3e5'); T(c, moves + ' 步', 942, 582, 16, green, 'right'); },
          pointer(x, y, type) { if (ended || type !== 'down') return; const b = buttons.slice().reverse().find(b => G.hit(x, y, b.x, b.y, b.w, b.h)); if (b) { moves++; b.fn(); if (game.check && game.check()) p.win(game.message); } else if (game.tap) { moves++; game.tap(x, y); if (game.check && game.check()) p.win(game.message); } },
          key(code) { if (ended) return; if (game.key) { moves++; game.key(code); if (game.check && game.check()) p.win(game.message); } }
        };
      }
    });
  }

  add(1, '折光航线', 'Prism Route', '让一束激光拐过三个弯，抵达远端接收器。', '点击三个反射镜切换 / 与 \\。将左侧激光依次送过所有镜面并进入右下角接收器。', 'ray-trace-discrete-specular-reflection', p => {
    const mirrors = [{ x: 310, y: 380, slash: false }, { x: 310, y: 190, slash: true }, { x: 700, y: 190, slash: true }];
    function trace() { let x = 100, y = 380, dx = 1, dy = 0, path = [[x, y]], visited = 0; for (let k = 0; k < 8; k++) { const m = mirrors.filter(m => (dx && m.y === y && (m.x - x) * dx > 0) || (dy && m.x === x && (m.y - y) * dy > 0)).sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))[0]; if (!m) { path.push([x + dx * 800, y + dy * 500]); break; } x = m.x; y = m.y; path.push([x, y]); visited++; [dx, dy] = m.slash ? [-dy, -dx] : [dy, dx]; if (x === 700 && y === 190 && dx === 0 && dy === 1) { path.push([700, 460]); return { path, good: visited === 3 }; } } return { path, good: false }; }
    return { draw(c) { const t = trace(); t.path.forEach((q, i) => { if (i) L(c, ...t.path[i - 1], ...q, green, 5); }); p.node(c, '光源', 100, 380, 29, null, green); p.node(c, '接收', 700, 460, 33, null, blue); mirrors.forEach(m => p.tile(c, m.slash ? '/' : '\\', m.x - 26, m.y - 26, 52, 52, () => m.slash = !m.slash, '#36445f')); T(c, '调整镜面 · 跟随光的路径', 500, 515, 18, muted, 'center'); }, check: () => trace().good };
  });

  add(2, '色谱合成台', 'Chromatic Lab', '用三束原色光制造四种精确的信号。', '每个开关对应 R、G、B 光源。观察目标 RGB 值，配出一致颜色后点击交付。完成四份样本。', 'additive-rgb-channel-composition-sequence', p => {
    let on = [0, 0, 0], level = 0; const targets = [[1, 0, 1], [0, 1, 1], [1, 1, 0], [1, 1, 1]];
    const color = a => 'rgb(' + a.map(v => v * 255).join(',') + ')';
    return { draw(c) { T(c, '样本 ' + (level + 1) + ' / 4', 500, 145, 19, muted, 'center'); O(c, 335, 290, 100, color(on)); O(c, 665, 290, 100, color(targets[Math.min(level, 3)])); T(c, '当前混色', 335, 425, 19, ink, 'center'); T(c, '目标 ' + targets[Math.min(level, 3)].join(' / '), 665, 425, 19, ink, 'center'); ['R 红光', 'G 绿光', 'B 蓝光'].forEach((v, i) => p.button(c, v + (on[i] ? ' ●' : ' ○'), 160 + i * 190, 465, 170, () => on[i] ^= 1, [pink, green, blue][i])); p.button(c, '交付样本', 755, 465, 150, () => { if (eq(on, targets[level])) { level++; on = [0, 0, 0]; p.note('样本合格，配制下一束光。'); if (level === 4) p.win('四色光谱全部校准。'); } else p.note('光谱不一致，检查三个通道。'); }); } };
  });

  add(3, '相位归零', 'Phase Null', '用反相信号消去三台振荡器的噪声。', '三个旋钮每次转动 30°。将补偿相位调为红色信号的反相，三个合成波都成为直线即可提交。', 'sinusoidal-antiphase-cancellation', p => {
    const source = [30, 120, 240], phases = [0, 0, 0];
    return { draw(c) { source.forEach((v, i) => { const y = 165 + i * 102; L(c, 60, y, 650, y, '#2b3546'); for (let x = 70; x < 640; x += 5) { const f = z => Math.sin(z / 45 + v * Math.PI / 180) + Math.sin(z / 45 + phases[i] * Math.PI / 180); L(c, x, y + f(x) * 22, x + 5, y + f(x + 5) * 22, blue, 3); } T(c, '源 ' + v + '°', 65, y + 47, 15, pink); p.adjust(c, '补偿相位', phases[i], 725, y - 35, val => phases[i] = mod(val, 360), 30, '°'); }); p.button(c, '检测噪声', 380, 480, 240, () => { if (phases.every((v, i) => mod(v - source[i], 360) === 180)) p.win('干涉噪声降为零。'); else p.note('仍然存在波动：两个相位相差 180° 才会抵消。'); }); } };
  });

  add(4, '单向供能', 'Flow Direction', '为能量环设置正确的流向。', '点击节点上的箭头切换流向。能量必须从 A 顺序流经 B、C、D、E 到 F，禁止回流。', 'directed-valve-network-routing', p => {
    const nodes = [{ x: 140, y: 300 }, { x: 310, y: 175 }, { x: 520, y: 175 }, { x: 520, y: 380 }, { x: 745, y: 380 }, { x: 880, y: 240 }], on = [0, 1, 0, 1, 0];
    return { draw(c) { for (let i = 0; i < 5; i++) { const a = nodes[i], b = nodes[i + 1]; L(c, a.x, a.y, b.x, b.y, on[i] ? green : '#68434b', 8); const x = (a.x + b.x) / 2, y = (a.y + b.y) / 2; p.tile(c, on[i] ? '→' : '←', x - 23, y - 23, 46, 46, () => on[i] ^= 1, '#2b3c52'); } nodes.forEach((v, i) => p.node(c, 'ABCDEF'[i], v.x, v.y, 28, null, i === 5 ? pink : blue)); T(c, 'A → B → C → D → E → F', 500, 490, 23, ink, 'center'); }, check: () => on.every(Boolean) };
  });

  add(5, '异或配电', 'XOR Station', '四个电源、六个逻辑门，一次精确配电。', '点击四个电源。下方门输出分别为 A⊕B、B⊕C、C⊕D、A⊕D、A∧C、B∨D，配出目标 110011。', 'six-logic-gates-four-input-circuit-synthesis', p => {
    const a = [0, 0, 0, 0], target = [1, 1, 0, 0, 1, 1];
    const values = () => [a[0] ^ a[1], a[1] ^ a[2], a[2] ^ a[3], a[0] ^ a[3], a[0] & a[2], a[1] | a[3]];
    return { draw(c) { a.forEach((v, i) => p.node(c, 'ABCD'[i] + ' ' + v, 230 + i * 180, 205, 38, () => a[i] ^= 1, v ? green : muted)); const vals = values(); ['A⊕B', 'B⊕C', 'C⊕D', 'A⊕D', 'A∧C', 'B∨D'].forEach((s, i) => { const x = 145 + i * 142; L(c, x, 270, x, 328, '#42506a'); O(c, x, 365, 30, vals[i] === target[i] ? green : pink); T(c, s, x, 425, 18, ink, 'center'); T(c, vals[i] + ' / 目标 ' + target[i], x, 460, 16, muted, 'center'); }); }, check: () => eq(values(), target) };
  });

  add(6, '差速齿轮', 'Gear Synchrony', '不同齿比带动四只刻度盘。', '拨动左齿轮同时使第 1、2 盘前进 1、2 格；右齿轮使第 3、4 盘前进 1、3 格。四盘指针全部到 0 刻度。', 'coupled-modular-gear-ratios', p => {
    const a = [3, 0, 2, 0], count = 6;
    return { draw(c) { a.forEach((v, i) => { const x = 185 + i * 210, y = 295; O(c, x, y, 76, '#273449'); for (let k = 0; k < count; k++) { const t = k / count * 2 * Math.PI - Math.PI / 2; O(c, x + Math.cos(t) * 64, y + Math.sin(t) * 64, 5, k ? muted : green); } L(c, x, y, x + Math.cos(v / 6 * 2 * Math.PI - Math.PI / 2) * 54, y + Math.sin(v / 6 * 2 * Math.PI - Math.PI / 2) * 54, blue, 6); T(c, String(v), x, 407, 22, ink, 'center'); }); p.button(c, '转动左齿轮 ↻', 200, 470, 245, () => { a[0] = (a[0] + 1) % 6; a[1] = (a[1] + 2) % 6; }); p.button(c, '转动右齿轮 ↻', 555, 470, 245, () => { a[2] = (a[2] + 1) % 6; a[3] = (a[3] + 3) % 6; }); }, check: () => a.every(v => v === 0) };
  });

  add(7, '零信任隔离', 'Network Quarantine', '切断感染路径，同时保住两台业务服务器。', '点击线路切断或恢复。红色感染节点不能连接到绿色核心；蓝色两台业务节点必须仍能抵达核心。', 'graph-cut-with-protected-connectivity', p => {
    const ns = [{ x: 165, y: 300 }, { x: 390, y: 180 }, { x: 390, y: 420 }, { x: 650, y: 180 }, { x: 650, y: 420 }, { x: 870, y: 300 }];
    const edges = [[0, 1], [0, 2], [1, 2], [1, 3], [2, 4], [3, 5], [4, 5], [3, 4]], cut = new Set();
    function reach() { const seen = new Set([0]); for (let z = 0; z < 6; z++) edges.forEach(([a, b], i) => { if (!cut.has(i)) { if (seen.has(a)) seen.add(b); if (seen.has(b)) seen.add(a); } }); return seen; }
    return { draw(c) { edges.forEach(([a, b], i) => { const x = (ns[a].x + ns[b].x) / 2, y = (ns[a].y + ns[b].y) / 2; L(c, ns[a].x, ns[a].y, ns[b].x, ns[b].y, cut.has(i) ? '#5a354a' : '#536780', 7); p.tile(c, cut.has(i) ? '×' : '接通', x - 30, y - 20, 60, 40, () => cut.has(i) ? cut.delete(i) : cut.add(i), '#253146'); }); ns.forEach((q, i) => p.node(c, i === 0 ? '核心' : i === 5 ? '感染' : '节点' + i, q.x, q.y, 35, null, i === 0 ? green : i === 5 ? pink : blue)); p.button(c, '验证隔离', 390, 485, 220, () => { const r = reach(); if (!r.has(5) && r.has(1) && r.has(2)) p.win('威胁隔离，业务链路正常。'); else p.note(r.has(5) ? '感染仍可抵达核心。' : '节点 1、2 都要保留业务连接。'); }); } };
  });

  add(8, '顺序校验包', 'Packet Checksum', '包裹必须按顺序经过密钥路由。', '从左上角 S 点击相邻格前进。必须先取 A、再取 B，最后抵达 E。不能走回已用过的格。', 'ordered-waypoint-self-avoiding-grid-route', p => {
    const path = [0], walls = new Set([7, 9, 13, 19]), cols = 6, A = 4, B = 22, end = 29; let phase = 0;
    return { draw(c) { for (let i = 0; i < 30; i++) { const [x, y] = xy(i, cols, 290, 155, 68), used = path.includes(i), label = i === 0 ? 'S' : i === end ? 'E' : i === A ? 'A' : i === B ? 'B' : ''; p.tile(c, label, x, y, 58, 58, walls.has(i) ? null : () => { const last = path[path.length - 1]; if (path.includes(i) || Math.abs(i % 6 - last % 6) + Math.abs(Math.floor(i / 6) - Math.floor(last / 6)) !== 1) return; if (i === B && phase < 1) return p.note('先收集 A 密钥。'); path.push(i); if (i === A) phase = 1; if (i === B) phase = 2; if (i === end) { if (phase === 2) p.win('包裹校验通过。'); else p.note('缺少密钥，请清空路径重试。'); } }, walls.has(i) ? '#101722' : used ? '#42633b' : '#27364d'); } p.button(c, '清空路径', 65, 260, 165, () => { path.splice(1); phase = 0; }); T(c, '密钥 ' + phase + ' / 2', 65, 355, 20, green); } };
  });

  add(9, '依赖编排器', 'Dependency Engine', '把六个工作流按依赖顺序编译。', '按依赖关系点击任务：A 无前置；B、C 需 A；D 需 B；E 需 B 与 C；F 需 D 与 E。可点击重置撤销整个计划。', 'dag-topological-task-execution', p => {
    const deps = [[], [0], [0], [1], [1, 2], [3, 4]], done = new Set(), log = [];
    const nodes = [{ x: 140, y: 295 }, { x: 340, y: 190 }, { x: 340, y: 400 }, { x: 590, y: 190 }, { x: 590, y: 400 }, { x: 840, y: 295 }];
    return { draw(c) { deps.forEach((v, i) => v.forEach(d => L(c, nodes[d].x, nodes[d].y, nodes[i].x, nodes[i].y, done.has(d) ? green : '#46536d', 3))); nodes.forEach((q, i) => p.node(c, 'ABCDEF'[i], q.x, q.y, 40, () => { if (done.has(i)) return; if (!deps[i].every(d => done.has(d))) return p.note('缺少前置任务：' + deps[i].filter(d => !done.has(d)).map(d => 'ABCDEF'[d]).join('、')); done.add(i); log.push('ABCDEF'[i]); p.note('执行序列：' + log.join(' → ')); }, done.has(i) ? green : blue)); T(c, log.join('  →  '), 500, 485, 22, ink, 'center'); }, check: () => done.size === 6 };
  });

  add(10, '轨迹编译', 'Drone Compiler', '把方向指令编译成一条无人机航线。', '点击方向把指令加入程序，执行后无人机从 S 出发。先取 K 密钥再到 E。墙壁会使本次执行失败；可清空重编。', 'batch-robot-direction-program-with-key', p => {
    const program = [], wall = new Set([2, 7, 12, 16]), dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]]; let trail = [0], status = '尚未执行';
    return { draw(c) { for (let i = 0; i < 25; i++) { const [x, y] = xy(i, 5, 310, 130, 65); p.tile(c, i === 0 ? 'S' : i === 24 ? 'E' : i === 18 ? 'K' : '', x, y, 55, 55, null, wall.has(i) ? '#0d1420' : trail.includes(i) ? '#4d6350' : '#26364d'); } ['↑', '→', '↓', '←'].forEach((s, i) => p.button(c, s, 65 + i % 2 * 95, 180 + Math.floor(i / 2) * 70, 80, () => { if (program.length < 30) program.push(i); })); p.button(c, '执行', 720, 205, 160, () => { let pos = 0, key = false; trail = [0]; for (const d of program) { const x = pos % 5 + dirs[d][0], y = Math.floor(pos / 5) + dirs[d][1], next = y * 5 + x; if (x < 0 || x > 4 || y < 0 || y > 4 || wall.has(next)) { status = '碰壁：请修改程序'; return; } pos = next; trail.push(pos); if (pos === 18) key = true; } status = '终点：' + pos + (key ? ' · 已持密钥' : ' · 缺少密钥'); if (pos === 24 && key) p.win('无人机程序执行成功。'); }); p.button(c, '清空程序', 720, 275, 160, () => { program.length = 0; trail = [0]; }); wrap(c, program.map(i => ['↑', '→', '↓', '←'][i]).join(' '), 70, 485, 850, 20, green); T(c, status, 500, 525, 17, muted, 'center'); } };
  });

  add(11, '镜像信使', 'Mirror Couriers', '同一个指令，驱动两名反向移动的信使。', '用方向按钮控制蓝色信使，粉色信使水平镜像运动。两人同时到各自的绿色目标即可；撞墙的一方停住。', 'dual-agents-horizontal-mirrored-collision-motion', p => {
    let a = [0, 0], b = [3, 0]; const blocks = [new Set([5, 9]), new Set([6, 10])], goals = [[3, 3], [0, 3]];
    function move(dx, dy) { [a, b].forEach((v, k) => { const x = v[0] + (k ? -dx : dx), y = v[1] + dy; if (x >= 0 && x < 4 && y >= 0 && y < 4 && !blocks[k].has(y * 4 + x)) { v[0] = x; v[1] = y; } }); }
    return { draw(c) { [a, b].forEach((v, k) => { for (let i = 0; i < 16; i++) { const x = 120 + k * 510 + i % 4 * 65, y = 150 + Math.floor(i / 4) * 65; p.tile(c, i === goals[k][1] * 4 + goals[k][0] ? '◎' : '', x, y, 57, 57, null, blocks[k].has(i) ? '#0d1722' : '#27374c', green); if (v[0] === i % 4 && v[1] === Math.floor(i / 4)) O(c, x + 29, y + 29, 16, k ? pink : blue); } }); [['↑', 0, -1], ['←', -1, 0], ['↓', 0, 1], ['→', 1, 0]].forEach((v, i) => p.button(c, v[0], 300 + i * 100, 460, 85, () => move(v[1], v[2]))); }, check: () => eq(a, goals[0]) && eq(b, goals[1]), key(code) { const m = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[code]; if (m) move(...m); } };
  });

  add(12, '时间回声', 'Time Echo', '记录一段行动，让过去的自己为你开门。', '先移动到紫色压力板并点击录制回声，再返回起点。回声固定留在压力板上，门会打开；随后走到右侧出口。', 'persistent-time-clone-pressure-plate-door', p => {
    let pos = 0, echo = -1; const nodes = [{ x: 150, y: 310 }, { x: 330, y: 310 }, { x: 330, y: 170 }, { x: 530, y: 310 }, { x: 730, y: 310 }, { x: 880, y: 310 }], edges = [[0, 1], [1, 2], [1, 3], [3, 4], [4, 5]];
    return { draw(c) { edges.forEach(([a, b]) => L(c, nodes[a].x, nodes[a].y, nodes[b].x, nodes[b].y, a === 3 && echo !== 2 ? pink : '#51617d', 9)); nodes.forEach((q, i) => { p.node(c, i === 2 ? '压力板' : i === 5 ? '出口' : String(i), q.x, q.y, 35, () => { if (!edges.some(([a, b]) => a === pos && b === i || b === pos && a === i)) return; if ((pos === 3 && i === 4 || pos === 4 && i === 3) && echo !== 2) return p.note('门还关着：需要一个回声站在压力板上。'); pos = i; }, i === echo ? pink : i === pos ? blue : '#63778c'); if (i === pos) T(c, '你', q.x, q.y + 65, 18, blue, 'center'); }); p.button(c, '在当前位置录制回声', 320, 450, 360, () => { echo = pos; p.note(echo === 2 ? '回声持续压住机关。现在走向出口。' : '回声没有站在压力板上，可以重新录制。'); }); }, check: () => pos === 5 && echo === 2 };
  });

  add(13, '重力钥匣', 'Gravity Vault', '改变重力，让钥匙在密室中滑行。', '每次点击方向，球会沿重力方向滑到底。经过金色 K 后，停在绿色 E 格即可。黑色格是固定挡板。', 'gravity-tilt-slide-until-wall-key-collection', p => {
    let pos = 0, key = false, trail = []; const wall = new Set([7, 8, 10, 16, 18, 22, 24, 28]), cols = 6, rows = 6, K = 35, E = 5;
    function tilt(dx, dy) { trail = [pos]; for (let k = 0; k < 7; k++) { const x = pos % cols + dx, y = Math.floor(pos / cols) + dy, n = y * cols + x; if (x < 0 || x >= cols || y < 0 || y >= rows || wall.has(n)) break; pos = n; trail.push(pos); if (pos === K) key = true; } }
    return { draw(c) { for (let i = 0; i < cols * rows; i++) { const [x, y] = xy(i, cols, 325, 135, 56); p.tile(c, i === K && !key ? 'K' : i === E ? 'E' : '', x, y, 49, 49, null, wall.has(i) ? '#0b111b' : trail.includes(i) ? '#34465e' : '#233249', i === K ? orange : green); if (i === pos) O(c, x + 25, y + 25, 15, blue); } [['↑', 0, -1], ['↓', 0, 1], ['←', -1, 0], ['→', 1, 0]].forEach((v, i) => p.button(c, v[0], 80 + i % 2 * 95, 230 + Math.floor(i / 2) * 70, 80, () => tilt(v[1], v[2]))); T(c, key ? '密钥已获取' : '先收集右下角密钥', 500, 510, 19, key ? green : orange, 'center'); }, check: () => pos === E && key };
  });

  add(14, '折叠信息纸', 'Information Fold', '翻折透明薄片，让两层图案恰好重合。', '分别水平、垂直翻转蓝色薄片，再旋转它，使所有蓝点与右侧粉色目标一致。每次旋转 90°。', 'dihedral-symmetry-transparent-layer-alignment', p => {
    let points = [[0, 0], [1, 0], [1, 1], [2, 1], [3, 2]], target = [[3, 3], [3, 2], [2, 2], [2, 1], [1, 0]];
    const normalize = a => a.map(q => q.join(',')).sort().join('|');
    return { draw(c) { [points, target].forEach((set, k) => { T(c, k ? '目标投影' : '透明薄片', 250 + k * 490, 145, 20, k ? pink : blue, 'center'); for (let i = 0; i < 16; i++) { const x = 140 + k * 490 + i % 4 * 60, y = 190 + Math.floor(i / 4) * 60; R(c, x, y, 52, 52, '#263349', 5); if (set.some(q => q[0] === i % 4 && q[1] === Math.floor(i / 4))) O(c, x + 26, y + 26, 15, k ? pink : blue); } }); p.button(c, '水平翻折', 170, 465, 190, () => points = points.map(([x, y]) => [3 - x, y])); p.button(c, '垂直翻折', 405, 465, 190, () => points = points.map(([x, y]) => [x, 3 - y])); p.button(c, '旋转 90°', 640, 465, 190, () => points = points.map(([x, y]) => [3 - y, x])); }, check: () => normalize(points) === normalize(target) };
  });

  add(15, '交织数据线', 'Braid Switch', '每次交换一对线路，恢复端口映射。', '点击交叉器交换相邻两条数据线。让上方 A、B、C、D、E 分别连接到下方相同名称的端口。', 'adjacent-crossbar-permutation-routing', p => {
    const a = [2, 4, 0, 3, 1];
    return { draw(c) { a.forEach((v, i) => { const x = 180 + i * 160; L(c, x, 200, 180 + v * 160, 410, [blue, pink, green, orange, '#bba6ff'][i], 5); p.node(c, 'ABCDE'[i], x, 170, 28, null, blue); p.node(c, 'ABCDE'[i], x, 445, 28, null, a[i] === i ? green : muted); }); for (let i = 0; i < 4; i++) p.button(c, '交换 ' + 'ABCDE'[i] + '/' + 'ABCDE'[i + 1], 140 + i * 190, 490, 170, () => [a[i], a[i + 1]] = [a[i + 1], a[i]]); T(c, '当前映射：' + a.map(i => 'ABCDE'[i]).join(' · '), 500, 125, 18, ink, 'center'); }, check: () => a.every((v, i) => v === i) };
  });

  add(16, '空间虫洞', 'Wormhole Pairing', '给一组不连续的房间建立传送关系。', '选择两个传送门配对。目标是让 S→A→B→C→E 这条链成立；选择已有配对的门会解除其旧连接。', 'bidirectional-portal-pairing-directed-room-chain', p => {
    const names = ['S 出口', 'A 入口', 'A 出口', 'B 入口', 'B 出口', 'C 入口', 'C 出口', 'E 入口']; const pairs = {}, target = [[0, 1], [2, 3], [4, 5], [6, 7]]; let selected = -1;
    const points = positions(8);
    return { draw(c) { Object.keys(pairs).forEach(k => { if (+k < pairs[k]) L(c, points[k].x, points[k].y, points[pairs[k]].x, points[pairs[k]].y, green, 3); }); points.forEach((q, i) => p.node(c, names[i], q.x, q.y, 36, () => { if (selected < 0) selected = i; else if (selected !== i) { [selected, i].forEach(k => { if (pairs[k] !== undefined) { delete pairs[pairs[k]]; delete pairs[k]; } }); pairs[selected] = i; pairs[i] = selected; selected = -1; } else selected = -1; }, selected === i ? orange : blue)); T(c, '按房间先后次序连接「出口 → 下一入口」', 500, 520, 18, muted, 'center'); }, check: () => target.every(([a, b]) => pairs[a] === b) };
  });

  add(17, '磁极编队', 'Polar Lattice', '为六块电磁铁找到稳定的交替磁场。', '每块磁铁有 N、S 两面，点击翻转。让每条线路两端磁极相反，同时 A 为 N 极、D 为 S 极。', 'bipartite-magnetic-polarity-assignment-with-anchors', p => {
    const a = [0, 0, 0, 0, 0, 0], ns = positions(6), edges = [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0], [0, 3]];
    return { draw(c) { edges.forEach(([u, v]) => L(c, ns[u].x, ns[u].y, ns[v].x, ns[v].y, a[u] !== a[v] ? green : '#84516f', 5)); ns.forEach((q, i) => p.node(c, 'ABCDEF'[i] + ' ' + (a[i] ? 'S' : 'N'), q.x, q.y, 37, () => a[i] ^= 1, a[i] ? pink : blue)); T(c, '锚点：A=N · D=S', 500, 515, 21, orange, 'center'); }, check: () => a[0] === 0 && a[3] === 1 && edges.every(([u, v]) => a[u] !== a[v]) };
  });

  add(18, '轨道窗口', 'Orbital Window', '在准确的角度点火，完成分级转移。', '飞船绕轨道运行。三次点火分别要求位于 0°、120°、240° 附近（±18°）。观察绿色窗口，在窗口内点击点火。失败不会扣除阶段。', 'timed-three-stage-orbital-burn-windows', p => {
    let angle = 220, stage = 0; const targets = [0, 120, 240];
    return { update(dt) { angle = mod(angle + dt * 48, 360); }, draw(c) { const r = 130 + stage * 15; c.save(); c.strokeStyle = '#39445d'; c.lineWidth = 3; c.beginPath(); c.arc(500, 310, r, 0, Math.PI * 2); c.stroke(); const t = targets[Math.min(stage, 2)] * Math.PI / 180; c.strokeStyle = green; c.lineWidth = 12; c.beginPath(); c.arc(500, 310, r, t - .31, t + .31); c.stroke(); c.restore(); O(c, 500, 310, 62, '#f2b570'); O(c, 500 + Math.cos(angle * Math.PI / 180) * r, 310 + Math.sin(angle * Math.PI / 180) * r, 16, blue); T(c, '阶段 ' + (stage + 1) + ' / 3 · 当前 ' + Math.floor(angle) + '°', 500, 125, 22, ink, 'center'); p.button(c, '引擎点火', 365, 485, 270, () => { if (Math.abs(mod(angle - targets[stage] + 180, 360) - 180) < 18) { stage++; p.note('转移轨道已建立。'); if (stage === 3) p.win('三次精准点火，飞船抵达目的轨道。'); } else p.note('尚未进入窗口，等飞船来到绿色弧段。'); }); } };
  });

  add(19, '生长语法', 'Branch Grammar', '让种子按分枝规则长成指定结构。', '蓝色芽点可继续生长。每次生长会产生左右两个子芽。目标叶深度从左到右为 2、2、1；不要继续展开已经达到深度的芽。', 'binary-tree-leaf-depth-construction', p => {
    let leaves = [{ depth: 0, path: '' }]; const target = [2, 2, 1];
    return { draw(c) { const all = [{ path: '', depth: 0 }]; leaves.forEach(a => { for (let k = 1; k <= a.path.length; k++) if (!all.some(v => v.path === a.path.slice(0, k))) all.push({ path: a.path.slice(0, k), depth: k }); }); const point = path => { let x = 500; for (let k = 0; k < path.length; k++) x += (path[k] === 'L' ? -1 : 1) * 230 / Math.pow(2, k); return [x, 145 + path.length * 95]; }; all.forEach(q => { if (q.path) L(c, ...point(q.path.slice(0, -1)), ...point(q.path), '#486449', 5); }); all.forEach(q => { const [x, y] = point(q.path), leaf = leaves.findIndex(a => a.path === q.path); p.node(c, String(q.depth), x, y, 26, leaf < 0 ? null : () => { if (q.depth > 2) return p.note('这棵树太深了，请重新播种。'); leaves.splice(leaf, 1, { depth: q.depth + 1, path: q.path + 'L' }, { depth: q.depth + 1, path: q.path + 'R' }); }, leaf >= 0 ? green : '#658377'); }); T(c, '当前叶深度：' + leaves.map(q => q.depth).join(' · '), 500, 465, 22, ink, 'center'); p.button(c, '重新播种', 390, 495, 220, () => leaves = [{ depth: 0, path: '' }]); }, check: () => eq(leaves.map(q => q.depth), target) };
  });

  add(20, '体素投影', 'Voxel Projections', '用空间方块同时满足三个投影。', '点击 3×3 网格切换方块。让每行方块数为 2、1、2，每列为 1、3、1，同时对角线方块数必须为 1。', 'binary-voxel-marginal-projections-and-diagonal', p => {
    const a = Array(9).fill(0), rows = [2, 1, 2], cols = [1, 3, 1];
    const row = i => sum(a.slice(i * 3, i * 3 + 3)), col = i => a[i] + a[i + 3] + a[i + 6];
    return { draw(c) { for (let i = 0; i < 9; i++) { const x = 360 + i % 3 * 86, y = 180 + Math.floor(i / 3) * 86; p.tile(c, a[i] ? '◆' : '', x, y, 74, 74, () => a[i] ^= 1, a[i] ? '#6d7193' : '#233148', a[i] ? green : ink); } rows.forEach((v, i) => T(c, row(i) + ' / ' + v, 685, 225 + i * 86, 22, row(i) === v ? green : pink, 'center')); cols.forEach((v, i) => T(c, col(i) + ' / ' + v, 398 + i * 86, 490, 22, col(i) === v ? green : pink, 'center')); T(c, '对角线 ' + (a[0] + a[4] + a[8]) + ' / 1', 145, 305, 21, orange); }, check: () => rows.every((v, i) => row(i) === v) && cols.every((v, i) => col(i) === v) && a[0] + a[4] + a[8] === 1 };
  });

  add(21, '光谱过滤器', 'Spectrum Filters', '安排滤镜运算，提取数据光中的目标色。', '输入光为 111。三层滤镜依次执行 AND 掩码、XOR 掩码、OR 掩码；点击各掩码位，令四份输入 111、101、011、000 输出 010、000、110、100。', 'three-stage-bitmask-filter-function-synthesis', p => {
    const masks = [0, 0, 0], input = [7, 5, 3, 0], target = [2, 0, 6, 4];
    const out = n => ((n & masks[0]) ^ masks[1]) | masks[2];
    return { draw(c) { ['AND', 'XOR', 'OR'].forEach((v, j) => { T(c, v + ' 掩码', 170, 205 + j * 90, 23, blue); for (let k = 0; k < 3; k++) p.tile(c, String(masks[j] >> (2 - k) & 1), 315 + k * 72, 170 + j * 90, 60, 60, () => masks[j] ^= 1 << (2 - k), '#2d3c52'); }); input.forEach((v, i) => T(c, v.toString(2).padStart(3, '0') + ' → ' + out(v).toString(2).padStart(3, '0') + ' / ' + target[i].toString(2).padStart(3, '0'), 650, 210 + i * 64, 22, out(v) === target[i] ? green : pink)); p.button(c, '验证全部光束', 360, 470, 280, () => { if (input.every((v, i) => out(v) === target[i])) p.win('四路光谱提取一致。'); else p.note('目标是同时满足四份输入，不能只看第一束。'); }); } };
  });

  add(22, '量子门实验', 'Qubit Foundry', '操纵振幅，而不只是开关一个比特。', 'H 门混合两个振幅，X 门交换，Z 门反转 |1〉相位。依次制备 |1〉、|+〉、|−〉三种目标；每完成一份会重置到 |0〉。', 'real-qubit-amplitude-hadamard-pauli-state-preparation', p => {
    let state = [1, 0], phase = 0; const s = Math.SQRT1_2, targets = [[0, 1], [s, s], [s, -s]], labels = ['|1〉', '|+〉', '|−〉'];
    const match = () => state.every((v, i) => Math.abs(v - targets[phase][i]) < .001);
    return { draw(c) { T(c, '目标 ' + labels[Math.min(phase, 2)] + '  /  ' + (phase + 1) + ' of 3', 500, 140, 25, green, 'center'); state.forEach((v, i) => { const x = 300 + i * 400; R(c, x - 80, 200, 160, 210, '#26364b', 12); R(c, x - 55, 300 - Math.max(0, v) * 90, 110, Math.max(3, Math.abs(v) * 90), v < 0 ? pink : blue, 5); L(c, x - 70, 300, x + 70, 300, muted); T(c, (i ? '|1〉' : '|0〉') + '  ' + v.toFixed(3), x, 445, 22, ink, 'center'); }); p.button(c, 'H 混合', 150, 480, 180, () => { state = [(state[0] + state[1]) * s, (state[0] - state[1]) * s]; }); p.button(c, 'X 交换', 350, 480, 180, () => state.reverse()); p.button(c, 'Z 相位', 550, 480, 180, () => state[1] *= -1); p.button(c, '制备确认', 750, 480, 160, () => { if (!match()) return p.note('振幅或相位还不正确。负振幅会显示在中线下方。'); if (++phase === 3) p.win('三种量子态制备完毕。'); else { state = [1, 0]; p.note('开始制备下一种量子态。'); } }); } };
  });

  add(23, '可逆计算机', 'Reversible Core', '用可撤销的门变换四位寄存器。', '目标寄存器为 1101（从左到右）。可翻转首位、循环右移，或让第 1 位控制第 3 位的 CNOT。每个门都可逆。', 'four-bit-reversible-register-cnot-rotation', p => {
    let a = [0, 0, 0, 0]; const target = [1, 1, 0, 1], history = [];
    function gate(fn) { history.push(a.slice()); fn(); }
    return { draw(c) { a.forEach((v, i) => { p.tile(c, String(v), 180 + i * 170, 220, 130, 130, null, v ? '#517454' : '#26344a'); T(c, String(target[i]), 245 + i * 170, 400, 26, green, 'center'); }); p.button(c, 'NOT 首位', 110, 475, 180, () => gate(() => a[0] ^= 1)); p.button(c, '循环右移', 310, 475, 180, () => gate(() => a.unshift(a.pop()))); p.button(c, 'CNOT 1→3', 510, 475, 180, () => gate(() => a[2] ^= a[0])); p.button(c, '撤销一个门', 710, 475, 180, () => { if (history.length) a = history.pop(); }); T(c, '可逆门不会丢失信息', 500, 155, 21, blue, 'center'); }, check: () => eq(a, target) };
  });

  add(24, '酶链编辑', 'Enzyme Editor', '把碱基链送过不同的酶，改变排列。', '目标链为 GCAT。旋转酶将最左碱基移到最右；反转酶倒序整链；互补酶交换 A↔T、C↔G。', 'dna-string-cyclic-reverse-complement-transformations', p => {
    let a = 'ACGT'; const target = 'GCAT', palette = { A: blue, C: pink, G: green, T: orange };
    return { draw(c) { [...a].forEach((v, i) => p.tile(c, v, 200 + i * 160, 220, 125, 100, null, '#2c394e', palette[v])); [...target].forEach((v, i) => T(c, v, 262 + i * 160, 400, 34, palette[v], 'center')); p.button(c, '旋转酶', 170, 475, 190, () => a = a.slice(1) + a[0]); p.button(c, '反转酶', 405, 475, 190, () => a = [...a].reverse().join('')); p.button(c, '互补酶', 640, 475, 190, () => a = [...a].map(v => ({ A: 'T', T: 'A', C: 'G', G: 'C' }[v])).join('')); T(c, '上方为当前链 · 下方为目标链', 500, 150, 20, muted, 'center'); }, check: () => a === target };
  });

  add(25, '守恒反应釜', 'Stoichiometry', '分配有限的原子，完成精确的反应批次。', '配平反应 a·H₂ + b·O₂ → c·H₂O。然后提交三批反应，系数必须为最简正整数，所有氢、氧原子数量都要守恒。', 'stoichiometric-integer-atom-conservation', p => {
    let stage = 0, a = [1, 1, 1]; const recipes = [ { label: 'H₂ + O₂ → H₂O', left: [[2, 0], [0, 2]], right: [2, 1], solution: [2, 1, 2] }, { label: 'N₂ + H₂ → NH₃', left: [[2, 0], [0, 2]], right: [1, 3], solution: [1, 3, 2] }, { label: 'CO + O₂ → CO₂', left: [[1, 1], [0, 2]], right: [1, 2], solution: [2, 1, 2] } ];
    return { draw(c) { const r = recipes[Math.min(stage, 2)]; T(c, r.label, 500, 190, 38, blue, 'center'); ['反应物 A', '反应物 B', '产物'].forEach((s, i) => p.adjust(c, s, a[i], 135 + i * 280, 290, v => a[i] = G.clamp(v, 1, 8))); T(c, '反应釜 ' + (stage + 1) + ' / 3 · 最简整数比', 500, 420, 21, muted, 'center'); p.button(c, '启动反应', 370, 475, 260, () => { if (!eq(a, r.solution)) return p.note('原子没有按最简整数比守恒，请核对分子下标。'); if (++stage === 3) p.win('三批反应全部配平。'); else { a = [1, 1, 1]; p.note('守恒成立，进入下一批反应。'); } }); } };
  });

  add(26, '气闸平衡', 'Airlock Protocol', '在氧气耗尽前安全打开气闸。', '外界压力为 4，气闸初始压力 10。放气 −2、注气 +3；每次操作耗氧 1。压力等于 4 且剩余氧气至少 4 时才能开启气闸。', 'resource-constrained-airlock-pressure-equalization', p => {
    let pressure = 10, oxygen = 10;
    function change(d) { if (oxygen <= 0) return p.fail('供氧耗尽。'); const v = pressure + d; if (v < 0 || v > 16) return p.note('压力超出安全边界。'); pressure = v; oxygen--; }
    return { draw(c) { R(c, 280, 150, 440, 270, '#26364b', 28); R(c, 310, 190, 165, 190, '#34475b', 16); R(c, 525, 190, 165, 190, pressure === 4 ? '#42704e' : '#5b3e54', 16); T(c, '舱内 ' + pressure, 392, 295, 31, blue, 'center'); T(c, '外部 4', 608, 295, 31, green, 'center'); T(c, '氧气储量 ' + oxygen + ' / 10', 500, 450, 21, oxygen >= 4 ? green : pink, 'center'); p.button(c, '放气 −2', 145, 485, 200, () => change(-2)); p.button(c, '注气 +3', 400, 485, 200, () => change(3)); p.button(c, '开启气闸', 655, 485, 200, () => { if (pressure === 4 && oxygen >= 4) p.win('内外压差归零，安全通过气闸。'); else p.note('压力需要等于 4，且为返航保留至少 4 单位氧气。'); }); } };
  });

  add(27, '频段雕刻师', 'Equalizer Sculpt', '三个宽频旋钮，共同塑造五个频段。', '每个旋钮对中心频段产生双倍影响，对相邻频段产生一倍影响。调整增益，使五个输出频段等于目标 2、3、1、1、1。', 'overlapping-triangular-equalizer-basis-fitting', p => {
    const a = [0, 0, 0], target = [2, 3, 1, 1, 1];
    const value = i => a.reduce((s, v, k) => s + v * Math.max(0, 2 - Math.abs(i - k - 1)), 0);
    return { draw(c) { for (let i = 0; i < 5; i++) { const x = 220 + i * 140, v = value(i); R(c, x - 30, 210, 60, 180, '#27374d', 6); R(c, x - 20, 310 - Math.max(0, v) * 22, 40, Math.max(3, Math.abs(v) * 22), v === target[i] ? green : blue, 5); L(c, x - 42, 310 - target[i] * 22, x + 42, 310 - target[i] * 22, pink, 3); T(c, v + ' / ' + target[i], x, 430, 20, ink, 'center'); } a.forEach((v, i) => p.adjust(c, '频段 ' + (i + 1), v, 150 + i * 270, 460, n => a[i] = G.clamp(n, -3, 3))); }, check: () => target.every((v, i) => value(i) === v) };
  });

  add(28, '采样重建', 'Sample Recovery', '从离散采样点还原隐藏的波形。', '蓝点是目标波的 12 个采样。调频率（1–6）与相位（每次 90°），让绿色连续波穿过所有蓝点。', 'discrete-signal-frequency-phase-reconstruction', p => {
    let freq = 1, phase = 0; const targetF = 4, targetP = 90;
    const f = (x, fr, ph) => Math.sin(x / 720 * Math.PI * 2 * fr + ph * Math.PI / 180);
    return { draw(c) { L(c, 130, 295, 870, 295, '#516077'); for (let x = 0; x < 720; x += 4) L(c, 140 + x, 295 - f(x, freq, phase) * 105, 144 + x, 295 - f(x + 4, freq, phase) * 105, green, 3); for (let i = 0; i < 12; i++) { const x = i * 720 / 11; O(c, 140 + x, 295 - f(x, targetF, targetP) * 105, 7, blue); } p.adjust(c, '频率', freq, 260, 455, v => freq = G.clamp(v, 1, 6)); p.adjust(c, '相位', phase, 570, 455, v => phase = mod(v, 360), 90, '°'); T(c, '12 个样本 · 1 条连续波', 500, 140, 23, ink, 'center'); }, check: () => freq === targetF && phase === targetP };
  });

  add(29, '信标交汇', 'Beacon Intersection', '用三个距离圈锁定失联探测器。', '距离按横纵格数计算（曼哈顿距离）。目标距左上信标 8、右上信标 5、左下信标 6 格。点击唯一满足的格子。', 'manhattan-trilateration-from-three-beacons', p => {
    let selected = -1; const beacons = [[0, 0, 8], [7, 0, 5], [0, 4, 6]];
    const distances = i => beacons.map(([x, y]) => Math.abs(i % 8 - x) + Math.abs(Math.floor(i / 8) - y));
    return { draw(c) { for (let i = 0; i < 40; i++) { const [x, y] = xy(i, 8, 250, 160, 59); p.tile(c, beacons.some(([a, b]) => i === b * 8 + a) ? '⌖' : '', x, y, 50, 50, () => { selected = i; p.note('当前位置距三个信标：' + distances(i).join('、') + '。'); }, selected === i ? '#496b56' : '#26364c', blue); } T(c, '8 / 5 / 6', 500, 510, 27, green, 'center'); p.button(c, '确认坐标', 65, 260, 145, () => { if (selected >= 0 && eq(distances(selected), [8, 5, 6])) p.win('探测器坐标已锁定。'); else p.note('三个测距条件必须同时满足。'); }); } };
  });

  add(30, '透视对齐', 'Perspective Match', '改变深度，让三枚全息点叠上标记。', '三枚点的透视坐标为 x=500+(原始横距)/(1+深度/4)。调整各自深度 0–8，让它们重合到绿色标记。', 'perspective-depth-projection-inverse-alignment', p => {
    const z = [0, 0, 0], raw = [-280, 200, 320], desired = [4, 6, 8];
    return { draw(c) { raw.forEach((v, i) => { const y = 190 + i * 95, x = 500 + v / (1 + z[i] / 4), tx = 500 + v / (1 + desired[i] / 4); L(c, 180, y, 820, y, '#33415b'); O(c, tx, y, 18, '#355641'); O(c, tx, y, 6, green); O(c, x, y, 12, blue); T(c, '点 ' + (i + 1), 90, y + 5, 18, muted); p.adjust(c, '深度', z[i], 750, y - 33, n => z[i] = G.clamp(n, 0, 8)); }); T(c, '距离越远，投影越靠近消失点', 500, 490, 21, ink, 'center'); }, check: () => eq(z, desired) };
  });

  add(31, '无交叉星链', 'Planar Starlink', '连接六颗星，使网络成为不交叉的路径。', '依次点击两个节点添加或删除连线。只能有 5 条线、全部连通、连线不能交叉；A–D 各连 2 条，E、F 各连 1 条。', 'degree-constrained-planar-spanning-path-construction', p => {
    const ns = positions(6), edges = []; let selected = -1;
    const degree = i => edges.filter(e => e.includes(i)).length;
    function valid() { if (edges.length !== 5 || ns.some((_, i) => degree(i) !== (i < 4 ? 2 : 1))) return false; const seen = new Set([0]); for (let k = 0; k < 6; k++) edges.forEach(([a, b]) => { if (seen.has(a)) seen.add(b); if (seen.has(b)) seen.add(a); }); if (seen.size !== 6) return false; const cross = (a, b, c) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x); return !edges.some((e, i) => edges.some((f, j) => j > i && !e.some(v => f.includes(v)) && cross(ns[e[0]], ns[e[1]], ns[f[0]]) * cross(ns[e[0]], ns[e[1]], ns[f[1]]) < 0 && cross(ns[f[0]], ns[f[1]], ns[e[0]]) * cross(ns[f[0]], ns[f[1]], ns[e[1]]) < 0)); }
    return { draw(c) { edges.forEach(([a, b]) => L(c, ns[a].x, ns[a].y, ns[b].x, ns[b].y, blue, 4)); ns.forEach((v, i) => { p.node(c, 'ABCDEF'[i], v.x, v.y, 29, () => { if (selected < 0) selected = i; else if (selected === i) selected = -1; else { const ix = edges.findIndex(e => e.includes(i) && e.includes(selected)); if (ix >= 0) edges.splice(ix, 1); else edges.push([selected, i]); selected = -1; } }, selected === i ? orange : degree(i) === (i < 4 ? 2 : 1) ? green : blue); T(c, degree(i) + '/' + (i < 4 ? 2 : 1), v.x, v.y + 53, 17, muted, 'center'); }); p.button(c, '验证星链', 390, 485, 220, () => { if (valid()) p.win('星链连通，所有线路互不交叉。'); else p.note('检查节点度数、连通性，以及线路是否交叉。'); }); } };
  });

  add(32, '列车时隙', 'Rail Time Slots', '错开出发时刻，让三列车安全通过共享区段。', '三列车到达道岔的时间分别为发车后 2、3、1 秒，共享区段占用 2 秒。调发车时间 0–6 秒，使任意到达时刻至少相差 2 秒。', 'railway-disjunctive-resource-time-scheduling', p => {
    const a = [0, 0, 0], offset = [2, 3, 1]; let sim = -1;
    return { update(dt) { if (sim >= 0) sim += dt * 1.5; if (sim > 13) sim = -1; }, draw(c) { a.forEach((v, i) => { const y = 180 + i * 105; T(c, '列车 ' + 'ABC'[i], 80, y + 10, 22, ink); L(c, 300, y, 890, y, '#3c4d64', 8); R(c, 300 + (v + offset[i]) * 40, y - 24, 80, 48, '#5f4d41', 5); T(c, '共享', 340 + (v + offset[i]) * 40, y + 7, 15, orange, 'center'); if (sim >= 0) O(c, G.clamp(300 + (sim - v) * 40, 300, 890), y, 13, blue); p.adjust(c, '发车 / 秒', v, 65, y + 20, n => a[i] = G.clamp(n, 0, 6)); }); p.button(c, '运行时刻表', 640, 490, 250, () => { const arrivals = a.map((v, i) => v + offset[i]); sim = 0; if (arrivals.every((v, i) => arrivals.every((w, j) => i === j || Math.abs(v - w) >= 2))) p.win('时刻表无冲突，三列车安全通过。'); else p.note('棕色区块有重叠，请错开发车时刻。'); }); } };
  });

  add(33, '载重电梯', 'Freight Elevator', '在有限电量内运完三件目的地不同的货物。', '电梯容量 4，电量 14。A 重 2，从 0 楼到 2 楼；B 重 3，从 1 楼到 3 楼；C 重 2，从 2 楼到 0 楼。点击货物装卸，点击楼层移动。', 'capacity-constrained-pickup-delivery-elevator', p => {
    let floor = 0, energy = 14; const cargo = [{ name: 'A', w: 2, floor: 0, dest: 2, on: false, done: false }, { name: 'B', w: 3, floor: 1, dest: 3, on: false, done: false }, { name: 'C', w: 2, floor: 2, dest: 0, on: false, done: false }];
    return { draw(c) { for (let k = 0; k < 4; k++) { const y = 430 - k * 85; L(c, 260, y, 900, y, '#40516b', 3); p.button(c, k + ' 楼', 70, y - 25, 120, () => { const cost = Math.abs(floor - k); if (energy < cost) return p.note('剩余电量不足。'); energy -= cost; floor = k; }); } R(c, 750, 385 - floor * 85, 110, 80, '#43627c', 8); T(c, '电梯', 805, 430 - floor * 85, 20, ink, 'center'); cargo.forEach((q, i) => { const y = q.on ? 405 - floor * 85 : 405 - q.floor * 85; p.tile(c, q.name + ' ' + q.w + 't' + (q.done ? ' ✓' : ''), 295 + i * 140, y - 23, 125, 46, q.done ? null : () => { if (q.on) { q.on = false; q.floor = floor; q.done = floor === q.dest; } else if (q.floor !== floor) p.note('先让电梯到货物所在楼层。'); else if (sum(cargo.filter(v => v.on).map(v => v.w)) + q.w > 4) p.note('超过电梯载重上限。'); else q.on = true; }, q.done ? '#42643d' : q.on ? '#435676' : '#29384f'); }); T(c, '剩余电量 ' + energy + ' · 载重 ' + sum(cargo.filter(q => q.on).map(q => q.w)) + '/4', 500, 510, 22, green, 'center'); }, check: () => cargo.every(q => q.done) };
  });

  add(34, '水坝分流', 'Reservoir Gates', '控制水坝支路，让两个下游湿地获得定量水源。', '水源每次释放 4 单位水，左支路阀可分 0–4，右支路获得剩余水。总共释放 3 次，使左湿地 5、右湿地 7；超出目标会泄洪并失败。', 'finite-pulse-fluid-bifurcation-and-accumulation', p => {
    let gate = 2, pulses = 0, a = 0, b = 0;
    return { draw(c) { O(c, 500, 185, 55, blue); T(c, '4', 500, 195, 30, '#102233', 'center'); L(c, 500, 240, 290, 330, blue, 12); L(c, 500, 240, 710, 330, blue, 12); [[a, 5, 290], [b, 7, 710]].forEach(([v, target, x]) => { R(c, x - 100, 330, 200, 100, '#27364b', 10); R(c, x - 90, 420 - v * 10, 180, v * 10, '#47799d', 5); T(c, v + '/' + target, x, 465, 28, green, 'center'); }); p.adjust(c, '左支路阀', gate, 70, 150, v => gate = G.clamp(v, 0, 4)); T(c, '已放水 ' + pulses + ' / 3 次', 790, 180, 22, ink, 'center'); p.button(c, '释放一脉冲', 370, 490, 260, () => { a += gate; b += 4 - gate; pulses++; if (a > 5 || b > 7) p.fail('超过湿地容量，水坝已泄洪。'); else if (pulses === 3) { if (a === 5 && b === 7) p.win('两片湿地获得恰好的灌溉量。'); else p.fail('供水脉冲已耗尽。'); } }); } };
  });

  add(35, '微电网调度', 'Microgrid Dispatch', '把工厂放在阳光充足的时段，避免储能归零。', '六时段太阳能为 2、5、1、4、3、2，基础耗电 2。电池初始 3、上限 6。点击安排恰好两个工厂时段（各额外耗 3），模拟全过程不欠电。', 'time-coupled-solar-battery-load-dispatch', p => {
    const solar = [2, 5, 1, 4, 3, 2], on = Array(6).fill(false); let levels = [];
    return { draw(c) { solar.forEach((v, i) => { const x = 150 + i * 140; R(c, x - 35, 320 - v * 25, 70, v * 25, '#b3c971', 8); T(c, '太阳能 ' + v, x, 360, 17, orange, 'center'); p.tile(c, on[i] ? '工厂 ON' : '工厂 OFF', x - 60, 395, 120, 55, () => on[i] = !on[i], on[i] ? '#496342' : '#25364b'); if (levels.length) T(c, String(levels[i]), x, 490, 24, levels[i] < 0 ? pink : green, 'center'); }); p.button(c, '运行全天调度', 350, 135, 300, () => { if (on.filter(Boolean).length !== 2) return p.note('必须安排恰好两个工厂时段。'); let energy = 3; levels = solar.map((v, i) => energy = Math.min(6, energy + v - 2 - (on[i] ? 3 : 0))); if (levels.every(v => v >= 0)) p.win('全天供电稳定，工厂按时生产。'); else p.note('红色时段发生欠电，把工厂放在发电高峰。'); }); } };
  });

  add(36, '定向天线', 'Antenna Relay', '把四座中继站逐一接回中央基站。', '点击中继站，切换其指向的下一节点。每座站的数据都必须最终流向 0 号基站，不能陷入闭环。中继站不能直接穿过粉色干扰区。', 'functional-digraph-routing-with-forbidden-line-of-sight', p => {
    const ns = [{ x: 130, y: 300 }, { x: 350, y: 170 }, { x: 350, y: 430 }, { x: 650, y: 170 }, { x: 850, y: 430 }], next = [0, 2, 1, 4, 3]; const forbidden = new Set(['0-3', '0-4', '1-4', '2-3']);
    const blocked = (a, b) => forbidden.has([a, b].sort((a, b) => a - b).join('-'));
    function good(i) { const seen = new Set(); while (i !== 0) { if (seen.has(i) || blocked(i, next[i])) return false; seen.add(i); i = next[i]; } return true; }
    return { draw(c) { R(c, 500, 235, 100, 120, '#4c2f46', 20); T(c, '干扰区', 550, 300, 16, pink, 'center'); ns.forEach((q, i) => { if (i) { const t = ns[next[i]]; L(c, q.x, q.y, t.x, t.y, blocked(i, next[i]) ? pink : good(i) ? green : '#536580', 4); T(c, '→' + next[i], (q.x + t.x) / 2, (q.y + t.y) / 2 - 10, 18, orange, 'center'); } }); ns.forEach((q, i) => p.node(c, String(i), q.x, q.y, 32, i ? () => { next[i] = (next[i] + 1) % 5; if (next[i] === i) next[i] = (next[i] + 1) % 5; } : null, i ? blue : green)); T(c, '被屏蔽直连：0–3、0–4、1–4、2–3', 500, 510, 19, muted, 'center'); }, check: () => [1, 2, 3, 4].every(good) };
  });

  add(37, '阈值连锁', 'Threshold Cascade', '只启动三个节点，让整个网络自发唤醒。', '点击最多三个种子节点，然后传播。外围节点需要两个相邻激活节点，中枢需要三个。没有新节点激活时传播停止；可清空重选。', 'bootstrap-percolation-threshold-seed-selection', p => {
    const ns = positions(6).concat([{ x: 500, y: 320 }]), edges = Array.from({ length: 6 }, (_, i) => [i, (i + 1) % 6]).concat(Array.from({ length: 6 }, (_, i) => [i, 6])); let seeds = new Set(), active = new Set();
    function run() { active = new Set(seeds); for (let k = 0; k < 7; k++) { const add = []; for (let i = 0; i < 7; i++) if (!active.has(i)) { const n = edges.filter(([a, b]) => a === i && active.has(b) || b === i && active.has(a)).length; if (n >= (i === 6 ? 3 : 2)) add.push(i); } add.forEach(i => active.add(i)); } }
    return { draw(c) { edges.forEach(([a, b]) => L(c, ns[a].x, ns[a].y, ns[b].x, ns[b].y, '#3d5068', 3)); ns.forEach((q, i) => p.node(c, String(i === 6 ? 3 : 2), q.x, q.y, 26, () => { if (seeds.has(i)) seeds.delete(i); else if (seeds.size < 3) seeds.add(i); active = new Set(seeds); }, active.has(i) ? green : seeds.has(i) ? orange : blue)); p.button(c, '开始传播', 250, 490, 230, () => { run(); if (active.size === 7) p.win('少量种子唤醒了整个网络。'); else p.note('只唤醒 ' + active.size + ' 个节点。试着把种子间隔摆放。'); }); p.button(c, '清空种子', 520, 490, 230, () => { seeds = new Set(); active = new Set(); }); } };
  });

  add(38, '重写昨日', 'Rewrite Yesterday', '回到过去修改一个事件，看未来如何变化。', '点击最上排五个历史事件。下一天每格等于前一天左邻与右邻的 XOR（环形边界）。让第三天的五格等于 11000。', 'editable-history-cellular-xor-causality', p => {
    const a = [0, 0, 0, 0, 0], target = [1, 1, 0, 0, 0];
    const evolve = s => s.map((_, i) => s[(i + 4) % 5] ^ s[(i + 1) % 5]);
    const states = () => [a, evolve(a), evolve(evolve(a))];
    return { draw(c) { states().forEach((row, j) => { T(c, ['昨日', '今日', '明日'][j], 180, 207 + j * 100, 21, muted, 'center'); row.forEach((v, i) => p.tile(c, String(v), 290 + i * 90, 170 + j * 100, 70, 70, j ? null : () => a[i] ^= 1, v ? '#416d59' : '#25364d')); }); target.forEach((v, i) => T(c, String(v), 325 + i * 90, 515, 24, green, 'center')); }, check: () => eq(states()[2], target) };
  });

  add(39, '状态机铸造', 'Automata Foundry', '搭建一台识别奇数个 1 的微型自动机。', '机器从状态 A 出发，以 B 为接受状态。点击四个转移规则切换目标 A/B，让下方全部测试词按要求通过或拒绝。', 'dfa-transition-table-inference-odd-one-language', p => {
    const transitions = [0, 0, 0, 0], tests = [['1', 1], ['01', 1], ['10', 1], ['111', 1], ['0', 0], ['11', 0], ['101', 0]];
    function accept(word) { let state = 0; for (const ch of word) state = transitions[state * 2 + +ch]; return state; }
    return { draw(c) { transitions.forEach((v, i) => { const x = 130 + i % 2 * 260, y = 185 + Math.floor(i / 2) * 120; p.tile(c, 'AB'[Math.floor(i / 2)] + ' 收到 ' + (i % 2) + ' → ' + 'AB'[v], x, y, 230, 80, () => transitions[i] ^= 1, '#29394f', v ? green : blue); }); tests.forEach(([word, want], i) => { const got = accept(word); T(c, word.padEnd(5, ' ') + ' → ' + (got ? '接受' : '拒绝') + ' / ' + (want ? '接受' : '拒绝'), 695, 165 + i * 47, 18, got === want ? green : pink); }); T(c, '状态 A：偶数个 1    状态 B：奇数个 1', 500, 495, 22, muted, 'center'); }, check: () => tests.every(([w, a]) => accept(w) === a) };
  });

  add(40, '基因重写', 'Genome Rewrite', '用局部替换规则，把长链折算成目标基因。', '起始链 ABABA。每次点击一种重写规则，只替换最左边一个匹配片段。最终得到单独的 E。', 'ordered-term-rewriting-local-string-reductions', p => {
    let value = 'ABABA', history = []; const rules = [['AB', 'C'], ['CC', 'D'], ['DA', 'E']];
    return { draw(c) { [...value].forEach((v, i) => p.tile(c, v, 500 - value.length * 42 + i * 84, 235, 70, 85, null, '#2b3b51', [blue, green, pink, orange][v.charCodeAt(0) % 4])); T(c, '目标 E', 500, 400, 29, green, 'center'); rules.forEach(([from, to], i) => p.button(c, from + ' → ' + to, 160 + i * 235, 470, 210, () => { if (!value.includes(from)) return p.note('当前链中没有 ' + from + ' 片段。'); history.push(value); value = value.replace(from, to); })); p.button(c, '撤销', 765, 150, 125, () => { if (history.length) value = history.pop(); }); }, check: () => value === 'E' };
  });

  add(41, '剪切空间', 'Shear Space', '用非交换的坐标变换抵达目标向量。', '起始向量 (1,0)。X 剪切令 x←x+y；Y 剪切令 y←x+y；轴交换互换 x/y。目标 (5,3)，坐标不能超过 8。', 'noncommuting-integer-affine-shear-vector-navigation', p => {
    let a = [1, 0], history = [];
    const op = fn => { history.push(a.slice()); fn(); if (a.some(v => v > 8)) { a = history.pop(); p.note('超出坐标边界。可以交换坐标或撤销。'); } };
    return { draw(c) { const x0 = 280, y0 = 440, scale = 35; for (let i = 0; i < 9; i++) { L(c, x0 + i * scale, 140, x0 + i * scale, y0, '#26374b'); L(c, x0, y0 - i * scale, 580, y0 - i * scale, '#26374b'); } L(c, x0, y0, x0 + a[0] * scale, y0 - a[1] * scale, blue, 5); O(c, x0 + 5 * scale, y0 - 3 * scale, 13, green); O(c, x0 + a[0] * scale, y0 - a[1] * scale, 8, blue); T(c, '(' + a.join(', ') + ')', 760, 290, 39, blue, 'center'); T(c, '目标 (5, 3)', 760, 350, 24, green, 'center'); p.button(c, 'X 剪切', 110, 480, 180, () => op(() => a[0] += a[1])); p.button(c, 'Y 剪切', 310, 480, 180, () => op(() => a[1] += a[0])); p.button(c, '轴交换', 510, 480, 180, () => op(() => a.reverse())); p.button(c, '撤销', 710, 480, 180, () => { if (history.length) a = history.pop(); }); }, check: () => eq(a, [5, 3]) };
  });

  add(42, '滚动指纹', 'Rolling Fingerprint', '给数据块安排次序，生成指定哈希。', '依次选择四个不同数据块。哈希初始为 0，每加入一个数 v，执行 h=(3h+v) mod 17。用完全部块，最终指纹必须等于 13。', 'polynomial-rolling-hash-permutation-preimage', p => {
    let order = [];
    const hashes = () => { let h = 0; return order.map(v => h = (h * 3 + v) % 17); };
    return { draw(c) { [1, 2, 3, 4].forEach((v, i) => p.tile(c, String(v), 200 + i * 160, 180, 120, 85, () => { if (!order.includes(v)) order.push(v); }, order.includes(v) ? '#1e2b3b' : '#354968', order.includes(v) ? muted : blue)); T(c, '输入序列  ' + (order.join(' → ') || '等待数据块'), 500, 335, 28, ink, 'center'); T(c, '指纹演算  ' + hashes().join(' → '), 500, 395, 25, green, 'center'); p.button(c, '退回末块', 220, 475, 240, () => order.pop()); p.button(c, '校验指纹 13', 540, 475, 240, () => { if (order.length === 4 && hashes()[3] === 13) p.win('全部数据块形成正确的滚动指纹。'); else p.note('用完全部块后结果应为 13。顺序会影响每一轮计算。'); }); } };
  });

  add(43, '阴影叠层', 'Shadow Layers', '让两个有缺口的光栅叠成正确轮廓。', '点击左右箭头移动蓝色或粉色光栅（环形位移）。两层透光区取交集，只有两层都透光才亮。下排是目标 00100100。', 'cyclic-binary-stencil-intersection-offset-alignment', p => {
    let a = 0, b = 0; const A = [1, 1, 0, 0, 1, 0, 1, 0], B = [1, 0, 1, 1, 0, 1, 0, 0], target = [0, 0, 1, 0, 0, 1, 0, 0];
    const val = (arr, shift, i) => arr[mod(i - shift, 8)], out = () => A.map((_, i) => val(A, a, i) & val(B, b, i));
    return { draw(c) { [['蓝光栅', A.map((_, i) => val(A, a, i)), blue], ['粉光栅', B.map((_, i) => val(B, b, i)), pink], ['合成影', out(), green], ['目标影', target, orange]].forEach(([name, row, color], j) => { T(c, name, 140, 180 + j * 85, 20, color); row.forEach((v, i) => R(c, 280 + i * 65, 145 + j * 85, 54, 55, v ? color : '#23334a', 5)); }); p.button(c, '蓝层 ←', 150, 490, 160, () => a = mod(a - 1, 8), blue); p.button(c, '蓝层 →', 330, 490, 160, () => a = mod(a + 1, 8), blue); p.button(c, '粉层 ←', 510, 490, 160, () => b = mod(b - 1, 8), pink); p.button(c, '粉层 →', 690, 490, 160, () => b = mod(b + 1, 8), pink); }, check: () => eq(out(), target) };
  });

  add(44, '分形地址', 'Fractal Address', '按坐标逐层深入一张无限分形地图。', '目标坐标从左上角计为 (0.81,0.08)。每次点击所在的九宫格将视野放大 3 倍，连续正确定位 3 层；中央空洞不可进入。', 'recursive-ternary-coordinate-fractal-zoom-addressing', p => {
    let level = 0, tx = .81, ty = .08, history = [];
    return { draw(c) { T(c, '放大倍率 ×' + Math.pow(3, level), 180, 205, 24, green); T(c, '当前局部坐标', 180, 295, 18, muted); T(c, '(' + tx.toFixed(3) + ', ' + ty.toFixed(3) + ')', 180, 340, 27, blue); for (let i = 0; i < 9; i++) { const x = 470 + i % 3 * 115, y = 150 + Math.floor(i / 3) * 115; p.tile(c, i === 4 ? '空洞' : String(i + 1), x, y, 103, 103, i === 4 ? null : () => { const right = Math.floor(tx * 3) + Math.floor(ty * 3) * 3; if (i !== right) return p.note('目标不在该区域。每格边长为当前视野的 1/3。'); history.push(i + 1); tx = tx * 3 % 1; ty = ty * 3 % 1; if (++level === 3) p.win('目标地址：' + history.join(' → ') + '，定位完成。'); }, i === 4 ? '#0d1621' : '#2a3c55'); } T(c, '地址 ' + history.join(' / '), 180, 430, 20, ink); } };
  });

  add(45, '隐私光栅', 'Privacy Shutters', '挡住三个摄像头，留下观察窗的视线。', '选择最多两个光栅位置。摄像头 A 被 1/3 号挡住，B 被 2/3 号挡住，C 被 4/5 号挡住；1、2、5 会遮挡你的观察窗。让三台摄像头都不可见，同时观察窗保持通透。', 'set-cover-privacy-occlusion-with-protected-view', p => {
    const on = new Set(), covers = [[0], [1], [0, 1], [2], [2]], blockedViewer = [0, 1, 4];
    const covered = j => [...on].some(i => covers[i].includes(j));
    return { draw(c) { [0, 1, 2].forEach(i => { const y = 170 + i * 100; p.node(c, 'ABC'[i], 130, y, 29, null, covered(i) ? muted : pink); L(c, 165, y, 780, 320, covered(i) ? '#263447' : pink, 3); }); p.node(c, '展品', 820, 320, 52, null, green); p.node(c, '观察', 500, 135, 31, null, blockedViewer.some(i => on.has(i)) ? pink : blue); for (let i = 0; i < 5; i++) p.tile(c, '光栅 ' + (i + 1) + (on.has(i) ? ' ■' : ' □'), 100 + i * 170, 470, 150, 55, () => { if (on.has(i)) on.delete(i); else if (on.size < 2) on.add(i); else p.note('最多只能安装两个光栅。'); }, on.has(i) ? '#4d6045' : '#29384f'); T(c, '最多 2 个光栅 · 保留自己的观察通道', 500, 420, 20, muted, 'center'); }, check: () => [0, 1, 2].every(covered) && !blockedViewer.some(i => on.has(i)) };
  });

  add(46, '频率领地', 'Frequency Map', '相邻区域必须使用不同无线频率。', '点击区域在蓝、粉、绿三个频段间切换。每条边两端的频率都要不同；A 区固定为蓝，D 区固定为绿。', 'three-color-interference-graph-with-fixed-frequencies', p => {
    const ns = positions(6), a = [0, 0, 0, 2, 0, 0], edges = [[0, 1], [0, 5], [1, 2], [2, 3], [3, 4], [4, 5], [1, 5], [2, 4]];
    return { draw(c) { edges.forEach(([u, v]) => L(c, ns[u].x, ns[u].y, ns[v].x, ns[v].y, a[u] === a[v] ? pink : '#4a6570', 5)); ns.forEach((q, i) => p.node(c, 'ABCDEF'[i] + (i === 0 || i === 3 ? ' 🔒' : ''), q.x, q.y, 38, i === 0 || i === 3 ? null : () => a[i] = (a[i] + 1) % 3, [blue, pink, green][a[i]])); T(c, '蓝 / 粉 / 绿 · 相邻频段不得重复', 500, 515, 21, muted, 'center'); }, check: () => edges.every(([u, v]) => a[u] !== a[v]) };
  });

  add(47, '信息素导航', 'Pheromone Routes', '给蚁群布置路标，让它们自行送达食物。', '点击格子循环方向 ↑→↓←。A 从左上出发送到右下，B 从左下出发送到右上。路标对所有蚂蚁相同，每只最多走 20 步。', 'shared-local-arrow-policy-multi-agent-routing', p => {
    const cols = 5, rows = 4, arrows = Array(20).fill(1), walls = new Set([6, 7, 11]); let paths = [], message = '布置路标后开始运输';
    const ds = [[0, -1], [1, 0], [0, 1], [-1, 0]];
    function route(start, end) { let pos = start; const path = [pos]; for (let k = 0; k < 20; k++) { const [dx, dy] = ds[arrows[pos]], x = pos % cols + dx, y = Math.floor(pos / cols) + dy, next = y * cols + x; if (x < 0 || x >= cols || y < 0 || y >= rows || walls.has(next)) return { path, good: false }; pos = next; path.push(pos); if (pos === end) return { path, good: true }; } return { path, good: false }; }
    return { draw(c) { for (let i = 0; i < 20; i++) { const [x, y] = xy(i, cols, 320, 150, 72); p.tile(c, walls.has(i) ? '' : ['↑', '→', '↓', '←'][arrows[i]], x, y, 62, 62, walls.has(i) ? null : () => arrows[i] = (arrows[i] + 1) % 4, walls.has(i) ? '#0d1723' : '#29384e'); if ([0, 15, 4, 19].includes(i)) T(c, ({ 0: 'A', 15: 'B', 4: 'B终', 19: 'A终' })[i], x + 30, y + 65, 13, green, 'center'); } paths.forEach((path, j) => path.forEach((v, i) => { if (i) { const a = xy(path[i - 1], cols, 350, 180, 72), b = xy(v, cols, 350, 180, 72); L(c, ...a, ...b, j ? pink : blue, 4); } })); p.button(c, '开始运输', 70, 240, 190, () => { const a = route(0, 19), b = route(15, 4); paths = [a.path, b.path]; message = 'A ' + (a.good ? '已达' : '受阻') + ' · B ' + (b.good ? '已达' : '受阻'); if (a.good && b.good) p.win('共享路标把两份食物分别送达。'); else p.note(message); }); T(c, message, 500, 505, 20, muted, 'center'); } };
  });

  add(48, '微气候调节', 'Climate Cells', '调节局部热源，利用扩散恢复生态平衡。', '初始温度为 8、0、4。选择一个区域加热 +2，然后推进一次扩散：每格新温度=(自身×2+左右邻格)/4（环形）。共可加热两次，让所有区域温度最终都 ≥4。', 'heat-source-control-under-conservative-discrete-diffusion', p => {
    let heat = [8, 0, 4], fuel = 2, ticks = 0;
    return { draw(c) { heat.forEach((v, i) => { const x = 250 + i * 250; O(c, x, 280, 80, 'hsl(' + (200 - v * 12) + ' 40% 35%)'); T(c, v.toFixed(2) + '°', x, 290, 28, ink, 'center'); p.button(c, '局部加热 +2', x - 95, 410, 190, () => { if (!fuel) return p.note('热源燃料已用完。'); heat[i] += 2; fuel--; }, orange); }); T(c, '燃料 ' + fuel + ' / 2 · 扩散 ' + ticks + ' 轮', 500, 145, 22, green, 'center'); p.button(c, '推进热扩散', 360, 485, 280, () => { const prev = heat.slice(); heat = prev.map((v, i) => (v * 2 + prev[(i + 2) % 3] + prev[(i + 1) % 3]) / 4); ticks++; if (heat.every(v => v >= 4)) p.win('生态区温度全部恢复到安全范围。'); else p.note('冷区还未达到 4°；加热可补充总热量，扩散会平衡温差。'); }); } };
  });

  add(49, '字典压缩室', 'Dictionary Codec', '选择字典，让长数据流变成短指令。', '数据为 ABABABCDCDCD。最多选两个字典词；每个命中可编码为 1 字节，同时字典本身也占字符长度。使总成本 ≤10。', 'dictionary-selection-greedy-token-compression-cost', p => {
    const source = 'ABABABCDCDCD', options = ['AB', 'CD', 'ABC', 'BCD', 'BC', 'DA'], selected = new Set();
    function encode() { const dict = [...selected].map(i => options[i]).sort((a, b) => b.length - a.length), output = []; let i = 0; while (i < source.length) { const word = dict.find(w => source.startsWith(w, i)); if (word) { output.push('[' + word + ']'); i += word.length; } else output.push(source[i++]); } return { output, cost: output.length + sum(dict.map(v => v.length)) }; }
    return { draw(c) { T(c, source, 500, 180, 35, blue, 'center'); options.forEach((v, i) => p.tile(c, v, 180 + i % 3 * 230, 235 + Math.floor(i / 3) * 80, 185, 60, () => { if (selected.has(i)) selected.delete(i); else if (selected.size < 2) selected.add(i); }, selected.has(i) ? '#486343' : '#293b51', green)); const e = encode(); T(c, e.output.join(' '), 500, 435, 23, ink, 'center'); T(c, '原始 12 · 编码 + 字典 = ' + e.cost + ' 字节', 500, 475, 21, e.cost <= 10 ? green : pink, 'center'); p.button(c, '提交编码', 385, 500, 230, () => { if (e.cost <= 10) p.win('字典压缩完成，节省 ' + (12 - e.cost) + ' 字节。'); else p.note('把重复出现的短片段收入字典更划算。'); }); } };
  });

  add(50, '汉明修复', 'Hamming Rescue', '用三个奇偶校验位修复空间通信中的单比特错误。', '每份七位数据恰有一位出错。校验组为 {1,3,5,7}、{2,3,6,7}、{4,5,6,7}，每组 1 的个数应为偶数。点击一位翻转，提交三份修复。', 'hamming-seven-four-syndrome-single-bit-correction', p => {
    const base = [0, 1, 1, 0, 0, 1, 1], bad = [5, 2, 7]; let round = 0, data = base.map((v, i) => v ^ (i === bad[0] - 1 ? 1 : 0)), initial = data.slice();
    const groups = [[0, 2, 4, 6], [1, 2, 5, 6], [3, 4, 5, 6]];
    const syndrome = () => groups.map(g => g.reduce((s, i) => s ^ data[i], 0));
    return { draw(c) { T(c, '待修复数据包 ' + (round + 1) + ' / 3', 500, 145, 24, green, 'center'); data.forEach((v, i) => { p.tile(c, String(v), 140 + i * 105, 220, 85, 90, () => data[i] ^= 1, v ? '#49694a' : '#29374d'); T(c, String(i + 1), 182 + i * 105, 345, 19, muted, 'center'); }); syndrome().forEach((v, i) => T(c, 'P' + (1 << i) + '：' + (v ? '奇校验 ✕' : '偶校验 ✓'), 240 + i * 260, 415, 22, v ? pink : green, 'center')); p.button(c, '提交修复', 370, 480, 260, () => { if (syndrome().some(Boolean) || data.filter((v, i) => v !== initial[i]).length !== 1) return p.note('需要恰好翻转一位，让三组校验都变成偶数。'); if (++round === 3) p.win('三个数据包无损修复。'); else { data = base.map((v, i) => v ^ (i === bad[round] - 1 ? 1 : 0)); initial = data.slice(); p.note('下一份数据包已到达。'); } }); } };
  });

  add(51, '阵列重建', 'RAID Rebuild', '从奇偶校验中重建丢失的整块数据盘。', '盘 A 为 10110110，盘 B 为 01101100，校验盘 P 为 11000011。P=A XOR B XOR 缺失盘。点击空白数据位，重建缺失盘。', 'xor-parity-whole-disk-data-reconstruction', p => {
    const a = [1, 0, 1, 1, 0, 1, 1, 0], b = [0, 1, 1, 0, 1, 1, 0, 0], parity = [1, 1, 0, 0, 0, 0, 1, 1], missing = Array(8).fill(0);
    return { draw(c) { [['A', a], ['B', b], ['P', parity], ['?', missing]].forEach(([label, row], j) => { T(c, '磁盘 ' + label, 150, 180 + j * 85, 23, j === 3 ? green : muted); row.forEach((v, i) => p.tile(c, String(v), 300 + i * 66, 145 + j * 85, 53, 60, j === 3 ? () => missing[i] ^= 1 : null, v ? '#49644c' : '#26364c')); }); p.button(c, '重建校验', 360, 495, 280, () => { if (a.every((v, i) => (v ^ b[i] ^ missing[i]) === parity[i])) p.win('缺失的数据盘已完整重建。'); else p.note('逐列求 XOR：相同两位抵消，剩余即为缺失位。'); }); } };
  });

  add(52, '内存整形', 'Memory Architect', '在碎片化地址空间中分配对齐的连续区块。', '内存共 16 格，3、7、11 已占用。A 需 3 格无对齐；B 需 4 格且起址为 4 的倍数；C 需 2 格且起址为 2 的倍数。先选区块再点击起始地址。', 'aligned-contiguous-memory-allocation-with-fragmentation', p => {
    const blocks = [{ name: 'A', len: 3, align: 1 }, { name: 'B', len: 4, align: 4 }, { name: 'C', len: 2, align: 2 }], placed = [-1, -1, -1], reserved = new Set([3, 7, 11]); let selected = 0;
    function owner(i) { if (reserved.has(i)) return -2; return placed.findIndex((v, j) => v >= 0 && i >= v && i < v + blocks[j].len); }
    return { draw(c) { blocks.forEach((b, j) => p.tile(c, b.name + '  ' + b.len + ' 格 / 对齐 ' + b.align, 130 + j * 255, 160, 230, 65, () => selected = j, selected === j ? '#4c6551' : '#29394e')); for (let i = 0; i < 16; i++) { const x = 140 + i % 8 * 94, y = 300 + Math.floor(i / 8) * 90, own = owner(i); p.tile(c, own === -2 ? '占用' : own < 0 ? '空闲' : blocks[own].name, x, y, 82, 62, () => { const b = blocks[selected], old = placed[selected]; placed[selected] = -1; if (i % b.align || i + b.len > 16 || Array.from({ length: b.len }, (_, k) => i + k).some(v => owner(v) !== -1)) { placed[selected] = old; return p.note('无法放置：检查连续空间、对齐和边界。'); } placed[selected] = i; }, own === -2 ? '#503b4d' : own < 0 ? '#24354b' : ['#3c6380', '#67517a', '#506b43'][own]); T(c, String(i), x + 40, y + 83, 16, muted, 'center'); } p.button(c, '释放所选区块', 360, 495, 280, () => placed[selected] = -1); }, check: () => placed.every(v => v >= 0) };
  });

  add(53, '向量绘图机', 'Vector Turtle', '用转向和前进指令描出一枚六边形徽记。', '绘图机朝右起步。每次前进 60 像素，每次右转 60°。添加程序后执行，必须按绿色虚线顺序描出六条边并闭合。', 'vector-turtle-pen-path-compilation-regular-hexagon', p => {
    let commands = [], path = [[400, 220]];
    const target = Array.from({ length: 7 }, (_, i) => { let x = 400, y = 220; for (let k = 0; k < i; k++) { x += Math.cos(k * Math.PI / 3) * 60; y += Math.sin(k * Math.PI / 3) * 60; } return [x, y]; });
    function run() { let x = 400, y = 220, d = 0; path = [[x, y]]; commands.forEach(v => { if (v === 'F') { x += Math.cos(d) * 60; y += Math.sin(d) * 60; path.push([x, y]); } else d += Math.PI / 3; }); if (path.length === 7 && path.every((v, i) => Math.hypot(v[0] - target[i][0], v[1] - target[i][1]) < 1)) p.win('向量程序绘出了完整徽记。'); else p.note('需要六次前进，并在相邻边之间右转 60°。'); }
    return { draw(c) { c.save(); c.setLineDash([6, 7]); target.forEach((q, i) => { if (i) L(c, ...target[i - 1], ...q, '#6a9b6a', 5); }); c.restore(); path.forEach((q, i) => { if (i) L(c, ...path[i - 1], ...q, blue, 4); }); O(c, 400, 220, 9, orange); wrap(c, commands.join(' · '), 90, 425, 820, 19, green); p.button(c, 'F 前进', 110, 485, 180, () => { if (commands.length < 18) commands.push('F'); }); p.button(c, 'R 右转', 310, 485, 180, () => { if (commands.length < 18) commands.push('R'); }); p.button(c, '执行绘图', 510, 485, 180, run); p.button(c, '清空程序', 710, 485, 180, () => { commands = []; path = [[400, 220]]; }); } };
  });

  add(54, '共振弦室', 'Resonance Chamber', '在长度和张力之间找到正确共振。', '基频 f=√张力/弦长。长度至少为 2，张力最大 9；调整两项使基频精确为 1.5，同时二、三次谐波为 3、4.5。', 'string-harmonic-frequency-length-tension-calibration', p => {
    let length = 3, tension = 1, time = 0;
    return { update(dt) { time += dt; }, draw(c) { const f = Math.sqrt(tension) / length; for (let x = 0; x < 650; x += 5) { const y = xx => 270 + Math.sin(xx / 650 * Math.PI * 3) * Math.sin(time * f * 6) * 55; L(c, 175 + x, y(x), 180 + x, y(x + 5), blue, 4); } O(c, 175, 270, 10, green); O(c, 825, 270, 10, green); T(c, '基频 ' + f.toFixed(3) + '  ·  谐波 ' + (f * 2).toFixed(2) + ' / ' + (f * 3).toFixed(2), 500, 380, 25, ink, 'center'); p.adjust(c, '弦长', length, 200, 435, v => length = G.clamp(v, 2, 6)); p.adjust(c, '张力', tension, 600, 435, v => tension = G.clamp(v, 1, 9)); T(c, '目标 1.5 / 3 / 4.5', 500, 145, 26, green, 'center'); }, check: () => Math.abs(Math.sqrt(tension) / length - 1.5) < .0001 };
  });

  add(55, '货舱重心', 'Cargo Torque', '把不同重量的集装箱摆成平衡的船舱。', '四个泊位力臂为 −3、−1、+1、+3。货物重 1、2、3、4；先选两件货物交换位置，使总力矩为 0。', 'weighted-permutation-zero-torque-cargo-balancing', p => {
    const a = [1, 2, 3, 4], arm = [-3, -1, 1, 3]; let selected = -1;
    const torque = () => sum(a.map((v, i) => v * arm[i]));
    return { draw(c) { const t = torque(); c.save(); c.translate(500, 390); c.rotate(G.clamp(t * .012, -.17, .17)); R(c, -350, -25, 700, 60, '#344862', 15); a.forEach((v, i) => { const x = -300 + i * 170; R(c, x, -55 - v * 25, 90, v * 25 + 30, selected === i ? '#8b7760' : '#557d69', 8); T(c, String(v) + 't', x + 45, -65, 27, ink, 'center'); }); c.restore(); a.forEach((v, i) => p.button(c, '泊位 ' + arm[i], 170 + i * 175, 470, 145, () => { if (selected < 0) selected = i; else { [a[selected], a[i]] = [a[i], a[selected]]; selected = -1; } })); T(c, '总力矩 ' + (t > 0 ? '+' : '') + t, 500, 150, 29, t === 0 ? green : pink, 'center'); G.poly(c, [[475, 445], [525, 445], [500, 410]], '#8190a5'); }, check: () => torque() === 0 };
  });

  add(56, '刚性桥架', 'Rigid Truss', '用三角形稳定桥架，而不只是一张连通的图。', '依次点击两个节点添加/删除梁，最多 6 根。下方 A、B 固定；一个自由节点若通过两根不共线梁连到已固定节点就稳定。让上方三点全部稳定。', 'two-anchor-noncollinear-distance-rigidity-construction', p => {
    const ns = [{ x: 230, y: 440 }, { x: 770, y: 440 }, { x: 370, y: 280 }, { x: 630, y: 280 }, { x: 500, y: 150 }], edges = []; let selected = -1;
    function fixed() { const s = new Set([0, 1]); for (let k = 0; k < 4; k++) for (let i = 2; i < 5; i++) { const connected = edges.filter(e => e.includes(i)).map(e => e[0] === i ? e[1] : e[0]).filter(j => s.has(j)); if (connected.some((u, a) => connected.some((v, b) => a < b && Math.abs((ns[u].x - ns[i].x) * (ns[v].y - ns[i].y) - (ns[u].y - ns[i].y) * (ns[v].x - ns[i].x)) > 1))) s.add(i); } return s; }
    return { draw(c) { const s = fixed(); L(c, 120, 480, 880, 480, '#6b6354', 15); edges.forEach(([a, b]) => L(c, ns[a].x, ns[a].y, ns[b].x, ns[b].y, s.has(a) && s.has(b) ? green : blue, 8)); ns.forEach((q, i) => p.node(c, 'ABCDE'[i], q.x, q.y, 25, () => { if (selected < 0) selected = i; else { if (i !== selected) { const ix = edges.findIndex(e => e.includes(i) && e.includes(selected)); if (ix >= 0) edges.splice(ix, 1); else if (edges.length < 6 && !(i < 2 && selected < 2)) edges.push([selected, i]); } selected = -1; } }, selected === i ? orange : s.has(i) ? green : blue)); T(c, '用梁 ' + edges.length + '/6 · 稳定节点 ' + s.size + '/5', 500, 530, 22, ink, 'center'); }, check: () => fixed().size === 5 };
  });

  add(57, '超立方导航', 'Hypercube Walk', '每个方向都是一个比特维度。', '从 0000 出发，每次只能翻转一个维度。避开 0101 和 1010，依次访问标记 0011、1100、1111，再抵达出口 1000。', 'four-dimensional-hypercube-bit-edge-navigation', p => {
    let pos = 0, phase = 0, trail = [0]; const goals = [3, 12, 15, 8], forbidden = [5, 10];
    return { draw(c) { for (let i = 0; i < 16; i++) { const x = 200 + i % 4 * 195, y = 155 + Math.floor(i / 4) * 77; p.tile(c, i.toString(2).padStart(4, '0') + (goals.includes(i) ? ' ◆' : ''), x, y, 160, 57, null, forbidden.includes(i) ? '#593748' : i === pos ? '#4e6b48' : trail.includes(i) ? '#374e68' : '#25364d', i === goals[phase] ? green : ink); } for (let i = 0; i < 4; i++) p.button(c, '翻转维度 ' + (3 - i), 125 + i * 195, 490, 175, () => { const n = pos ^ (1 << (3 - i)); if (forbidden.includes(n)) return p.note('该顶点被禁用，请从另一个维度绕行。'); pos = n; trail.push(n); if (pos === goals[phase]) { phase++; if (phase === 4) p.win('穿越四维空间，全部标记已访问。'); else p.note('标记记录成功，下一个：' + goals[phase].toString(2).padStart(4, '0')); } }); } };
  });

  add(58, '莫比乌斯信使', 'Mobius Courier', '穿过边界，世界上下会反过来。', '方向按钮移动。跨过左右边界会从另一侧出现，并把上下坐标翻转、朝向翻面。收集两个 ◆ 后，以翻面状态抵达左下的 E（第 1 列第 3 行）。', 'mobius-strip-boundary-identification-chirality-walk', p => {
    let x = 0, y = 0, flipped = false; const gems = new Set([17, 8]), collected = new Set();
    function move(dx, dy) { let nx = x + dx, ny = y + dy; if (ny < 0 || ny >= 3) return; if (nx < 0 || nx >= 6) { nx = mod(nx, 6); ny = 2 - ny; flipped = !flipped; } x = nx; y = ny; if (gems.has(y * 6 + x)) collected.add(y * 6 + x); }
    return { draw(c) { for (let i = 0; i < 18; i++) { const [xx, yy] = xy(i, 6, 280, 175, 72); p.tile(c, i === 12 ? 'E' : gems.has(i) && !collected.has(i) ? '◆' : '', xx, yy, 63, 63, null, '#283a50', green); if (y * 6 + x === i) O(c, xx + 31, yy + 31, 15, flipped ? pink : blue); } T(c, '左边界 ↔ 右边界（上下翻转）', 500, 140, 21, muted, 'center'); T(c, '朝向 ' + (flipped ? '反面' : '正面') + ' · 标记 ' + collected.size + '/2', 500, 445, 23, flipped ? pink : blue, 'center'); [['↑', 0, -1], ['←', -1, 0], ['↓', 0, 1], ['→', 1, 0]].forEach((v, i) => p.button(c, v[0], 290 + i * 110, 490, 90, () => move(v[1], v[2]))); }, check: () => x === 0 && y === 2 && flipped && collected.size === 2 };
  });

  add(59, '并发锁实验', 'Concurrency Locks', '让两段事务完成，同时避免彼此等待。', '事务 P 顺序请求锁 A、锁 B、写入并释放；事务 Q 请求锁 B、锁 A、写入并释放。点击推进其中一个事务；若各占一把锁且互相等待就会死锁。两者各写入一次即完成。', 'two-transaction-opposed-lock-order-deadlock-avoidance', p => {
    const pc = [0, 0], locks = [-1, -1], order = [[0, 1], [1, 0]]; let commits = 0, value = 100;
    function step(i) { if (pc[i] >= 3) return; if (pc[i] < 2) { const want = order[i][pc[i]]; if (locks[want] !== -1 && locks[want] !== i) { if (pc[1 - i] === 1 && pc[i] === 1) p.fail('死锁：两个事务都占有一把锁，并等待对方。'); else p.note('锁暂时被占用，先推进另一个事务。'); return; } locks[want] = i; pc[i]++; } else { value += i ? -30 : 20; locks.forEach((v, k) => { if (v === i) locks[k] = -1; }); pc[i]++; commits++; } }
    return { draw(c) { [0, 1].forEach(i => { const x = 280 + i * 440; T(c, '事务 ' + 'PQ'[i], x, 180, 29, i ? pink : blue, 'center'); for (let k = 0; k < 3; k++) p.tile(c, k === 2 ? '提交并释放' : '请求锁 ' + 'AB'[order[i][k]], x - 110, 220 + k * 70, 220, 55, null, pc[i] > k ? '#416244' : '#29394f'); p.button(c, '推进 ' + 'PQ'[i], x - 110, 450, 220, () => step(i), i ? pink : blue); }); T(c, '锁 A：' + (locks[0] < 0 ? '空闲' : 'PQ'[locks[0]]) + '  ·  锁 B：' + (locks[1] < 0 ? '空闲' : 'PQ'[locks[1]]) + '  ·  账户 ' + value, 500, 525, 21, green, 'center'); }, check: () => commits === 2 && value === 90 };
  });

  add(60, '复合拍号', 'Polymetric Lab', '三个不同长度的循环，合奏成一张节奏地图。', '三条节奏轨长度分别为 3、4、5 拍，每循环只有一个重音。调整起始偏移，让 60 拍的合成重音强度与下方目标完全一致。', 'coprime-polymetric-loop-phase-pattern-reconstruction', p => {
    const phases = [0, 0, 0], length = [3, 4, 5], target = [1, 2, 4]; let time = 0, beat = 0;
    const value = (i, v) => sum(length.map((n, j) => mod(i - v[j], n) === 0 ? 1 : 0));
    return { update(dt) { time += dt; if (time > .24) { time = 0; beat = (beat + 1) % 60; if (value(beat, phases)) p.api.sound('click'); } }, draw(c) { phases.forEach((v, j) => p.adjust(c, '循环 ' + length[j] + ' 拍', v, 155 + j * 265, 145, n => phases[j] = mod(n, length[j]))); for (let i = 0; i < 60; i++) { const x = 155 + i % 15 * 47, y = 290 + Math.floor(i / 15) * 52, v = value(i, phases), t = value(i, target); R(c, x, y, 35, 36, v ? ['#243248', '#4e6983', '#6b93ad', '#90c7d8'][v] : '#1c293b', 5); O(c, x + 17, y + 27, 3 + t * 2, green); if (beat === i) L(c, x, y - 5, x + 35, y - 5, pink, 4); } T(c, '色块亮度：当前强度 · 绿点大小：目标强度', 500, 525, 18, muted, 'center'); }, check: () => Array.from({ length: 60 }, (_, i) => i).every(i => value(i, phases) === value(i, target)) };
  });
}());
