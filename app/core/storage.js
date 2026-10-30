let database;
async function db() {
  if(database)return database;
  database=await new Promise((resolve,reject)=>{
    const req=indexedDB.open('adhdcoach-private-v1',1);
    req.onupgradeneeded=()=>req.result.createObjectStore('vault');
    req.onsuccess=()=>{req.result.onversionchange=()=>{req.result.close();database=null;};resolve(req.result);};
    req.onerror=()=>reject(new Error('Deze browser kan geen lokale opslag openen.'));
    req.onblocked=()=>reject(new Error('Sluit de andere tabbladen van ADHDcoach en probeer opnieuw.'));
  });return database;
}
export async function readRecord() {
  const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction('vault','readonly');const r=t.objectStore('vault').get('main');r.onsuccess=()=>resolve(r.result??null);r.onerror=()=>reject(r.error);});
}
export async function writeRecord(envelope,expectedRevision) {
  const d=await db();return new Promise((resolve,reject)=>{
    const t=d.transaction('vault','readwrite');const store=t.objectStore('vault');let revision;let conflict;
    const r=store.get('main');r.onsuccess=()=>{
      const current=r.result?.revision??null;
      if(current!==expectedRevision){conflict=new Error('Deze gegevens zijn in een ander tabblad gewijzigd. Maak eerst een reservekopie van je huidige scherm en open daarna opnieuw.');t.abort();return;}
      revision=(current??0)+1;store.put({envelope,revision},'main');
    };
    t.oncomplete=()=>resolve(revision);
    t.onabort=()=>reject(conflict??new Error('Bewaren is niet gelukt. Je gegevens staan nog in dit scherm. Maak een reservekopie.'));
    t.onerror=()=>{};
  });
}
export async function deleteRecord(expectedRevision) {
  const d=await db();return new Promise((resolve,reject)=>{
    const t=d.transaction('vault','readwrite'),s=t.objectStore('vault');let conflict;
    const r=s.get('main');r.onsuccess=()=>{if((r.result?.revision??null)!==expectedRevision){conflict=new Error('De opslag is veranderd. Open opnieuw voordat je wist.');t.abort();return;}s.delete('main');};
    t.oncomplete=resolve;t.onabort=()=>reject(conflict??new Error('Wissen is niet gelukt.'));t.onerror=()=>{};
  });
}
