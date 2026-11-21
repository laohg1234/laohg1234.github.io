/* Flavor Studio · local illustrated maps, CC0 sprites and hand-drawn character animation. */
(function(){'use strict';const F=FG,A=F.art={images:{},loaded:0,errors:[]},images=A.images;
const names=['turret','cannon','fly','slime','tank-red','hero-red','hero-jump','tank-heavy','castle','flag','stone-tile','shield','gem','coin','tree','rock','bomb','heart','explosion-1','explosion-2','explosion-3','explosion-4','explosion-5'];
const scenes=['forest','desert','sea'];
A.ready=Promise.all([...names.map(k=>[k,'assets/game/'+k+'.png']),...scenes.map(k=>['scene-'+k,'assets/game/scene-'+k+'.jpg'])].map(([key,src])=>new Promise(resolve=>{const img=new Image();images[key]=img;img.onload=()=>{A.loaded++;resolve();};img.onerror=()=>{A.errors.push(key);resolve();};img.src=src;})));
A.sprite=(c,key,x,y,w=64,h=w,angle=0,flip=false)=>{const img=images[key];if(!img?.complete||!img.naturalWidth)return false;c.save();c.translate(x,y);if(angle)c.rotate(angle);if(flip)c.scale(-1,1);const ratio=Math.min(w/img.naturalWidth,h/img.naturalHeight),stretch=key.endsWith('-tile')||key==='bridge',dw=stretch?w:img.naturalWidth*ratio,dh=stretch?h:img.naturalHeight*ratio;c.drawImage(img,-dw/2,-dh/2,dw,dh);c.restore();return true;};
A.shadow=(c,x,y,rx,ry=rx*.4,alpha=.25)=>{c.save();c.fillStyle=`rgba(6,18,24,${alpha})`;c.beginPath();c.ellipse(x,y,Math.max(0,rx),Math.max(0,ry),0,0,Math.PI*2);c.fill();c.restore();};
A.scene=(c,type='forest',time=0)=>{const img=images['scene-'+type]||images['scene-forest'];c.save();if(img?.complete&&img.naturalWidth)c.drawImage(img,0,0,1000,620);else{c.fillStyle='#334b43';c.fillRect(0,0,1000,620);}if(type==='sea'){c.strokeStyle='#c8fcf322';c.lineWidth=2;for(let i=0;i<10;i++){let x=((i*137+time*17)%1200)-100,y=170+(i*73)%380;c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+14,y-4,x+30,y);c.stroke();}}if(type==='forest'||type==='garden'){for(let i=0;i<9;i++){let x=80+(i*173)%850+Math.sin(time*.65+i)*15,y=125+(i*91)%380+Math.cos(time*.45+i)*12;c.globalAlpha=.35+Math.sin(time+i)*.2;F.circle(c,x,y,1.5,'#e2efab');}}c.restore();};
A.unit=(c,type,x,y,size=64,angle=0,team='blue',time=0)=>{let key=type,rot=0,flip=false;
 if(type==='tank'){key=team==='red'?'tank-red':team==='green'?'tank-green':'tank-blue';rot=angle+Math.PI/2;}
 else if(type==='car'){key=team==='red'?'car-red':'car-blue';rot=angle+Math.PI/2;}
 else if(type==='hero'){key=team==='red'?'hero-red':Math.floor(time*8)%2?'hero-walk':'hero';flip=Math.cos(angle)<0;}
 else if(type==='slime'){key='slime';y+=Math.sin(time*8+x)*2;}
 else if(type==='ship'){key=team==='red'?'ship-red':'ship-blue';rot=angle+Math.PI/2;}
 else if(type==='drone'){key=team==='red'?'ship-red':'ship-blue';rot=angle+Math.PI/2;y+=Math.sin(time*5+x)*3;}
 else if(type==='turret'){key='turret';rot=angle+Math.PI/2;}
 else if(type==='coin'){key='coin';size*=.85+Math.abs(Math.cos(time*3+x))*.15;}
 A.shadow(c,x,y+size*.28,size*.3,size*.12,.2);return A.sprite(c,key,x,y,size,size,rot,flip);};
A.explosion=(c,x,y,r,progress)=>{progress=F.clamp(progress,0,1);c.save();c.globalAlpha=1-progress*.7;const key='explosion-'+Math.min(5,1+Math.floor(progress*5));A.sprite(c,key,x,y,r*2.5,r*2.5,progress*.5);c.restore();};
A.panel=(c,x,y,w,h,style='dark')=>{c.save();const glass=style==='glass';const gradient=c.createLinearGradient(x,y,x,y+h);gradient.addColorStop(0,glass?'#1b334849':'#24384dec');gradient.addColorStop(1,glass?'#10213285':'#111f30f5');c.shadowColor='#08152155';c.shadowBlur=glass?0:12;c.shadowOffsetY=3;F.rect(c,x,y,w,h,gradient,Math.min(12,h/4));c.shadowBlur=0;c.shadowOffsetY=0;c.strokeStyle=glass?'#c2e5e533':'#c6d5da45';c.lineWidth=1;c.beginPath();c.roundRect(x+.5,y+.5,w-1,h-1,Math.min(12,h/4));c.stroke();c.strokeStyle='#fff9dc18';c.beginPath();c.moveTo(x+10,y+2);c.lineTo(x+w-10,y+2);c.stroke();if(w>160&&h>100){for(const [dx,dy] of [[8,8],[w-8,8],[8,h-8],[w-8,h-8]]){F.circle(c,x+dx,y+dy,2,'#9eafb15a');}}c.restore();};
A.label=(c,label,value,x,y,color='#fff')=>{F.text(c,label,x,y,11,'#b7c8cf');F.text(c,value,x,y+21,23,color);};
A.icon=(c,type,x,y,size=30)=>{const key={energy:'gem',health:'heart',gold:'coin'}[type]||type;A.sprite(c,key,x,y,size,size);};
A.card=(c,label,x,y,w,h,theme='blue')=>{A.panel(c,x,y,w,h);const col={blue:'#7fcef2',green:'#b8e994',red:'#f99e8b',gold:'#ffdc8d',purple:'#c6abf1'}[theme]||'#9fd1dd';c.save();c.fillStyle=col;c.globalAlpha=.2;c.beginPath();c.roundRect(x+4,y+4,w-8,Math.min(48,h-8),6);c.fill();c.restore();F.text(c,label,x+w/2,y+h-17,13,'#e8f0ef','center');};
// Actual illustrated apparatus for experiments: gears, mirrors, servers and electric terminals.
A.device=(c,type,x,y,size=64,color='#9ed8ef',time=0)=>{c.save();A.shadow(c,x,y+size*.3,size*.4,size*.15,.2);c.translate(x,y);const r=size*.42;
 if(type==='gear'){c.rotate(time*.15);c.fillStyle='#9bafbd';for(let i=0;i<12;i++){c.save();c.rotate(i*Math.PI/6);c.fillRect(-size*.075,-size*.5,size*.15,size*.22);c.restore();}F.circle(c,0,0,r,'#627d8e');F.circle(c,0,0,r*.65,'#a9c5cb');F.circle(c,0,0,r*.34,'#253d50');}
 else if(type==='mirror'){F.rect(c,-r,-r*.8,r*2,r*1.6,'#3a6175',7);const g=c.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#d9ffff');g.addColorStop(.45,'#90c9e5');g.addColorStop(.5,'#e3faff');g.addColorStop(1,'#4b83ab');F.rect(c,-r+5,-r*.8+5,r*2-10,r*1.6-10,g,3);}
 else if(type==='server'){F.rect(c,-r,-r,r*2,r*2,'#2b465b',6);for(let i=0;i<3;i++){F.rect(c,-r+5,-r+5+i*r*.59,r*2-10,r*.45,'#527589',3);F.circle(c,r*.58,-r*.6+i*r*.59,2,color);F.line(c,-r*.6,-r*.6+i*r*.59,r*.1,-r*.6+i*r*.59,'#d4e4d9',2);}}
 else if(type==='switch'){F.circle(c,0,0,r,'#2d465a');F.circle(c,0,0,r*.83,'#7394a4');F.circle(c,0,0,r*.55,color);F.circle(c,-r*.14,-r*.2,r*.26,'#fff7de66');}
 else if(type==='prism'){F.poly(c,[[-r,r*.7],[0,-r],[r,r*.7]],'#73dbe5','#dbffff');F.poly(c,[[0,-r],[r,r*.7],[0,r*.3]],'#479bbd');F.line(c,-r*.48,r*.2,-r*.1,-r*.55,'#e1ffff',3);}
 else if(type==='battery'){F.rect(c,-r*.65,-r,r*1.3,r*2,'#497a78',6);F.rect(c,-r*.3,-r-5,r*.6,8,'#a7c4bc',2);F.rect(c,-r*.47,-r*.5,r*.94,r*1.25,color,3);F.poly(c,[[-6,-14],[9,-14],[0,1],[9,1],[-6,19],[-1,5],[-10,5]],'#24465d');}
 else{F.circle(c,0,0,r,'#354e61');F.circle(c,0,0,r*.8,color);F.circle(c,-r*.25,-r*.25,r*.3,'#ffffff55');}
 c.restore();};
})();
