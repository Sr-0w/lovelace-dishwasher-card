/* Dishwasher Card v0.2.1-dev — native segmented programs, MIT */
(function DishwasherCardV2(){
 const TYPE="dishwasher-card";
 if(customElements.get(TYPE))return;
 const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const style=`
 :host{display:block;--dw-orange:var(--dw-active-color,#ff6a00);--dw-green:#5bd6a6;--dw-muted:var(--secondary-text-color,#aaa)}
 *{box-sizing:border-box}
 ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#1b1b1b));border:1px solid var(--divider-color,#383838);border-radius:16px;overflow:hidden;color:var(--primary-text-color,#fafafa);box-shadow:none}
 .head{height:54px;display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid var(--divider-color,#383838)}
 .appico{width:34px;height:34px;display:grid;place-items:center;background:color-mix(in srgb,var(--dw-orange) 13%,transparent);border-radius:10px;color:var(--dw-orange)}
 .headtxt{flex:1;min-width:0}.title{font-size:15px;font-weight:650}.sub{margin-top:3px;display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dw-muted)}
 .dot{width:6px;height:6px;border-radius:50%;background:var(--state-color)}
 .details{border:0;background:transparent;cursor:pointer;padding:8px;color:var(--dw-muted)}
 .overview{padding:15px 17px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px}
 .current{min-width:0}.eyebrow{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dw-muted)}
 .program-name{font-size:25px;font-weight:650;line-height:1.25;letter-spacing:-.035em;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-top:3px}
 .power{text-align:right;min-width:70px}.power-value{font-size:19px;font-weight:600;white-space:nowrap;color:var(--primary-text-color,#eee);margin-top:4px}
 .quick-stats{padding:0 17px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--dw-muted);font-size:11px}
 .quick-stats span{display:flex;align-items:center;gap:5px}.quick-stats .warn{color:var(--dw-orange)}.quick-stats ha-icon{--mdc-icon-size:15px}
 .mode-heading{padding:10px 15px 0;border-top:1px solid var(--divider-color,#363636);display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:600;color:var(--dw-muted)}
 .segment{margin:9px 12px 12px;padding:4px;display:flex;gap:3px;background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#393939);border-radius:13px;overflow:hidden}
 .segment-btn{height:64px;min-width:0;flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;border:0;border-radius:10px;background:transparent;color:var(--secondary-text-color,#b8b8b8);font-family:inherit;font-size:11px;font-weight:600;white-space:nowrap;cursor:pointer;transition:background-color .18s,color .18s,transform .12s}
 .segment-btn ha-icon{--mdc-icon-size:24px}
 .segment-btn.selected{background:var(--dw-orange);color:#fff;box-shadow:0 2px 7px #0002}
 .segment-btn:disabled{opacity:.35;cursor:not-allowed}
 .segment-btn.selected:disabled{opacity:.8}
 .segment-btn:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:-2px}
 .segment-btn:active:not(:disabled){transform:scale(.97)}
 .controls{display:grid;grid-template-columns:1.1fr 1fr;gap:8px;padding:10px 12px 12px;border-top:1px solid var(--divider-color,#363636)}
 .button{height:44px;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--divider-color,#404040);border-radius:10px;cursor:pointer;font-family:inherit;font-size:12px;font-weight:650}
 .button:disabled{opacity:.35;cursor:not-allowed}.button:active:not(:disabled){transform:scale(.98)}
 .button ha-icon{--mdc-icon-size:20px}.primary{background:var(--dw-orange);border-color:var(--dw-orange);color:#fff}
 .secondary{background:var(--secondary-background-color,#292929);color:var(--primary-text-color,#eee)}
 @media(max-width:355px){.segment{margin:7px 8px 9px}.segment-btn{height:57px;font-size:10px;gap:3px}.segment-btn ha-icon{--mdc-icon-size:21px}.overview{padding:11px}.program-name{font-size:23px}.controls{padding:8px}.button{font-size:11px}}
 `;
 class DishwasherCard extends HTMLElement{
  constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));}
  setConfig(config){if(!config?.entities?.state||!config.entities.program)throw Error("Dishwasher Card: entities.state and entities.program are required");this._config=config;this._signature="";this._render();}
  set hass(hass){this._hass=hass;const ids=Object.values(this._config?.entities??{}).filter(x=>typeof x==="string");const signature=ids.map(id=>{const st=hass.states[id];return id+":"+(st?.state??"unknown")+":"+((id===this._config.entities.program)?JSON.stringify(st?.attributes?.options??[]):"");}).join("|");if(signature!==this._signature){this._signature=signature;this._render();}}
  getCardSize(){return 5;}
  getGridOptions(){return {columns:12,rows:5,min_rows:4};}
  static getStubConfig(){return {name:"Dishwasher",entities:{state:"sensor.dishwasher_state",program:"select.dishwasher_program"}};}
  _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
  _number(key){const st=this._state(key),n=Number(st?.state);return st&&Number.isFinite(n)?Math.round(n).toLocaleString(this._hass?.locale?.language??"en"):"—";}
  _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
  _click(e){
   const el=e.target.closest("[data-action]");if(!el||el.disabled)return;
   const action=el.dataset.action,c=this._config;
   if(action==="details"){if(c.detail_path){history.pushState(null,"",c.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(c.entities.state);return;}
   if(action==="program-more"){this._moreInfo(c.entities.program);return;}
   if(action==="program"){
    const id=c.entities.program,st=this._state("program"),option=el.dataset.option;
    const options=st?.attributes?.options??[];
    const raw=this._state("state")?.state?.toLowerCase()??"";
    const running=["run","running","washing","drying","active","on"].includes(raw);
    if(running||!id?.startsWith("select.")||!options.includes(option)||st.state===option)return;
    el.disabled=true;
    Promise.resolve(this._hass.callService("select","select_option",{entity_id:id,option})).catch(err=>console.error("Dishwasher Card: program selection failed",err)).finally(()=>{if(el.isConnected)el.disabled=false;});
    return;
   }
   if(action==="command"){
    if(c.entities.remote&&this._state("remote")?.state!=="on")return;
    const id=c.entities[el.dataset.key];if(!id?.startsWith("button.")||!this._hass.states[id])return;
    el.disabled=true;
    Promise.resolve(this._hass.callService("button","press",{entity_id:id})).catch(err=>console.error("Dishwasher Card: command failed",err)).finally(()=>{if(el.isConnected)el.disabled=false;});
   }
  }
  _render(){
   if(!this._hass||!this._config)return;
   const c=this._config;
   const L={idle:"Idle",running:"Running",paused:"Paused",unavailable:"Unavailable",program:"Program",remote_on:"Remote enabled",remote_off:"Remote disabled",start:"Start",pause:"Pause",resume:"Resume",details:"Options & details",finish:"Finish",more:"Other",power:"Power",...(c.labels??{})};
   const raw=this._state("state")?.state?.toLowerCase()??"unknown";
   const running=["run","running","washing","drying","active","on"].includes(raw),paused=["pause","paused"].includes(raw),stopped=["stop","stopped","idle","off","ready","complete","finished"].includes(raw);
   const status=running?L.running:paused?L.paused:stopped?L.idle:L.unavailable;
   const remote=!c.entities.remote||this._state("remote")?.state==="on";
   const pstate=this._state("program"),programCode=pstate?.state??"—";
   const optionList=Array.isArray(pstate?.attributes?.options)?pstate.attributes.options:[];
   const programName=c.program_labels?.[programCode]??programCode.replaceAll("_"," ");
   const preferred=Array.isArray(c.program_presets)&&c.program_presets.length?c.program_presets:["eco","ai","intensive"];
   const presets=[...new Set(preferred)].filter(x=>typeof x==="string"&&optionList.includes(x)).slice(0,4);
   if(!presets.length)presets.push(...optionList.slice(0,3));
   const icons={eco:"mdi:leaf",ai:"mdi:autorenew",intensive:"mdi:fire",express:"mdi:flash",glasses:"mdi:glass-wine",pre_wash:"mdi:water",extra_silence:"mdi:volume-mute",machine_care:"mdi:washing-machine",...c.program_icons};
   const programActiveOutside=!presets.includes(programCode);
   const canProgramChange=!!pstate&&pstate.state!=="unavailable"&&!running;
   const end=this._state("completion")?.state;
   let completion="";
   if(running&&end){const at=new Date(end);if(Number.isFinite(at.getTime()))completion=at.toLocaleTimeString(this._hass.locale?.language??"en",{hour:"2-digit",minute:"2-digit"});}
   const key=stopped?"start":paused?"resume":running?"pause":null;
   const label=stopped?L.start:paused?L.resume:running?L.pause:L.unavailable;
   const allowed=!!key&&this._state(key)?.state!=="unavailable"&&!!this._state(key)&&remote;
   const stateColor=running?"var(--dw-green)":paused?"var(--dw-orange)":"var(--secondary-text-color,#999)";
   const segments=presets.map(code=>{
    const selected=programCode===code;
    const programText=c.program_labels?.[code]??code.replaceAll("_"," ");
    return `<button class="segment-btn ${selected?"selected":""}" data-action="program" data-option="${esc(code)}" aria-pressed="${selected}" title="${esc(programText)}" ${!canProgramChange||selected?"disabled":""}><ha-icon icon="${esc(icons[code]??"mdi:playlist-play")}"></ha-icon>${esc(programText)}</button>`;
   });
   if(optionList.length>presets.length){
    segments.push(`<button class="segment-btn ${programActiveOutside?"selected":""}" data-action="program-more" title="${esc(L.more)}" aria-label="${esc(L.more)}"><ha-icon icon="mdi:dots-horizontal"></ha-icon>${esc(L.more)}</button>`);
   }
   this.shadowRoot.innerHTML=`<style>${style}</style><ha-card style="--state-color:${stateColor}"><div class="head"><div class="appico"><ha-icon icon="mdi:dishwasher"></ha-icon></div><div class="headtxt"><div class="title">${esc(c.name??"Dishwasher")}</div><div class="sub"><i class="dot"></i>${esc(status)}</div></div><button class="details" data-action="details" aria-label="${esc(L.details)}"><ha-icon icon="mdi:chevron-right"></ha-icon></button></div><div class="overview"><div class="current"><div class="eyebrow">${esc(L.program)}</div><div class="program-name">${esc(programName)}</div></div><div class="power"><div class="eyebrow">${esc(L.power)}</div><div class="power-value">${this._number("power")} W</div></div></div><div class="quick-stats"><span class="${remote?"":"warn"}"><ha-icon icon="mdi:remote"></ha-icon>${esc(remote?L.remote_on:L.remote_off)}</span>${completion?`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${esc(L.finish)} ${esc(completion)}</span>`:""}</div>${segments.length?`<div class="mode-heading">${esc(L.program)}<span>${!canProgramChange?"●":""}</span></div><div class="segment">${segments.join("")}</div>`:""}<div class="controls"><button class="button primary" data-action="command" data-key="${key??""}" ${!allowed?"disabled":""}><ha-icon icon="mdi:${running?"pause":"play"}"></ha-icon>${esc(remote?label:L.remote_off)}</button><button class="button secondary" data-action="details"><ha-icon icon="mdi:tune"></ha-icon>${esc(L.details)}</button></div></ha-card>`;
  }
 }
 customElements.define(TYPE,DishwasherCard);
 window.customCards=window.customCards||[];
 window.customCards.push({type:TYPE,name:"Dishwasher Card",description:"Native-feeling dishwasher card with thermostat-style program selector",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-dishwasher-card"});
})();
