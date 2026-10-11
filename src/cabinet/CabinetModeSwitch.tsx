export type CabinetMode='illustrative'|'physical';
export default function CabinetModeSwitch({mode,onChange}:{mode:CabinetMode;onChange:(m:CabinetMode)=>void}){
 return <div className="cabinet-mode-switch control-group" role="group" aria-label="Tipo de cuadro"><button aria-pressed={mode==='illustrative'} className={mode==='illustrative'?'':'secondary'} onClick={()=>onChange('illustrative')}>Cuadro ilustrativo</button><button aria-pressed={mode==='physical'} className={mode==='physical'?'':'secondary'} onClick={()=>onChange('physical')}>Cuadro a escala · mm</button></div>;
}
