export function el(tag,attrs={},...children) {
  const node=document.createElement(tag);
  for(const [key,value] of Object.entries(attrs)) {
    if(value===undefined||value===null||value===false)continue;
    if(key.startsWith('on')&&typeof value==='function')node.addEventListener(key.slice(2).toLowerCase(),value);
    else if(key==='class')node.className=value;
    else if(['value','checked','disabled','selected'].includes(key))node[key]=value;
    else node.setAttribute(key,value===true?'':String(value));
  }
  for(const child of children.flat(Infinity)){if(child===null||child===false||child===undefined)continue;node.append(child instanceof Node?child:document.createTextNode(String(child)));}
  return node;
}
export const button=(label,onclick,cls='button',attrs={})=>el('button',{type:'button',class:cls,onclick,...attrs},label);
export const field=(label,input,help='')=>el('div',{class:'field'},el('label',{for:input.id},label),input,help?el('p',{class:'field-help'},help):null);
export function announce(message){const region=document.querySelector('#announcement');region.textContent='';requestAnimationFrame(()=>region.textContent=message);}
export function formatTime(ms){const seconds=Math.max(0,Math.ceil(ms/1000));return `${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;}
export function dateLabel(value){const d=new Date(value);return Number.isNaN(d.valueOf())?'':new Intl.DateTimeFormat('nl-NL',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}).format(d);}
