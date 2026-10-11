export type History<T>={present:T;past:T[];future:T[];beforeDrag:T|null};
export type Action<T>={type:'apply'|'preview'|'reset';value:T}|{type:'beginDrag'|'finishDrag'|'cancelDrag'|'undo'|'redo'};
export function createHistory<T>(initial:T):History<T>{return {present:initial,past:[],future:[],beforeDrag:null};}
const equal=(a:unknown,b:unknown)=>JSON.stringify(a)===JSON.stringify(b);
export function historyReducer<T>(s:History<T>,a:Action<T>):History<T>{
 switch(a.type){
 case 'reset':return createHistory(a.value);
 case 'beginDrag':return s.beforeDrag===null?{...s,beforeDrag:s.present}:s;
 case 'cancelDrag':return s.beforeDrag===null?s:{...s,present:s.beforeDrag,beforeDrag:null};
 case 'preview':return s.beforeDrag===null?s:{...s,present:a.value};
 case 'finishDrag':return s.beforeDrag===null?s:equal(s.present,s.beforeDrag)?{...s,beforeDrag:null}:{...s,past:[...s.past,s.beforeDrag].slice(-50),future:[],beforeDrag:null};
 case 'apply':return equal(s.present,a.value)?s:s.beforeDrag!==null?{...s,present:a.value}:{...s,past:[...s.past,s.present].slice(-50),present:a.value,future:[]};
 case 'undo':return s.beforeDrag!==null||!s.past.length?s:{...s,present:s.past.at(-1)!,past:s.past.slice(0,-1),future:[...s.future,s.present]};
 case 'redo':return s.beforeDrag!==null||!s.future.length?s:{...s,present:s.future.at(-1)!,past:[...s.past,s.present].slice(-50),future:s.future.slice(0,-1)};
 }
}
