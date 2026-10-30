import {el,button,dateLabel} from '../core/ui.js';
export function laterView(ctx) {
  const {data,actions}=ctx;
  const q=ctx.search.toLocaleLowerCase('nl');
  const tasks=data.tasks.filter(t=>t.title.toLocaleLowerCase('nl').includes(q));
  const notes=data.notes.filter(n=>n.text.toLocaleLowerCase('nl').includes(q));
  const taskRow=t=>el('article',{class:'list-item task-row'},
    el('div',{class:'list-copy'},el('p',{class:'item-meta'},t.done?'Afgerond':t.id===data.activeId?'Gekozen voor nu':'Bewaren voor later'),el('h3',{class:t.done?'completed':''},t.title),t.steps.length?el('p',{class:'field-help'},`${t.steps.filter(s=>s.done).length} van ${t.steps.length} eigen stappen gedaan`):null),
    el('div',{class:'item-actions'},data.preferences.modules.tasks&&!t.done&&t.id!==data.activeId?button('Voor nu kiezen',()=>actions.choose(t.id),'button secondary'):null,
      t.done?button('Opnieuw klaarzetten',()=>actions.reopen(t.id),'text-button'):button('Aanpassen',()=>actions.taskEditor(t),'text-button'),button('Verwijderen',()=>actions.removeTask(t.id),'text-button danger',{'aria-label':`Verwijder taak ${t.title}`})));
  const noteRow=n=>el('article',{class:'list-item'},el('p',{class:'item-meta'},[n.type,dateLabel(n.created)].filter(Boolean).join(' · ')),el('p',{class:'note-text'},n.text),
    el('div',{class:'item-actions'},button('Aanpassen',()=>actions.noteEditor(n),'text-button'),data.preferences.modules.tasks?button('Maak hier een taak van',()=>actions.taskFromNote(n),'text-button'):null,button('Verwijderen',()=>actions.removeNote(n.id),'text-button danger',{'aria-label':`Verwijder notitie ${n.text.slice(0,40)}`})));
  return el('div',{class:'page-column'},el('p',{class:'eyebrow'},'LATER'),el('h1',{id:'page-title',tabindex:'-1'},'Niets hoeft tegelijk.'),
    el('div',{class:'toolbar'},el('div',{class:'field search-field'},el('label',{for:'search'},'Zoek in taken en notities'),el('input',{id:'search',type:'search',value:ctx.search,placeholder:'Jouw woorden',oninput:e=>ctx.onSearch(e.target.value)})),
      el('div',{class:'actions'},data.preferences.modules.tasks?button('Nieuwe taak',()=>actions.taskEditor(),'button secondary'):null,data.preferences.modules.notes?button('Losse notitie',()=>actions.noteEditor(),'button secondary'):null)),
    el('div',{class:'tabs','aria-label':'Soort inhoud'},...['Alles','Taken','Notities'].map(t=>button(t,()=>actions.filter(t),`tab ${ctx.filter===t?'active':''}`,{'aria-pressed':ctx.filter===t}))),
    !tasks.length&&!notes.length?el('p',{class:'empty'},q?'Geen resultaten voor deze woorden.':'Je hebt nog niets bewaard voor later.'):null,
    ctx.filter!=='Notities'?el('section',{},el('h2',{},'Mijn taken'),tasks.length?tasks.map(taskRow):el('p',{class:'quiet'},'Geen taken in deze selectie.')):null,
    ctx.filter!=='Taken'?el('section',{},el('h2',{},'Mijn notities'),notes.length?notes.slice().reverse().map(noteRow):el('p',{class:'quiet'},'Geen notities in deze selectie.')):null);
}
