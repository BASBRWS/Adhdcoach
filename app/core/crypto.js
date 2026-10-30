const ITERATIONS=600000;
const AAD=new TextEncoder().encode('adhdcoach.vault.v1');
function encode(bytes) {let s='';for(const x of new Uint8Array(bytes))s+=String.fromCharCode(x);return btoa(s);}
function decode(value,max=8000000) {
  if(typeof value!=='string'||value.length>max||!/^[A-Za-z0-9+/]*={0,2}$/.test(value))throw new Error('Ongeldig reservekopiebestand.');
  try{return Uint8Array.from(atob(value),c=>c.charCodeAt(0));}catch{throw new Error('Ongeldig reservekopiebestand.');}
}
export function checkEnvelope(e) {
  if(!e||e.kind!=='adhdcoach-vault'||e.version!==1||e.iterations!==ITERATIONS||e.algorithm!=='AES-GCM')throw new Error('Deze reservekopie wordt niet ondersteund.');
  const salt=decode(e.salt,100),iv=decode(e.iv,100),cipher=decode(e.cipher);
  if(salt.length!==16||iv.length!==12||cipher.length<16)throw new Error('De reservekopie is beschadigd.');
  return {salt,iv,cipher};
}
export async function deriveKey(passphrase,salt) {
  if(typeof passphrase!=='string'||passphrase.length>1000)throw new Error('De wachtzin is niet geldig.');
  const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase.normalize('NFC')),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',salt,iterations:ITERATIONS,hash:'SHA-256'},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
export async function newVault(passphrase,state) {
  if(passphrase.trim().length<12)throw new Error('Gebruik een wachtzin van minstens 12 tekens.');
  const salt=crypto.getRandomValues(new Uint8Array(16));const key=await deriveKey(passphrase,salt);
  return {key,salt,envelope:await seal(state,key,salt)};
}
export async function seal(state,key,salt) {
  const iv=crypto.getRandomValues(new Uint8Array(12));
  const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:AAD},key,new TextEncoder().encode(JSON.stringify(state)));
  return {kind:'adhdcoach-vault',version:1,algorithm:'AES-GCM',iterations:ITERATIONS,salt:encode(salt),iv:encode(iv),cipher:encode(cipher)};
}
export async function openVault(envelope,passphrase) {
  const {salt,iv,cipher}=checkEnvelope(envelope);const key=await deriveKey(passphrase,salt);
  try {
    const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:AAD},key,cipher);
    return {key,salt,state:JSON.parse(new TextDecoder().decode(clear))};
  } catch {throw new Error('Openen is niet gelukt. Controleer de wachtzin en het bestand.');}
}
