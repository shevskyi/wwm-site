const canvas=document.querySelector('#space');
const story=document.querySelector('.story');
const stage=document.querySelector('.stage');
const credit=document.querySelector('.scene-credit');
const phaseLabel=document.querySelector('.scene-state');
const opening=document.querySelector('.opening'),system=document.querySelector('.system'),result=document.querySelector('.result');
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const smooth=(a,b,x)=>{const p=clamp((x-a)/(b-a));return p*p*(3-2*p)};
const lerp=(a,b,t)=>a+(b-a)*t;
let gl,program,uniforms={},textures=[],ready=false,request=0;
function staticFlow(){document.querySelector('.scene-fallback').src='assets/space.png';[opening,system,result].forEach(x=>{x.inert=false;x.removeAttribute('aria-hidden')})}
const vertex=`attribute vec2 aPosition;void main(){gl_Position=vec4(aPosition,0.,1.);}`;
const fragment=`precision highp float;
uniform vec2 uResolution;uniform vec4 uFrame;uniform float uProgress;uniform sampler2D uFinished;uniform sampler2D uRaw;uniform sampler2D uDrawing;
vec2 imageUV(vec2 p){float frameRatio=uFrame.z/uFrame.w;float imageRatio=1.6004;vec2 uv=p;if(frameRatio<imageRatio){uv.x=(uv.x-.5)*frameRatio/imageRatio+.5;}else{float scale=imageRatio/frameRatio;float centre=mix(.5,.37,smoothstep(1.6,2.5,frameRatio));uv.y=(uv.y-.5)*scale+centre;}return uv;}
void main(){vec2 screen=vec2(gl_FragCoord.x,uResolution.y-gl_FragCoord.y);vec2 local=(screen-uFrame.xy)/uFrame.zw;if(min(local.x,local.y)<0.||max(local.x,local.y)>1.){gl_FragColor=vec4(0.);return;}
vec2 uv=imageUV(local);vec4 finish=texture2D(uFinished,uv);vec4 raw=texture2D(uRaw,uv);vec4 drawing=texture2D(uDrawing,uv);
// Only the ceiling uses the construction edit. Door/window/floor pixels remain one source.
float ceiling=1.-smoothstep(.40,.48,uv.y);vec2 aperture=(uv-vec2(.69,.275))/vec2(.275,.148);float voidMask=smoothstep(.83,1.03,dot(aperture,aperture));ceiling*=voidMask;
vec4 structure=mix(finish,raw,ceiling);float grey=dot(structure.rgb,vec3(.2126,.7152,.0722));structure.rgb=mix(vec3(grey),structure.rgb,.48);
float delay=mix(.0,.075,smoothstep(.32,.85,uv.y));float material=smoothstep(.13+delay,.39+delay,uProgress);vec4 colour=mix(drawing,structure,material);
float finished=smoothstep(.53+delay,.80+delay,uProgress);colour=mix(colour,finish,finished);gl_FragColor=vec4(colour.rgb,1.);
}`;
function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(s));return s}
async function imageTexture(src){const img=new Image();img.src=src;await img.decode();const backing=document.createElement('canvas');backing.width=2**Math.ceil(Math.log2(img.width));backing.height=2**Math.ceil(Math.log2(img.height));const ctx=backing.getContext('2d');ctx.imageSmoothingQuality='high';ctx.drawImage(img,0,0,backing.width,backing.height);const t=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,t);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,backing);gl.generateMipmap(gl.TEXTURE_2D);return t}
async function init(){
 if(reduce.matches){staticFlow();document.body.dataset.scene='static';return}
 try{
  if(new URLSearchParams(location.search).get('view')==='static')throw Error('Static concept preview');
  gl=canvas.getContext('webgl',{alpha:true,antialias:false,premultipliedAlpha:false,powerPreference:'low-power'});if(!gl)throw Error('WebGL unavailable');
  program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vertex));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('Shader link failed');gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const position=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  for(const name of ['uResolution','uFrame','uProgress','uFinished','uRaw','uDrawing'])uniforms[name]=gl.getUniformLocation(program,name);
  textures=await Promise.all([imageTexture('assets/space.png'),imageTexture('assets/construction.png').catch(()=>imageTexture('assets/space.png')),imageTexture('assets/drawing.png')]);
  textures.forEach((t,i)=>{gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,t)});gl.uniform1i(uniforms.uFinished,0);gl.uniform1i(uniforms.uRaw,1);gl.uniform1i(uniforms.uDrawing,2);ready=true;document.body.dataset.scene='loading';schedule();
 }catch(error){document.body.classList.add('no-webgl');document.body.dataset.scene='fallback';staticFlow();console.error('Scene fallback:',error.message)}
}
function setCopy(el,opacity,y=0){el.style.opacity=opacity.toFixed(3);el.style.transform=`translateY(${y}px)`;el.style.pointerEvents=opacity>.95?'auto':'none';el.inert=opacity<.1;el.setAttribute('aria-hidden',String(opacity<.1))}
function render(){request=0;if(reduce.matches||document.body.classList.contains('no-webgl'))return;
 const w=stage.clientWidth,h=stage.clientHeight,mobile=w<851,pad=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--pad'))||24;
 const headerHeight=document.querySelector('.header').offsetHeight;document.querySelector('#approach').style.top=`${(story.offsetHeight-h)*.46+headerHeight+24}px`;document.querySelector('#finished').style.top=`${(story.offsetHeight-h)*.90+headerHeight+24}px`;
 const sectionTop=story.getBoundingClientRect().top;const p=clamp(-sectionTop/(story.offsetHeight-h));
 document.querySelector('.stage-bottom').style.visibility=stage.getBoundingClientRect().bottom<h-20?'hidden':'visible';
 const toSystem=smooth(.16,.39,p),toResult=smooth(.57,.79,p);
 let f;
 if(mobile){const top=parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header'))+22;const fh=h<740?h*.32:h*.36;f=[pad,top,w-2*pad,lerp(fh,fh*1.14,toSystem*(1-toResult))];}
 else{const a=[w*.265,Math.max(252,h*.33),w*.68,h*.50],b=[w*.085,Math.max(116,h*.15),w*.83,h*.58],c=[w*.565,Math.max(116,h*.15),w*.395,h*.70];f=a.map((v,i)=>lerp(lerp(v,b[i],toSystem),c[i],toResult));}
 opening.style.top=mobile?`${f[1]+f[3]+68}px`:'';opening.style.bottom=mobile?'auto':'';result.style.top=mobile?`${f[1]+f[3]+68}px`:'';result.style.bottom=mobile?'auto':'';
 credit.style.left=`${f[0]}px`;credit.style.top=`${f[1]+f[3]+12}px`;credit.style.width=`${f[2]}px`;
 const openOpacity=1-smooth(.10,.19,p),sysOpacity=smooth(.34,.40,p)*(1-smooth(.55,.63,p)),resultOpacity=smooth(.78,.84,p);
 setCopy(opening,openOpacity,-20*(1-openOpacity));setCopy(system,sysOpacity,10*(1-sysOpacity));setCopy(result,resultOpacity,12*(1-resultOpacity));
 system.style.left=`${pad}px`;system.style.top=`${mobile?Math.max(f[1]+f[3]+68,h*.60):h*.79}px`;system.style.width=`${w-2*pad}px`;
 phaseLabel.textContent=p<.2?'Ескіз геометрії':p<.68?'Конструкція':'Готовий простір';stage.dataset.progress=p.toFixed(3);stage.dataset.state=p<.2?'drawing':p<.68?'construction':'finished';
 if(ready){const dpr=Math.min(devicePixelRatio||1,2),pw=Math.round(w*dpr),ph=Math.round(h*dpr);if(canvas.width!==pw||canvas.height!==ph){canvas.width=pw;canvas.height=ph;gl.viewport(0,0,pw,ph)}gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(program);gl.uniform2f(uniforms.uResolution,pw,ph);gl.uniform4f(uniforms.uFrame,...f.map(v=>v*dpr));gl.uniform1f(uniforms.uProgress,p);gl.drawArrays(gl.TRIANGLES,0,6);canvas.dataset.rendered='true';document.body.dataset.scene='ready';}
}
function schedule(){if(!request)request=requestAnimationFrame(()=>{render();renderServices()})}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});reduce.addEventListener('change',()=>{if(reduce.matches)staticFlow();else if(!ready)init();schedule()});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();document.body.classList.add('no-webgl');document.body.dataset.scene='fallback';staticFlow()});
document.querySelector('a[href="#approach"]').addEventListener('click',e=>{if(reduce.matches||document.body.classList.contains('no-webgl'))return;e.preventDefault();const y=story.offsetTop+(story.offsetHeight-stage.clientHeight)*.46;scrollTo({top:y,behavior:'smooth'});history.replaceState(null,'','#approach')});
init();schedule();

