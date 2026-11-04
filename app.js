const story=document.querySelector('.story');
const stage=document.querySelector('.stage');
const heading=document.querySelector('.heading');
const track=document.querySelector('.visual-track');
const visual=document.querySelector('.visual-stage');
const layers={drawing:document.querySelector('.drawing'),structure:document.querySelector('.structure'),finished:document.querySelector('.finished')};
const copies=[...document.querySelectorAll('[data-copy]')];
const reduce=matchMedia('(prefers-reduced-motion: reduce)');
const desktop=matchMedia('(min-width:981px)');
const short=matchMedia('(max-height:640px)');
const clamp=x=>Math.max(0,Math.min(1,x));
const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
const lerp=(a,b,t)=>a+(b-a)*t;
let frame=0;
let metrics={};
function isStatic(){return reduce.matches||short.matches||(new URLSearchParams(location.search).get('motion')==='off'||new URLSearchParams(location.search).get('view')==='static')}
function geometry(){
 const header=document.querySelector('.header').offsetHeight;
 if(desktop.matches)return {start:scrollY+story.getBoundingClientRect().top,distance:Math.max(1,story.offsetHeight-stage.offsetHeight)};
 return {start:scrollY+track.getBoundingClientRect().top-header-24,distance:Math.max(1,track.offsetHeight-visual.offsetHeight)};
}
function copyMotion(p,immediate=false){
 const opacity=immediate?[1,0,0]:[1-smooth(.16,.25,p),smooth(.27,.35,p)*(1-smooth(.63,.72,p)),smooth(.74,.82,p)];
 copies.forEach((copy,i)=>{
  const value=opacity[i];
  const distance=i===0?-20*(1-value):i===1?(p<.5?22:-22)*(1-value):22*(1-value);
  copy.style.opacity=value.toFixed(3);
  copy.style.visibility=value>.015?'visible':'hidden';
  copy.style.transform=immediate?'none':`translateY(${distance.toFixed(1)}px)`;
  copy.inert=value<.55;
  copy.setAttribute('aria-hidden',String(value<.55));
 });
}
function paint(p){
 const construction=smooth(.16,.37,p),finished=smooth(.61,.83,p);
 layers.drawing.style.opacity=1;
 layers.structure.style.opacity=construction*(1-finished);
 layers.finished.style.opacity=finished;
 copyMotion(p,isStatic());
 if(desktop.matches&&!isStatic()){
  const expand=smooth(.06,.40,p),settle=smooth(.58,.92,p),release=smooth(.05,.36,p);
  heading.style.transform=`translateY(${-metrics.h*.25*release}px)`;
  heading.style.opacity=(1-smooth(.12,.36,p)).toFixed(3);
  stage.style.setProperty('--frame-left',`${lerp(lerp(34,30,expand),43,settle)}%`);
  stage.style.setProperty('--frame-top',`${lerp(metrics.openY,metrics.buildY,expand)}px`);
  stage.style.setProperty('--frame-height',`${lerp(lerp(metrics.openH,metrics.buildH,expand),metrics.resultH,settle)}px`);
  stage.style.setProperty('--copy-top',`${lerp(metrics.copyY,metrics.header+metrics.h*.39,expand)+settle*16}px`);
 }else{heading.style.transform='none';heading.style.opacity=1;}
 story.dataset.phase=p<.27?'drawing':p<.73?'construction':'finished';
 story.dataset.progress=p.toFixed(3);
}
function render(){frame=0;document.body.classList.toggle('is-scrolled',scrollY>12);
 if(isStatic()){paint(1);return}
 const g=geometry();paint(clamp((scrollY-g.start)/g.distance));
}
function schedule(){if(!frame)frame=requestAnimationFrame(render)}
function measure(){
 const h=stage.offsetHeight,header=document.querySelector('.header').offsetHeight;
 const titleBottom=(parseFloat(getComputedStyle(heading).top)||0)+heading.offsetHeight;
 const openY=Math.max(h*.48,titleBottom+Math.min(82,h*.085));
 const openH=Math.min(h*.44,h-openY-60);
 const buildY=header+Math.max(44,h*.055);
 metrics={h,header,openY,openH:Math.max(180,openH),buildY,buildH:Math.min(h*.66,h-buildY-82),resultH:Math.min(h*.66,h-buildY-82),copyY:openY+openH*.30};
}
function sync(){
 document.body.classList.toggle('static-mode',isStatic());
 track.style.setProperty('--visual-height',`${visual.offsetHeight}px`);
 measure();schedule();
}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',sync,{passive:true});
reduce.addEventListener('change',sync);desktop.addEventListener('change',sync);short.addEventListener('change',sync);
new ResizeObserver(()=>{track.style.setProperty('--visual-height',`${visual.offsetHeight}px`);schedule()}).observe(visual);
document.body.classList.add('enhanced');sync();document.fonts.ready.then(sync);
const dialog=document.querySelector('#mobile-menu');
const toggle=document.querySelector('.menu-toggle');
function closeMenu(){dialog.close()}
toggle.addEventListener('click',()=>{dialog.showModal();document.body.classList.add('menu-open');toggle.setAttribute('aria-expanded','true')});
dialog.querySelector('.menu-close').addEventListener('click',closeMenu);
dialog.addEventListener('close',()=>{document.body.classList.remove('menu-open');toggle.setAttribute('aria-expanded','false');toggle.focus({preventScroll:true})});
dialog.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
desktop.addEventListener('change',()=>{if(desktop.matches&&dialog.open)closeMenu()});


