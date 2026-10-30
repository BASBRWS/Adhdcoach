import {validateState,demoState} from './model.js';
import {newVault,openVault,seal} from './crypto.js';
export class Session {
  constructor(storage,onStatus=()=>{}){this.storage=storage;this.onStatus=onStatus;this.data=null;this.demo=false;this.key=null;this.salt=null;this.revision=null;this.queue=Promise.resolve();this.dirty=false;this.sequence=0;}
  async create(passphrase) {
    const data=validateState((await import('./model.js')).emptyState());const vault=await newVault(passphrase,data);
    const revision=await this.storage.writeRecord(vault.envelope,null);
    Object.assign(this,{data,key:vault.key,salt:vault.salt,revision,demo:false,dirty:false});
  }
  async unlock(passphrase) {
    const record=await this.storage.readRecord();if(!record)throw new Error('Er zijn nog geen eigen gegevens op dit apparaat.');
    const v=await openVault(record.envelope,passphrase);
    Object.assign(this,{data:validateState(v.state),key:v.key,salt:v.salt,revision:record.revision,demo:false,dirty:false});
  }
  startDemo(){this.data=demoState();this.demo=true;this.revision=null;this.dirty=false;}
  change(mutator) {
    if(!this.data)throw new Error('Open eerst je eigen plek.');
    const candidate=structuredClone(this.data);mutator(candidate);this.data=validateState(candidate);
    if(this.demo){this.onStatus('demo');return;}
    const snapshot=structuredClone(this.data),sequence=++this.sequence;this.dirty=true;this.onStatus('saving');
    this.queue=this.queue.then(async()=>{
      const envelope=await seal(snapshot,this.key,this.salt);this.revision=await this.storage.writeRecord(envelope,this.revision);
      if(this.sequence===sequence){this.dirty=false;this.onStatus('saved');}
    }).catch(error=>{this.onStatus('error',error.message);});
  }
  async backup() {if(this.demo)throw new Error('Voorbeeldgegevens worden niet geëxporteerd.');return seal(this.data,this.key,this.salt);}
  async restore(envelope,passphrase,expectedRevision) {
    await this.queue;
    const v=await openVault(envelope,passphrase);const data=validateState(v.state);
    const fresh=await seal(data,v.key,v.salt);const revision=await this.storage.writeRecord(fresh,expectedRevision);
    Object.assign(this,{data,key:v.key,salt:v.salt,revision,demo:false,dirty:false});
  }
  async lock() {
    await this.queue;if(this.dirty)throw new Error('Er zijn gegevens die nog niet bewaard zijn. Maak eerst een reservekopie.');
    Object.assign(this,{data:null,key:null,salt:null,demo:false,revision:null});
  }
}
