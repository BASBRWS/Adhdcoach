import {el,button,formatTime} from '../core/ui.js';
import {remaining} from '../core/model.js';
export function nowView(ctx) {
  const {data,actions}=ctx;
  const task=data.tasks.find(t=>t.id===data.activeId&&!t.done);
  const next=task?.steps.find(s=>!s.done);
  const focus=data.focus;
  const timer=()=>el('section',{class:'focus-block','aria-label':'Focusblok'},
    el('div',{class:'section-label'},'Jouw focusblok'),
    el('div',{class:'timer','data-timer':'',role:'timer','aria-label':'Resterende focustijd'},formatTime(remaining(focus))),
    el('div',{class:'timer-track','aria-hidden':'true'},el('div',{'data-timer-progress':'',style:`width:${focus?100*remaining(focus)/focus.totalMs:100}%`})),
    focus?.status==='running'?el('div',{class:'actions'},button('Pauzeer',actions.pause,'button secondary'),button('Stop blok',actions.stopFocus,'text-button')):
    focus?.status==='paused'?el('div',{class:'actions'},button('Ga verder',actions.resume,'button'),button('Stop blok',actions.stopFocus,'text-button')):
    el('div',{},focus?.status==='finished'?el('p',{class:'quiet'},'Je focusblok is afgelopen. Je taak blijft staan tot jij die afrondt.'):null,
      el('div',{class:'actions duration-actions'},...[5,10,15].map(m=>button(`${m} minuten`,()=>actions.start(m),'button secondary')))),
    el('p',{class:'field-help'},'De timer loopt op basis van de klok. Er klinkt geen alarm als deze app gesloten is.'));
  if(ctx.focusOnly&&task) return el('div',{class:'single-focus'},
    button('← Terug naar alles',actions.toggleFocus,'text-button'),
    el('p',{class:'eyebrow'},'ALLEEN DIT'),el('h1',{id:'page-title',tabindex:'-1'},next?.text??task.title),
    next?el('p',{class:'focus-parent'},task.title):null,
    data.preferences.modules.focus?timer():null,
    el('div',{class:'actions'},next?button('Deze stap is gedaan',()=>actions.toggleStep(task.id,next.id),'button'):button('Taak afronden',()=>actions.finish(task.id),'button')),
    button('Bewaar iets dat ertussendoor komt',()=>actions.noteEditor(),'text-button'));
  const main=el('div',{class:'now-grid'},
    el('section',{class:'now-main'},
      el('p',{class:'eyebrow'},'NU'),el('h1',{id:'page-title',tabindex:'-1'},'Eerst deze.'),
      !data.preferences.modules.tasks?el('div',{class:'empty'},el('h2',{},'Taakstart staat uit.'),el('p',{},'Je kunt het hulpmiddel weer aanzetten bij Privé.'),button('Naar mijn hulpmiddelen',()=>actions.route('privacy'),'button secondary')):
      task?el('article',{class:'active-task'},
        el('p',{class:'section-label'},'DOOR JOU GEKOZEN'),el('h2',{class:'task-title'},task.title),
        next?el('div',{class:'first-step'},el('span',{class:'step-marker','aria-hidden':'true'},'↳'),el('div',{},el('p',{class:'field-help'},'Kleinste volgende handeling'),el('p',{class:'step-text'},next.text))):
          el('p',{class:'quiet'},'Je kunt beginnen met de taak, of eerst een kleine stap toevoegen.'),
        el('div',{class:'actions'},button('Alleen dit in beeld',actions.toggleFocus,'button'),button('Kleiner maken of aanpassen',()=>actions.taskEditor(task),'text-button')),
        task.steps.length?el('fieldset',{class:'step-list'},el('legend',{},'Mijn stappen'),...task.steps.map(step=>el('label',{class:'check-row',for:`step-${step.id}`},el('input',{id:`step-${step.id}`,type:'checkbox',checked:step.done,onchange:()=>actions.toggleStep(task.id,step.id)}),el('span',{class:step.done?'completed':''},step.text)))):null,
        button('Deze taak is klaar',()=>actions.finish(task.id),'text-button finish-task')):
      el('div',{class:'empty'},el('h2',{},'Wat wil je nu doen.'),el('p',{},'Kies één taak. De rest kan in Later blijven staan.'),el('div',{class:'actions'},button('Zet een taak klaar',()=>actions.taskEditor(),'button'),button('Kies uit Later',()=>actions.route('later'),'text-button'))),
      task&&data.preferences.modules.focus?timer():null),
    el('aside',{class:'capture-side'},
      el('p',{class:'eyebrow'},'IETS ERTUSSENDOOR'),el('h2',{},'Bewaar het hier.'),el('p',{class:'quiet'},'Een gedachte, prikkel of losse herinnering. Je taak blijft gewoon staan.'),
      data.preferences.modules.notes?ctx.quickCapture():el('p',{},'Snel vastleggen staat uit bij je hulpmiddelen.'),
      el('div',{class:'side-divider'}),el('h3',{},'Voor later'),
      data.notes.length?el('div',{class:'recent-notes'},...data.notes.slice(-3).reverse().map(n=>el('button',{class:'note-fragment',onclick:()=>actions.noteEditor(n)},n.text))):el('p',{class:'quiet'},'Hier staan nog geen notities.'),
      button('Alles terugvinden',()=>actions.route('later'),'text-button')));
  return main;
}
