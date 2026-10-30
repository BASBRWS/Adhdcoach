import {el,button} from '../core/ui.js';
import {MODULES} from '../core/model.js';
export function privacyView(ctx) {
  const {actions,data}=ctx;
  return el('div',{class:'page-column'},el('p',{class:'eyebrow'},'PRIVÉ EN VOORKEUREN'),el('h1',{id:'page-title',tabindex:'-1'},'Jouw gegevens, hier.'),
    el('section',{class:'privacy-intro'},el('h2',{},ctx.demo?'Je bekijkt voorbeeldgegevens.':'Op dit apparaat versleuteld.'),
      el('p',{},ctx.demo?'Deze stand bewaart niets. Sluit de voorbeeldstand om met je eigen gegevens te beginnen.':'Taken, notities en afspraken staan versleuteld in deze browser. Je wachtzin en ontsleutelde inhoud worden niet naar een server gestuurd.'),
      el('p',{class:'quiet'},'De aanbieder van de website kan technische bezoekgegevens verwerken. Lokale opslag maakt je bezoek niet anoniem. Er zijn geen externe meetdiensten of AI-koppelingen in deze app.')),
    el('section',{},el('h2',{},'Reservekopie en herstel'),el('p',{},'Bij een verloren wachtzin of gewiste browseropslag zijn je gegevens zonder bruikbare kopie niet terug te halen. Je reservekopie heeft dezelfde wachtzin.'),
      el('div',{class:'actions'},button('Versleutelde kopie downloaden',actions.exportBackup,'button', {disabled:ctx.demo}),button('Reservekopie terugzetten',actions.restoreBackup,'button secondary',{disabled:ctx.demo})),
      el('p',{class:'field-help'},'Synchronisatie staat niet aan en is in deze versie nog niet beschikbaar. Verschillende browsers en apparaten hebben ieder hun eigen opslag.'),
      button('Uitleg over installeren',actions.installHelp,'text-button')),
    el('section',{},el('h2',{},'Mijn hulpmiddelen'),el('p',{class:'quiet'},'Uitzetten verbergt het hulpmiddel. Bestaande gegevens blijven bewaard.'),
      ...MODULES.map(m=>el('label',{class:'module-switch',for:`module-${m.id}`},el('span',{},el('strong',{},m.name),el('span',{class:'field-help'},m.description)),el('input',{id:`module-${m.id}`,type:'checkbox',checked:data.preferences.modules[m.id],onchange:e=>actions.module(m.id,e.target.checked)})))),
    el('section',{},el('h2',{},'Automatisch vergrendelen'),el('div',{class:'field'},el('label',{for:'lock-duration'},'Na hoeveel minuten zonder bediening'),el('select',{id:'lock-duration',value:String(data.preferences.lockMinutes),onchange:e=>actions.lockMinutes(Number(e.target.value))},...[5,15,30].map(n=>el('option',{value:String(n),selected:n===data.preferences.lockMinutes},`${n} minuten`))))),
    el('section',{class:'danger-zone'},el('h2',{},'Gegevens wissen'),el('p',{},'Dit verwijdert de versleutelde opslag van deze app in deze browser. Eerder gedownloade reservekopieën blijven bestaan.'),button('Wis mijn lokale gegevens',actions.wipe,'button danger-outline',{disabled:ctx.demo})));
}
