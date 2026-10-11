import test from 'node:test';
import assert from 'node:assert/strict';
import {readStored,writeStored,browserStorage} from '../.test-build/cabinet/storage.js';
test('almacenamiento bloqueado se informa sin lanzar',()=>{
 const s={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 assert.equal(readStored(s,'v02').ok,false);assert.equal(writeStored(s,'v02','{}').ok,false);
 assert.equal(browserStorage(()=>{throw Error('getter blocked')}).ok,false);
});
test('claves separadas conservan el cuadro previo',()=>{
 const map=new Map([['v01','legacy']]),s={getItem:k=>map.get(k)??null,setItem:(k,v)=>map.set(k,v)};
 assert.equal(writeStored(s,'v02','physical').ok,true);
 assert.deepEqual(readStored(s,'v01'),{ok:true,value:'legacy'});
 assert.deepEqual(readStored(s,'v02'),{ok:true,value:'physical'});
});
