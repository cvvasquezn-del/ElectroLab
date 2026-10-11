import {createContext,useContext,useEffect,useRef,useState,type ReactNode} from 'react';
import {browserStorage} from './storage.js';
import {recoverConnected,saveConnected} from './projectStorage.js';
import {createPhysicalProject} from './model.js';
import {migratePhysical,type ConnectedProject,type ProjectResult} from './project.js';
import {validateConnectedProject} from './projectValidation.js';
import {useProjectHistory} from './useProjectHistory';
function restore(){const s=browserStorage();return s.ok?recoverConnected(s.storage):{project:migratePhysical(createPhysicalProject()),warning:s.error,protected:true};}
function useShared(){
 const [initial]=useState(restore),history=useProjectHistory(()=>initial.project);
 const current=useRef(history.present),dragBase=useRef<ConnectedProject|null>(null);
 const [notice,setNotice]=useState(initial.warning),[protectedRecovery,setProtectedRecovery]=useState(initial.protected),[saved,setSaved]=useState(false),[storageError,setStorageError]=useState('');
 current.current=history.present;
 function apply(result:ProjectResult){
 if(history.isDragging)return false;
 if(!result.ok){setNotice(result.error);return false;}
 const valid=validateConnectedProject(result.project);if(!valid.ok){setNotice(valid.error);return false;}
 if(JSON.stringify(current.current)===JSON.stringify(valid.project))return true;
 history.setPresent(valid.project);current.current=valid.project;setProtectedRecovery(false);setNotice('Cambios aplicados.');return true;
 }
 function importProject(p:ConnectedProject){const valid=validateConnectedProject(p);if(!valid.ok){setNotice(valid.error);return false;}history.cancelDrag();dragBase.current=null;history.reset(valid.project);current.current=valid.project;setProtectedRecovery(false);setNotice('Proyecto compartido importado.');return true;}
 function beginDrag(){dragBase.current=current.current;history.beginDrag();}
 function preview(p:ConnectedProject){if(!dragBase.current)return;current.current=p;history.preview(p);}
 function cancelDrag(){if(dragBase.current){current.current=dragBase.current;dragBase.current=null;}history.cancelDrag();}
 function finishDrag(){const base=dragBase.current;if(!base)return;const valid=validateConnectedProject(current.current);
 if(!valid.ok){setNotice(valid.error);cancelDrag();return;}
 if(JSON.stringify(base)===JSON.stringify(valid.project)){cancelDrag();return;}
 history.preview(valid.project);history.finishDrag();current.current=valid.project;dragBase.current=null;setProtectedRecovery(false);setNotice('Posición actualizada.');
 }
 useEffect(()=>{if(history.isDragging)return;const s=browserStorage(),result=s.ok?saveConnected(s.storage,history.present,protectedRecovery):s;setSaved(result.ok);setStorageError(result.ok?'':result.error);},[history.present,history.isDragging,protectedRecovery]);
 return {project:history.present,apply,importProject,beginDrag,preview,finishDrag,cancelDrag,undo:history.undo,redo:history.redo,canUndo:history.canUndo,canRedo:history.canRedo,isDragging:history.isDragging,notice,setNotice,saved,storageError};
}
const ProjectContext=createContext<ReturnType<typeof useShared>|null>(null);
export function ProjectProvider({children}:{children:ReactNode}){const value=useShared();return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;}
export function useConnectedProject(){const value=useContext(ProjectContext);if(!value)throw Error('Falta el proveedor de proyecto.');return value;}
