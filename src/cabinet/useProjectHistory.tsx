import {useCallback,useRef,useState} from 'react';
import {createHistory,historyReducer,type Action} from './history.js';
export function useProjectHistory<T>(initial:()=>T){
 const [state,setState]=useState(()=>createHistory(initial()));
 const current=useRef(state);
 const dispatch=useCallback((action:Action<T>)=>{const next=historyReducer(current.current,action);current.current=next;setState(next);},[]);
 const setPresent=useCallback((value:T|((previous:T)=>T))=>dispatch({type:'apply',value:typeof value==='function'?(value as (p:T)=>T)(current.current.present):value}),[dispatch]);
 return {present:state.present,setPresent,preview:(value:T)=>dispatch({type:'preview',value}),beginDrag:()=>dispatch({type:'beginDrag'}),finishDrag:()=>dispatch({type:'finishDrag'}),cancelDrag:()=>dispatch({type:'cancelDrag'}),undo:()=>dispatch({type:'undo'}),redo:()=>dispatch({type:'redo'}),reset:(value:T)=>dispatch({type:'reset',value}),canUndo:state.beforeDrag===null&&state.past.length>0,canRedo:state.beforeDrag===null&&state.future.length>0,isDragging:state.beforeDrag!==null};
}
