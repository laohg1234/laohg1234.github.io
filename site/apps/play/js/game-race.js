/* RIDGELINE RALLY / Flavor Studio. Fixed-step suspension, three hand-built rally stages. */
(function () {
  'use strict';
  const F = FG, TAU = Math.PI * 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const lerp = (a, b, t) => a + (b - a) * t;
  const C = { ink: '#f6f3e9', soft: '#b8c9cc', lime: '#d9f58c', blue: '#83d7f6', gold: '#ffce80', red: '#ff8d87' };
  const stages = [
    { name: '松林晨光', region: 'PINE VALLEY', type: 'forest', length: 9000, par: 26, bronze: 43,
      sky: ['#78c0d2', '#dbe8c5'], mountain: ['#86b0a7', '#507e77', '#345b54'], dirt: '#76513a', rock: '#4e3b31', edge: '#a3bc66', grip: 1,
      nodes: [[0,450],[350,450],[620,390],[860,470],[1110,375],[1370,460],[1600,365],[1810,310],[1920,285],[2090,405],[2380,450],[2620,340],[2860,430],[3060,365],[3310,430],[3560,380],[3820,445],[4120,360],[4500,410],[4780,360],[5040,455],[5280,390],[5540,465],[5780,350],[6050,430],[6320,300],[6530,265],[6770,420],[7040,450],[7320,365],[7600,445],[7860,370],[8120,455],[8400,340],[8700,430],[9000,390]],
      gaps: [[1920,2090],[6530,6770]], ice: [], pads: [[1810,1890],[6410,6490]], checks: [1050,2400,3530,5300,7050,8120],
      signs: [{x:520,t:'起伏路 · 空中用 ← → 调车头'},{x:1600,t:'跳台 170m · 留好氮气'},{x:2400,t:'补给点 · 维修与氮气'},{x:3570,t:'连续弯坡 · 落地角度贴近地面'},{x:6050,t:'林间大跳台 · 准备氮气'},{x:7440,t:'最后一段 · 保持轮胎贴地'}] },
    { name: '赤岩飞跃', region: 'REDROCK CANYON', type: 'desert', length: 9600, par: 28, bronze: 47,
      sky: ['#d78c6d', '#f5d2a0'], mountain: ['#c18d72', '#a36551', '#70433b'], dirt: '#a06a42', rock: '#70462f', edge: '#e2b776', grip: .9,
      nodes: [[0,445],[300,445],[520,395],[800,470],[1120,445],[1370,320],[1510,280],[1750,440],[2030,465],[2240,360],[2490,460],[2740,420],[2960,285],[3220,445],[3460,430],[3700,350],[3900,445],[4200,370],[4470,435],[4800,395],[5070,310],[5340,430],[5600,350],[5820,430],[6050,300],[6230,270],[6470,440],[6740,470],[6980,380],[7150,440],[7380,340],[7600,465],[7850,350],[8100,430],[8380,310],[8610,420],[8900,350],[9230,415],[9600,390]],
      gaps: [[1510,1750],[2960,3220],[6230,6470]], ice: [], pads: [[1400,1480],[2850,2930],[6120,6200]], checks: [1010,2150,3500,5100,6700,8120],
      signs: [{x:650,t:'砂石路 · 刹车会让车身前倾'},{x:1200,t:'大断桥 · 跳台前使用氮气'},{x:2580,t:'第二跳 · 别在空中过度后仰'},{x:3590,t:'冲刺段 · 完美落地补充氮气'},{x:5760,t:'赤岩大裂谷 · 先下坡蓄速'},{x:7080,t:'搓板路 · 轻压车头，减少腾空'}] },
    { name: '雪岭决赛', region: 'ALPINE SUMMIT', type: 'snow', length: 10000, par: 30, bronze: 51,
      sky: ['#536f97', '#c1d7e3'], mountain: ['#9db6cb', '#6e8ea7', '#466b83'], dirt: '#78949e', rock: '#425f6b', edge: '#eaf7fa', grip: .75,
      nodes: [[0,430],[380,430],[650,370],[900,455],[1150,350],[1410,470],[1660,350],[1910,440],[2130,315],[2260,280],[2470,430],[2730,455],[2950,350],[3190,425],[3450,320],[3710,435],[3960,330],[4220,440],[4500,330],[4750,390],[5000,390],[5250,460],[5530,350],[5820,455],[6080,320],[6310,410],[6600,300],[6800,260],[7040,425],[7330,465],[7590,340],[7850,425],[8120,315],[8400,445],[8700,330],[9000,420],[9300,320],[9650,390],[10000,390]],
      gaps: [[2260,2470],[6800,7040]], ice: [[600,1100],[2730,3220],[3900,4450],[5000,5850],[7450,8450]], pads: [[2150,2230],[6690,6770]], checks: [1200,2660,3800,5500,7280,8750],
      signs: [{x:500,t:'冰面 · 提前刹车，保留牵引力'},{x:1950,t:'雪崖跳台 · 低车头落地更稳'},{x:3020,t:'冰谷起伏 · 轻推姿态修正'},{x:4370,t:'连绵冰谷 · 刹车距离变长'},{x:6320,t:'雪岭飞越 · 别在崖边犹豫'},{x:8790,t:'最后冲刺 · 终点就在山脊之后'}] }
  ];
  function profile(stage, x) {
    const a = stage.nodes; x = clamp(x, 0, stage.length);
    let lo = 0, hi = a.length - 2;
    while (lo < hi) { const m = (lo + hi + 1) >> 1; if (a[m][0] <= x) lo = m; else hi = m - 1; }
    const p = a[lo], q = a[lo + 1], t = clamp((x - p[0]) / (q[0] - p[0]), 0, 1), ease = t * t * (3 - 2 * t);
    return { y: lerp(p[1], q[1], ease), slope: (q[1] - p[1]) / (q[0] - p[0]) * 6 * t * (1 - t), solid: !stage.gaps.some(g => x > g[0] && x < g[1]), ice: stage.ice.some(g => x >= g[0] && x <= g[1]) };
  }
  const T = (c, s, x, y, size = 18, col = C.ink, align = 'left') => F.text(c, s, x, y, size, col, align);
  const rect = (c, x, y, w, h, col, r = 8) => F.rect(c, x, y, w, h, col, r);
  const line = (c, x, y, a, b, col, w = 2) => F.line(c, x, y, a, b, col, w);
  const circle = (c, x, y, r, col) => F.circle(c, x, y, r, col);
  const poly = (c, points, col, stroke) => F.poly(c, points, col, stroke);
  function panel(c, x, y, w, h, alpha = .88) { c.save(); c.globalAlpha = alpha; rect(c, x, y, w, h, '#13232e', 12); c.restore(); c.strokeStyle = '#eff8f01a'; c.lineWidth = 1; c.beginPath(); c.roundRect(x + .5, y + .5, w - 1, h - 1, 12); c.stroke(); }
  function sprite(c, key, x, y, w, h = w, a = 0) { F.art?.sprite?.(c, key, x, y, w, h, a); }
  function tyre(c, x, y, r, rotation, grip = 1) {
    c.save(); c.translate(x, y); c.rotate(rotation); circle(c, 0, 0, r + 1, '#162229');
    circle(c, 0, 0, r - 3, '#293238'); circle(c, 0, 0, r * .58, '#bdc7c6'); circle(c, 0, 0, r * .4, '#536571');
    for (let i = 0; i < 8; i++) { c.rotate(TAU / 8); line(c, r - 6, -3, r, -3, grip < .5 ? '#71848d' : '#465258', 3); }
    for (let i = 0; i < 5; i++) { const a = i * TAU / 5; line(c, Math.cos(a) * 3, Math.sin(a) * 3, Math.cos(a) * r * .46, Math.sin(a) * r * .46, '#dbe5e0', 2); }
    circle(c, 0, 0, 3, '#e8e7d7'); c.restore();
  }
  function car(c, body, color, ghost, time, suspension = [0, 0], boost = false, wheelSpin = 0) {
    c.save(); c.translate(body.x, body.y); c.rotate(body.a); if (ghost) c.globalAlpha = .33;
    const wheelX = [-35, 35], wheelY = [18 - suspension[0], 18 - suspension[1]];
    for (let i = 0; i < 2; i++) { line(c, wheelX[i] * .58, -3, wheelX[i], wheelY[i], '#43515a', 8); line(c, wheelX[i] * .55, -6, wheelX[i], wheelY[i] - 3, '#f4ca69', 3); tyre(c, wheelX[i], wheelY[i], 16, wheelSpin); }
    if (boost && !ghost) { const tail = 25 + Math.sin(time * 67) * 8; poly(c, [[-52,7],[-52,19],[-52-tail,14],[-61,10]], '#81dcff'); poly(c, [[-51,10],[-51,16],[-67,13]], '#eefbff'); }
    c.shadowColor = '#00000044'; c.shadowBlur = 8; c.shadowOffsetY = 3;
    poly(c, [[-49,2],[-38,-15],[-18,-16],[-8,-35],[20,-36],[37,-15],[52,-7],[53,8],[30,14],[-43,13]], '#1e2d34', '#122129');
    poly(c, [[-46,0],[-35,-12],[-15,-12],[-4,-31],[19,-32],[34,-12],[48,-5],[48,6],[29,10],[-41,9]], color);
    c.shadowBlur = 0; c.shadowOffsetY = 0;
    poly(c, [[-5,-28],[8,-28],[9,-12],[-14,-12]], '#9bdbdf'); poly(c, [[12,-28],[18,-28],[29,-12],[13,-12]], '#588f9f');
    line(c, -10, -34, 22, -34, '#f1f5e8', 4); line(c, -3, -32, -14, -8, '#324653', 4); line(c, 22, -32, 35, -9, '#324653', 4);
    rect(c, -39, -4, 76, 5, '#fff9dc55', 1); rect(c, -8, -4, 22, 10, '#ecf2dd', 2); T(c, '07', 3, 2, 10, '#1e353d', 'center');
    rect(c, 45, -5, 6, 6, '#fff5c1', 2); rect(c, -49, -1, 5, 6, '#ff7b65', 1); line(c, -54, 13, -43, 13, '#a6b1ac', 4);
    line(c, -26, -14, -37, -23, '#394c54', 4); rect(c, -47, -28, 20, 5, '#263940', 2);
    c.restore();
  }

  F.register({
    id: 'race-ridge-rally', title: '山脊拉力', en: 'RIDGELINE RALLY', genre: '越野竞速', category: '物理游乐', featured: true,
    coverScene: 'platformer', coverUnit: 'car', color: '#ffc37f', duration: '2–4 分钟',
    touchControls: { direction: true, keys: { Space: '氮气', KeyQ: '复位', KeyE: '稳姿' } },
    description: '穿越松林、赤岩与雪岭，用悬挂、空中姿态和氮气跑出你的最佳路线。',
    controls: '↑ / W 油门；↓ / S 刹车；← → / A D 空中倾斜；空格氮气；E 空中稳姿；Q 返回检查点。画面按钮支持触屏。',
    rules: '完成松林、峡谷、雪岭三个不同赛段。↑ 油门、↓ 刹车；空中 ← 抬车头、→ 压车头，尽量与落地点坡度一致。空格消耗氮气加速；干净落地和收集燃料瓶可补充氮气。E 稳姿有 10 秒冷却。每段有检查点，碰到旗帜自动修车；翻车或落谷会消耗一格车况并回到检查点。Q 可主动复位并罚时 3 秒。全程车况耗尽或赛时超过 240 秒失败。幽灵车表示银牌节奏；比拼用时、技巧和收集得分，完成全部赛段即可获胜。',
    mechanic: 'three-stage terrain rally with dual-wheel spring suspension rigid-body pitch airborne torque nitro ramps gaps ice grip checkpoints landing grading and time ghost',
    create(api) {
      let stageIndex = 0, stage = stages[0], mode = 'intro', time = 0, stageTime = 0, totalTime = 0, countdown = 3,
        accumulator = 0, camera = { x: 0, y: 0 }, hp = 5, nitro = 1, stabilizeCD = 0, flash = 0, shake = 0,
        checkpoints = 0, checkpointX = 130, resets = 0, spin = 0, airTime = 0, flips = 0, rotationTravel = 0,
        trickScore = 0, fuelCount = 0, cleanLandings = 0, successfulFlips = 0, ended = false, stageResults = [], message = '', messageTime = 0,
        finishDelay = 0, held = null, boostOn = false, wasGrounded = false, contactCount = 0, soundCD = 0, padCooldown = 0;
      let body = null, particles = [], fuel = [], trails = [], springs = [0,0], touch = { gas: false, brake: false, left: false, right: false, boost: false };
      let sceneryCanvas=null,sceneryContext=null,sceneryOrigin=0,sceneryStage=-1,sceneryCheckpoints=-1;
      function setMessage(s, seconds = 2) { message = s; messageTime = seconds; }
      function finish(win, text) { if (ended) return; ended = true; mode = 'finished'; const score = win ? Math.max(1000, Math.round(17000 - totalTime * 28 + trickScore + fuelCount * 75 + hp * 300)) : Math.max(0, Math.round(stageIndex * 1800 + body.x + trickScore)); api.finish(win, score, text); api.sound(win ? 'win' : 'lose'); }
      function resetBody(x) { const p = profile(stage, x); body = { x, y: p.y - 40, vx: 0, vy: 0, a: Math.atan(p.slope), av: 0 }; wasGrounded = false; airTime = 0; rotationTravel = 0; contactCount = 0; springs = [0,0]; boostOn = false; }
      function populateFuel() { fuel = []; for (let x = 700; x < stage.length - 250; x += 980) { const p = profile(stage, x); if (p.solid) fuel.push({ x, y: p.y - 65, taken: false }); } for (const gap of stage.gaps) fuel.push({ x: (gap[0] + gap[1]) / 2, y: profile(stage, gap[0]).y - 55, taken: false }); }
      function loadStage(i) { stageIndex = i; stage = stages[i]; stageTime = 0; checkpoints = 0; checkpointX = 130; resetBody(130); populateFuel(); camera = { x: 0, y: 0 }; trails = []; particles = []; countdown = 3; mode = 'countdown'; accumulator = 0; hp = Math.min(5, hp + 2); nitro = 1; setMessage(stage.name, 3); }
      function start() { if (mode === 'intro') loadStage(0); else if (mode === 'stage-clear') loadStage(stageIndex + 1); }
      function respawn(manual = false) {
        if (mode !== 'race') return; resets++; if (!manual) hp--; else totalTime += 3;
        if (hp <= 0) { finish(false, '车况耗尽。试试跳台前蓄足速度，空中轻压车头，让轮胎先落地。'); return; }
        resetBody(checkpointX); nitro = Math.max(.4, nitro); flash = .6; shake = .4; camera.x = Math.max(0, body.x - 280);
        setMessage(manual ? '返回检查点 · 罚时 +3s' : '救援到达 · 返回最近旗帜', 2); api.sound('hit');
      }
      function stabilize() { if (mode !== 'race' || stabilizeCD > 0) return; stabilizeCD = 10; const p = profile(stage, body.x + Math.max(50,body.vx*.25)); const goal = Math.atan(p.slope); body.av *= .15; body.a += wrap(goal-body.a)*.65; setMessage('空中稳姿', 1); api.sound('skill'); }
      function particle(x,y,vx,vy,color,life,size) { if (particles.length > 150) particles.shift(); particles.push({x,y,vx,vy,color,life,max:life,size}); }
      function landing(impact, targetA) {
        const error = Math.abs(wrap(body.a - targetA)), completedFlips=Math.floor((Math.abs(rotationTravel)+.5)/TAU);
        if (airTime > .22) {
          if (error < .4 && impact < 850) { const points = Math.round(airTime*120)+completedFlips*500; cleanLandings++; successfulFlips+=completedFlips; trickScore += points; nitro = clamp(nitro+.13+airTime*.035,0,1); setMessage((completedFlips ? completedFlips+' 圈空翻 · ' : '')+'干净落地 +'+points,1.7); api.sound('skill'); }
          else if (error > .95 || impact > 860) { hp--; shake = .35; setMessage('重落地 · 注意车身与坡面平行',1.8); api.sound('hit'); }
          else if (error < .6) setMessage('稳稳落地',1);
          for(let i=0;i<13;i++)particle(body.x,body.y+30,(Math.random()-.5)*130,-Math.random()*110,stage.edge,.3+Math.random()*.35,2+Math.random()*4);
        }
        airTime=0;rotationTravel=0;flips=0;
      }
      function input() { const k=api.keys; return {gas:!!(k.ArrowUp||k.KeyW||touch.gas),brake:!!(k.ArrowDown||k.KeyS||touch.brake),tilt:(k.ArrowRight||k.KeyD||touch.right?1:0)-(k.ArrowLeft||k.KeyA||touch.left?1:0),boost:!!(k.Space||touch.boost)}; }
      function tick(dt) {
        const u=input(),p=body;stageTime+=dt;totalTime+=dt;stabilizeCD=Math.max(0,stabilizeCD-dt);soundCD-=dt;padCooldown=Math.max(0,padCooldown-dt);
        let forces={x:0,y:980},torque=0,contacts=0,groundNormal={x:0,y:-1},avgSlope=0;const priorVy=p.vy;
        for(let i=0;i<2;i++) { const bx=i?35:-35,by=18,co=Math.cos(p.a),si=Math.sin(p.a),rx=bx*co-by*si,ry=bx*si+by*co,wx=p.x+rx,wy=p.y+ry,road=profile(stage,wx);
          const norm=1/Math.sqrt(1+road.slope*road.slope),nx=road.slope*norm,ny=-norm,penetration=(wy+16-road.y)*norm;
          springs[i]=lerp(springs[i],road.solid?clamp(penetration,0,13):0,Math.min(1,dt*15));
          if(road.solid&&penetration>0&&penetration<75) { contacts++;const vx=p.vx-p.av*ry,vy=p.vy+p.av*rx,vn=vx*nx+vy*ny,force=clamp(penetration*115-vn*12.5,0,4600);forces.x+=nx*force;forces.y+=ny*force;torque+=(rx*ny-ry*nx)*force/1800;groundNormal={x:nx,y:ny};avgSlope+=road.slope; }
        }
        const grounded=contacts>0;contactCount=contacts;boostOn=u.boost&&u.gas&&nitro>.01;nitro=clamp(nitro+(boostOn?-.36:grounded?.02:.008)*dt,0,1);
        if(grounded){const slope=avgSlope/contacts,norm=1/Math.sqrt(1+slope*slope),tx=norm,ty=slope*norm,road=profile(stage,p.x),grip=road.ice?.32:stage.grip,tangentSpeed=p.vx*tx+p.vy*ty;
          let drive=u.gas?(boostOn?1150:800):0;if(tangentSpeed> (boostOn?435:330))drive*=.08;let resist=tangentSpeed*(u.brake?grip*4.8:.18+Math.abs(tangentSpeed)*.0014);if(!u.gas&&!u.brake)resist+=Math.sign(tangentSpeed)*18;
          forces.x+=tx*(drive-resist);forces.y+=ty*(drive-resist);torque+=wrap(Math.atan(slope)-p.a)*12-p.av*6;torque+=u.brake?-.65:boostOn?-.2:0;
        if(stage.pads.some(g=>p.x>=g[0]&&p.x<=g[1])&&u.gas){forces.x+=160;nitro=clamp(nitro+.22*dt,0,1);if(boostOn&&padCooldown<=0&&p.vx>230){padCooldown=2;nitro=Math.max(0,nitro-.15);p.vy=-560;setMessage('飞跃跳台 · ← 抬头可做后空翻',1.8);api.sound('skill');}}
          if(!wasGrounded)landing(Math.max(0,priorVy),Math.atan(slope));
          if(u.gas&&Math.abs(p.vx)>35&&Math.random()<dt*32)particle(p.x-31,p.y+28,-p.vx*.15-Math.random()*55,-10-Math.random()*30,road.ice?'#cce8f2':stage.edge,.45,3+Math.random()*4);
        }else{airTime+=dt;torque+=u.tilt*11.5-p.av*.45;rotationTravel+=p.av*dt;flips=Math.floor((Math.abs(rotationTravel)+.5)/TAU);}
        p.vx=clamp(p.vx+forces.x*dt,-100,500);p.vy=clamp(p.vy+forces.y*dt,-850,1200);p.av=clamp(p.av+torque*dt,-8,8);p.x+=p.vx*dt;p.y+=p.vy*dt;p.a+=p.av*dt;spin+=p.vx*dt/16;
        if(p.x<90){p.x=90;p.vx=Math.max(0,p.vx);}const road=profile(stage,p.x);
        // Recover wheel tunnelling, but never create a bridge over the designed chasms.
        if(road.solid&&p.y>road.y-8&&p.y<road.y+85&&Math.abs(wrap(p.a-Math.atan(road.slope)))<1.1){p.y=road.y-25;p.vy=Math.min(p.vy,0);}
        if(road.solid&&p.y>road.y-55&&Math.abs(wrap(p.a-Math.atan(road.slope)))>1.85){respawn();return;}
        if(p.y>800||hp<=0){respawn();return;}
        for(const item of fuel)if(!item.taken&&Math.hypot(p.x-item.x,p.y-item.y)<57){item.taken=true;fuelCount++;nitro=clamp(nitro+.2,0,1);trickScore+=75;api.sound('click');for(let i=0;i<8;i++)particle(item.x,item.y,(Math.random()-.5)*90,-Math.random()*100,C.blue,.5,3);}
        while(checkpoints<stage.checks.length&&p.x>stage.checks[checkpoints]&&grounded){checkpointX=stage.checks[checkpoints]+45;checkpoints++;hp=Math.min(5,hp+1);nitro=clamp(nitro+.2,0,1);setMessage('检查点 '+checkpoints+' / '+stage.checks.length+' · 维修 +1',2);api.sound('skill');}
        wasGrounded=grounded;if(p.x>stage.length-60&&road.solid){finishDelay+=dt;if(finishDelay>.18){const medal=stageTime<=stage.par?'金牌':stageTime<=stage.bronze?'银牌':'完赛';stageResults.push({name:stage.name,time:stageTime,medal});finishDelay=0;if(stageIndex===2){finish(true,'三段山脊全部征服！总用时 '+totalTime.toFixed(1)+' 秒，干净落地 '+cleanLandings+' 次。');}else{mode='stage-clear';api.sound('win');}return;}}
        if(totalTime>240)finish(false,'拉力赛时限已到，跳台前留足氮气，并利用检查点继续挑战。');
      }
      function update(dt) {
        if(ended)return;dt=clamp(dt,0,.1);time+=dt;messageTime=Math.max(0,messageTime-dt);flash=Math.max(0,flash-dt);shake=Math.max(0,shake-dt);
        for(let i=particles.length-1;i>=0;i--){const q=particles[i];q.life-=dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=150*dt;if(q.life<=0)particles.splice(i,1);}
        if(mode==='countdown'){countdown-=dt;if(countdown<=0){mode='race';setMessage('出发！',1);api.sound('skill');}}
        if(mode==='race'){accumulator+=dt;while(accumulator>=1/120&&mode==='race'){tick(1/120);accumulator-=1/120;}}
        if(body){const ahead=clamp(body.vx*.65,0,170);camera.x=lerp(camera.x,clamp(body.x-300+ahead,0,stage.length-860),1-Math.exp(-dt*3));camera.y=lerp(camera.y,clamp(body.y-350,-190,120),1-Math.exp(-dt*2));}
        api.setScore(Math.round(stageIndex*2500+(body?.x||0)+trickScore));
      }
      function background(c) {
        const sky=c.createLinearGradient(0,0,0,620);sky.addColorStop(0,stage.sky[0]);sky.addColorStop(1,stage.sky[1]);c.fillStyle=sky;c.fillRect(0,0,1000,620);
        const sunX=stageIndex===2?795:825,sunY=130;circle(c,sunX,sunY,41,stageIndex===2?'#e8f2ff':'#fff0bf');circle(c,sunX,sunY,57,'#fff8df18');
        for(let layer=0;layer<3;layer++){const pts=[[0,640]],parallax=.08+layer*.12,base=250+layer*90,amp=layer===0?100:65;for(let x=-80;x<1100;x+=40){let world=x+camera.x*parallax,y=base+Math.sin(world/190+layer*2.8)*amp+Math.sin(world/83+layer)*amp*.28;pts.push([x,y-camera.y*.1]);}pts.push([1100,640]);poly(c,pts,stage.mountain[layer]);if(stageIndex===2&&layer===0){for(let x=0;x<1000;x+=245){const y=base+Math.sin((x+camera.x*parallax)/190)*amp;poly(c,[[x-48,y+36],[x,y-20],[x+45,y+38],[x+17,y+19],[x+2,y+32],[x-17,y+17]],'#e7f1f0');}}}
        for(let i=0;i<7;i++){let x=((i*217-camera.x*.12+time*2)%1350+1350)%1350-150,y=100+(i*37)%120;c.save();c.globalAlpha=.4;circle(c,x,y,17,'#fff9e4');circle(c,x+24,y-7,26,'#fff9e4');circle(c,x+51,y,18,'#fff9e4');rect(c,x-9,y,72,13,'#fff9e4',6);c.restore();}
        if(stageIndex===2)for(let i=0;i<30;i++){const x=(i*67+time*(12+i%6))%1000,y=(i*91+time*17)%620;circle(c,x,y,1+i%2,'#f5ffff88');}
      }
      function terrain(c,span=1100) {
        const left=Math.floor(camera.x/14)*14-70,right=camera.x+span;
        let path=[];const segments=[];for(let x=left;x<=right;x+=14){const p=profile(stage,x);if(p.solid){path.push([x,p.y]);}else if(path.length){segments.push(path);path=[];}}if(path.length)segments.push(path);
        for(const arr of segments){if(arr.length<2)continue;const bottom=800;const points=[[arr[0][0],bottom],...arr,[arr[arr.length-1][0],bottom]];poly(c,points,stage.dirt);c.save();c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.clip();for(let y=460;y<850;y+=48){line(c,left,y,right,y+Math.sin(y)*18,stage.rock+'60',5);}for(let x=Math.floor(left/65)*65;x<right;x+=65){const p=profile(stage,x);for(let j=0;j<4;j++){const yy=p.y+35+j*56,xx=x+Math.sin(x*2+j)*20;poly(c,[[xx-10,yy],[xx,yy-5],[xx+13,yy+4],[xx+3,yy+10]],stage.rock+'88');}}c.restore();
          c.lineJoin='round';c.lineCap='round';c.beginPath();arr.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.strokeStyle=stage.rock;c.lineWidth=13;c.stroke();c.beginPath();arr.forEach(([x,y],i)=>i?c.lineTo(x,y-3):c.moveTo(x,y-3));c.strokeStyle=stage.edge;c.lineWidth=8;c.stroke();
        }
        for(const gap of stage.gaps){for(const x of gap){if(x<left-50||x>right+50)continue;const y=profile(stage,x).y;rect(c,x-8,y+5,16,160,stage.rock,2);for(let n=0;n<4;n++)line(c,x-12,y+20+n*30,x+12,y+37+n*30,stage.edge+'88',4);}}
        for(const ice of stage.ice){const a=Math.max(left,ice[0]),b=Math.min(right,ice[1]);if(a>b)continue;c.beginPath();for(let x=a;x<b;x+=10){const p=profile(stage,x);if(x===a)c.moveTo(x,p.y-6);else c.lineTo(x,p.y-6);}c.strokeStyle='#a5e7fa';c.lineWidth=7;c.stroke();for(let x=a+20;x<b;x+=80){let p=profile(stage,x);line(c,x-5,p.y-7,x+8,p.y-9,'#f7ffff',2);}}
        for(const pad of stage.pads){for(let x=pad[0]+5;x<pad[1];x+=20){const p=profile(stage,x);c.save();c.translate(x,p.y-8);c.rotate(Math.atan(p.slope));poly(c,[[-7,-6],[0,0],[-7,6],[1,6],[8,0],[1,-6]],'#8cf3ef');c.restore();}}
        for(let i=0;i<stage.checks.length;i++){const x=stage.checks[i],p=profile(stage,x);if(x<left-120||x>right+100)continue;line(c,x,p.y,x,p.y-114,'#dae4cd',5);poly(c,[[x,p.y-114],[x+52,p.y-100],[x,p.y-84]],i<checkpoints?'#d8f58f':'#d5e0da');panel(c,x-30,p.y-145,75,24,.75);T(c,'CP '+(i+1),x+8,p.y-132,11,i<checkpoints?C.lime:C.ink,'center');}
        for(let x=Math.floor(left/210)*210;x<right;x+=210){const p=profile(stage,x);if(!p.solid||Math.abs(x-stage.length)<150)continue;const type=stageIndex===0?'tree':stageIndex===1?'rock':'tree';if(stageIndex===0)sprite(c,type,x,p.y-58,65,115);else if(stageIndex===1)sprite(c,type,x,p.y-22,50,45);else{c.save();c.globalAlpha=.7;sprite(c,type,x,p.y-52,59,100);c.restore();}}
        for(const s of stage.signs){if(s.x<left-220||s.x>right)continue;const p=profile(stage,s.x);line(c,s.x,p.y,s.x,p.y-76,'#c7be9c',5);panel(c,s.x-14,p.y-100,250,38,.82);T(c,s.t,s.x+110,p.y-80,12,C.ink,'center');}
        const x=stage.length-65,p=profile(stage,x);if(x>left-100&&x<right+100){line(c,x,p.y,x,p.y-150,'#e9eee7',7);line(c,x+140,p.y,x+140,p.y-150,'#e9eee7',7);rect(c,x-5,p.y-158,150,35,'#182b32',3);T(c,'FINISH',x+70,p.y-140,20,C.lime,'center');for(let n=0;n<12;n++)for(let j=0;j<2;j++)rect(c,x+n*12,p.y-119+j*10,12,10,(n+j)%2?'#ecf2dc':'#243138',0);}
      }
      function cachedTerrain(c){
        if(typeof document==='undefined'||!c.drawImage){terrain(c);return;}
        if(!sceneryCanvas){sceneryCanvas=document.createElement('canvas');sceneryCanvas.width=1450;sceneryCanvas.height=900;sceneryContext=sceneryCanvas.getContext('2d');}
        if(!sceneryContext){terrain(c);return;}
        const origin=Math.floor(Math.max(0,camera.x-110)/220)*220;
        if(sceneryStage!==stageIndex||sceneryCheckpoints!==checkpoints||camera.x<sceneryOrigin||camera.x+1070>sceneryOrigin+1450){
          sceneryOrigin=origin;sceneryStage=stageIndex;sceneryCheckpoints=checkpoints;const previous=camera.x;camera.x=origin;
          sceneryContext.setTransform(1,0,0,1,0,0);sceneryContext.clearRect(0,0,1450,900);sceneryContext.translate(-origin,0);terrain(sceneryContext,1450);camera.x=previous;
        }
        c.drawImage(sceneryCanvas,sceneryOrigin,0);
      }
      function fuelDraw(c) { for(const item of fuel)if(!item.taken&&item.x>camera.x-80&&item.x<camera.x+1080){const y=item.y+Math.sin(time*4+item.x)*4;circle(c,item.x,y,25,'#9de7ff16');rect(c,item.x-11,y-15,22,29,'#6ddef1',5);rect(c,item.x-6,y-20,12,7,'#d5f9ff',2);poly(c,[[item.x+2,y-9],[item.x-6,y+2],[item.x,y+2],[item.x-2,y+9],[item.x+7,y-2],[item.x+1,y-2]],'#173b50');} }
      function hud(c) {
        panel(c,20,18,960,70,.88);T(c,'山脊拉力',42,43,23,C.ink);T(c,'RIDGELINE RALLY',43,66,9,'#93aeb6');
        T(c,(stageIndex+1)+' / 3',244,42,22,C.gold);T(c,stage.name,244,65,12,C.soft);T(c,totalTime.toFixed(1)+'s',389,42,23,C.ink);T(c,'总计时',389,65,11,C.soft);
        T(c,Math.round(Math.max(0,body?.vx||0)*.38)+'',535,42,29,C.ink);T(c,'km/h',575,64,11,C.soft);T(c,'车况',655,32,11,C.soft);for(let i=0;i<5;i++)rect(c,655+i*21,46,15,14,i<hp?'#d9efaa':'#3a4950',3);
        T(c,'氮气',800,32,11,C.soft);F.bar(c,800,48,151,10,nitro,1,boostOn?'#d8faff':C.blue);
        panel(c,350,105,300,28,.7);const gap=stage.gaps.find(g=>g[0]>(body?.x||0)-40&&g[0]<(body?.x||0)+500);T(c,gap?'前方断崖 '+Math.max(0,Math.round(gap[0]-body.x))+'m · 提前加速':contactCount?'地面牵引':'空中 · ← → 调整姿态',500,120,12,gap?C.gold:C.soft,'center');
        const mapY=520,mapX=330,mapW=340;panel(c,mapX-14,mapY-15,mapW+28,34,.72);line(c,mapX,mapY,mapX+mapW,mapY,'#76958a',3);for(const g of stage.gaps)line(c,mapX+g[0]/stage.length*mapW,mapY,mapX+g[1]/stage.length*mapW,mapY,'#182833',5);for(const x of stage.checks)circle(c,mapX+x/stage.length*mapW,mapY,4,'#d2e9ae');circle(c,mapX+clamp((body?.x||0)/stage.length,0,1)*mapW,mapY,5,C.gold);
        const buttons=[['brake','刹车 ↓',20,546,112],['left','抬头 ←',146,546,98],['right','压头 →',258,546,98],['gas','油门 ↑',746,546,112],['boost','氮气',870,546,110]];
        for(const [id,label,x,y,w]of buttons){panel(c,x,y,w,54,touch[id]||input()[id]?1:.82);if(touch[id]||id==='boost'&&boostOn)rect(c,x+3,y+3,w-6,4,id==='boost'?C.blue:C.lime,2);T(c,label,x+w/2,y+28,16,C.ink,'center');}
        panel(c,370,552,120,42,.8);T(c,'Q 复位 +3s',430,574,12,C.soft,'center');panel(c,504,552,120,42,.8);T(c,stabilizeCD>0?'E 稳姿 '+Math.ceil(stabilizeCD)+'s':'E 空中稳姿',564,574,12,stabilizeCD>0?C.soft:C.blue,'center');
        if(messageTime>0&&mode==='race'){panel(c,290,150,420,40,.84);T(c,message,500,171,17,C.gold,'center');}
      }
      function intro(c) {
        panel(c,95,115,810,375,.93);T(c,'OFFROAD / 03 STAGES',137,150,12,C.gold);T(c,'山脊拉力',135,195,45,C.ink);T(c,'油门交给右脚，落地交给技术。',138,240,19,C.soft);
        const labels=['松林晨光','赤岩飞跃','雪岭决赛'];labels.forEach((s,i)=>{const x=140+i*245;rect(c,x,280,222,72,['#3d6654','#85543e','#4f7186'][i],9);T(c,'0'+(i+1),x+15,300,11,'#f3f2d399');T(c,s,x+15,326,21,C.ink);});
        T(c,'↑ 油门  ↓ 刹车    ← → 空中姿态    空格 氮气',140,388,16,C.ink);T(c,'车轮贴着坡面落下更稳。检查点会修车，E 可紧急稳姿。',140,420,14,C.soft);
        rect(c,650,433,210,44,C.lime,8);T(c,'开始拉力  →',755,455,19,'#203739','center');
      }
      function stageClear(c) {
        panel(c,160,125,680,359,.95);T(c,'STAGE COMPLETE',500,160,12,C.lime,'center');T(c,stage.name+' · 完成',500,207,33,C.ink,'center');
        const result=stageResults[stageResults.length-1];T(c,result.time.toFixed(2)+'s',355,278,48,C.gold,'center');T(c,result.medal,656,275,30,result.medal==='金牌'?C.gold:C.blue,'center');
        T(c,'车况恢复 +2  ·  氮气补满',500,335,16,C.soft,'center');T(c,'下一站：'+stages[stageIndex+1].name,500,375,18,C.ink,'center');rect(c,335,412,330,48,C.lime,9);T(c,'继续下一赛段  →',500,436,20,'#203739','center');
      }
      function draw(c) {
        background(c);if(!body){body={x:130,y:410,vx:0,vy:0,a:0,av:0};}c.save();if(shake>0)c.translate(Math.sin(time*80)*shake*9,Math.cos(time*71)*shake*5);c.translate(-camera.x,-camera.y);cachedTerrain(c);fuelDraw(c);
        if(mode==='race'||mode==='stage-clear'){let ghostX=clamp(130+stageTime*(stage.length-190)/stage.bronze,130,stage.length-70),gp=profile(stage,ghostX);if(gp.solid){car(c,{x:ghostX,y:gp.y-38,a:Math.atan(gp.slope)},'#e4edec',true,time,[0,0],false,stageTime*20);if(Math.abs(ghostX-body.x)<650){T(c,'SILVER PACE',ghostX,gp.y-92,10,'#f4f9f0aa','center');}}}
        if(flash<=0||Math.floor(time*13)%2===0)car(c,body,'#e8a65e',false,time,springs,boostOn,spin);for(const q of particles){c.save();c.globalAlpha=clamp(q.life/q.max,0,1);circle(c,q.x,q.y,q.size,q.color);c.restore();}c.restore();hud(c);
        if(mode==='intro')intro(c);if(mode==='stage-clear')stageClear(c);if(mode==='countdown'){panel(c,406,195,188,163,.85);T(c,String(Math.max(1,Math.ceil(countdown))),500,269,80,C.lime,'center');T(c,'准备发车',500,328,13,C.soft,'center');}
      }
      function pointer(x,y,type) { if(type==='up'){cancelPointer();return;}if(type!=='down')return;
        if(mode==='intro'){if(x>95&&x<905&&y>115&&y<490)start();return;}if(mode==='stage-clear'){if(x>160&&x<840&&y>125&&y<484)start();return;}
        if(y>=546&&y<=608){touch.brake=x>=20&&x<=132;touch.left=x>=146&&x<=244;touch.right=x>=258&&x<=356;touch.gas=x>=746&&x<=858;touch.boost=x>=870&&x<=980;if(touch.boost)touch.gas=true;if(x>=370&&x<=490)respawn(true);if(x>=504&&x<=624)stabilize();}
      }
      function cancelPointer(){touch={gas:false,brake:false,left:false,right:false,boost:false};}
      resetBody(130);populateFuel();
      return {update,draw,pointer,cancelPointer,key(code){if(mode==='intro'||mode==='stage-clear'){if(code==='Space'||code==='Enter')start();return;}if(code==='KeyQ')respawn(true);if(code==='KeyE')stabilize();},
        snapshot(){return{mode,stage:stageIndex,stageName:stage.name,time,totalTime,stageTime,hp,nitro,checkpoints,checkpointX,resets,cleanLandings,successfulFlips,trickScore,airTime,contactCount,boostOn,body:{...body},camera:{...camera},stageResults:stageResults.map(s=>({...s})),terrain:{length:stage.length,gaps:stage.gaps.map(g=>g.slice()),ice:stage.ice.map(g=>g.slice()),nodes:stage.nodes.map(g=>g.slice())}};}
      };
    }
  });
})();
