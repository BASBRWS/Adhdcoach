import test from 'node:test';
import assert from 'node:assert/strict';
import {newVault,openVault,seal,checkEnvelope} from '../app/core/crypto.js';
import {emptyState} from '../app/core/model.js';
const pass='Deze testwachtzin is alleen een voorbeeld.';
test('versleutelde reservekopie herstelt inhoud en bewaart geen leesbare notitietekst',async()=>{const s=emptyState();s.notes=[{id:'note',text:'Verzonnen persoonlijke inhoud',type:'',created:''}];const v=await newVault(pass,s);assert.equal(JSON.stringify(v.envelope).includes(s.notes[0].text),false);const out=await openVault(v.envelope,pass);assert.deepEqual(out.state,s);assert.equal(out.key.extractable,false);});
test('een verkeerde wachtzin en gewijzigde inhoud worden geweigerd',async()=>{const v=await newVault(pass,emptyState());await assert.rejects(openVault(v.envelope,'Dit is een andere testwachtzin.'));const e=structuredClone(v.envelope);e.cipher=(e.cipher[0]==='A'?'B':'A')+e.cipher.slice(1);await assert.rejects(openVault(e,pass));});
test('iedere schrijfactie heeft een andere nonce en korte wachtzinnen worden geweigerd',async()=>{const s=emptyState();const v=await newVault(pass,s);const next=await seal(s,v.key,v.salt);assert.notEqual(v.envelope.iv,next.iv);assert.notEqual(v.envelope.cipher,next.cipher);await assert.rejects(newVault('kort',s));});
test('onbekende of buitensporige afleidingsinstellingen worden vóór cryptografische verwerking geweigerd',()=>{assert.throws(()=>checkEnvelope({kind:'adhdcoach-vault',version:1,iterations:999999999,algorithm:'AES-GCM'}));});
