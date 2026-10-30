import {el,button} from '../core/ui.js';
const suggestions=[
  {title:'De start is te groot',text:'Kies één zichtbare handeling. Bijvoorbeeld alleen de map openen of één voorwerp klaarleggen.'},
  {title:'Er zijn te veel prikkels',text:'Kies zelf of minder geluid, een andere plek of een zachter scherm nu helpt.'},
  {title:'Ik wil direct reageren',text:'Zet je reactie eerst in een notitie. Kies daarna of je haar wilt gebruiken of bewaren.'}
];
export function supportView(ctx) {
  const {actions,data}=ctx;
  if(ctx.supportDisplay)return el('div',{class:'support-display'},button('← Terug',()=>actions.displaySupport(null),'text-button'),el('p',{class:'eyebrow'},'MIJN GEKOZEN AFSPRAAK'),el('h1',{id:'page-title',tabindex:'-1'},ctx.supportDisplay),el('p',{class:'display-notice'},'Alleen deze zin staat in beeld. Er wordt niets verstuurd.'));
  return el('div',{class:'page-column'},el('p',{class:'eyebrow'},'STEUN'),el('h1',{id:'page-title',tabindex:'-1'},'Wat past nu.'),
    !data.preferences.modules.support?el('div',{class:'empty'},el('p',{},'Eigen steun staat uit. Je bestaande afspraken blijven bewaard.'),button('Hulpmiddelen aanpassen',()=>actions.route('privacy'),'button secondary')):
    el('div',{},el('div',{class:'section-heading'},el('h2',{},'Mijn eigen afspraken'),button('Afspraak toevoegen',()=>actions.supportEditor(),'button secondary')),
      !data.supports.length?el('p',{class:'quiet'},'Bewaar een zin die voor jou werkt. Je kunt die later ook groot laten zien.'):null,
      ...data.supports.map(s=>el('article',{class:'list-item support-row'},el('p',{class:'item-meta'},s.context||'Mijn eigen woorden'),el('h3',{},s.text),el('div',{class:'item-actions'},button('Groot tonen',()=>actions.displaySupport(s.text),'button secondary'),button('Aanpassen',()=>actions.supportEditor(s),'text-button'),button('Verwijderen',()=>actions.removeSupport(s.id),'text-button danger')))),
      el('h2',{class:'section-space'},'Iets om te proberen'),...suggestions.map(s=>el('details',{class:'support-option'},el('summary',{},s.title),el('p',{},s.text),button('Bewaar een eigen afspraak',()=>actions.supportEditor(),'text-button'))),
      el('p',{class:'field-help section-space'},'Dit zijn praktische suggesties. Jij kiest of ze passen. ADHDcoach geeft geen diagnose of behandeladvies.')));
}
