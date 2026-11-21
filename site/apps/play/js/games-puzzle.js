(() => {
  'use strict';
  const F = FG;
  const category = '解谜实验';
  const ink = '#eef6ed';
  const muted = '#acbfbb';
  const gold = '#ffcc76';
  const mint = '#9fefc0';
  const danger = '#ff8d8d';
  const hints = ['上', '右', '下', '左'];
  const dx = [0, 1, 0, -1];
  const dy = [-1, 0, 1, 0];
  const arrows = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
  const letters = ['KeyW', 'KeyD', 'KeyS', 'KeyA'];

  function register(meta, create) {
    F.register({category, duration: '3–8 分钟', touchControls: {direction: false, keys: {}}, ...meta, create});
  }

  function session(api) {
    let ended = false;
    return {
      get ended() { return ended; },
      finish(win, score, message) {
        if (ended) return;
        ended = true;
        api.finish(win, Math.max(0, Math.round(score)), message);
      }
    };
  }

  function stage(c, title, stats, palette = '#234939') {
    const g = c.createLinearGradient(0, 0, 790, 620);
    g.addColorStop(0, palette);
    g.addColorStop(1, '#10191e');
    c.fillStyle = g;
    c.fillRect(0, 0, 1000, 620);
    for (let y = 95; y < 618; y += 29) {
      for (let x = 15 + (y % 2) * 10; x < 1000; x += 29) F.circle(c, x, y, 1, '#d4efec19');
    }
    F.rect(c, 20, 18, 960, 58, '#10191ee5', 9);
    F.text(c, title, 38, 47, 26, ink);
    stats.forEach(([label, value], i) => {
      const x = 430 + i * 180;
      F.text(c, label, x, 39, 13, muted);
      F.text(c, value, x, 58, 18, mint);
    });
  }

  function side(c, header, body, note = '', noteColor = gold) {
    F.rect(c, 702, 100, 278, 487, '#101c21eb', 12);
    F.text(c, header, 722, 128, 23, ink);
    F.wrapText(c, body, 722, 160, 238, 17, muted, 25);
    if (note) F.wrapText(c, note, 722, 412, 238, 16, noteColor, 25);
  }

  function button(c, label, y, active = true, color = mint) {
    F.rect(c, 722, y, 238, 48, active ? color : '#3b4b4d', 7);
    F.text(c, label, 841, y + 24, 18, active ? '#112422' : muted, 'center');
  }

  const onButton = (x, y, top) => F.hit(x, y, 722, top, 238, 48);
  const board = (w, h, size, center = 352) => ({w, h, size, x: center - w * size / 2, y: 345 - h * size / 2});
  const coord = (b, index) => [b.x + (index % b.w) * b.size, b.y + Math.floor(index / b.w) * b.size];
  function tileAt(b, x, y) {
    const col = Math.floor((x - b.x) / b.size);
    const row = Math.floor((y - b.y) / b.size);
    return col >= 0 && col < b.w && row >= 0 && row < b.h ? row * b.w + col : -1;
  }
  function backdrop(c, b) {
    F.rect(c, b.x - 9, b.y - 9, b.w * b.size + 18, b.h * b.size + 18, '#081217bd', 8);
  }
  function moveDir(code) {
    const i = arrows.indexOf(code);
    return i >= 0 ? i : letters.indexOf(code);
  }
  function shuffle(values, random) {
    for (let i = values.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
  }

  register({
    id: 'puzzle-minefield', title: '矿区扫雷', en: 'Mine Survey', genre: '扫雷',
    description: '读懂邻雷数字，为危险格插旗，清空两块矿区的安全区域。',
    rules: '数字等于周围八格的地雷总数。首次探测及周围八格安全。清出全部安全格进入下一关。点已揭示的数字且周围旗数正确时，可一次探测其余相邻格。踩雷结束。',
    controls: '点击棋盘探测或插旗。右侧按钮切换工具，F 也可切换。',
    mechanic: 'first-click-safe two-field mine survey with flood uncover and numbered chording'
  }, api => {
    const game = session(api);
    let level = 0, b, count, mines, open, flags, initialized, flagMode = false, clear = false, wrong = -1;
    const maps = [[8, 7, 8], [10, 8, 14]];
    const random = api.random || Math.random;
    function reset() {
      const [w, h, n] = maps[level];
      b = board(w, h, w === 8 ? 58 : 52);
      count = n;
      mines = new Set();
      open = new Set();
      flags = new Set();
      initialized = clear = false;
    }
    function neighbors(i) {
      const row = Math.floor(i / b.w);
      const col = i % b.w;
      const result = [];
      for (let y = Math.max(0,row-1); y <= Math.min(b.h-1,row+1); y++) {
        for (let x = Math.max(0,col-1); x <= Math.min(b.w-1,col+1); x++) if (y*b.w+x !== i) result.push(y*b.w+x);
      }
      return result;
    }
    const clue = i => neighbors(i).filter(j => mines.has(j)).length;
    function uncover(i) {
      if (!initialized) {
        const excluded = new Set([i, ...neighbors(i)]);
        const available = Array.from({length:b.w*b.h}, (_,j) => j).filter(j => !excluded.has(j));
        mines = new Set(shuffle(available, random).slice(0, count));
        initialized = true;
      }
      const queue = open.has(i) && neighbors(i).filter(j => flags.has(j)).length === clue(i) ? neighbors(i) : [i];
      for (const j of queue) {
        if (open.has(j) || flags.has(j)) continue;
        if (mines.has(j)) {
          wrong = j;
          game.finish(false, level * 1500 + open.size * 15, '探测器触雷。先按数字数清邻雷。');
          return;
        }
        open.add(j);
        if (!clue(j)) queue.push(...neighbors(j));
      }
      api.setScore(level * 1500 + open.size * 15);
      if (open.size === b.w*b.h-count) {
        clear = true;
        api.sound('win');
      } else api.sound('click');
    }
    reset();
    return {
      pointer(x,y,type) {
        if (type !== 'down' || game.ended) return;
        if (onButton(x,y,500)) {
          if (clear) {
            if (level === 0) { level++; reset(); }
            else game.finish(true, 3600, '两块矿区全部勘探完成。');
          } else flagMode = !flagMode;
          return;
        }
        const i = tileAt(b,x,y);
        if (clear || i < 0) return;
        if (flagMode) {
          if (open.has(i)) return;
          if (flags.has(i)) flags.delete(i);
          else if (flags.size < count) flags.add(i);
          api.sound('click');
        } else if (!flags.has(i)) uncover(i);
      },
      key(code) { if (code === 'KeyF' && !clear) flagMode = !flagMode; },
      draw(c) {
        stage(c, '矿区扫雷', [['矿区', level+1+'/2'], ['安全格', open.size+'/'+(b.w*b.h-count)], ['余旗', count-flags.size]], '#3e5140');
        backdrop(c,b);
        const numbers = ['', '#87d4ff','#bceca7','#ffb591','#c4adff','#ffc263','#87ead1','#f2a0b5','#fff'];
        for (let i = 0; i < b.w*b.h; i++) {
          const [x,y] = coord(b,i);
          const s = b.size;
          F.rect(c,x+1,y+1,s-2,s-2,open.has(i)?'#1d2a2c':i===wrong?'#9c4e4a':'#475955',5);
          if (!open.has(i)) F.line(c,x+5,y+6,x+s-5,y+6,'#abc0a893',2);
          if (open.has(i) && clue(i)) F.text(c,clue(i),x+s/2,y+s/2,27,numbers[clue(i)],'center');
          if (flags.has(i)) {
            F.line(c,x+s*.41,y+s*.27,x+s*.41,y+s*.72,'#e8ebd7',3);
            F.poly(c,[[x+s*.41,y+s*.26],[x+s*.72,y+s*.35],[x+s*.41,y+s*.48]],gold);
            F.line(c,x+s*.32,y+s*.73,x+s*.53,y+s*.73,'#e8ebd7',3);
          }
          if (i===wrong) F.circle(c,x+s/2,y+s/2,11,danger);
        }
        side(c,'现场探测','读数字判断周围八格。插旗标明地雷的位置，探测其余区域。',clear?'安全区已清理。': flagMode?'当前工具 · 插旗':'当前工具 · 探测');
        button(c,clear?(level?'完成勘探':'进入第二矿区'):flagMode?'切换到探测':'切换到插旗',500,true,flagMode?gold:mint);
      },
      snapshot() {return {level,clear,initialized,open:[...open].map(i=>[i,clue(i)]),flags:[...flags],width:b.w,height:b.h};}
    };
  });

  register({
    id: 'puzzle-slide-studio', title: '滑块修画', en: 'Sliding Gallery', genre: '滑块拼图',
    description: '利用唯一空位移动图块，把两幅编号错乱的画拼回原样。',
    rules: '只能移动紧邻空位的图块。按编号或图像边缘把画还原，空位留在右下角。两幅画都拼成即获胜。撤销会计入总操作，提示指出一个可行方向。',
    controls: '点击邻接图块，或方向键沿箭头方向移动空位。右侧可撤销和提示。',
    touchControls: {direction: true,keys:{KeyQ:'撤销',KeyE:'提示'}},
    mechanic: 'compact sliding art puzzles with reachable seeded scrambles and route hints'
  }, api => {
    const game = session(api);
    let level = 0, b, values, blank, history, route, moves = 0, help = 0, glow = -1, complete = false;
    const paths = [[3,0,3,2,1,0,1,2,3,3,0,1], [0,3,0,3,2,1,2,3,0,0,1,1,2,2,3,0,1,0,3,3]];
    function neighbor(i, d) {
      const x = i % b.w + dx[d], y = Math.floor(i/b.w) + dy[d];
      return x >= 0 && y >= 0 && x < b.w && y < b.h ? y*b.w+x : -1;
    }
    function swap(next) {
      [values[blank],values[next]] = [values[next],values[blank]];
      blank = next;
    }
    function reset() {
      b = board(level+3,level+3,level?112:144);
      values = Array.from({length:b.w*b.h}, (_,i) => (i+1)%(b.w*b.h));
      blank = values.length-1;
      route = [blank];
      history = [];
      glow = -1;
      for (const d of paths[level]) {
        const next = neighbor(blank,d);
        if (next >= 0) { swap(next); route.push(blank); }
      }
    }
    const solved = () => values.every((v,i) => v === (i+1)%values.length);
    function move(next) {
      if (complete || game.ended || ![0,1,2,3].some(d => neighbor(blank,d)===next)) return;
      history.push({blank, route:route.slice()});
      swap(next);
      if (route.at(-2)===next) route.pop();
      else route.push(next);
      glow = -1;
      moves++;
      api.sound('click');
      api.setScore((level+1)*900+values.filter((v,i)=>v===(i+1)%values.length).length*22);
      if (solved()) { complete = true; api.sound('win'); }
    }
    function advance() {
      if (level===0) {
        level++;
        complete=false;
        reset();
      } else game.finish(true, Math.max(1800,4500-moves*27-help*180), '两幅作品已装裱完成。');
    }
    function undo() {
      if (!history.length || complete) return;
      const last = history.pop();
      swap(last.blank);
      route = last.route;
      glow = -1;
      moves++;
      api.sound('click');
    }
    function hint() {
      if (complete || glow >= 0) return;
      glow = route.at(-2) ?? -1;
      help++;
      api.sound('click');
    }
    function painting(c,size) {
      c.fillStyle=level?'#4969a1':'#67a7a1';
      c.fillRect(0,0,size,size);
      const s = size/10;
      F.circle(c,7.5*s,2.1*s,1.02*s,level?'#e9c4ff':'#ffd180');
      F.poly(c,[[0,6*s],[2.5*s,3.3*s],[4.9*s,6.5*s],[6.5*s,4.2*s],[size,7*s],[size,size],[0,size]],level?'#685a98':'#37797b');
      F.poly(c,[[0,8*s],[3.6*s,5.5*s],[6.3*s,7.4*s],[8*s,6.55*s],[size,8.6*s],[size,size],[0,size]],level?'#333e65':'#286454');
      F.poly(c,[[4.5*s,size],[5.9*s,7*s],[6.6*s,7.3*s],[6.2*s,size]],level?'#eeabbd':'#e8c48e');
      for(let j=0;j<14;j++) {
        const x=((j*47)%100)*size/100,y=(.78+(j*13%18)/100)*size;
        F.line(c,x,y,x-.025*size,y+.03*size,'#d1e5cc35',2);
      }
    }
    reset();
    return {
      pointer(x,y,type) {
        if (type!=='down'||game.ended) return;
        if (onButton(x,y,500)) { if(complete)advance(); else hint(); return; }
        if (onButton(x,y,445)) { undo(); return; }
        const i=tileAt(b,x,y); if(i>=0) move(i);
      },
      key(code) {
        if(game.ended)return;
        if(code==='KeyQ'||code==='KeyZ')undo();
        else if(code==='KeyE')hint();
        else if(code==='Enter'&&complete)advance();
        else if(moveDir(code)>=0) {const next=neighbor(blank,moveDir(code));if(next>=0)move(next);}
      },
      draw(c) {
        stage(c,'滑块修画',[['画作',level+1+'/2'],['累计操作',moves],['提示',help]],'#413858');
        backdrop(c,b);
        values.forEach((v,i) => {
          const [x,y]=coord(b,i), s=b.size;
          F.rect(c,x+1,y+1,s-2,s-2,i===blank?'#19242c':'#aebebe',4);
          if (!v) return;
          c.save(); c.beginPath(); c.rect(x+2,y+2,s-4,s-4); c.clip();
          c.translate(x-(v-1)%b.w*s,y-Math.floor((v-1)/b.w)*s);
          painting(c,b.w*s);
          c.restore();
          F.rect(c,x+7,y+7,33,27,'#101c21da',4);
          F.text(c,v,x+23,y+20,17,ink,'center');
          if(glow===i) {c.strokeStyle=gold;c.lineWidth=5;c.strokeRect(x+3,y+3,s-6,s-6);}
        });
        side(c,'修复参考','把相邻图块滑入空格。数字按行从小到大，完整的画面也能帮你定位。',complete?'画面已还原。':glow>=0?'高亮图块可还原上一步路径。':'');
        c.save(); c.translate(756,228); painting(c,170); c.restore();
        button(c,'撤销',445,history.length>0&&!complete);
        button(c,complete?(level?'完成装裱':'下一幅画'):'提示',500,true,complete?mint:gold);
      },
      snapshot() {return {level,blank,values:[...values],complete};}
    };
  });

  const patterns = [
    ['00100','01110','11111','00100','01110'],
    ['00110000','01110011','11111110','11111100','01111000','00100000','00110000','00000000'],
    ['000111000','001111100','001010100','011111110','111111111','111101111','001111100','001000100','011000110']
  ];
  const pictureNames = ['树苗', '信鸽', '铁皮机器人'];
  function runs(line) {
    const result = line.join('').match(/1+/g) || [];
    return result.length ? result.map(part => part.length) : [0];
  }

  register({
    id:'puzzle-pixel-grid', title:'像素数织', en:'Pixel Loom', genre:'数织',
    description:'根据行列线索决定哪些格子上色，织出三幅藏在方格里的像素画。',
    rules:'每组数字表示连续上色的格数，数字顺序对应同一行或列中的色块顺序。两个色块之间至少留一个空格。三幅都解出即获胜。',
    controls:'点击格子上色，重复点击擦除。右侧可切换空格标记、清除或查看提示。',
    mechanic:'three authored nonograms with row/column constraint indicators and paint/void input'
  }, api => {
    const game=session(api);
    let level=0,b,cells,rowClues,colClues,complete=false,mark=false,help=0,edits=0,focus=-1;
    const n=()=>patterns[level].length;
    function reset() {
      const size=n();
      b=board(size,size,Math.min(67,Math.floor(385/size)),405);
      b.y=552-size*b.size;
      cells=Array(size*size).fill(0);
      rowClues=patterns[level].map(row=>runs(row.split('')));
      colClues=Array.from({length:size},(_,x)=>runs(patterns[level].map(row=>row[x])));
      focus=-1;
    }
    function matches(i,column) {
      const line=Array.from({length:n()},(_,j)=>cells[column?j*n()+i:i*n()+j]===1?1:0);
      return runs(line).join(',')===(column?colClues:rowClues)[i].join(',');
    }
    function place(i) {
      if(i<0||complete)return;
      const value=mark?2:1;
      cells[i]=cells[i]===value?0:value;
      edits++;
      focus=-1;
      const passed=rowClues.filter((_,j)=>matches(j,false)).length;
      api.setScore(level*1200+passed*35);
      if(passed===n()&&colClues.every((_,j)=>matches(j,true))) {complete=true;api.sound('win');}
      else api.sound('click');
    }
    reset();
    return {
      pointer(x,y,type) {
        if(type!=='down'||game.ended)return;
        if(onButton(x,y,520)) {
          if(complete) {
            if(level===patterns.length-1)game.finish(true,Math.max(3300,6100-edits*10-help*140),'三幅像素画全部完成。');
            else { level++;complete=false;reset(); }
          } else {
            focus=cells.findIndex((v,i)=>(v===1)!==(patterns[level][Math.floor(i/n())][i%n()]==='1'));
            if(focus>=0)help++;
          }
          api.sound('click');
        } else if(onButton(x,y,460)&&!complete) { mark=!mark;api.sound('click'); }
        else if(onButton(x,y,340)&&!complete) { reset();api.sound('click'); }
        else place(tileAt(b,x,y));
      },
      draw(c) {
        stage(c,'像素数织',[['画作',level+1+'/3'],['操作',edits],['提示',help]],'#263c52');
        backdrop(c,b);
        cells.forEach((v,i)=>{
          const [x,y]=coord(b,i), s=b.size;
          const dark=(Math.floor(i/n()/3)+Math.floor((i%n())/3))%2;
          F.rect(c,x+1,y+1,s-2,s-2,v===1?(complete?'#ffd693':['#81e8c4','#85c7fa','#cfb9ff'][level]):dark?'#294348':'#314d50',3);
          if(v===2) {F.line(c,x+s*.34,y+s*.34,x+s*.66,y+s*.66,'#9abaa9',2);F.line(c,x+s*.66,y+s*.34,x+s*.34,y+s*.66,'#9abaa9',2);}
          if(i===focus) {c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(x+3,y+3,s-6,s-6);}
        });
        rowClues.forEach((clue,i)=>F.text(c,clue.join('  '),b.x-15,b.y+(i+.5)*b.size,18,matches(i,false)?mint:ink,'right'));
        colClues.forEach((clue,i)=>clue.forEach((value,k)=>F.text(c,value,b.x+(i+.5)*b.size,b.y-16-(clue.length-1-k)*20,17,matches(i,true)?mint:ink,'center')));
        side(c,complete?pictureNames[level]:'读出行列','例如「2  1」是两个连续色格，隔开至少一格，再涂一个。正确的行列数字会变绿。',
          complete?'图案已织好。':focus>=0?'高亮格需要检查。':'');
        if(!complete) button(c,'清空本关',340,true,'#bbcdd0');
        button(c,mark?'返回上色':'标记空格',460,!complete,mark?gold:mint);
        button(c,complete?(level===2?'完成作品':'下一幅'):'提示一格',520,true,complete?mint:gold);
      },
      snapshot() {return {level,complete,cells:[...cells],board:{...b}};}
    };
  });
  register({
    id:'puzzle-cargo-dock', title:'仓库推箱', en:'Cargo Dock', genre:'推箱解谜',
    description:'在狭窄仓库驾驶搬运车，把货箱推上对应装卸位。',
    rules:'一次只能推动一只货箱，无法拉动。把全部木箱推到底板上的金色装卸位。三间仓库全部清理即获胜。推入死角可以撤销。',
    controls:'方向键 / WASD 移动。触屏点相邻地面或下方方向键，Q 撤销，R 重置。',
    touchControls:{direction:true,keys:{KeyQ:'撤销',KeyR:'重置'}},
    mechanic:'three single-crate push logistics maps with one-way corner deadlock warnings'
  }, api=>{
    const game=session(api);
    const maps=[
      ['#######','#  .  #','#  $  #','#  @  #','#     #','#######'],
      ['########','#   .  #','#   #  #','# $ $ .#','# # @  #','#      #','########'],
      ['#########','#  .  . #','# #  #  #','#   $$  #','# .   @ #','#   $   #','#       #','#########']
    ];
    let level=0,b,boxes,walls,docks,player,history,done=false,steps=0,notice='';
    function reset() {
      const layout=maps[level];
      b=board(layout[0].length,layout.length,62);
      walls=new Set();boxes=new Set();docks=new Set();history=[];notice='';
      [...layout.join('')].forEach((v,i)=>{
        if(v==='#')walls.add(i);
        if(v==='$')boxes.add(i);
        if(v==='.')docks.add(i);
        if(v==='@')player=i;
      });
    }
    function neighbor(i,d) {
      const x=i%b.w+dx[d],y=Math.floor(i/b.w)+dy[d];
      return x<0||x>=b.w||y<0||y>=b.h?-1:y*b.w+x;
    }
    const wall=i=>i<0||walls.has(i);
    function move(d) {
      if(d<0||done||game.ended)return;
      const next=neighbor(player,d), pushed=boxes.has(next), after=neighbor(next,d);
      if(wall(next)||(pushed&&(wall(after)||boxes.has(after))))return;
      history.push([player,pushed?next:-1,after]);
      player=next;
      steps++;
      notice='';
      if(pushed) {
        boxes.delete(next);boxes.add(after);api.sound('hit');
        const corner=(wall(neighbor(after,0))||wall(neighbor(after,2)))&&(wall(neighbor(after,1))||wall(neighbor(after,3)));
        if(corner&&!docks.has(after)) notice='箱子进了死角。撤销这一步可以救回来。';
      } else api.sound('click');
      const placed=[...boxes].filter(i=>docks.has(i)).length;
      api.setScore(level*1000+placed*150);
      if(placed===boxes.size) {done=true;api.sound('win');}
    }
    function undo() {
      if(done||!history.length)return;
      const [before,box,after]=history.pop();
      player=before;
      if(box>=0){boxes.delete(after);boxes.add(box);}
      notice='';
      steps++;
      api.setScore(level*1000+[...boxes].filter(i=>docks.has(i)).length*150);
    }
    function advance() {
      if(level===maps.length-1)game.finish(true,Math.max(2100,5000-steps*11),'三间仓库的货箱全部就位。');
      else {level++;done=false;reset();}
    }
    reset();
    return {
      key(code) {
        if(game.ended)return;
        if(code==='KeyQ'||code==='KeyZ')undo();
        else if(code==='KeyR'&&!done)reset();
        else if(code==='Enter'&&done)advance();
        else move(moveDir(code));
      },
      pointer(x,y,type) {
        if(type!=='down'||game.ended)return;
        if(onButton(x,y,500)) {if(done)advance();else undo();return;}
        if(onButton(x,y,447)) {if(!done)reset();return;}
        const i=tileAt(b,x,y);
        if(i>=0)move(arrows.findIndex((_,d)=>neighbor(player,d)===i));
      },
      draw(c) {
        stage(c,'仓库推箱',[['仓库',level+1+'/3'],['就位',[...boxes].filter(i=>docks.has(i)).length+'/'+boxes.size],['累计步数',steps]],'#554833');
        backdrop(c,b);
        for(let i=0;i<b.w*b.h;i++) {
          const [x,y]=coord(b,i),s=b.size,metal=walls.has(i);
          F.rect(c,x+1,y+1,s-2,s-2,metal?'#3c4d53':'#273531',4);
          if(metal) {
            F.line(c,x+5,y+12,x+s-6,y+12,'#70878a',3);
            F.line(c,x+5,y+29,x+s-6,y+29,'#222d36',3);
            F.circle(c,x+7,y+s-8,3,'#91a3a1');
          }
          if(docks.has(i)) {
            c.save();c.setLineDash([5,4]);c.strokeStyle=gold;c.lineWidth=3;c.strokeRect(x+8,y+8,s-16,s-16);c.restore();
            F.text(c,'＋',x+s/2,y+s/2,27,gold,'center');
          }
          if(boxes.has(i)){
            F.rect(c,x+6,y+8,s-12,s-12,'#151d1d',5);
            F.rect(c,x+7,y+5,s-14,s-14,docks.has(i)?'#7ba468':'#bd864b',5);
            F.rect(c,x+13,y+11,s-26,s-26,docks.has(i)?'#527756':'#84552e',3);
            F.line(c,x+15,y+14,x+s-15,y+s-16,'#edc483',4);
            F.line(c,x+s-15,y+14,x+15,y+s-16,'#edc483',4);
          }
          if(player===i) {
            F.rect(c,x+12,y+9,s-24,s-18,'#7dced1',9);
            F.rect(c,x+17,y+14,s-34,s-31,'#23474d',5);
            F.rect(c,x+10,y+s-18,12,8,'#10221e',2);
            F.rect(c,x+s-22,y+s-18,12,8,'#10221e',2);
            F.line(c,x+24,y+s-11,x+s-24,y+s-11,mint,3);
          }
        }
        side(c,'对位装卸','把木箱推到黄色装卸位。留出搬运车绕到箱子另一侧的空间。',done?'装卸完成，可以进入下一间。':notice);
        button(c,'重置仓库',447,!done,'#b7c6c2');
        button(c,done?(level===2?'完成卸货':'下一间仓库'):'撤销一步',500,done||history.length>0);
      },
      snapshot() {return {level,player,boxes:[...boxes],walls:[...walls],docks:[...docks],width:b.w,height:b.h,done};}
    };
  });

  register({
    id:'puzzle-magnetic-array', title:'磁针阵列', en:'Magnetic Array', genre:'状态反转',
    description:'反转磁针，利用联动线路让三块控制板的红色指示灯全部熄灭。',
    rules:'点击一根磁针会同时改变它和连线相邻磁针的状态。每关线路不同。三个阵列的红灯全部关闭即获胜。',
    controls:'点按磁针切换状态。右侧可撤销或重置当前阵列。',
    mechanic:'authored magnetic switch graphs with orthogonal lateral and diagonal toggle couplings'
  }, api=>{
    const game=session(api);
    const maps=[
      {w:4,h:4,seed:[1,5,10,15],kind:'cross'},
      {w:5,h:5,seed:[2,5,6,9,13,15,19,22],kind:'mixed'},
      {w:6,h:5,seed:[0,3,7,9,12,16,21,23,26,28],kind:'diagonal'}
    ];
    let level=0,b,neighbors,lights,history,complete=false,steps=0,last=-1;
    function flip(i) {lights[i]=!lights[i];for(const j of neighbors[i]) lights[j]=!lights[j];}
    function reset() {
      const map=maps[level];
      b=board(map.w,map.h,79);
      neighbors=Array.from({length:map.w*map.h},()=>[]);
      const n=neighbors.length;
      for(let i=0;i<n;i++)for(let j=i+1;j<n;j++){
        const x=Math.abs(i%map.w-j%map.w),y=Math.floor(j/map.w)-Math.floor(i/map.w);
        const linked=map.kind==='cross'?x+y===1:
          map.kind==='mixed'?x+y===1&&(i*3+j)%5!==0||x===1&&y===1&&(i+j)%3===0:
            x===1&&y===1||y===0&&x===1&&Math.floor(i/map.w)%2===0;
        if(linked){neighbors[i].push(j);neighbors[j].push(i);}
      }
      lights=Array(n).fill(false);
      for(const i of map.seed)flip(i);
      history=[];last=-1;
    }
    function act(i,record=true) {
      flip(i);last=i;steps++;
      if(record)history.push(i);
      const active=lights.filter(Boolean).length;
      api.setScore(level*900+(lights.length-active)*25);
      complete=active===0;
      api.sound(complete?'win':'click');
    }
    reset();
    return {
      pointer(x,y,type) {
        if(type!=='down'||game.ended)return;
        if(onButton(x,y,500)){
          if(complete){
            if(level===2)game.finish(true,Math.max(2400,5400-steps*27),'三块磁针阵列已经全部复位。');
            else{level++;complete=false;reset();}
          }else if(history.length)act(history.pop(),false);
          return;
        }
        if(onButton(x,y,445)&&!complete){reset();return;}
        const i=tileAt(b,x,y);
        if(i>=0&&!complete)act(i);
      },
      draw(c){
        stage(c,'磁针阵列',[['控制板',level+1+'/3'],['红灯',lights.filter(Boolean).length],['总操作',steps]],'#39394c');
        backdrop(c,b);
        const center=i=>{const [x,y]=coord(b,i);return [x+b.size/2,y+b.size/2];};
        neighbors.forEach((adj,i)=>adj.forEach(j=>{
          if(j<=i)return;
          F.line(c,...center(i),...center(j),'#536f73',6);
          F.line(c,...center(i),...center(j),i===last||j===last?'#a9ead0':'#83968e',1.5);
        }));
        lights.forEach((lit,i)=>{
          const [x,y]=center(i),color=lit?danger:mint;
          F.circle(c,x,y,26,'#101b20');
          F.circle(c,x,y,23,'#3c5359');
          F.circle(c,x,y,20,'#18282d');
          F.circle(c,x,y-10,3,color);
          F.poly(c,lit?[[x-2,y+13],[x+7,y-4],[x-6,y+2]]:[[x+2,y-4],[x-7,y+13],[x+6,y+7]],color);
          if(i===last)F.circle(c,x,y+23,2.5,gold);
        });
        side(c,'联动线路','点击磁针时，只有它和与它直接相连的磁针会翻转。熄灭每一个红灯。',complete?'所有指示灯已复位。':'');
        button(c,'重置阵列',445,!complete,'#bfccc5');
        button(c,complete?(level===2?'完成校准':'下一块控制板'):'撤销',500,complete||history.length>0);
      },
      snapshot(){return {level,complete,lights:[...lights],width:b.w,height:b.h};}
    };
  });

  const emblems=['sun','diamond','beacon','wave','leaf','planet','moon','spark','drop','hill'];
  const emblemColors=['#ffd17b','#9cf0c1','#9cd8fa','#a9beff','#abdb88','#edbbd9','#d3ccfa','#ff9c89','#9ae7e5','#dcbd90'];
  function emblem(c,i,x,y,s){
    const col=emblemColors[i];
    if(i===0||i===5){
      F.circle(c,x,y,s*.24,col);
      c.save();c.translate(x,y);c.rotate(-.3);c.strokeStyle=col;c.lineWidth=2;c.beginPath();c.ellipse(0,0,s*.43,s*.15,0,0,Math.PI*2);c.stroke();c.restore();
    }else if(i===1||i===7){
      F.poly(c,[[x,y-s*.38],[x+s*.31,y],[x,y+s*.38],[x-s*.31,y]],col);
      F.line(c,x-s*.19,y,x+s*.19,y,'#fff9ddaa',2);
    }else if(i===3){
      for(let k=0;k<3;k++) {
        c.beginPath();c.moveTo(x-s*.38,y+(k-1)*11);c.quadraticCurveTo(x,y-12+(k-1)*11,x+s*.37,y+(k-1)*11);
        c.strokeStyle=col;c.lineWidth=3;c.stroke();
      }
    }else if(i===4||i===8){
      F.poly(c,[[x,y-s*.35],[x+s*.26,y-s*.04],[x+s*.2,y+s*.24],[x,y+s*.34],[x-s*.24,y+s*.09]],col);
      F.line(c,x-s*.05,y+s*.2,x+s*.07,y-s*.14,'#244742',3);
    }else if(i===6){
      F.circle(c,x,y,s*.31,col);
      F.circle(c,x+s*.12,y-s*.09,s*.25,'#293f48');
    }else{
      F.poly(c,[[x,y-s*.32],[x+s*.35,y+s*.24],[x-s*.35,y+s*.24]],col);
      F.line(c,x,y-s*.11,x,y+s*.19,'#33464b',3);
    }
  }

  register({
    id:'puzzle-archive-pairs',title:'档案配对',en:'Archive Pairs',genre:'记忆翻牌',
    description:'记住档案卡的徽记，先完成十二张入门卡，再整理二十张限次卡。',
    rules:'每次最多翻开两张。图案相同的两张保持翻开，否则短暂显示后盖回。每关有比对次数上限，找齐所有配对进入下一关。',
    controls:'点击翻开档案卡，配对后点右侧继续。',
    mechanic:'two-stage symbol matching with finite comparison budget and brief mismatch exposure'
  }, api=>{
    const game=session(api);
    let level=0,b,cards,first=-1,second=-1,pairs,attempts,total=0,wait=0,done=false;
    const random=api.random||Math.random;
    const limit=()=>level?32:16;
    function reset(){
      b=board(level?5:4,level?4:3,level?108:122);
      cards=shuffle(Array.from({length:b.w*b.h},(_,i)=>Math.floor(i/2)),random);
      pairs=new Set();attempts=0;first=second=-1;wait=0;
    }
    function advance(){
      if(level)game.finish(true,Math.max(1200,5600-total*55),'档案的所有徽记都已正确复原。');
      else{level++;done=false;reset();}
    }
    reset();
    return {
      update(dt) {
        if(wait<=0||game.ended)return;
        wait-=dt;
        if(wait<=0){
          first=second=-1;
          if(attempts>=limit())game.finish(false,level*1200+pairs.size*100,'本轮比对次数已用尽。');
        }
      },
      pointer(x,y,type){
        if(type!=='down'||game.ended)return;
        if(done&&onButton(x,y,500)){advance();return;}
        const i=tileAt(b,x,y);
        if(i<0||i===first||pairs.has(i)||wait>0||done)return;
        if(first<0){ first=i;api.sound('click');return; }
        second=i;attempts++;total++;
        if(cards[first]===cards[i]){
          pairs.add(first);pairs.add(i);
          first=second=-1;
          api.setScore(level*1200+pairs.size*100);
          if(pairs.size===cards.length){done=true;api.sound('win');}
          else if(attempts>=limit())game.finish(false,level*1200+pairs.size*100,'本轮比对次数已用尽。');
          else api.sound('skill');
        }else{wait=.86;api.sound('hit');}
      },
      draw(c){
        stage(c,'档案配对',[['档案组',level+1+'/2'],['已配对',pairs.size/2+'/'+cards.length/2],['剩余比对',limit()-attempts]],'#3e414d');
        backdrop(c,b);
        cards.forEach((card,i)=>{
          const [x,y]=coord(b,i),s=b.size,shown=i===first||i===second||pairs.has(i);
          F.rect(c,x+7,y+10,s-14,s-16,'#101b21',8);
          F.rect(c,x+7,y+6,s-14,s-16,shown?'#293f48':'#364d53',8);
          c.strokeStyle=pairs.has(i)?mint:shown?gold:'#708f8d';c.lineWidth=2;c.strokeRect(x+15,y+13,s-30,s-30);
          if(shown){
            emblem(c,card,x+s/2,y+s/2-3,s*.65);
            if(pairs.has(i))F.text(c,'✓',x+s-23,y+s-25,17,mint,'center');
          }else{
            F.poly(c,[[x+s/2,y+30],[x+s-27,y+s/2],[x+s/2,y+s-34],[x+27,y+s/2]],'#506a69');
            F.text(c,String(i+1),x+s/2,y+s/2,18,ink,'center');
          }
        });
        side(c,'寻找同一枚徽记','每翻开一对会扣除一次比对额度。先记住位置，已配对的卡片会亮起。',done?'这一组已全部配对。':wait>0?'记住这两个位置。':'');
        if(done)button(c,level?'归档完成':'下一组档案',500);
      },
      snapshot(){return {level,first,second,done,visible:[...new Set([...pairs,first,second])].filter(i=>i>=0).map(i=>[i,emblems[cards[i]]]),width:b.w,height:b.h};}
    };
  });

  register({
    id:'puzzle-crystal-sort', title:'晶体分拣', en:'Crystal Sorter', genre:'容量分拣',
    description:'为晶体样本重新分装。两支空管有限，先为关键颜色腾出位置。',
    rules:'只能把管顶同色的一段倒进空管，或另一支顶端同色且有空间的管。每管容量四单位。所有样本按颜色各占一支满管后进入下一批，两批结束获胜。',
    controls:'点选取样管，再点目标试管。重复点选取消。右侧可撤销或重置。',
    mechanic:'capacity-constrained two-batch color separation with top-layer transfers and shape-coded crystals'
  }, api=>{
    const game=session(api);
    const maps=[
      [[0,1,0,1],[1,0,1,0],[2,2,3,3],[3,3,2,2],[],[]],
      [[0,1,2,3],[4,3,1,0],[2,4,0,2],[3,1,4,1],[4,2,3,0],[],[]]
    ];
    const colors=['#ff957e','#77d9ef','#b8ec83','#c5adff','#ffd578'];
    let level=0,tubes,selected=-1,history,done=false,moves=0,note='';
    function reset() {tubes=maps[level].map(t=>[...t]);selected=-1;history=[];note='';}
    function location(i){
      const step=level?87:99;
      return [350-(tubes.length-1)*step/2+i*step,246];
    }
    const full=t=>t.length===4&&t.every(v=>v===t[0]);
    function move(to) {
      if(to===selected){selected=-1;return;}
      if(selected<0){if(tubes[to].length)selected=to;return;}
      const from=tubes[selected],target=tubes[to],color=from.at(-1);
      if(target.length===4||(target.length&&target.at(-1)!==color)){
        note='目标管需要空位，顶部要与当前晶体同色。';
        selected=target.length?to:-1;
        return;
      }
      history.push(tubes.map(t=>[...t]));
      do {target.push(from.pop());}while(from.at(-1)===color&&target.length<4);
      selected=-1;note='';moves++;
      const ready=tubes.filter(full).length;
      api.setScore(level*1300+ready*230);
      done=tubes.every(t=>!t.length||full(t));
      api.sound(done?'win':'click');
    }
    reset();
    return {
      pointer(x,y,type){
        if(type!=='down'||game.ended)return;
        if(onButton(x,y,500)){
          if(done){
            if(level)game.finish(true,Math.max(2500,5400-moves*30),'两批样本都已按色分装。');
            else{level++;done=false;reset();}
          }else if(history.length){tubes=history.pop();selected=-1;note='';moves++;}
          return;
        }
        if(onButton(x,y,445)){if(!done)reset();return;}
        const i=tubes.findIndex((_,j)=>{
          const [tx,ty]=location(j);
          return F.hit(x,y,tx-37,ty-30,74,224);
        });
        if(i>=0&&!done)move(i);
      },
      draw(c){
        stage(c,'晶体分拣',[['样本批次',level+1+'/2'],['满管',tubes.filter(full).length+'/'+(4+level)],['总转移',moves]],'#304e50');
        F.rect(c,45,448,615,44,'#142729',5);
        F.line(c,54,453,653,453,'#829a8f',3);
        tubes.forEach((tube,i)=>{
          const [x,y]=location(i);
          F.rect(c,x-34,y-10,68,193,selected===i?gold:'#6c9091',12);
          F.rect(c,x-31,y-7,62,187,'#263b44',10);
          F.line(c,x-34,y-8,x+34,y-8,selected===i?'#fff0b8':'#a8c3bf',3);
          for(let j=0;j<4;j++){
            const yy=y+138-j*40;
            F.line(c,x+24,yy+35,x+31,yy+35,'#b4d4c688',1);
            if(j>=tube.length)continue;
            const color=tube[j];
            F.rect(c,x-27,yy,54,36,colors[color],5);
            F.text(c,['◆','●','▲','✦','■'][color],x,yy+17,20,'#203234','center');
          }
          F.text(c,full(tube)?'✓':i+1,x,y+220,17,full(tube)?mint:muted,'center');
        });
        side(c,'样本工作台','选一支试管，再选目标。图形可辅助辨认颜色。先利用空管把混合样本拆开。',done?'本批样本已全部分装。':note);
        button(c,'重置分拣',445,!done,'#b6ccca');
        button(c,done?(level?'送交样本':'下一批样本'):'撤销转移',500,done||history.length>0);
      },
      snapshot(){return {level,done,tubes:tubes.map(t=>[...t])};}
    };
  });
})();