const layout=document.documentElement.dataset.serviceVariant;
const data={
 ceilings:{title:'Стелі.',description:'Підвісні й багаторівневі стелі, декоративні гіпсокартонні конструкції та ніші під освітлення.',image:'стельова конструкція',scope:['Каркасні підвісні та багаторівневі стелі','Криволінійні площини й переходи рівнів','Декоративні конструкції та ніші'],steps:['Звірити геометрію, рівні та примикання','Узгодити розміщення інженерії й доступів','Зібрати каркас і виконати обшивку','Погодити наступний етап оздоблення'],questions:['План стель і висотні відмітки','Розрізи, радіуси та конструктивні вузли','Межа монтажу й чистового оздоблення']},
 partitions:{title:'Перегородки.',description:'Гіпсокартонні перегородки та обшивки для поділу приміщень. Розташування, прорізи й точний обсяг визначаємо за вашим проєктом.',image:'перегородка',scope:['Внутрішні каркасні перегородки','Обшивки та конструкції навколо елементів приміщення','Прорізи й примикання за проєктом'],steps:['Звірити план і розташування прорізів','Узгодити примикання й суміжні роботи','Зібрати каркас та виконати обшивку','Підготувати поверхню до погодженого наступного етапу'],questions:['Призначення та геометрія приміщень','Вимоги до конструкції й закладних елементів','Склад обшивки, прорізи та комунікації']},
 finishes:{title:'Оздоблення.',description:'Шпаклювання та фарбування стін і стель після монтажу конструкцій. Підготовку й очікуваний фініш погоджуємо за вашим проєктом.',image:'поверхня стіни',scope:['Підготовка стін і стель до оздоблення','Шпаклювання поверхонь','Фарбування погоджених ділянок'],steps:['Оглянути стан основи','Визначити потрібну підготовку й фініш','Підготувати та оздобити погоджені поверхні','Звірити виконаний обсяг'],questions:['Стан основи та попередній етап робіт','Очікуваний вигляд і колір поверхні','Межі ділянок і суміжні матеріали']}
};
const serviceTabs=[...document.querySelectorAll('[data-service]')];
const servicePanel=document.querySelector('#services-panel');
const serviceDetails=document.querySelector('#service-details');
const detailToggle=document.querySelector('.service-detail-toggle');
let currentService='ceilings';
function setList(id,items){document.querySelector(id).replaceChildren(...items.map(text=>{const li=document.createElement('li');li.textContent=text;return li}))}
function selectService(key,reason="init"){
 if(!data[key])return;
 if(reason!=="init")engageGallery(key,reason);
 const previous=servicePanel.dataset.selected;if(previous===key)return;
 currentService=key;const item=data[key];servicePanel.dataset.selected=key;
 serviceTabs.forEach(tab=>{const active=tab.dataset.service===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
 servicePanel.setAttribute('aria-labelledby',`${layout}-${key}`);
 document.querySelector('#service-title').textContent=item.title;
 document.querySelector('#service-description').textContent=item.description;
 document.querySelector('#detail-title').textContent=item.title;
 setList('#detail-scope',item.scope);setList('#detail-steps',item.steps);setList('#detail-questions',item.questions);setList('#gallery-scope-right',item.scope);
 document.querySelectorAll('.service-map title').forEach(el=>el.textContent=`Ілюстрація: ${item.image} на кресленні приміщення.`);
 document.querySelectorAll('[data-surface]').forEach(surface=>surface.classList.toggle('is-active',surface.dataset.surface===key));
 document.querySelector('.services').dataset.selected=key;
 document.dispatchEvent(new Event('wwm:service-change'));
 if(previous&&!reduce.matches)servicePanel.animate([{opacity:.72,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
}
function wireTabs(items,select,keyName,preview=true){items.forEach((button,index)=>{
 button.addEventListener('click',()=>select(button.dataset[keyName],'click'));
 button.addEventListener('pointerenter',()=>{if(preview&&matchMedia('(hover:hover) and (pointer:fine)').matches)select(button.dataset[keyName],'hover')});
 button.addEventListener('focus',()=>select(button.dataset[keyName],'focus'));
 button.addEventListener('keydown',event=>{
  if(!['ArrowDown','ArrowRight','ArrowUp','ArrowLeft','Home','End'].includes(event.key))return;
  event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?items.length-1:(index+(['ArrowDown','ArrowRight'].includes(event.key)?1:-1)+items.length)%items.length;
  items[next].focus({preventScroll:true});
 });
})}
const galleryBody=document.querySelector('.services-body');
let galleryPinned=false;
function engageGallery(key,reason){
 galleryBody.classList.add('has-selection');
 galleryBody.dataset.focused=key;
 const index=['ceilings','partitions','finishes'].indexOf(key);
 galleryBody.style.setProperty('--info-offset',index===1?'96px':'50px');
 if(reason==='click')galleryPinned=true;
 if(innerWidth<=620&&(reason==='focus'||reason==='click')){
  const card=document.querySelector('#gallery-'+key),rail=card.parentElement;
  requestAnimationFrame(()=>{
   const delta=card.getBoundingClientRect().left-rail.getBoundingClientRect().left;
   rail.scrollTo({left:rail.scrollLeft+delta,behavior:reduce.matches?'instant':'smooth'});
  });
 }
 servicePanel.inert=false;servicePanel.setAttribute('aria-hidden','false');
}
function releaseGallery(){
 galleryPinned=false;galleryBody.classList.remove('has-selection');
 servicePanel.inert=true;servicePanel.setAttribute('aria-hidden','true');
}
galleryBody.addEventListener('pointerleave',()=>{if(!galleryPinned&&!galleryBody.contains(document.activeElement))releaseGallery()});
galleryBody.addEventListener('focusout',()=>queueMicrotask(()=>{if(!galleryPinned&&!galleryBody.contains(document.activeElement)&&!galleryBody.matches(':hover'))releaseGallery()}));
galleryBody.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();releaseGallery()}});
wireTabs(serviceTabs,selectService,'service');
document.querySelectorAll('[data-hit]').forEach(hit=>{
 hit.addEventListener('pointerenter',()=>{if(matchMedia('(hover:hover) and (pointer:fine)').matches)selectService(hit.dataset.hit,'hover')});
 hit.addEventListener('click',()=>selectService(hit.dataset.hit,'click'));
});
detailToggle.addEventListener('click',()=>{
 const open=detailToggle.getAttribute('aria-expanded')!=='true';
 detailToggle.setAttribute('aria-expanded',String(open));serviceDetails.hidden=!open;
});
document.querySelector('.service-enquiry').addEventListener('click',()=>document.querySelector('[name=service]').value=currentService);
function servicesOrientation(){document.querySelectorAll('.service-tabs').forEach(group=>group.setAttribute('aria-orientation',layout==='studio'&&innerWidth>620?'vertical':'horizontal'))}
addEventListener('resize',servicesOrientation,{passive:true});servicesOrientation();selectService(currentService);
function selectServiceAnchor(){const key=location.hash.slice(1);if(data[key])selectService(key,'click')}
addEventListener('hashchange',selectServiceAnchor);selectServiceAnchor();

// The selected surface appears as this chapter takes over from the finished room.
const servicesSection=document.querySelector('.services');
let chapterFrame=0;
function chapterMotion(){
 const top=servicesSection.getBoundingClientRect().top;
 const entry=reduce.matches?1:smooth(0,1,(innerHeight*.9-top)/(innerHeight*.55));
 servicesSection.style.setProperty('--surface-reveal',entry.toFixed(3));
 const mark=document.querySelector('.header').offsetHeight+innerHeight*.25;
 let active='';for(const id of ['services','experience','about','cooperation','contact']){if(document.getElementById(id).getBoundingClientRect().top<=mark)active=id;}
 document.querySelectorAll('.header a[href^="#"],.footer-nav a[href^="#"]').forEach(a=>{if(a.getAttribute('href')==='#'+active)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current')});
}
function scheduleChapter(){if(!chapterFrame)chapterFrame=requestAnimationFrame(()=>{chapterFrame=0;chapterMotion()})}
addEventListener('scroll',scheduleChapter,{passive:true});addEventListener('resize',scheduleChapter,{passive:true});reduce.addEventListener('change',scheduleChapter);chapterMotion();

const workData={
 project:{title:'Почнемо з вашої задачі.',description:'Місце об’єкта, креслення й перелік потрібних робіт допомагають визначити, яку частину проєкту ви доручаєте WWM.',items:['Де розташований об’єкт','Що потрібно виконати','Які матеріали проєкту вже є']},
 scope:{title:'Визначаємо межі відповідальності.',description:'Розглядаємо склад робіт, конструктивні вузли та суміжні задачі. Погоджений обсяг стає основою подальшої роботи.',items:['Які конструкції й поверхні входять в обсяг','Де починаються та закінчуються суміжні роботи','Що має бути визначено до початку виконання']},
 order:{title:'Узгоджуємо послідовність.',description:'Черговість залежить від проєкту, стану об’єкта та інших виконавців. Важливо розуміти, який результат потрібен на кожному етапі.',items:['Готовність об’єкта до нашого етапу','Взаємодія із суміжними виконавцями','Стан, у якому передаємо погоджений обсяг']}
};
const workTabs=[...document.querySelectorAll('[data-work]')];
let selectedWork='project';
function selectWork(key){
 if(!workData[key])return;const panel=document.querySelector('#work-panel');if(panel.dataset.selected===key)return;
 const previous=panel.dataset.selected;selectedWork=key;panel.dataset.selected=key;panel.setAttribute('aria-labelledby','work-'+key);
 workTabs.forEach(tab=>{const active=tab.dataset.work===key;tab.setAttribute('aria-selected',String(active));tab.tabIndex=active?0:-1});
 const item=workData[key];document.querySelector('#work-title').textContent=item.title;document.querySelector('#work-description').textContent=item.description;setList('#work-items',item.items);
 document.dispatchEvent(new Event('wwm:work-change'));
 if(previous&&!reduce.matches)panel.animate([{opacity:.72,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:220,easing:'ease-out'});
}
wireTabs(workTabs,selectWork,'work',false);selectWork(selectedWork);

const archiveDialog=document.querySelector('#archive-viewer');
let archiveTrigger;
document.querySelectorAll('[data-archive]').forEach(button=>button.addEventListener('click',()=>{
 archiveTrigger=button;document.querySelector('#archive-full').src=button.dataset.archive;document.querySelector('#archive-full-caption').textContent=button.dataset.caption;archiveDialog.showModal();document.body.classList.add('menu-open');
}));
document.querySelector('.archive-close').addEventListener('click',()=>archiveDialog.close());
archiveDialog.addEventListener('close',()=>{document.body.classList.remove('menu-open');archiveTrigger?.focus({preventScroll:true})});

let draftText='';
document.querySelector('#brief-form').addEventListener('submit',event=>{
 event.preventDefault();const form=new FormData(event.currentTarget);const key=String(form.get('service'));
 const direction=key==='several'?'Кілька напрямів':data[key].title.replace(/\.$/,'');
 draftText=`Об’єкт: ${String(form.get('city')).trim()}\nНапрям: ${direction}\nРоботи: ${String(form.get('description')).trim()}`;
 document.querySelector('#draft-text').textContent=draftText;document.querySelector('#draft').hidden=false;document.querySelector('#draft').focus({preventScroll:true});
});
document.querySelector('#copy-draft').addEventListener('click',async event=>{
 try{await navigator.clipboard.writeText(draftText);event.currentTarget.textContent='Текст скопійовано'}catch{event.currentTarget.textContent='Виділіть і скопіюйте текст вище'}
});

// The opening changes its layout during initialisation. Restore an explicit deep link once that layout is ready.
const initialPageHash=location.hash;
let earlyInteraction=false;
for(const event of ['pointerdown','wheel','touchstart','keydown'])addEventListener(event,()=>{earlyInteraction=true},{once:true,passive:true});
const pageLoaded=document.readyState==='complete'?Promise.resolve():new Promise(resolve=>addEventListener('load',resolve,{once:true}));
Promise.all([document.fonts.ready,pageLoaded]).then(()=>requestAnimationFrame(()=>{
 if(!initialPageHash||location.hash!==initialPageHash||earlyInteraction)return;
 const target=document.getElementById(initialPageHash.slice(1));
 if(target)target.scrollIntoView({block:'start',behavior:'instant'});
 scheduleChapter();
}));


const evidenceItems={
 study:{src:'assets/archive-study.webp',alt:'Ілюстративна реконструкція криволінійної конструкції за архівом',kind:'Ілюстрація за архівом',title:'Роздивитися внутрішню будову.',description:'Реконструкція допомагає побачити зв’язок каркаса й криволінійної площини. Документальні кадри — у добірці поруч.',subject:'Каркас і площина',source:'Ілюстрація за матеріалами досвіду керівника',caption:'Візуальна реконструкція за архівним фото.',position:'50% 44%',fit:'cover'},
 frame:{src:'assets/archive-construction.jpg',alt:'Архівне фото відкритого каркаса та криволінійних стельових площин',kind:'Архівне фото',title:'Каркас до завершення обшивки.',description:'Відкриті ділянки показують внутрішню будову стелі. У цьому кадрі поруч видно каркас, обшивку та інженерні комунікації.',subject:'Відкритий каркас і обшивка',source:'Досвід керівника, Ізраїль, 2014–2019',caption:'Незмінений архівний кадр. Досвід керівника до заснування WWM.',position:'50% 50%',fit:'contain'},
 curve:{src:'assets/archive-curve.jpg',alt:'Архівне фото криволінійних напрямних на стельовій конструкції',kind:'Архівне фото',title:'Контур читається ще під час монтажу.',description:'На поверхні видно криволінійні напрямні та їхнє взаємне розташування. Окремий кадр із матеріалів досвіду керівника.',subject:'Криволінійні напрямні',source:'Досвід керівника, Ізраїль, 2014–2019',caption:'Окремий архівний кадр криволінійної конструкції. Досвід керівника до WWM.',position:'50% 50%',fit:'contain'},
 plane:{src:'assets/archive-detail.jpg',alt:'Архівне фото об’ємної стельової конструкції з круглим прорізом',kind:'Архівне фото',title:'Обшивка вже задає об’єм.',description:'Круглий проріз, криволінійний борт і перехід площин видно до чистового оздоблення. Архівний ракурс пояснює характер виконуваних конструкцій.',subject:'Проріз і криволінійна площина',source:'Досвід керівника, Ізраїль, 2014–2019',caption:'Незмінений архівний кадр об’ємної конструкції. Досвід керівника до WWM.',position:'50% 50%',fit:'contain'}
};
const evidenceTabs=[...document.querySelectorAll('[data-evidence]')];
let evidenceActive='study',evidenceAnimation;
function selectEvidence(key,reason='init'){
 const item=evidenceItems[key];if(!item)return;
 evidenceActive=key;
 evidenceTabs.forEach(t=>{const active=t.dataset.evidence===key;t.setAttribute('aria-selected',String(active));t.tabIndex=active?0:-1});
 const img=document.querySelector('#evidence-image');img.src=item.src;img.alt=item.alt;img.style.objectFit=item.fit;img.style.objectPosition=item.position;
 for(const [id,value] of Object.entries({'evidence-kind':item.kind,'evidence-title':item.title,'evidence-description':item.description,'evidence-subject':item.subject,'evidence-source':item.source,'evidence-caption':item.caption}))document.getElementById(id).textContent=value;
 const panel=document.querySelector('#evidence-panel');panel.setAttribute('aria-labelledby','evidence-'+key);
 const open=document.querySelector('#evidence-open');open.dataset.archive=item.src;open.dataset.caption=item.caption;
 if(reason!=='init'&&!reduce.matches){evidenceAnimation?.cancel();evidenceAnimation=img.animate([{opacity:.55},{opacity:1}],{duration:260,easing:'ease-out'})}
 const tab=document.querySelector('#evidence-'+key),rail=tab.parentElement;
 if(innerWidth<=480&&reason!=='init')requestAnimationFrame(()=>{rail.scrollTo({left:rail.scrollLeft+tab.getBoundingClientRect().left-rail.getBoundingClientRect().left,behavior:reduce.matches?'instant':'smooth'})});
}
// Preview is an explicit choice; reading a caption does not trigger another scene.
evidenceTabs.forEach((t,index)=>{
 t.addEventListener('click',()=>selectEvidence(t.dataset.evidence,'click'));
 t.addEventListener('keydown',e=>{
  if(!['ArrowRight','ArrowLeft','Home','End'].includes(e.key))return;e.preventDefault();
  const next=e.key==='Home'?0:e.key==='End'?evidenceTabs.length-1:(index+(e.key==='ArrowRight'?1:-1)+evidenceTabs.length)%evidenceTabs.length;
  evidenceTabs[next].focus({preventScroll:true});selectEvidence(evidenceTabs[next].dataset.evidence,'keyboard');
 });
});selectEvidence(evidenceActive);
const processLayout=document.querySelector('.process-layout');
const scopeButtons=[...document.querySelectorAll('button[data-direction]')];
let processDirection=currentService;
const diagramCopy={project:'Спочатку бачимо проєкт цілком.',scope:'Виділяємо саме ту частину, за яку відповідає WWM.',order:'Готовність об’єкта, наш етап, передача погодженого обсягу.'};
const scopeNames={ceilings:'Для стель знадобляться',partitions:'Для перегородок знадобляться',finishes:'Для оздоблення знадобляться'};
function paintProcess(){
 processLayout.dataset.process=selectedWork;processLayout.dataset.direction=processDirection;
 document.querySelector('#diagram-caption').textContent=diagramCopy[selectedWork];
 document.querySelector('#scope-label').textContent=scopeNames[processDirection];
 setList('#scope-questions',data[processDirection].questions);
 scopeButtons.forEach(t=>t.setAttribute('aria-pressed',String(t.dataset.direction===processDirection)));
}
scopeButtons.forEach(t=>t.addEventListener('click',()=>{processDirection=t.dataset.direction;paintProcess()}));
document.addEventListener('wwm:work-change',paintProcess);
document.addEventListener('wwm:service-change',()=>{processDirection=currentService;paintProcess()});
document.querySelector('#process-enquiry').addEventListener('click',()=>{document.querySelector('[name=service]').value=processDirection});
paintProcess();
