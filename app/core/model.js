export const VERSION = 1;
export const MODULES = Object.freeze([
  {id:'tasks',name:'Taakstart',description:'Eén taak en een kleine eerste handeling.'},
  {id:'focus',name:'Focusblok',description:'Een zelfgekozen tijd, met pauze en hervatten.'},
  {id:'notes',name:'Snel vastleggen',description:'Bewaar een gedachte zonder je taak te verlaten.'},
  {id:'support',name:'Eigen steun',description:'Persoonlijke afspraken en een pauzemoment.'}
]);
export function emptyState() {
  return {version:VERSION,tasks:[],notes:[],supports:[],activeId:null,focus:null,
    preferences:{modules:{tasks:true,focus:true,notes:true,support:true},lockMinutes:15}};
}
const text=(v,max)=>{if(typeof v!=='string')return '';if(v.length>max)throw new Error('Een tekst in het bestand is langer dan toegestaan.');return v;};
export function validateState(input) {
  if(!input || input.version!==VERSION || !Array.isArray(input.tasks)||!Array.isArray(input.notes)||!Array.isArray(input.supports))throw new Error('Dit gegevensformaat wordt niet ondersteund.');
  if(input.tasks.length>500||input.notes.length>1000||input.supports.length>100)throw new Error('Dit bestand bevat te veel onderdelen.');
  const state=emptyState(); const used=new Set();
  function id(value){if(typeof value!=='string'||!value||value.length>100||used.has(value))throw new Error('Het bestand bevat ongeldige of dubbele nummers.');used.add(value);return value;}
  state.tasks=input.tasks.map(t=>{
    if(!t||!text(t.title,160).trim()||!Array.isArray(t.steps)||t.steps.length>30)throw new Error('Een taak is niet geldig.');
    return {id:id(t.id),title:text(t.title,160),steps:t.steps.map(s=>{if(!s||!text(s.text,300).trim())throw new Error('Een stap is niet geldig.');return {id:id(s.id),text:text(s.text,300),done:s.done===true};}),done:t.done===true,created:text(t.created,40)};
  });
  state.notes=input.notes.map(n=>{if(!n||!text(n.text,2000).trim())throw new Error('Een notitie is niet geldig.');return {id:id(n.id),text:text(n.text,2000),type:['gedachte','prikkel','gevoel','situatie','impuls'].includes(n.type)?n.type:'',created:text(n.created,40)};});
  state.supports=input.supports.map(s=>{if(!s||!text(s.text,500).trim())throw new Error('Een afspraak is niet geldig.');return {id:id(s.id),text:text(s.text,500),context:text(s.context,80)};});
  state.activeId=state.tasks.some(t=>t.id===input.activeId&&!t.done)?input.activeId:null;
  const f=input.focus;
  if(f&&state.activeId===f.taskId&&Number.isFinite(f.totalMs)&&f.totalMs>=60000&&f.totalMs<=3600000&&['running','paused','finished'].includes(f.status)) {
    if(!Number.isFinite(f.remainingMs)||f.remainingMs<0||f.remainingMs>f.totalMs||(f.status==='running'&&!Number.isFinite(f.deadline)))throw new Error('Het focusblok is niet geldig.');
    state.focus={taskId:f.taskId,totalMs:f.totalMs,remainingMs:f.remainingMs,status:f.status,deadline:f.status==='running'?f.deadline:null};
  }
  for(const m of MODULES)state.preferences.modules[m.id]=input.preferences?.modules?.[m.id]!==false;
  state.preferences.lockMinutes=[5,15,30].includes(input.preferences?.lockMinutes)?input.preferences.lockMinutes:15;
  return state;
}
export function uid() {
  if(globalThis.crypto.randomUUID)return globalThis.crypto.randomUUID();
  // getRandomValues also works in the HTTP-only demo preview; vaults still require HTTPS.
  const bytes=globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6]=(bytes[6]&15)|64;bytes[8]=(bytes[8]&63)|128;
  const h=[...bytes].map(b=>b.toString(16).padStart(2,'0')).join('');
  return `${h.slice(0,8)}-${h.slice(8,12)}-${h.slice(12,16)}-${h.slice(16,20)}-${h.slice(20)}`;
}
export const remaining=(focus,now=Date.now())=>!focus?0:focus.status==='running'?Math.min(focus.totalMs,Math.max(0,focus.deadline-now)):focus.remainingMs;
export function startFocus(state,minutes,now=Date.now()) {
  if(!state.tasks.some(t=>t.id===state.activeId&&!t.done))throw new Error('Kies eerst een taak voor nu.');
  const totalMs=Number(minutes)*60000;
  if(!Number.isFinite(totalMs)||totalMs<60000||totalMs>3600000)throw new Error('Kies tussen 1 en 60 minuten.');
  state.focus={taskId:state.activeId,totalMs,remainingMs:totalMs,status:'running',deadline:now+totalMs};
}
export function pauseFocus(state,now=Date.now()) {
  if(state.focus?.status!=='running')return;
  const ms=remaining(state.focus,now);Object.assign(state.focus,{remainingMs:ms,status:ms?'paused':'finished',deadline:null});
}
export function resumeFocus(state,now=Date.now()) {
  if(state.focus?.status!=='paused'||state.focus.remainingMs<=0)return;
  Object.assign(state.focus,{deadline:now+state.focus.remainingMs,status:'running'});
}
export function finishTask(state,id) {
  const t=state.tasks.find(t=>t.id===id);if(!t)return;t.done=true;
  if(state.activeId===id)state.activeId=null;if(state.focus?.taskId===id)state.focus=null;
}
export function removeTask(state,id) {
  state.tasks=state.tasks.filter(t=>t.id!==id);if(state.activeId===id)state.activeId=null;if(state.focus?.taskId===id)state.focus=null;
}
export function demoState() {
  const s=emptyState();s.tasks=[{id:'demo-task',title:'Mijn administratie bijwerken',steps:[{id:'demo-step-1',text:'Open de map met bonnetjes',done:false},{id:'demo-step-2',text:'Leg één bon klaar',done:false}],done:false,created:new Date().toISOString()},
    {id:'demo-task-2',title:'Een afspraak plannen',steps:[],done:false,created:new Date().toISOString()}];
  s.activeId='demo-task';s.notes=[{id:'demo-note',text:'Ik wil straks nog iets opzoeken. Eerst mijn bon klaarleggen.',type:'gedachte',created:new Date().toISOString()}];
  s.supports=[{id:'demo-support-1',text:'Stel me één vraag tegelijk.',context:'Gesprekken'},{id:'demo-support-2',text:'Ik kom hier straks op terug. Geef me even tijd.',context:'Bij een impuls'}];return s;
}
