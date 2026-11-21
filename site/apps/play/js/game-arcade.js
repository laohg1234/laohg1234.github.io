/* Flavor Studio · 雾港守夜. Original finite encounter / telegraph action game. */
(function () {
  'use strict';
  const F = FG, PI = Math.PI, TAU = PI * 2;
  const C = { ink:'#edf6ee', dim:'#94a9a6', mint:'#a9edce', cyan:'#7adeeb', red:'#ff7770', gold:'#f1c77d', orange:'#eaa075', violet:'#c6a4ed' };
  const clamp = (n,a,b) => Math.max(a,Math.min(b,n));
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const angle = (a,b) => Math.atan2(b.y-a.y,b.x-a.x);
  const delta = (a,b) => Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const lineDistance = (x,y,ax,ay,bx,by) => {
    const dx=bx-ax,dy=by-ay,t=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy||1),0,1);
    return Math.hypot(x-ax-dx*t,y-ay-dy*t);
  };
  const rect = (c,x,y,w,h,color,r=0) => F.rect(c,x,y,w,h,color,r);
  const circle = (c,x,y,r,color) => F.circle(c,x,y,r,color);
  const text = (c,s,x,y,z=16,color=C.ink,align='left') => F.text(c,s,x,y,z,color,align);
  const line = (c,x,y,xx,yy,color,width=2) => F.line(c,x,y,xx,yy,color,width);
  function ring(c,x,y,r,color,width=2,start=0,end=TAU) {
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.arc(x,y,Math.max(0,r),start,end);c.stroke();
  }
  function panel(c,x,y,w,h,color='#0d2327ee') {
    rect(c,x,y,w,h,color,10);c.strokeStyle='#a9c9c324';c.lineWidth=1;c.strokeRect(x+.5,y+.5,w-1,h-1);
  }
  const deck={left:70,right:930,top:135,bottom:535};
  const pillars=[{x:350,y:290,r:30},{x:640,y:405,r:31}];
  function blocked(a,b,margin=0) {
    return pillars.some(o=>lineDistance(o.x,o.y,a.x,a.y,b.x,b.y)<o.r+margin);
  }
  function moveBody(b,dx,dy,r=b.r||17) {
    b.x=clamp(b.x+dx,deck.left+r,deck.right-r);
    b.y=clamp(b.y+dy,deck.top+r,deck.bottom-r);
    for(const o of pillars){let d=distance(b,o),min=o.r+r;if(d<min){let a=d>.001?angle(o,b):0;b.x=o.x+Math.cos(a)*min;b.y=o.y+Math.sin(a)*min;}}
  }
  function steer(b,tx,ty,speed,dt,others=[]) {
    let dx=tx-b.x,dy=ty-b.y,n=Math.hypot(dx,dy)||1;dx/=n;dy/=n;
    for(const o of pillars){let d=distance(b,o),range=o.r+(b.r||17)+60;if(d<range){let a=angle(o,b),push=(range-d)/range*2.9;dx+=Math.cos(a)*push;dy+=Math.sin(a)*push;}}
    for(const o of others){if(o===b||o.hp<=0)continue;let d=distance(b,o);if(d<48&&d>.1){dx+=(b.x-o.x)/d*(48-d)/35;dy+=(b.y-o.y)/d*(48-d)/35;}}
    n=Math.hypot(dx,dy)||1;moveBody(b,dx/n*speed*dt,dy/n*speed*dt);
  }

  F.register({
    id:'arcade-siege',title:'雾港守夜',en:'LAST LIGHT AT FOGHARBOR',genre:'战术街机',category:'技能竞技',featured:true,
    color:C.mint,coverScene:'city',coverUnit:'hero',duration:'约 3 分钟',
    touchControls:{direction:true,keys:{Space:'射击',KeyQ:'闪避',KeyE:'折射',KeyR:'超载'}},
    description:'雨夜码头上的最后一名守夜人。看清红色预警，在射击、闪避和折射盾之间做选择，迎战巨型起重机。',
    rules:'依次清除货栈与防波堤的两批入侵者，击败三阶段首领「铁鹭」获胜，全局共十名敌人与一名首领。突击手先亮冲锋走廊，狙击手锁定红线，迫击手标记爆炸圆；预警锁定后横向离开即可躲避。弹丸会被码头立柱阻挡，首领粗光束与爆炸会穿过。按住射击会升温，过热后须冷却至 30% 才能继续；松开射击冷却更快。Q 闪避与 E 折射盾共用电池，电池缓慢回复；折射盾只挡朝向前方的弹丸，不能挡冲锋、粗光束或地面爆炸。命中与折射积累超载，满时 R 爆发伤害并回复 16 生命。每批清场后仅掉落两个维修包。首领攻击后的金色核心窗口伤害更高；血量降到 65% / 32% 会切换攻击组合。生命耗尽或四分钟未完成则失败。Esc 暂停，切换窗口自动暂停。',
    controls:'WASD / 方向键移动；按住 Space 自动索敌射击，或按住鼠标手动瞄准；Q 闪避（30 电池）；E 正面折射盾（40 电池）；R 超载爆发（100 充能）。触屏：方向键 + SPACE / Q / E / R，直接按住 SPACE 即可自动瞄准。',
    mechanic:'finite two skirmishes plus three-phase crane boss; locked telegraph lanes circles and crosses; line-of-sight cover; heat-managed aim-assisted fire; shared-energy dash and directional projectile reflection; earned overload burst; authored rain-soaked dock',
    create(api) {
      const rng=typeof api.random==='function'?api.random:Math.random;
      const p={x:230,y:445,r:15,hp:100,energy:100,heat:0,charge:0,a:-.7,inv:0,shield:0,dash:0,dx:0,dy:0,fire:0,flash:0};
      let time=0,stage=-1,stageTime=0,transition=1.25,finished=false,overheated=false,combo=0,fireMuzzle=0,shake=0,damageFlash=0,killCount=0,score=0,boss=null;
      let banner={title:'雾港 · 末班钟响',sub:'红线先亮，危险随后。守住最后一盏灯。',life:3.3,max:3.3};
      let note='按住 SPACE 自动索敌 · Q 闪避 · E 折射盾',noteLife=5;
      const enemies=[],shots=[],hazards=[],effects=[],drops=[],trails=[],numbers=[],queue=[];
      const stats={shots:0,hits:0,reflected:0,dodges:0,shields:0,bursts:0,damage:0,bossPhases:[],bossPatterns:[]};
      const schedule=[
        [{type:'runner',x:820,y:190,at:.8},{type:'sniper',x:810,y:480,at:2.5},{type:'runner',x:500,y:170,at:4.2},{type:'mortar',x:855,y:310,at:6.5}],
        [{type:'sniper',x:170,y:175,at:.8},{type:'runner',x:840,y:465,at:1.8},{type:'mortar',x:820,y:180,at:3.3},{type:'runner',x:160,y:450,at:5},{type:'sniper',x:805,y:450,at:6.5},{type:'mortar',x:500,y:170,at:8}]
      ];
      function tell(message,life=2.5){note=message;noteLife=life;}
      function burst(x,y,col,count=12,power=1){for(let i=0;i<count;i++){let a=rng()*TAU,s=(35+rng()*145)*power;effects.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,life:.25+rng()*.5,col,size:1+rng()*2});}}
      function label(x,y,s,col=C.gold){numbers.push({x,y,s,col,life:.9});}
      function done(win,message){if(finished)return;finished=true;score=Math.round(killCount*180+(win?4200+p.hp*16+Math.max(0,240-time)*8:boss?Math.max(0,boss.max-boss.hp)*2:0)+stats.reflected*30);api.setScore(score);api.finish(win,score,message);}
      function damage(amount,sourceAngle,kind='impact') {
        if(finished||p.inv>0)return false;
        p.hp=Math.max(0,p.hp-amount);p.inv=.82;p.flash=.18;shake=Math.max(shake,7);damageFlash=.28;stats.damage+=amount;combo=0;
        burst(p.x,p.y,C.red,12);api.sound('hit');label(p.x,p.y-29,'−'+amount,C.red);
        if(sourceAngle!==undefined)moveBody(p,Math.cos(sourceAngle)*14,Math.sin(sourceAngle)*14);
        if(p.hp<=0)done(false,'守夜人的灯熄了。红线和红圈锁定后，先横移避开，再寻找金色核心窗口。');
        return true;
      }
      function enemyHurt(e,amount,reflected=false) {
        if(e.hp<=0||e.spawn>0)return;
        if(e===boss&&e.exposed<=0)amount*=.37;
        e.hp-=amount;e.flash=.09;stats.hits++;p.charge=clamp(p.charge+(reflected?2:1.35),0,100);
        burst(e.x,e.y,e===boss?C.gold:C.mint,3,.6);
        if(e.hp<=0){killCount++;combo++;shake=Math.max(shake,e===boss?10:3);burst(e.x,e.y,e===boss?C.gold:C.orange,e===boss?65:23,1.4);api.sound('win');
          if(e===boss){done(true,'两道封锁清除，铁鹭停机。雾港的最后一盏灯，亮到了天明。');return;}
          if(combo>=3){label(e.x,e.y-35,'三连击',C.gold);combo=0;p.charge=clamp(p.charge+12,0,100);}
        }
      }
      function spawn(spec) {
        let x=spec.x,y=spec.y;
        if(distance({x,y},p)<190){x=p.x<500?845:155;y=p.y<330?470:180;}
        const hp={runner:92,sniper:98,mortar:128}[spec.type];
        enemies.push({id:stage+'-'+killCount+'-'+stageTime,type:spec.type,x,y,r:spec.type==='mortar'?22:18,hp,max:hp,a:angle({x,y},p),spawn:1.05,state:'seek',timer:.9+enemies.length*.13,wind:0,flash:0,hit:false,cycle:0});
        burst(x,y,C.red,12,.4);
      }
      function beginStage() {
        stage++;stageTime=0;transition=0;
        if(stage<2){queue.push(...schedule[stage].map(a=>({...a})));banner={title:stage===0?'01 / 货栈警报':'02 / 防波堤封锁',sub:stage===0?'4 名入侵者 · 利用立柱隔开火力':'6 名入侵者 · 三种攻击开始协同',life:2.7,max:2.7};}
        else{boss={type:'boss',x:760,y:255,r:48,hp:1420,max:1420,a:PI,state:'idle',timer:1.8,wind:0,exposed:0,flash:0,phase:1,attack:0,spawn:1.3,cycle:0};stats.bossPhases.push(1);banner={title:'03 / 起重机「铁鹭」',sub:'等待金色核心亮起，再倾泻火力。粗光束无法被折射。',life:3.1,max:3.1};}
        api.sound('skill');
      }
      function clearStage() {
        transition=4;queue.length=0;shots.splice(0);hazards.splice(0);
        drops.push({x:440,y:315,r:15,kind:'health',life:30},{x:560,y:315,r:15,kind:'health',life:30});
        p.energy=100;p.heat=Math.min(p.heat,25);overheated=false;
        tell('封锁清除！中央空投了 2 个维修包，各恢复 22 生命。',4);
        banner={title:'区域安全',sub:'拾取绿色维修包 · 下一道封锁将在 4 秒后开启',life:3.5,max:3.5};
      }
      function aimTarget() {
        const alive=enemies.filter(e=>e.hp>0&&e.spawn<=0);if(boss&&boss.hp>0&&boss.spawn<=0)alive.push(boss);
        return alive.sort((a,b)=>(blocked(p,a)?1500:0)+distance(p,a)-((blocked(p,b)?1500:0)+distance(p,b)))[0]||null;
      }
      function shoot() {
        if(p.fire>0||p.dash>0||overheated)return;
        p.fire=.16;p.heat=Math.min(100,p.heat+9.2);fireMuzzle=.07;stats.shots++;
        const a=p.a,vel=680;shots.push({owner:'p',x:p.x+Math.cos(a)*23,y:p.y+Math.sin(a)*23,vx:Math.cos(a)*vel,vy:Math.sin(a)*vel,r:3.2,damage:10.5,life:1.5,tail:13,col:C.mint});
        api.sound('click');
        if(p.heat>=99){overheated=true;tell('枪管过热 · 先移动，冷却至 30% 后恢复射击',2);burst(p.x,p.y,C.orange,8,.35);}
      }
      function skill(code) {
        if(finished||transition>0&&stage<0)return;
        if(code==='KeyQ'){
          if(p.energy<30||p.dash>0){if(p.energy<30)tell('电池不足：闪避需要 30',1.3);return;}
          let x=+(!!(api.keys.KeyD||api.keys.ArrowRight))-+(!!(api.keys.KeyA||api.keys.ArrowLeft)),y=+(!!(api.keys.KeyS||api.keys.ArrowDown))-+(!!(api.keys.KeyW||api.keys.ArrowUp)),n=Math.hypot(x,y);
          if(!n){x=Math.cos(p.a);y=Math.sin(p.a);n=1;}p.dx=x/n;p.dy=y/n;p.dash=.22;p.inv=Math.max(p.inv,.32);p.energy-=30;stats.dodges++;api.sound('skill');burst(p.x,p.y,C.cyan,10,.8);
        }
        if(code==='KeyE'){
          if(p.energy<40||p.shield>0||p.dash>0){if(p.energy<40)tell('电池不足：折射盾需要 40',1.3);return;}
          p.energy-=40;p.shield=.85;stats.shields++;api.sound('skill');
        }
        if(code==='KeyR'){
          if(p.charge<100){tell('超载需要 100 充能：命中与折射都能积累',1.7);return;}
          p.charge=0;stats.bursts++;p.hp=Math.min(100,p.hp+16);p.heat=0;overheated=false;p.inv=Math.max(p.inv,.55);shake=8;
          effects.push({kind:'ring',x:p.x,y:p.y,life:.6,max:.6,r:310,col:C.gold});burst(p.x,p.y,C.gold,40,2);api.sound('skill');
          for(const e of enemies)if(distance(e,p)<310)enemyHurt(e,125,true);
          if(boss&&distance(boss,p)<350)enemyHurt(boss,220,true);
          for(let i=shots.length-1;i>=0;i--)if(shots[i].owner==='e'&&distance(shots[i],p)<330)shots.splice(i,1);
          tell('超载爆发 · 回复 16 生命 / 枪管冷却',2.1);label(p.x,p.y-38,'超载',C.gold);
        }
      }
      function enemyShot(e,a,speed=340,damageAmount=14,r=5) {
        shots.push({owner:'e',x:e.x+Math.cos(a)*(e.r+8),y:e.y+Math.sin(a)*(e.r+8),vx:Math.cos(a)*speed,vy:Math.sin(a)*speed,damage:damageAmount,r,life:3.3,tail:12,col:e.type==='boss'?C.gold:C.red});
        burst(e.x+Math.cos(a)*25,e.y+Math.sin(a)*25,C.red,5,.4);
      }
      function mortarMark(x,y,r=57,delay=1.05,damageAmount=22) {
        hazards.push({kind:'circle',x:clamp(x,deck.left+25,deck.right-25),y:clamp(y,deck.top+25,deck.bottom-25),r,life:delay,max:delay,damage:damageAmount,hit:false});
      }
      function updateEnemy(e,dt) {
        e.flash=Math.max(0,e.flash-dt);e.spawn=Math.max(0,e.spawn-dt);if(e.spawn>0||e.hp<=0)return;
        const d=distance(p,e);e.timer-=dt;
        if(e.state==='seek'){
          e.a=angle(e,p);e.cycle+=dt;
          if(e.type==='runner'){
            if(d>175)steer(e,p.x,p.y,105+stage*8,dt,enemies);
            else if(e.timer<=0){e.state='wind';e.wind=.7;e.timer=.7;e.lock=e.a;e.hit=false;e.target={x:p.x,y:p.y};}
          }else if(e.type==='sniper'){
            let strafe=Math.sin(time*.8+e.x*.02)>0?1:-1,da=e.a+PI/2;
            let tx=d<235?e.x-Math.cos(e.a)*180:d>390?p.x:e.x+Math.cos(da)*100*strafe,ty=d<235?e.y-Math.sin(e.a)*180:d>390?p.y:e.y+Math.sin(da)*100*strafe;
            steer(e,tx,ty,58,dt,enemies);
            if(e.timer<=0&&!blocked(e,p,4)){e.state='wind';e.wind=1.0;e.timer=1;e.lock=angle(e,p);e.target={x:p.x,y:p.y};}
          }else{
            if(d<215)steer(e,e.x-Math.cos(e.a)*130,e.y-Math.sin(e.a)*130,56,dt,enemies);
            if(e.timer<=0){e.state='wind';e.wind=1.2;e.timer=1.2;e.target={x:p.x,y:p.y};mortarMark(p.x,p.y,57,1.2,22);}
          }
        }else if(e.state==='wind'){
          if(e.timer<=0){
            if(e.type==='runner'){e.state='dash';e.timer=.43;e.a=e.lock;}
            else if(e.type==='sniper'){enemyShot(e,e.lock,445,16,5);e.state='recover';e.timer=.65;}
            else{e.state='recover';e.timer=.8;}
          }
        }else if(e.state==='dash'){
          const ox=e.x,oy=e.y;moveBody(e,Math.cos(e.lock)*485*dt,Math.sin(e.lock)*485*dt,e.r);trails.push({x:ox,y:oy,a:e.lock,life:.19,col:C.red});
          if(!e.hit&&lineDistance(p.x,p.y,ox,oy,e.x,e.y)<p.r+e.r){damage(20,e.lock);e.hit=true;}
          if(e.timer<=0||Math.hypot(e.x-ox,e.y-oy)<80*dt){e.state='recover';e.timer=1.25;}
        }else if(e.timer<=0){e.state='seek';e.timer=e.type==='runner'?.8:e.type==='sniper'?1.25:1.6;}
      }
      function bossAttack() {
        const list=boss.phase===1?['rail','missiles','rail']:boss.phase===2?['cross','fan','missiles']:['rush','fan','cross','missiles'];
        const kind=list[boss.attack++%list.length];stats.bossPatterns.push([boss.phase,kind]);boss.kind=kind;boss.state='wind';boss.lock=angle(boss,p);boss.a=boss.lock;boss.target={x:p.x,y:p.y};boss.wind=kind==='missiles'?1.35:kind==='fan'?1.1:.95;boss.timer=boss.wind;boss.hit=false;
        if(kind==='missiles'){
          mortarMark(p.x,p.y,60,1.35,23);mortarMark(p.x+95,p.y-40,55,1.55,23);mortarMark(p.x-95,p.y+40,55,1.75,23);
        }
      }
      function updateBoss(dt) {
        if(!boss||boss.hp<=0)return;
        boss.flash=Math.max(0,boss.flash-dt);boss.spawn=Math.max(0,boss.spawn-dt);boss.exposed=Math.max(0,boss.exposed-dt);if(boss.spawn>0)return;
        const phase=boss.hp<=boss.max*.32?3:boss.hp<=boss.max*.65?2:1;
        if(phase!==boss.phase){boss.phase=phase;stats.bossPhases.push(phase);boss.state='idle';boss.timer=1.4;boss.exposed=1.4;hazards.splice(0);boss.attack=0;banner={title:phase===2?'铁鹭 / 超压运转':'铁鹭 / 最后反击',sub:phase===2?'新增交叉光束与扇形弹幕':'冲锋会锁定方向；横向闪避，抓住反击窗口',life:2.4,max:2.4};burst(boss.x,boss.y,C.gold,30,1.3);shake=6;}
        boss.timer-=dt;
        if(boss.state==='idle'){
          boss.a=angle(boss,p);
          const tx=660+Math.sin(time*.22)*110,ty=280+Math.sin(time*.37)*70;steer(boss,tx,ty,31,dt);
          if(boss.timer<=0)bossAttack();
        }else if(boss.state==='wind'){
          if(boss.timer<=0){
            if(boss.kind==='rail'||boss.kind==='cross'){
              const a=boss.lock;hazards.push({kind:'beam',x:boss.x,y:boss.y,a,life:.24,max:.24,r:21,damage:26,hit:false});
              if(boss.kind==='cross')hazards.push({kind:'beam',x:boss.target.x,y:boss.target.y,a:a+PI/2,life:.24,max:.24,r:21,damage:26,hit:false});
              shake=5;boss.state='recover';boss.timer=boss.phase===3?1.65:2;boss.exposed=boss.timer;
            }else if(boss.kind==='fan'){
              boss.state='fan';boss.timer=1.05;boss.next=.01;boss.volley=0;
            }else if(boss.kind==='rush'){boss.state='rush';boss.timer=.67;}
            else{boss.state='recover';boss.timer=2;boss.exposed=2;}
          }
        }else if(boss.state==='fan'){
          boss.next-=dt;
          if(boss.next<=0&&boss.volley<3){boss.next=.31;for(let i=-2;i<=2;i++)enemyShot(boss,boss.lock+i*.25+(boss.volley%2? .1:0),235+boss.volley*35,13,6);boss.volley++;}
          if(boss.timer<=0){boss.state='recover';boss.timer=1.8;boss.exposed=1.8;}
        }else if(boss.state==='rush'){
          let ox=boss.x,oy=boss.y;moveBody(boss,Math.cos(boss.lock)*570*dt,Math.sin(boss.lock)*570*dt,boss.r);trails.push({x:ox,y:oy,a:boss.lock,life:.25,col:C.gold,big:true});
          if(!boss.hit&&lineDistance(p.x,p.y,ox,oy,boss.x,boss.y)<p.r+boss.r){damage(26,boss.lock);boss.hit=true;}
          if(boss.timer<=0||Math.hypot(boss.x-ox,boss.y-oy)<80*dt){boss.state='recover';boss.timer=2.25;boss.exposed=2.25;}
        }else if(boss.timer<=0){boss.state='idle';boss.timer=.7;}
      }
      function updateShots(dt) {
        for(let i=shots.length-1;i>=0;i--){let s=shots[i];s.life-=dt;const ox=s.x,oy=s.y;s.x+=s.vx*dt;s.y+=s.vy*dt;
          if(s.life<=0||s.x<deck.left-15||s.x>deck.right+15||s.y<deck.top-20||s.y>deck.bottom+20){shots.splice(i,1);continue;}
          if(pillars.some(o=>lineDistance(o.x,o.y,ox,oy,s.x,s.y)<o.r+s.r)){burst(s.x,s.y,s.col,4,.4);shots.splice(i,1);continue;}
          if(s.owner==='p'){
            let hit=enemies.find(e=>e.hp>0&&e.spawn<=0&&lineDistance(e.x,e.y,ox,oy,s.x,s.y)<e.r+s.r);
            if(!hit&&boss&&boss.spawn<=0&&boss.hp>0&&lineDistance(boss.x,boss.y,ox,oy,s.x,s.y)<boss.r+s.r)hit=boss;
            if(hit){enemyHurt(hit,s.damage,s.reflected);shots.splice(i,1);}
          }else if(lineDistance(p.x,p.y,ox,oy,s.x,s.y)<p.r+s.r+(p.shield>0?14:0)){
            const incoming=Math.atan2(-s.vy,-s.vx);
            if(p.shield>0&&Math.abs(delta(incoming,p.a))<1.25){
              const target=aimTarget(),a=target?angle(s,target):p.a,speed=690;s.owner='p';s.reflected=true;s.vx=Math.cos(a)*speed;s.vy=Math.sin(a)*speed;s.damage=38;s.life=1.65;s.col=C.cyan;s.x=p.x+Math.cos(a)*35;s.y=p.y+Math.sin(a)*35;p.charge=clamp(p.charge+17,0,100);p.energy=Math.min(100,p.energy+6);stats.reflected++;burst(p.x,p.y,C.cyan,12);api.sound('skill');label(p.x,p.y-27,'折射 +17',C.cyan);
            }else{damage(s.damage,Math.atan2(s.vy,s.vx),'bullet');shots.splice(i,1);}
          }
        }
      }
      function updateHazards(dt) {
        for(let i=hazards.length-1;i>=0;i--){const h=hazards[i];h.life-=dt;
          if(h.kind==='circle'){
            if(h.life<=0&&!h.hit){h.hit=true;h.blast=.36;shake=Math.max(shake,3);burst(h.x,h.y,C.orange,23,1.35);if(distance(p,h)<h.r+p.r*.5)damage(h.damage,angle(h,p));}
            if(h.hit){h.blast-=dt;if(h.blast<=0)hazards.splice(i,1);}
          }else{
            if(!h.hit){h.hit=true;let dx=Math.cos(h.a)*1400,dy=Math.sin(h.a)*1400;if(lineDistance(p.x,p.y,h.x-dx,h.y-dy,h.x+dx,h.y+dy)<h.r+p.r)damage(h.damage,h.a);}
            if(h.life<=0)hazards.splice(i,1);
          }
        }
      }
      function update(dt) {
        if(finished)return;dt=clamp(dt,0,.04);time+=dt;stageTime+=dt;noteLife=Math.max(0,noteLife-dt);banner.life=Math.max(0,banner.life-dt);shake=Math.max(0,shake-dt*32);damageFlash=Math.max(0,damageFlash-dt);fireMuzzle=Math.max(0,fireMuzzle-dt);
        p.fire=Math.max(0,p.fire-dt);p.inv=Math.max(0,p.inv-dt);p.flash=Math.max(0,p.flash-dt);p.shield=Math.max(0,p.shield-dt);p.energy=Math.min(100,p.energy+16*dt);
        const target=aimTarget(),shooting=!!(api.keys.Space||api.pointer.down);
        if(api.pointer.down)p.a=angle(p,api.pointer);else if(target)p.a=angle(p,target);
        p.heat=Math.max(0,p.heat-dt*(shooting&&!overheated?10:27));if(overheated&&p.heat<=30){overheated=false;tell('枪管冷却完成',1);}
        let mx=+(!!(api.keys.KeyD||api.keys.ArrowRight))-+(!!(api.keys.KeyA||api.keys.ArrowLeft)),my=+(!!(api.keys.KeyS||api.keys.ArrowDown))-+(!!(api.keys.KeyW||api.keys.ArrowUp)),n=Math.hypot(mx,my)||1;
        if(p.dash>0){p.dash=Math.max(0,p.dash-dt);trails.push({x:p.x,y:p.y,a:p.a,life:.18,col:C.cyan});moveBody(p,p.dx*660*dt,p.dy*660*dt);}
        else{const speed=shooting&&!overheated?194:235;moveBody(p,mx/n*speed*dt,my/n*speed*dt);}
        p.walk=Math.hypot(mx,my)>.1||p.dash>0;
        if(shooting&&(target||api.pointer.down))shoot();
        if(transition>0){transition-=dt;if(transition<=0)beginStage();}
        else if(stage>=0&&stage<2){while(queue.length&&stageTime>=queue[0].at)spawn(queue.shift());for(const e of enemies)updateEnemy(e,dt);if(!queue.length&&enemies.every(e=>e.hp<=0))clearStage();}
        else updateBoss(dt);
        // Bodies occupy space: standing inside the crane cannot bypass its attacks.
        for(const e of [...enemies,...(boss?[boss]:[])])if(e.hp>0&&e.spawn<=0){let d=distance(p,e),min=p.r+e.r;if(d<min){const a=d>.01?angle(e,p):time;p.x=e.x+Math.cos(a)*min;p.y=e.y+Math.sin(a)*min;moveBody(p,0,0);}}
        updateShots(dt);updateHazards(dt);if(finished)return;
        for(let i=enemies.length-1;i>=0;i--)if(enemies[i].hp<=0)enemies.splice(i,1);
        for(let i=drops.length-1;i>=0;i--){const d=drops[i];d.life-=dt;if(distance(p,d)<p.r+d.r+6){p.hp=Math.min(100,p.hp+22);burst(d.x,d.y,C.mint,16);label(d.x,d.y-15,'+22',C.mint);api.sound('skill');drops.splice(i,1);}else if(d.life<=0)drops.splice(i,1);}
        for(let i=effects.length-1;i>=0;i--){const q=effects[i];q.life-=dt;if(!q.kind){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vx*=Math.exp(-3*dt);q.vy*=Math.exp(-3*dt);}if(q.life<=0)effects.splice(i,1);}
        for(let i=trails.length-1;i>=0;i--)if((trails[i].life-=dt)<=0)trails.splice(i,1);
        for(let i=numbers.length-1;i>=0;i--){numbers[i].life-=dt;numbers[i].y-=30*dt;if(numbers[i].life<=0)numbers.splice(i,1);}
        score=Math.round(killCount*180+stats.reflected*30+(boss?Math.max(0,boss.max-boss.hp)*2:0));api.setScore(score);
        if(time>=240)done(false,'黎明前的撤离窗口关闭了。减少盲目连射，利用折射与金色核心窗口提高效率。');
      }

      function drawDeck(c) {
        const sky=c.createLinearGradient(0,0,0,620);sky.addColorStop(0,'#12272c');sky.addColorStop(.5,'#1a3739');sky.addColorStop(1,'#0b242b');c.fillStyle=sky;c.fillRect(0,0,1000,620);
        // Distant warehouses and the cold water around a raised cargo pier.
        for(let i=0;i<11;i++){const x=i*103-25,h=35+(i*47)%70;rect(c,x,115-h,78,h,'#0d2025');for(let j=0;j<4;j++)if((i+j)%3===0)rect(c,x+12+j*16,101-h,6,8,'#94bb9c55');}
        for(let i=0;i<22;i++){const x=(i*137+time*11)%1100-50,y=125+(i*71)%480;line(c,x,y,x+25+Math.sin(time+i)*12,y-2,'#8fc2bd18',1.2);}
        c.shadowColor='#020d1399';c.shadowBlur=20;c.shadowOffsetY=10;F.poly(c,[[58,126],[938,126],[950,548],[45,548]],'#253c3c');c.shadowBlur=0;c.shadowOffsetY=0;
        rect(c,65,132,870,403,'#334946');
        const floor=c.createLinearGradient(0,130,1000,540);floor.addColorStop(0,'#36504c');floor.addColorStop(.5,'#263f40');floor.addColorStop(1,'#304c47');rect(c,70,137,860,394,floor);
        for(let x=73;x<932;x+=72){line(c,x,137,x-9,531,'#142c2b85',2);line(c,x+1,138,x-8,529,'#9ab4a315',1);for(let y=155;y<530;y+=92)circle(c,x+8,y,1.6,'#b7c3ae3b');}
        for(let y=155;y<535;y+=92)line(c,72,y,929,y,'#0c23282b',1);
        for(let i=0;i<100;i++){const x=88+(i*137)%830,y=155+(i*71)%354;line(c,x,y,x+11+(i%4)*6,y+(i%3-1),'#b6d0b408',1);}
        // A battered quay edge: exposed beams, tied ropes and reflected dock lamps.
        for(let x=63;x<941;x+=79){rect(c,x,535,48,9,'#132d32',1);line(c,x+3,541,x+44,541,'#7f968148',1);}
        for(const [x,y]of [[111,144],[879,145],[106,514],[882,514]]){c.save();c.translate(x,y);c.strokeStyle='#9e9b715c';c.lineWidth=2;c.beginPath();for(let j=0;j<3;j++)c.ellipse(0,j*2,17-j*3,8-j,0,0,TAU);c.stroke();line(c,-15,0,-35,16,'#9c967269',2);c.restore();}
        // Rain-filled oil stains, paint, service hatches, mooring hardware.
        c.save();c.globalAlpha=.22;for(const [x,y,rx,ry]of [[240,235,78,18],[490,465,100,13],[795,390,67,22],[535,210,72,13]]){c.fillStyle='#8cc9bd';c.beginPath();c.ellipse(x,y,rx,ry,-.2,0,TAU);c.fill();line(c,x-rx*.6,y,x+rx*.5,y-3,'#b9ecdc',1);}c.restore();
        c.save();c.globalAlpha=.24;c.translate(450,350);c.rotate(-.08);text(c,'FOGHARBOR',0,0,34,'#b6cbbb','center');text(c,'PIER 07  /  KEEP CLEAR',0,31,11,'#b6cbbb','center');c.restore();
        for(const [x,y,w]of [[110,161,102],[705,478,104]]){rect(c,x,y,w,36,'#172f32',3);for(let xx=x+7;xx<x+w;xx+=12)line(c,xx,y+5,xx-6,y+31,'#638478',2);}
        for(let x=83;x<930;x+=34){line(c,x,139,x+14,139,'#b3ae6d80',3);line(c,x,530,x+14,530,'#b3ae6d80',3);}
        for(const [x,y]of [[78,170],[920,180],[76,490],[921,488]]){c.save();c.translate(x,y);circle(c,0,0,13,'#142d32');rect(c,-5,-9,10,20,'#657f74',3);line(c,-10,-4,10,-4,'#9eb8a0',3);c.restore();}
        for(const x of [76,925])for(const y of [214,432]){const gl=c.createRadialGradient(x,y,1,x,y,110);gl.addColorStop(0,'#edce792b');gl.addColorStop(1,'#edce7900');circle(c,x,y,110,gl);rect(c,x-6,y-12,12,17,'#b8aa70',3);rect(c,x-3,y-9,6,9,'#ffe5a1',1);}
        for(let i=0;i<8;i++){const x=115+(i*173)%770,y=180+(i*91)%305,q=(time*.7+i*.217)%1;c.save();c.globalAlpha=(1-q)*.17;ring(c,x,y,q*17,'#b7ded6',.7);c.restore();}
        // Cargo stacks and a gantry silhouette sit beyond the walkable boundary.
        for(const [x,y,w,h]of [[-5,315,49,77],[953,220,58,58],[951,292,60,78]]){rect(c,x+3,y+4,w,h,'#081d24',3);rect(c,x,y,w,h,'#3e5853',3);rect(c,x+4,y+4,w-8,h-8,'#304a48',1);for(let xx=x+10;xx<x+w-5;xx+=9)line(c,xx,y+7,xx,y+h-7,'#97a18835',2);rect(c,x+7,y+h-12,14,4,'#bdad7544',0);}
        c.save();c.strokeStyle='#092029';c.lineWidth=8;line(c,969,128,977,451,'#0a2029',12);line(c,968,136,826,116,'#0a2029',10);line(c,960,139,936,171,'#0a2029',4);line(c,831,117,831,163,'#0a2029',2);ring(c,831,165,7,'#0a2029',3,0,PI*1.6);c.restore();
        for(let i=0;i<55;i++){let x=(i*117.3-time*74)%1040;if(x<0)x+=1040;let y=(i*71.7+time*420)%680-30;line(c,x,y,x-7,y+17,'#c1e8df19',1);}
      }
      function drawPillar(c,o) {
        c.save();c.translate(o.x,o.y);c.fillStyle='#051c2366';c.beginPath();c.ellipse(14,16,43,24,-.4,0,TAU);c.fill();
        rect(c,-30,-18,60,43,'#152c31',7);rect(c,-25,-26,50,43,'#53736b',5);rect(c,-21,-22,42,34,'#354f50',4);
        for(let x=-16;x<=16;x+=16){circle(c,x,-15,2.5,'#b4bca0');circle(c,x,7,2.5,'#b4bca0');}
        rect(c,-9,-36,18,47,'#a99b61',3);rect(c,-5,-34,10,43,'#4a6158',2);line(c,-25,17,25,17,'#0c2327',5);circle(c,0,-29,3,'#ffd58d');
        c.strokeStyle='#b9be8b44';c.lineWidth=2;c.beginPath();c.arc(0,-4,35,0,TAU);c.stroke();c.restore();
      }
      function drawWarning(c,e) {
        if(e.spawn>0){const z=1-e.spawn/1.05;c.save();c.globalAlpha=.5+.3*Math.sin(time*17);ring(c,e.x,e.y,21+z*26,C.red,2);line(c,e.x-35,e.y,e.x+35,e.y,'#ff777033',1);line(c,e.x,e.y-35,e.x,e.y+35,'#ff777033',1);text(c,e.type==='boss'?'重型信号':{runner:'突击手',sniper:'狙击手',mortar:'迫击手'}[e.type],e.x,e.y-44,11,C.red,'center');c.restore();return;}
        if(e.state!=='wind')return;
        const progress=1-clamp(e.timer/e.wind,0,1);c.save();
        if(e.type==='runner'||e.type==='boss'&&e.kind==='rush'){
          const a=e.lock,range=e.type==='boss'?450:245,w=e.type==='boss'?65:34;c.translate(e.x,e.y);c.rotate(a);rect(c,0,-w,range,w*2,'#ff655825',4);c.strokeStyle='#ff9b85';c.lineWidth=1.5;c.strokeRect(0,-w,range,w*2);for(let x=30;x<range;x+=38){F.poly(c,[[x,-10],[x+14,0],[x,10]],'#ffb08899');}rect(c,0,-w,range*progress,3,C.red);c.restore();
        }else if(e.type==='sniper'||e.type==='boss'&&(e.kind==='rail'||e.kind==='cross')){
          const a=e.lock,reach=e.type==='boss'?1400:900,ax=e.x-Math.cos(a)*(e.type==='boss'?reach:0),ay=e.y-Math.sin(a)*(e.type==='boss'?reach:0),bx=e.x+Math.cos(a)*reach,by=e.y+Math.sin(a)*reach;
          c.setLineDash([8,7]);line(c,ax,ay,bx,by,'#ff9387'+(progress>.72?'d9':'7a'),e.type==='boss'?3:1.5);c.setLineDash([]);line(c,ax,ay,bx,by,'#ff655816',e.type==='boss'?43:12);
          if(e.kind==='cross'){const b=a+PI/2,x=e.target.x,y=e.target.y;line(c,x-Math.cos(b)*1400,y-Math.sin(b)*1400,x+Math.cos(b)*1400,y+Math.sin(b)*1400,'#ff65581f',43);c.setLineDash([8,7]);line(c,x-Math.cos(b)*1400,y-Math.sin(b)*1400,x+Math.cos(b)*1400,y+Math.sin(b)*1400,C.red,2);c.setLineDash([]);}
          c.restore();
        }else if(e.type==='boss'&&e.kind==='fan'){
          const a=e.lock;c.fillStyle='#f1c77d16';c.beginPath();c.moveTo(e.x,e.y);c.arc(e.x,e.y,230,a-.68,a+.68);c.closePath();c.fill();ring(c,e.x,e.y,230,'#f1c77d77',1.5,a-.68,a+.68);for(let i=-2;i<=2;i++)line(c,e.x+Math.cos(a+i*.25)*75,e.y+Math.sin(a+i*.25)*75,e.x+Math.cos(a+i*.25)*220,e.y+Math.sin(a+i*.25)*220,'#f1c77d44',1);c.restore();
        }else c.restore();
        ring(c,e.x,e.y,e.r+12,'#ffb48b',3,-PI/2,-PI/2+TAU*progress);
      }
      function drawHumanoid(c,e,isPlayer=false) {
        const t=time*10+(e.x*.02),a=e.a||0,walk=isPlayer?p.walk:e.state==='seek',bob=walk?Math.sin(t)*1.6:Math.sin(time*2)*.8;
        c.save();c.translate(e.x,e.y);c.fillStyle='#071d2466';c.beginPath();c.ellipse(2,11,e.r+4,e.r*.48,0,0,TAU);c.fill();
        if(isPlayer&&p.inv>0&&p.dash<=0&&Math.floor(time*15)%2)c.globalAlpha=.55;
        c.rotate(a);const col=isPlayer?C.mint:e.type==='runner'?C.orange:e.type==='sniper'?C.red:C.violet;
        // A readable body silhouette with animated planted legs, hood and weapon.
        const stride=walk?Math.sin(t)*5:0;rect(c,-10-stride,-12,13,8,'#152c31',3);rect(c,-10+stride,4,13,8,'#152c31',3);
        rect(c,-10,-12,10,8,isPlayer?'#406d67':'#654d52',3);rect(c,-10,4,10,8,isPlayer?'#406d67':'#654d52',3);
        c.translate(0,bob);F.poly(c,[[-14,-9],[-5,-16],[11,-11],[15,0],[11,11],[-5,16],[-14,9]],e.flash>0?'#fff9e5':isPlayer?'#799c86':e.type==='runner'?'#b47a55':e.type==='sniper'?'#8d5956':'#79678a');
        rect(c,-12,-11,9,22,'#273e3f',3);rect(c,-10,-8,4,16,col,1);
        circle(c,4,0,10,e.flash>0?'#fff':isPlayer?'#b4c7ac':'#b59985');circle(c,7,0,7,'#1a333a');line(c,8,-4,11,3,col,3);
        if(e.type==='mortar'){
          rect(c,-5,-19,20,10,'#3e4b55',4);circle(c,11,-14,6,'#c0a5db');circle(c,12,-14,3,'#293b49');rect(c,3,8,21,7,'#34464a',3);
        }else{
          line(c,6,-12,19,-7,isPlayer?'#9bb19a':'#a68877',7);line(c,8,12,20,8,isPlayer?'#9bb19a':'#a68877',7);
          rect(c,12,-6,e.type==='sniper'?33:22,12,'#192d32',3);rect(c,19,-7,14,4,'#5a7d74',1);rect(c,18,3,12,3,col,1);
          if(e.type==='runner'){F.poly(c,[[17,-17],[31,-10],[21,-6]],'#d5b78e');F.poly(c,[[17,17],[31,10],[21,6]],'#d5b78e');}
        }
        if(isPlayer&&fireMuzzle>0){F.poly(c,[[37,-4],[50,-1],[38,5],[43,0]],'#f8f3be');}
        c.restore();
        if(!isPlayer){F.bar(c,e.x-21,e.y-32,42,4,e.hp,e.max,e.type==='mortar'?C.violet:C.red);text(c,{runner:'突击手',sniper:'狙击手',mortar:'迫击手'}[e.type],e.x,e.y-43,9,'#c4c6b9','center');if(e.state==='recover')text(c,'破绽',e.x,e.y+34,10,C.gold,'center');}
      }
      function drawBoss(c) {
        const b=boss;if(!b||b.hp<=0)return;const a=b.a,bob=Math.sin(time*2)*2,open=b.exposed>0;
        c.save();c.translate(b.x,b.y);c.fillStyle='#05171c80';c.beginPath();c.ellipse(9,24,72,37,-.2,0,TAU);c.fill();
        c.rotate(a);for(let side of [-1,1])for(let i=-1;i<=1;i++){
          const z=Math.sin(time*(b.state==='rush'?15:3)+i+side)*4,y=side*(38+Math.abs(i)*5),xx=i*28;
          line(c,xx,y*.35,xx-13+z,y,'#172e35',13);line(c,xx-13+z,y,xx+9+z,y+side*19,'#697b70',8);line(c,xx+9+z,y+side*19,xx+20+z,y+side*20,'#283d40',8);circle(c,xx-13+z,y,5,'#cbb178');
        }
        c.translate(0,bob);F.poly(c,[[-48,-27],[-26,-43],[27,-37],[50,-18],[50,18],[27,37],[-26,43],[-48,27]],b.flash>0?'#fff3c8':'#566d66');
        F.poly(c,[[-43,-20],[-22,-35],[17,-29],[29,-15],[29,15],[17,29],[-22,35],[-43,20]],'#283e42');
        for(let sy of [-1,1]){rect(c,-20,sy*28-7,54,14,'#ac9565',3);for(let x=-14;x<26;x+=13)line(c,x,sy*28-5,x+8,sy*28+5,'#3d514c',3);rect(c,22,sy*25-7,44,14,'#23383f',4);rect(c,40,sy*25-5,25,10,'#748c7b',3);rect(c,63,sy*25-6,8,12,b.state==='wind'?C.red:'#aaa57c',2);}
        ring(c,-9,0,23,'#8b9a78',5);circle(c,-9,0,18,open?'#f4cc7d':'#4a7073');
        if(open){c.shadowColor=C.gold;c.shadowBlur=25;circle(c,-9,0,11,'#fff1b3');c.shadowBlur=0;}
        for(let i=0;i<6;i++){let q=i*TAU/6+time*(open?3:.5);line(c,-9+Math.cos(q)*9,Math.sin(q)*9,-9+Math.cos(q)*17,Math.sin(q)*17,open?'#ab7538':'#2c4952',3);}
        rect(c,-49,-10,12,20,'#122a33',3);circle(c,-46,-5,2,C.red);circle(c,-46,5,2,C.red);
        c.restore();
        if(open){ring(c,b.x,b.y,65,'#f1c77d99',1.5);text(c,'核心暴露',b.x,b.y+86,12,C.gold,'center');}
        if(b.spawn>0)ring(c,b.x,b.y,80+b.spawn*15,C.gold,2);
      }
      function drawHazards(c) {
        for(const h of hazards){
          if(h.kind==='circle'){
            if(h.hit){c.save();c.globalAlpha=clamp(h.blast/.36,0,1);circle(c,h.x,h.y,h.r*(1.15-h.blast), '#ffd99b66');ring(c,h.x,h.y,h.r*(1.3-h.blast),C.orange,9);c.restore();}
            else{const q=1-h.life/h.max;circle(c,h.x,h.y,h.r,'#ff6e6025');ring(c,h.x,h.y,h.r,C.red,1.8);ring(c,h.x,h.y,h.r*q,'#ffb18d',2);line(c,h.x-8,h.y,h.x+8,h.y,C.red,1.5);line(c,h.x,h.y-8,h.x,h.y+8,C.red,1.5);text(c,'!',h.x,h.y-h.r-13,15,C.red,'center');}
          }else{c.save();c.globalAlpha=clamp(h.life/.1,0,1);const dx=Math.cos(h.a)*1400,dy=Math.sin(h.a)*1400;line(c,h.x-dx,h.y-dy,h.x+dx,h.y+dy,'#ff775933',h.r*3);line(c,h.x-dx,h.y-dy,h.x+dx,h.y+dy,C.orange,h.r*1.8);line(c,h.x-dx,h.y-dy,h.x+dx,h.y+dy,'#fff7ca',h.r*.65);c.restore();}
        }
      }
      function drawHUD(c) {
        panel(c,16,12,968,94,'#10272bf2');
        rect(c,30,27,3,63,C.mint,1);text(c,'雾港守夜',45,37,23,C.ink);text(c,'NIGHT WATCH  /  PIER 07',46,62,10,C.dim);
        text(c,'生命',250,34,12,C.dim);F.bar(c,285,27,112,10,p.hp,100,p.hp<30?C.red:C.mint);text(c,Math.ceil(p.hp),434,32,16,C.ink,'right');
        text(c,'电池',250,62,12,C.dim);F.bar(c,285,56,112,7,p.energy,100,C.cyan);text(c,Math.floor(p.energy),434,60,12,C.cyan,'right');
        text(c,overheated?'过热 / 等待冷却':'枪管温度',476,33,12,overheated?C.red:C.dim);F.bar(c,475,52,158,8,p.heat,100,overheated?C.red:p.heat>75?C.orange:C.gold);
        text(c,'超载',670,33,12,C.dim);F.bar(c,708,29,138,8,p.charge,100,p.charge>=100?C.gold:C.violet);text(c,Math.floor(p.charge)+'%',862,33,12,p.charge>=100?C.gold:C.dim,'right');
        text(c,'R',708,61,12,p.charge>=100?C.gold:C.dim);text(c,p.charge>=100?'已就绪 · 伤害 + 回血':'命中 / 折射充能',732,61,11,p.charge>=100?C.gold:C.dim);
        text(c,Math.floor(time/60)+':'+String(Math.floor(time%60)).padStart(2,'0'),958,36,22,C.ink,'right');text(c,'04:00 截止',958,62,10,C.dim,'right');
        line(c,46,79,957,79,'#a8c9bc18',1);text(c,stage<0?'准备行动':stage<2?['01 货栈警报','02 防波堤封锁'][stage]:'03 起重机 · 铁鹭',46,92,11,C.gold);text(c,stage<2?'已清除 '+killCount+' / 10 名入侵者':'铁鹭 / 阶段 '+boss.phase+' · '+(boss.exposed>0?'核心暴露':'装甲闭合'),958,92,11,C.dim,'right');
        if(boss&&boss.hp>0){panel(c,283,110,434,23,'#10262ce8');text(c,'铁鹭',301,121,11,C.gold);F.bar(c,352,117,346,7,boss.hp,boss.max,boss.exposed>0?C.gold:C.red);for(let q of [.32,.65])line(c,352+346*q,115,352+346*q,126,'#192f33',2);}
        panel(c,16,553,968,53,'#10272bf2');
        const skills=[{x:36,key:'SPACE',name:'自动索敌',sub:overheated?'枪管冷却中':'按住射击',ready:!overheated,col:C.mint,w:205},{x:263,key:'Q',name:'闪避',sub:'30 电池',ready:p.energy>=30,col:C.cyan,w:170},{x:450,key:'E',name:'折射盾',sub:'40 电池 · 挡正面弹丸',ready:p.energy>=40,col:C.cyan,w:280},{x:753,key:'R',name:'超载',sub:'100 充能 · 爆发回血',ready:p.charge>=100,col:C.gold,w:210}];
        for(const s of skills){rect(c,s.x,565,s.key==='SPACE'?54:27,27,s.ready?'#496b5b':'#263c40',5);text(c,s.key,s.x+(s.key==='SPACE'?27:13.5),578,s.key==='SPACE'?10:13,s.ready?s.col:C.dim,'center');let xx=s.x+(s.key==='SPACE'?65:37);text(c,s.name,xx,572,13,s.ready?C.ink:C.dim);text(c,s.sub,xx,590,10,s.ready?s.col:C.dim);}
        if(noteLife>0){panel(c,200,537,600,15,'#0b2025e6');text(c,note,500,545,10,C.ink,'center');}
        if(banner.life>0){const enter=clamp((banner.max-banner.life)*3,0,1),exit=clamp(banner.life*2,0,1);c.save();c.globalAlpha=Math.min(enter,exit);panel(c,16,553,968,53,'#10282dfc');rect(c,30,563,3,33,C.gold,0);text(c,banner.title,46,569,18,C.gold);text(c,banner.sub,46,592,12,C.ink);text(c,'SPACE / Q / E / R',958,578,12,C.dim,'right');c.restore();}
      }
      function draw(c) {
        c.save();drawDeck(c);
        c.save();if(shake>0)c.translate(Math.sin(time*83)*shake*.55,Math.cos(time*107)*shake*.4);
        // Clip gameplay effects to the deck; UI and distant scenery remain still.
        c.beginPath();c.rect(65,129,871,408);c.clip();
        for(const e of enemies)if(e.hp>0)drawWarning(c,e);if(boss)drawWarning(c,boss);
        for(const d of drops){const y=d.y+Math.sin(time*4+d.x)*3;circle(c,d.x,d.y+9,19,'#102a2c66');ring(c,d.x,d.y,24+Math.sin(time*3)*2,'#b4f1cd66',1);rect(c,d.x-12,y-11,24,22,'#a2cfab',5);rect(c,d.x-4,y-8,8,16,'#1b544a',1);rect(c,d.x-8,y-4,16,8,'#1b544a',1);text(c,'+22',d.x,y-27,10,C.mint,'center');}
        for(const q of trails){c.save();c.globalAlpha=q.life*1.8;circle(c,q.x,q.y,q.big?38:16,q.col);c.restore();}
        drawHazards(c);
        const bodies=[...enemies.filter(e=>e.hp>0),p,...pillars.map(o=>({...o,pillar:true}))];if(boss&&boss.hp>0)bodies.push(boss);bodies.sort((a,b)=>a.y-b.y);
        for(const e of bodies){if(e.pillar)drawPillar(c,e);else if(e===boss)drawBoss(c);else if(e.spawn>0){c.save();c.globalAlpha=clamp(1-e.spawn,0,1);drawHumanoid(c,e);c.restore();}else drawHumanoid(c,e,e===p);}
        if(p.shield>0){c.save();c.shadowColor=C.cyan;c.shadowBlur=14;ring(c,p.x,p.y,35,C.cyan,4,p.a-1.25,p.a+1.25);ring(c,p.x,p.y,39,'#a4efff55',1,p.a-1.25,p.a+1.25);c.restore();}
        if(p.dash>0)ring(c,p.x,p.y,24,'#adf5eea0',1);
        for(const s of shots){const a=Math.atan2(s.vy,s.vx);line(c,s.x-Math.cos(a)*s.tail,s.y-Math.sin(a)*s.tail,s.x,s.y,s.col,s.r*1.2);circle(c,s.x,s.y,s.r,s.owner==='p'?'#efffea':'#ffdfb4');}
        for(const q of effects){c.save();c.globalAlpha=clamp(q.life*2,0,1);if(q.kind==='ring'){let v=1-q.life/q.max;ring(c,q.x,q.y,q.r*v,q.col,12*(1-v)+1);}else circle(c,q.x,q.y,q.size||2,q.col);c.restore();}
        for(const q of numbers){c.save();c.globalAlpha=Math.min(1,q.life*2);text(c,q.s,q.x,q.y,13,q.col,'center');c.restore();}
        c.restore();
        // Cable foreground and fine mist give depth without obscuring warning zones.
        c.save();c.globalAlpha=.4;c.strokeStyle='#051b22';c.lineWidth=4;c.beginPath();c.moveTo(-10,117);c.bezierCurveTo(250,143,690,103,1010,129);c.stroke();c.restore();
        if(damageFlash>0){c.save();c.globalAlpha=damageFlash*.45;rect(c,0,0,1000,620,C.red);c.restore();}
        drawHUD(c);c.restore();
      }
      return {
        update,draw,key:skill,pointer(){},cancelPointer(){},
        // Read-only observations for reproducible public-input replays and accessibility.
        snapshot(){return {time,stage,transition,finished,overheated,player:{...p},enemies:enemies.map(e=>({...e,target:e.target?{...e.target}:null})),boss:boss?{...boss,target:boss.target?{...boss.target}:null}:null,shots:shots.map(s=>({...s})),hazards:hazards.map(h=>({...h})),drops:drops.map(d=>({...d})),queue:queue.length,stats:{...stats,bossPhases:[...stats.bossPhases],bossPatterns:stats.bossPatterns.map(a=>[...a])},score};}
      };
    }
  });
})();
