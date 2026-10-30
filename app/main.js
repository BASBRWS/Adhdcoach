import * as storage from './core/storage.js';
import {Session} from './core/session.js';
import {uid,remaining,startFocus,pauseFocus,resumeFocus,finishTask,removeTask} from './core/model.js';
import {el,button,field,announce,formatTime} from './core/ui.js';
import {nowView} from './modules/now.js';
import {laterView} from './modules/later.js';
import {supportView} from './modules/support.js';
import {privacyView} from './modules/privacy.js';

const root=document.querySelector('#app');
const ui={route:'now',focusOnly:false,supportDisplay:null,search:'',filter:'Alles',capture:'',lastActivity:Date.now(),status:'saved',error:'',ready:false,hasRecord:false};
const session=new Session(storage,(status,message)=>{ui.status=status;if(message)ui.error=message;else if(status==='saved')ui.error='';paintStatus();});
const routes={now:nowView,later:laterView,support:supportView,privacy:privacyView};
let timerInterval;let installPrompt;
let locking=false;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
function paintStatus() {
  const status=document.querySelector('#save-status');if(status)status.textContent=session.demo?'Voorbeeldstand':ui.status==='saving'?'Bezig met bewaren…':ui.status==='error'?'Nog niet bewaard':'Op dit apparaat bewaard';
  const alert=document.querySelector('#app-error');if(alert){alert.hidden=!ui.error;alert.textContent=ui.error;}
}
function fail(error){ui.error=error?.message??'Dit is niet gelukt. Probeer opnieuw.';paintStatus();announce(ui.error);}
function change(mutator){try{session.change(mutator);render();}catch(e){fail(e);}}
function navigate(route){ui.route=route;ui.focusOnly=false;ui.supportDisplay=null;render(true);}
function render(moveFocus=false) {
  const oldFocus=document.activeElement?.id;root.replaceChildren();
  if(!session.data){renderGate();return;}
  document.body.classList.toggle('focused',ui.focusOnly||!!ui.supportDisplay);
  const ctx={data:session.data,demo:session.demo,focusOnly:ui.focusOnly,supportDisplay:ui.supportDisplay,search:ui.search,filter:ui.filter,actions,quickCapture,onSearch:value=>{const position=document.querySelector('#search')?.selectionStart;ui.search=value;render();const s=document.querySelector('#search');s?.focus();try{s?.setSelectionRange(position,position);}catch{}}};
  const special=ui.focusOnly||!!ui.supportDisplay;
  const header=el('header',{class:'app-header'},el('a',{href:'#main',class:'brand',onclick:e=>{e.preventDefault();navigate('now');}},'adhd coach',el('span',{'aria-hidden':'true',class:'brand-line'})),
    el('p',{id:'save-status',class:'save-status'}),button(session.demo?'Sluit voorbeeldstand':'Vergrendelen',()=>actions.lock(),'text-button lock-button'));
  const main=el('main',{id:'main',class:special?'special-main':'app-main'},el('p',{id:'app-error',class:'error-banner',role:'alert',hidden:true}),routes[ui.route](ctx));
  if(!special){root.append(header);if(session.demo)root.append(el('div',{class:'demo-banner'},el('span',{},'Voorbeeldstand. Je wijzigingen verdwijnen bij sluiten.'),button('Begin met eigen gegevens',()=>actions.lock(),'text-button')));}
  root.append(main);
  if(!special)root.append(el('nav',{class:'main-nav','aria-label':'Hoofdnavigatie'},...[["now","Nu","01"],["later","Later","02"],["support","Steun","03"]].map(([id,label,num])=>button([num,' ',label].join(''),()=>navigate(id),`nav-item ${ui.route===id?'selected':''}`,{'aria-current':ui.route===id?'page':null})),button('Privé',()=>navigate('privacy'),`nav-item privacy-nav ${ui.route==='privacy'?'selected':''}`,{'aria-current':ui.route==='privacy'?'page':null})));
  paintStatus();if(moveFocus)document.querySelector('#page-title')?.focus();else if(oldFocus)document.getElementById(oldFocus)?.focus();tick();
}
function modal(title,build) {
  const d=el('dialog',{class:'modal','aria-labelledby':'dialog-title'});const form=el('form',{});const error=el('p',{class:'form-error',role:'alert',hidden:true});
  const close=()=>d.close();d.append(el('div',{class:'modal-heading'},el('h2',{id:'dialog-title'},title),button('Sluiten',()=>{if(!dirty()||confirm('Je invoer is nog niet bewaard. Sluiten?'))close();},'text-button')),
    form);document.body.append(d);
  const initial=new Map();let dirty=()=>[...form.querySelectorAll('input:not([type=file]),textarea,select')].some(n=>initial.get(n)!==n.value);
  const api={form,close,error,submit(label,callback){const b=el('button',{type:'submit',class:'button'},label);form.append(error,b);form.addEventListener('submit',async event=>{event.preventDefault();b.disabled=true;error.hidden=true;try{await callback();}catch(e){error.textContent=e.message;error.hidden=false;error.focus();}finally{b.disabled=false;}});}};
  build(api);for(const n of form.querySelectorAll('input:not([type=file]),textarea,select'))initial.set(n,n.value);
  d.getDraft=()=>{
    if(!dirty())return '';
    const ids=['task-title','task-steps','note-text','support-text','support-context'];
    const values=ids.map(id=>form.querySelector(`#${id}`)?.value?.trim()).filter(Boolean);
    return values.length?`Onvoltooide invoer\n${values.join('\n')}`:'';
  };
  d.addEventListener('cancel',e=>{if(dirty()&&!confirm('Je invoer is nog niet bewaard. Sluiten?'))e.preventDefault();});
  d.addEventListener('close',()=>d.remove(),{once:true});d.showModal();(form.querySelector('input,textarea,select')??d.querySelector('button'))?.focus();return d;
}
async function persistAndClose(close){await session.queue;if(session.dirty)throw new Error(ui.error||'Bewaren is nog niet gelukt. Je invoer blijft beschikbaar.');close();ui.error='';render();announce(session.demo?'Aangepast in de voorbeeldstand.':'Bewaard op dit apparaat.');}
function input(id,value='',attrs={}){return el('input',{id,value,...attrs});}
function taskEditor(task,initialTitle='') {
  const taskId=task?.id??uid();
  modal(task?'Taak aanpassen':'Eén taak klaarzetten',({form,submit,close})=>{
    const title=input('task-title',task?.title??initialTitle,{required:true,maxlength:160,autocomplete:'off'});
    const steps=el('textarea',{id:'task-steps',rows:4,maxlength:6000},(task?.steps??[]).map(s=>s.text).join('\n'));
    form.append(field('Wat wil je doen',title),field('Maak de start klein, als dat helpt',steps,'Eén handeling per regel. Bijvoorbeeld alleen de map openen. Je mag dit leeg laten.'));
    submit(task?'Bewaar mijn taak':'Zet deze taak klaar',async()=>{
      if(!title.value.trim())throw new Error('Geef je taak een naam.');
      const lines=steps.value.split('\n').map(x=>x.trim()).filter(Boolean);if(lines.length>30||lines.some(x=>x.length>300))throw new Error('Gebruik maximaal 30 stappen van 300 tekens.');
      const used=new Set();const entries=lines.map(line=>{const old=task?.steps.find(s=>s.text===line&&!used.has(s.id));if(old){used.add(old.id);return old;}return{id:uid(),text:line,done:false};});
      session.change(s=>{const t=s.tasks.find(t=>t.id===taskId);if(t){t.title=title.value.trim();t.steps=entries;}else{s.tasks.push({id:taskId,title:title.value.trim(),steps:entries,done:false,created:new Date().toISOString()});if(!s.activeId)s.activeId=taskId;}});
      await persistAndClose(close);
    });
  });
}
function noteEditor(note) {
  const noteId=note?.id??uid();
  modal(note?'Notitie aanpassen':'Los vastleggen',({form,submit,close})=>{
    const text=el('textarea',{id:'note-text',rows:5,required:true,maxlength:2000},note?.text??'');
    const type=el('select',{id:'note-type'},...['','gedachte','prikkel','gevoel','situatie','impuls'].map(v=>el('option',{value:v,selected:note?.type===v},v||'Nog niet indelen')));
    form.append(field('Wat wil je bewaren',text),field('Een soort kiezen is optioneel',type));
    submit('Bewaar mijn woorden',async()=>{if(!text.value.trim())throw new Error('Schrijf een woord of een korte zin.');session.change(s=>{const n=s.notes.find(n=>n.id===noteId);if(n){n.text=text.value.trim();n.type=type.value;}else s.notes.push({id:noteId,text:text.value.trim(),type:type.value,created:new Date().toISOString()});});await persistAndClose(close);});
  });
}
function quickCapture() {
  let pendingId=null,busy=false;
  const text=el('textarea',{id:'quick-note',rows:3,maxlength:2000,placeholder:'Dit wil ik straks onthouden',oninput:e=>ui.capture=e.target.value},ui.capture);
  const f=el('form',{class:'quick-capture'},field('Jouw woorden',text,'Bij vergrendelen bewaren we je losse invoer als notitie.'),el('button',{type:'submit',class:'button secondary'},'Bewaar voor later'));
  f.addEventListener('submit',async e=>{e.preventDefault();if(busy)return;if(!text.value.trim()){text.setCustomValidity('Schrijf eerst een woord of een korte zin.');text.reportValidity();text.setCustomValidity('');return;}busy=true;f.querySelector('button').disabled=true;try{pendingId??=uid();session.change(s=>{const n=s.notes.find(n=>n.id===pendingId);if(n)n.text=text.value.trim();else s.notes.push({id:pendingId,text:text.value.trim(),type:'',created:new Date().toISOString()});});await session.queue;if(session.dirty)throw new Error(ui.error);ui.capture='';render();announce(session.demo?'Notitie toegevoegd in de voorbeeldstand.':'Notitie bewaard. Je taak blijft staan.');document.querySelector('#quick-note')?.focus();}catch(error){fail(error);}finally{busy=false;f.querySelector('button').disabled=false;}});return f;
}
function supportEditor(support) {
  const id=support?.id??uid();
  modal(support?'Afspraak aanpassen':'Mijn eigen afspraak',({form,submit,close})=>{
    const text=el('textarea',{id:'support-text',rows:3,maxlength:500,required:true},support?.text??'');
    const context=input('support-context',support?.context??'',{maxlength:80});
    form.append(field('Welke woorden helpen jou',text,'Deze zin kun je later groot tonen.'),field('Wanneer past dit, optioneel',context));
    submit('Bewaar mijn afspraak',async()=>{if(!text.value.trim())throw new Error('Schrijf eerst je afspraak.');session.change(s=>{const a=s.supports.find(x=>x.id===id);if(a){a.text=text.value.trim();a.context=context.value.trim();}else s.supports.push({id,text:text.value.trim(),context:context.value.trim()});});await persistAndClose(close);});
  });
}
async function downloadBackup() {
  try{const backup=await session.backup();const blob=new Blob([JSON.stringify(backup)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=el('a',{href:url,download:`adhdcoach-reservekopie-${new Date().toISOString().slice(0,10)}.json`});document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);announce('Reservekopie aangemaakt. Bewaar de kopie en je wachtzin op een veilige plek.');}catch(e){fail(e);}
}
function restoreBackup() {
  modal('Reservekopie terugzetten',({form,submit,close})=>{
    const file=input('backup-file','',{type:'file',accept:'.json,application/json',required:true});const pass=input('backup-pass','',{type:'password',autocomplete:'current-password',required:true,maxlength:1000});
    form.append(el('p',{},'Dit vervangt de gegevens in deze browser. Download eerst een kopie als je die wilt bewaren.'),field('Kies je versleutelde reservekopie',file),field('Wachtzin van deze reservekopie',pass));
    submit('Controleer en zet terug',async()=>{if(!file.files[0]||file.files[0].size>8000000)throw new Error('Kies een reservekopie van maximaal 8 MB.');let envelope;try{envelope=JSON.parse(await file.files[0].text());}catch{throw new Error('Dit bestand is geen leesbare reservekopie.');}
      if(session.data&&!confirm('De gegevens in deze browser worden vervangen. Doorgaan?'))return;
      const record=await storage.readRecord();await session.restore(envelope,pass.value,session.data&&!session.demo?session.revision:record?.revision??null);ui.hasRecord=true;ui.error='';ui.capture='';ui.status='saved';close();navigate('now');announce('Reservekopie teruggezet.');});
  });
}
function installHelp() {
  modal('Gebruik op je telefoon',({form})=>{
    form.append(el('p',{},'Android. Open deze website in Chrome en kies App installeren of Toevoegen aan startscherm in het browsermenu.'),el('p',{},'iPhone. Open deze website in Safari. Kies Delen en Zet op beginscherm.'),el('p',{},'Installeren vereist HTTPS of localhost. Deze webapp heeft geen koppeling met een appwinkel en synchroniseert niet automatisch tussen apparaten.'));
    if(installPrompt)form.append(button('Open installatiekeuze',async()=>{await installPrompt.prompt();installPrompt=null;},'button'));
  });
}
const actions={
  route:navigate,taskEditor,noteEditor,supportEditor,exportBackup:downloadBackup,restoreBackup,installHelp,
  filter:value=>{ui.filter=value;render();},
  toggleFocus:()=>{ui.focusOnly=!ui.focusOnly;render(true);},
  displaySupport:text=>{ui.supportDisplay=text;render(true);},
  choose:id=>{change(s=>{s.activeId=id;s.focus=null;});navigate('now');},
  finish:id=>{change(s=>finishTask(s,id));ui.focusOnly=false;render(true);announce('Taak afgerond. Je kunt zelf kiezen wat volgt.');},
  reopen:id=>change(s=>{const t=s.tasks.find(t=>t.id===id);if(t)t.done=false;}),
  toggleStep:(taskId,stepId)=>change(s=>{const step=s.tasks.find(t=>t.id===taskId)?.steps.find(p=>p.id===stepId);if(step)step.done=!step.done;}),
  start:minutes=>change(s=>startFocus(s,minutes)),pause:()=>change(s=>pauseFocus(s)),resume:()=>change(s=>resumeFocus(s)),stopFocus:()=>change(s=>s.focus=null),
  taskFromNote:note=>taskEditor(null,note.text.slice(0,160)),
  removeTask:id=>{if(confirm('Deze taak en de eigen stappen verwijderen?'))change(s=>removeTask(s,id));},
  removeNote:id=>{if(confirm('Deze notitie verwijderen?'))change(s=>s.notes=s.notes.filter(n=>n.id!==id));},
  removeSupport:id=>{if(confirm('Deze eigen afspraak verwijderen?'))change(s=>s.supports=s.supports.filter(x=>x.id!==id));},
  module:(id,on)=>change(s=>{s.preferences.modules[id]=on;if(!on&&(id==='tasks'||id==='focus'))pauseFocus(s);}),
  lockMinutes:n=>change(s=>s.preferences.lockMinutes=n),
  lock:async()=>{
    if(locking||!session.data)return;locking=true;
    try{
      if(!session.demo){
        const drafts=[ui.capture.trim(),...[...document.querySelectorAll('dialog')].map(d=>d.getDraft?.()??'')].filter(Boolean);
        const chunks=drafts.flatMap(text=>{const out=[];for(let i=0;i<text.length;i+=2000)out.push(text.slice(i,i+2000));return out;});
        if(chunks.length)session.change(s=>{for(const text of chunks)if(!s.notes.some(n=>n.text===text))s.notes.push({id:uid(),text,type:'',created:new Date().toISOString()});});
      }
      await session.lock();ui.capture='';ui.focusOnly=false;ui.supportDisplay=null;ui.search='';ui.error='';ui.hasRecord=!!await storage.readRecord();document.querySelectorAll('dialog').forEach(d=>d.close());document.body.classList.remove('focused');render();
    }catch(e){fail(e);}finally{locking=false;}
  },
  wipe:()=>modal('Mijn lokale gegevens wissen',({form,submit,close})=>{const value=input('wipe-confirm','',{required:true,autocomplete:'off'});form.append(el('p',{},'Je verwijdert taken, notities en afspraken uit deze browser. Gedownloade reservekopieën blijven bestaan.'),field('Typ WISSEN om dit te doen',value));submit('Wis deze lokale opslag',async()=>{if(value.value!=='WISSEN')throw new Error('Typ WISSEN om door te gaan.');await session.queue;if(session.dirty)throw new Error('Maak eerst een reservekopie van de nog niet bewaarde inhoud.');await storage.deleteRecord(session.revision);await session.lock();ui.hasRecord=false;ui.capture='';ui.error='';close();render();});})
};
function renderGate() {
  document.body.classList.remove('focused');
  const main=el('main',{id:'main',class:'gate'},el('div',{class:'gate-brand brand'},'adhd coach',el('span',{class:'brand-line','aria-hidden':'true'})),
    el('p',{class:'eyebrow'},'TAKEN. GEDACHTEN. ÉÉN VOLGENDE STAP.'),el('h1',{},ui.hasRecord?'Open je eigen plek.':'Begin bij één ding.'),
    el('p',{class:'gate-intro'},ui.hasRecord?'Je gegevens staan versleuteld in deze browser. Open ze met jouw wachtzin.':'Kies wat je nu wilt doen. Bewaar wat ertussendoor komt. Je eigen taken en notities blijven versleuteld in deze browser.'),
    el('p',{class:'error-banner',role:'alert',hidden:!ui.error},ui.error));
  if(!ui.ready){main.append(el('p',{role:'status'},'Lokale opslag controleren…'));root.append(main);return;}
  if(!globalThis.crypto?.subtle)main.append(el('p',{class:'error-banner'},'Eigen opslag vereist een veilige HTTPS verbinding of localhost. De voorbeeldstand kun je wel bekijken.'));
  const form=el('form',{class:'gate-form'});const pass=input('gate-pass','',{type:'password',autocomplete:ui.hasRecord?'current-password':'new-password',required:true,maxlength:1000,minlength:ui.hasRecord?1:12});
  form.append(field(ui.hasRecord?'Jouw wachtzin':'Maak een wachtzin van minstens 12 tekens',pass));
  let again;if(!ui.hasRecord){again=input('gate-pass-again','',{type:'password',autocomplete:'new-password',required:true,minlength:12,maxlength:1000});form.append(field('Herhaal je wachtzin',again),el('p',{class:'field-help'},'Kies een zin die je kunt onthouden of bewaar hem in je wachtwoordmanager. Zonder wachtzin kunnen we je inhoud niet herstellen.'));}
  const error=el('p',{class:'form-error',role:'alert',hidden:true});const submit=el('button',{type:'submit',class:'button',disabled:!globalThis.crypto?.subtle},ui.hasRecord?'Open mijn gegevens':'Maak mijn eigen plek');form.append(error,submit);
  form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;error.hidden=true;try{if(again&&pass.value!==again.value)throw new Error('De wachtzinnen zijn niet gelijk.');if(ui.hasRecord)await session.unlock(pass.value);else await session.create(pass.value);pass.value='';if(again)again.value='';ui.status='saved';ui.error='';ui.hasRecord=true;ui.lastActivity=Date.now();navigate('now');}catch(err){error.textContent=err.message;error.hidden=false;}finally{submit.disabled=false;}});
  main.append(form,el('div',{class:'gate-options'},button('Eerst bekijken met voorbeelden',()=>{session.startDemo();ui.error='';ui.status='demo';ui.lastActivity=Date.now();navigate('now');},'button secondary'),button('Een reservekopie terugzetten',restoreBackup,'text-button')),
    el('p',{class:'gate-foot'},'Geen account. Geen advertentiemetingen. Geen externe AI. Voorbeeldgegevens worden niet bewaard.'));
  root.append(main);
}
function tick() {
  if(!session.data)return;
  const f=session.data.focus;
  document.querySelectorAll('[data-timer]').forEach(n=>n.textContent=formatTime(remaining(f)));
  document.querySelectorAll('[data-timer-progress]').forEach(n=>n.style.width=`${f?100*remaining(f)/f.totalMs:100}%`);
  if(f?.status==='running'&&remaining(f)===0){session.change(s=>Object.assign(s.focus,{status:'finished',remainingMs:0,deadline:null}));render();announce('Je focusblok is afgelopen.');}
  if(!session.demo&&Date.now()-ui.lastActivity>session.data.preferences.lockMinutes*60000){ui.lastActivity=Date.now();actions.lock();}
}
for(const name of ['pointerdown','keydown','input'])document.addEventListener(name,()=>ui.lastActivity=Date.now(),{passive:true});
window.addEventListener('beforeunload',e=>{if(session.dirty||ui.capture.trim()){e.preventDefault();e.returnValue='';}});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')tick();});
async function boot(){render();try{ui.hasRecord=!!await storage.readRecord();}catch(e){ui.error=e.message;}ui.ready=true;render();timerInterval=setInterval(tick,1000);
  if('serviceWorker'in navigator&&location.protocol!=='file:')navigator.serviceWorker.register('./sw.js').catch(()=>{announce('Offline gebruik is in deze browser niet beschikbaar.');});}
boot();