const services={
 ceilings:{title:'Площини, рівні та складна геометрія.',description:'Підвісні й багаторівневі стелі, декоративні гіпсокартонні конструкції та ніші під освітлення.',note:'Матеріали, вузли й точний обсяг визначаємо за вашим проєктом.',image:'assets/archive-curve.jpg',alt:'Криволінійна гіпсокартонна стеля під час монтажу',link:'Обговорити стелі'},
 partitions:{title:'Нові межі всередині простору.',description:'Гіпсокартонні перегородки та внутрішні конструкції для поділу приміщення.',note:'Розташування, прорізи та вимоги до конструкції погоджуємо до початку робіт.',image:'assets/archive-construction.jpg',alt:'Архівний монтаж внутрішніх гіпсокартонних конструкцій',link:'Обговорити перегородки'},
 finishes:{title:'Підготовка поверхні й фінальний колір.',description:'Шпаклювання та фарбування стін і стель. Чистове оздоблення після монтажу конструкцій.',note:'Стан основи й очікуваний фініш визначають підготовку та склад робіт.',image:'assets/archive-detail.jpg',alt:'Деталь гіпсокартонної поверхні з матеріалів портфоліо',link:'Обговорити оздоблення'}
};
const tabs=[...document.querySelectorAll('[data-service]')];
const panel=document.querySelector('#service-panel');
const serviceScroll=document.querySelector('.service-scroll');
const serviceStage=document.querySelector('.service-stage');
const serviceKeys=['ceilings','partitions','finishes'];
const zoneLabels={ceilings:'стельову конструкцію',partitions:'криволінійну перегородку',finishes:'поверхню стіни та примикання'};
let selected='ceilings';
function select(key,url=false){
 if(!services[key])return;selected=key;const data=services[key];
 tabs.forEach(t=>{const active=t.dataset.service===key;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1});
 panel.dataset.service=key;panel.setAttribute('aria-labelledby',`tab-${key}`);
 document.querySelector('#service-title').textContent=data.title;
 document.querySelector('#service-description').textContent=data.description;
 document.querySelector('#service-note').textContent=data.note;
 document.querySelectorAll('[data-zone]').forEach(path=>path.classList.toggle('is-active',path.dataset.zone===key));
 document.querySelector('#zone-title').textContent=`Фотографічний фрагмент: ${zoneLabels[key]}`;
 document.querySelector('#zone-caption').textContent=`Показано ${zoneLabels[key]}.`;
 document.querySelector('#service-contact').innerHTML=`${data.link}<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12"/></svg>`;
 if(url==='push')history.pushState({service:key},'',`#${key}`);
 else if(url==='replace')history.replaceState({service:key},'',`#${key}`);
 serviceStage.dataset.active=key;
}
function serviceGeometry(){
 const header=document.querySelector('.header').offsetHeight;
 const start=window.scrollY+serviceScroll.getBoundingClientRect().top-header-16;
 const distance=Math.max(1,serviceScroll.offsetHeight-serviceStage.offsetHeight);
 return {start,distance};
}
function jumpService(key,updateURL=true){
 if(!services[key])return;
 select(key,updateURL?'push':false);
 if(reduce.matches){document.querySelector('#scope').scrollIntoView({behavior:'instant'});return}
 const {start,distance}=serviceGeometry();
 const points=[.12,.50,.88];
 scrollTo({top:start+distance*points[serviceKeys.indexOf(key)],behavior:'instant'});
}
function renderServices(){
 if(!serviceScroll)return;
 document.querySelector('.service-list').setAttribute('aria-orientation',innerWidth<851?'horizontal':'vertical');
 if(reduce.matches)return;
 const {start,distance}=serviceGeometry();
 const raw=(scrollY-start)/distance,p=clamp(raw);
 serviceStage.dataset.progress=p.toFixed(3);
 const index=Math.min(2,Math.floor(p*3));
 if(raw>=-.01&&raw<=1.01&&serviceKeys[index]!==selected)select(serviceKeys[index],'replace');
}
 tabs.forEach((tab,i)=>{
  tab.addEventListener('click',()=>jumpService(tab.dataset.service));
  tab.addEventListener('keydown',e=>{
   if(['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(e.key)){
    e.preventDefault();const target=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowDown'||e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    tabs[target].focus({preventScroll:true});jumpService(tabs[target].dataset.service);
   }
  });
 });
function restoreService(){const key=location.hash.slice(1);if(services[key])jumpService(key,false)}
addEventListener('popstate',restoreService);document.fonts.ready.then(restoreService);restoreService();
document.querySelectorAll('a[href="#scope"]').forEach(link=>link.addEventListener('click',()=>select('ceilings',false)));

document.querySelector('#service-contact').addEventListener('click',()=>{document.querySelector('[name=description]').value=services[selected].link.replace('Обговорити','Потрібно виконати:')+'. '});
let draft='';document.querySelector('#brief-form').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);draft=`Об’єкт: ${String(data.get('city')).trim()}\nРоботи: ${String(data.get('description')).trim()}`;document.querySelector('#draft-text').textContent=draft;document.querySelector('#draft').hidden=false});
document.querySelector('#copy-draft').addEventListener('click',async e=>{try{await navigator.clipboard.writeText(draft);e.currentTarget.textContent='Текст скопійовано'}catch{e.currentTarget.textContent='Виділіть і скопіюйте текст нижче'}});

function restoreApproach(){const chapter=location.hash==='#approach'?.46:location.hash==='#finished'?.90:null;if(chapter!==null&&!reduce.matches&&!document.body.classList.contains('no-webgl'))scrollTo({top:story.offsetTop+(story.offsetHeight-stage.clientHeight)*chapter,behavior:'instant'})}
addEventListener('hashchange',()=>{restoreApproach();restoreService()});addEventListener('popstate',restoreApproach);document.fonts.ready.then(restoreApproach);
