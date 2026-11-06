/* Dishwasher Card v0.8.0-dev — scheduled-start time picker, MIT */
(function DishwasherCardV2(){
 const TYPE="dishwasher-card";
 if(customElements.get(TYPE))return;
 const esc=v=>String(v??"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[ch]));
 const style=`
 :host{display:block;--dw-orange:var(--dw-active-color,#ff6a00);--dw-green:#5bd6a6;--dw-muted:var(--secondary-text-color,#aaa)}
 *{box-sizing:border-box}
 ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#1b1b1b));border:1px solid var(--divider-color,#383838);border-radius:16px;overflow:hidden;color:var(--primary-text-color,#fafafa);box-shadow:none}
 .head{position:relative;display:flex;align-items:center;justify-content:center;min-height:48px;padding:13px 50px 8px}
 .appico{width:34px;height:34px;display:grid;place-items:center;background:color-mix(in srgb,var(--dw-orange) 13%,transparent);border-radius:10px;color:var(--dw-orange)}
 .headtxt{min-width:0}.title{font-size:16px;font-weight:600;line-height:1.4;text-align:center}.sub{margin-top:3px;display:flex;align-items:center;gap:6px;font-size:11px;color:var(--dw-muted)}
 .dot{width:6px;height:6px;border-radius:50%;background:var(--state-color)}
 .details{position:absolute;right:9px;top:50%;transform:translateY(-50%);border:0;background:transparent;cursor:pointer;padding:8px;border-radius:50%;color:var(--dw-muted)}
 .overview{padding:15px 17px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px}
 .current{min-width:0}.eyebrow{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dw-muted)}
 .program-name{font-size:25px;font-weight:650;line-height:1.25;letter-spacing:-.035em;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-top:3px}
 .power{text-align:right;min-width:70px}.power-value{font-size:19px;font-weight:600;white-space:nowrap;color:var(--primary-text-color,#eee);margin-top:4px}
 .quick-stats{padding:0 17px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--dw-muted);font-size:11px}
 .quick-stats span{display:flex;align-items:center;gap:5px}.quick-stats .scheduled{color:var(--dw-orange)}.quick-stats .warn{color:var(--dw-orange)}.quick-stats ha-icon{--mdc-icon-size:15px}
 .mode-heading{padding:6px 15px 0;display:flex;align-items:center;justify-content:space-between;font-size:11px;font-weight:600;color:var(--dw-muted)}
 .segment{--segment-radius:var(--dw-radius,var(--ha-border-radius-xl,13px));--segment-inset:3px;margin:8px 12px 10px;padding:var(--segment-inset);display:grid;grid-template-columns:repeat(var(--dw-columns,8),minmax(0,1fr));gap:2px;background:var(--dw-segment-background,var(--secondary-background-color,#292929));border:1px solid var(--divider-color,#393939);border-radius:var(--segment-radius);overflow:hidden}
 .segment.extras{grid-template-columns:repeat(var(--dw-columns,8),minmax(0,1fr));margin-top:-4px;background:transparent;border-style:dashed}
 .segment-btn{height:var(--dw-program-height,45px);min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:3px 1px;border:0;border-radius:calc(var(--segment-radius) - var(--segment-inset) - 1px);background:transparent;color:var(--secondary-text-color,#b8b8b8);font-family:inherit;font-size:var(--dw-program-font-size,9px);font-weight:500;white-space:nowrap;cursor:pointer;transition:background-color .18s,color .18s,transform .12s}
 .segment-label{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2}
 .segment-btn ha-icon{--mdc-icon-size:var(--dw-program-icon-size,17px)}
 .segment-btn.selected{background:var(--dw-orange);color:#fff;box-shadow:none}
 .segment-btn:disabled{opacity:.35;cursor:not-allowed}
 .segment-btn.selected:disabled{opacity:.8}
 .segment-btn:focus-visible{outline:2px solid var(--primary-color,#ff6a00);outline-offset:-2px}
 .segment-btn:active:not(:disabled){transform:scale(.97)}
 .controls{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:8px;padding:5px 12px 12px}
 .play-split{display:grid;grid-template-columns:minmax(0,1fr) 45px;min-width:0;gap:3px;border-radius:var(--ha-border-radius-lg,10px);overflow:hidden}
 .play-split>.button{border-radius:0}
 .schedule-toggle{color:#fff;background:var(--dw-orange);border-color:var(--dw-orange)}
 .schedule-panel{margin:0 12px 12px;padding:12px;border-radius:var(--ha-border-radius-lg,10px);background:var(--secondary-background-color,#292929);border:1px solid var(--divider-color,#444)}
 .schedule-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;margin-bottom:10px}
 .schedule-title ha-icon{--mdc-icon-size:18px}
 .schedule-edit{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
 .schedule-edit input{min-width:0;width:100%;font:inherit;font-size:19px;color:var(--primary-text-color);background:var(--card-background-color,#202020);border:1px solid var(--divider-color);border-radius:var(--ha-border-radius-md,8px);padding:8px 10px}
 .schedule-edit button{padding:0 14px;background:var(--dw-orange);color:#fff;border:0;border-radius:var(--ha-border-radius-md,8px);font:inherit;font-weight:600;cursor:pointer}
 .schedule-edit button:disabled{opacity:.35}
 .schedule-hint{color:var(--secondary-text-color);font-size:11px;margin-top:8px}
 .schedule-error{color:var(--error-color,#f66);font-size:12px;margin-top:8px}
 .schedule-close{margin-top:7px;padding:4px 0;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;cursor:pointer}
 .button{height:var(--dw-action-height,46px);display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--divider-color,#404040);border-radius:var(--ha-border-radius-lg,10px);cursor:pointer;font-family:inherit;font-size:13px;font-weight:600}
 .button:disabled{opacity:.35;cursor:not-allowed}.button:active:not(:disabled){transform:scale(.98)}
 .button ha-icon{--mdc-icon-size:20px}.primary{background:var(--dw-orange);border-color:var(--dw-orange);color:#fff}.primary.cancel{background:var(--error-color,#d9534f);border-color:var(--error-color,#d9534f)}
 .secondary{background:var(--secondary-background-color,#292929);color:var(--secondary-text-color,#ccc);border-color:var(--divider-color,#444)} .secondary ha-icon{--mdc-icon-size:22px}
 @media(max-width:355px){.segment{margin:7px 8px 9px;padding:2px;gap:1px}.segment-btn{height:43px;font-size:8px;gap:2px}.segment-btn ha-icon{--mdc-icon-size:16px}.overview{padding:11px}.program-name{font-size:23px}.controls{padding:8px}.button{font-size:11px}}
 `;
 class DishwasherCard extends HTMLElement{
  constructor(){super();this._expanded=false;this._confirmCancel=false;this._scheduleOpen=false;this._scheduleTime="";this._scheduleBusy=false;this._scheduleError="";this._scheduleNotice="";this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));this.shadowRoot.addEventListener("change",e=>{if(e.target.matches?.("input[data-schedule-time]"))this._scheduleTime=e.target.value;});}
  setConfig(config){if(!config?.entities?.state||!config.entities.program)throw Error("Dishwasher Card: entities.state and entities.program are required");this._config=config;this._signature="";this._render();}
  set hass(hass){this._hass=hass;const ids=Object.values(this._config?.entities??{}).filter(x=>typeof x==="string");const signature=ids.map(id=>{const st=hass.states[id];return id+":"+(st?.state??"unknown")+":"+((id===this._config.entities.program)?JSON.stringify(st?.attributes?.options??[]):"");}).join("|");if(signature!==this._signature){this._signature=signature;this._render();}}
  getCardSize(){return 7;}
  getGridOptions(){return {columns:12,rows:"auto"};}
  static getStubConfig(){return {name:"Dishwasher",entities:{state:"sensor.dishwasher_state",program:"select.dishwasher_program"}};}
  _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
  _number(key){const st=this._state(key),n=Number(st?.state);return st&&Number.isFinite(n)?Math.round(n).toLocaleString(this._hass?.locale?.language??"en"):"—";}
  _css(value,fallback){return typeof value==="string"&&(/^#[a-f0-9]{3,8}$/i.test(value)||/^var\(--[a-z\d-]+(?:,\s*#[a-f\d]{3,8})?\)$/i.test(value))?value:fallback;}
  _px(v,fallback,min,max){const n=Number(v);return Number.isFinite(n)?Math.min(max,Math.max(min,n)):fallback;}
  _delayedInfo(){
    const job=this._state("job_state")?.state?.toLowerCase().replace(/[\s_-]/g,"")??"";
    const progress=this._state("operating_progress")?.state?.toLowerCase().replace(/[\s_-]/g,"")??"";
    const delayed=["delaywash","delaywashing","delayedstart","scheduledstart"].includes(job)||["delaywash","delaywashing"].includes(progress);
    if(!delayed)return {delayed:false};
    const wait=this._state("time_left_to_start"),min=Number(wait?.state);
    let start=null;
    if(wait&&!["unknown","unavailable"].includes(wait.state)&&Number.isFinite(min)&&min>0){
      const last=new Date(wait.last_updated??wait.last_changed??Date.now()).getTime();
      start=new Date((Number.isFinite(last)?last:Date.now())+min*60000);
    }
    const duration=this._state("cycle_duration"),length=Number(duration?.state);
    const end=start&&duration&&!["unknown","unavailable"].includes(duration.state)&&Number.isFinite(length)&&length>0?new Date(start.getTime()+length*60000):null;
    return {delayed:true,start,end};
   }
  _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
  _click(e){
   const el=e.target.closest("[data-action]");if(!el||el.disabled)return;
   const action=el.dataset.action,c=this._config;
   if(action==="details"){if(c.detail_path){history.pushState(null,"",c.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(c.entities.state);return;}
   if(action==="schedule-toggle"){
    if(this._scheduleBusy)return;
    this._scheduleOpen=!this._scheduleOpen;
    this._scheduleError="";
    if(this._scheduleOpen&&!this._scheduleTime){
     const future=new Date(Date.now()+3600000);
     this._scheduleTime=String(future.getHours()).padStart(2,"0")+":"+String(future.getMinutes()).padStart(2,"0");
    }
    this._render();return;
   }
   if(action==="schedule-close"){
    if(!this._scheduleBusy){this._scheduleOpen=false;this._scheduleError="";this._render();}
    return;
   }
   if(action==="schedule-confirm"){
    if(this._scheduleBusy||!this._scheduleOpen)return;
    const [domain,service]=String(c.schedule_service??"").split(".");
    const state=this._state("state")?.state?.toLowerCase();
    if(!domain||!service||!c.entities.job_state||state!=="stop"||this._delayedInfo().delayed||c.entities.remote&&this._state("remote")?.state!=="on")return;
    const chosen=this.shadowRoot.querySelector('input[data-schedule-time]')?.value??this._scheduleTime;
    const m=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(chosen??"");
    if(!m){this._scheduleError="Heure invalide";this._render();return;}
    const now=new Date(),future=new Date(now);
    future.setHours(Number(m[1]),Number(m[2]),0,0);
    if(future<=now)future.setDate(future.getDate()+1);
    const minutes=Math.ceil((future.getTime()-now.getTime())/60000);
    if(minutes<1||minutes>1440){this._scheduleError="Choisis une heure dans les 24 prochaines heures";this._render();return;}
    this._scheduleTime=chosen;this._scheduleBusy=true;this._scheduleError="";
    this._render();
    Promise.resolve(this._hass.callService(domain,service,{entity_id:c.entities.job_state,delay_minutes:minutes})).then(()=>{
     this._scheduleOpen=false;this._scheduleNotice="Programmation demandée";
    }).catch(error=>{this._scheduleError=String(error?.message??error);}).finally(()=>{
     this._scheduleBusy=false;this._render();
    });
    return;
   }
   if(action==="program-more"){this._expanded=!this._expanded;this._render();return;}
   if(action==="program"){
    const id=c.entities.program,st=this._state("program"),option=el.dataset.option;
    const options=st?.attributes?.options??[];
    const raw=this._state("state")?.state?.toLowerCase()??"";
    const waiting=this._delayedInfo().delayed;
    const running=String(c.state_values?.running??"run,running,washing,drying,active,on").split(",").map(x=>x.trim().toLowerCase()).includes(raw);
    if(running||waiting||!id?.startsWith("select.")||!options.includes(option)||st.state===option)return;
    this._expanded=false;
    el.disabled=true;
    Promise.resolve(this._hass.callService("select","select_option",{entity_id:id,option})).catch(err=>console.error("Dishwasher Card: program selection failed",err)).finally(()=>{if(el.isConnected)el.disabled=false;});
    return;
   }
   if(action==="command"){
    if(el.dataset.key==="cancel"){
     // A Samsung delayed start is not an actively running wash. Cancel, don't pause.
     if(!this._delayedInfo().delayed){this._confirmCancel=false;this._render();return;}
     if(!this._confirmCancel){this._confirmCancel=true;this._render();return;}
     this._confirmCancel=false;
    }
    if(c.entities.remote&&this._state("remote")?.state!=="on")return;
    const id=c.entities[el.dataset.key];if(!id?.startsWith("button.")||!this._hass.states[id])return;
    el.disabled=true;
    Promise.resolve(this._hass.callService("button","press",{entity_id:id})).catch(err=>console.error("Dishwasher Card: command failed",err)).finally(()=>{if(el.isConnected)el.disabled=false;});
   }
  }
  _controlsHtml({c,delay,running,key,allowed,remote,label,L,showSchedule}){
   if(c.show_controls===false)return "";
   const isCancel=delay.delayed&&key==="cancel";
   const icon=delay.delayed?(isCancel?(this._confirmCancel?"alert-circle-outline":"close-circle-outline"):"clock-outline"):(running?"pause":"play");
   const primary=`<button class="button primary ${isCancel?"cancel":""}" data-action="command" data-key="${key??""}" ${!allowed?"disabled":""}><ha-icon icon="mdi:${icon}"></ha-icon>${esc(remote?label:L.remote_off)}</button>`;
   const clock=showSchedule?`<button class="button schedule-toggle" data-action="schedule-toggle" aria-label="${esc(L.schedule)}" title="${esc(L.schedule)}"><ha-icon icon="mdi:clock-plus-outline"></ha-icon></button>`:"";
   const left=showSchedule?`<div class="play-split">${primary}${clock}</div>`:primary;
   return `<div class="controls">${left}<button class="button secondary" data-action="details" aria-label="${esc(L.details)}" title="${esc(L.details)}"><ha-icon icon="mdi:tune-variant"></ha-icon></button></div>`;
  }
  _scheduleHtml({showSchedule,delay,L}){
   const notice=this._scheduleNotice&&!delay.delayed?`<div class="quick-stats"><span><ha-icon icon="mdi:clock-check-outline"></ha-icon>${esc(this._scheduleNotice)}</span></div>`:"";
   if(!showSchedule||!this._scheduleOpen)return notice;
   const error=this._scheduleError?`<div class="schedule-error">${esc(this._scheduleError)}</div>`:"";
   return `<div class="schedule-panel"><div class="schedule-title"><ha-icon icon="mdi:clock-outline"></ha-icon>${esc(L.schedule_at)}</div><div class="schedule-edit"><input type="time" data-schedule-time value="${esc(this._scheduleTime)}" aria-label="${esc(L.schedule_at)}" ${this._scheduleBusy?"disabled":""}><button data-action="schedule-confirm" ${this._scheduleBusy?"disabled":""}>${esc(this._scheduleBusy?"…":L.schedule_confirm)}</button></div><div class="schedule-hint">${esc(L.schedule_hint)}</div>${error}<button class="schedule-close" data-action="schedule-close">${esc(L.schedule_close)}</button></div>${notice}`;
  }
  _render(){
   if(!this._hass||!this._config)return;
   const c=this._config;
   const L={idle:"Idle",running:"Running",paused:"Paused",unavailable:"Unavailable",delayed:"Delayed start",cancel:"Cancel scheduled start",confirm_cancel:"Confirm cancellation",schedule:"Schedule start",schedule_at:"Start at",schedule_confirm:"Schedule",schedule_close:"Close",schedule_hint:"Within the next 24 hours",starts:"Starts",estimated_finish:"Estimated finish",program:"Program",remote_on:"Remote enabled",remote_off:"Remote disabled",start:"Start",pause:"Pause",resume:"Resume",details:"Options & details",finish:"Finish",more:"Other",power:"Power",water:"Water",...(c.labels??{})};
   const raw=this._state("state")?.state?.toLowerCase()??"unknown";
   const delay=this._delayedInfo();
   if(!delay.delayed)this._confirmCancel=false;else{this._scheduleOpen=false;this._scheduleNotice="";}
   const running=String(c.state_values?.running??"run,running,washing,drying,active,on").split(",").map(x=>x.trim().toLowerCase()).includes(raw),paused=String(c.state_values?.paused??"pause,paused").split(",").map(x=>x.trim().toLowerCase()).includes(raw),stopped=String(c.state_values?.stopped??"stop,stopped,idle,off,ready,complete,finished").split(",").map(x=>x.trim().toLowerCase()).includes(raw);
   const status=delay.delayed?L.delayed:running?L.running:paused?L.paused:stopped?L.idle:L.unavailable;
   const remote=!c.entities.remote||this._state("remote")?.state==="on";
   const pstate=this._state("program"),programCode=pstate?.state??"—";
   const optionList=Array.isArray(pstate?.attributes?.options)?pstate.attributes.options:[];
   const programName=c.program_labels?.[programCode]??programCode.replaceAll("_"," ");
   const preferred=Array.isArray(c.program_presets)&&c.program_presets.length?c.program_presets:["eco","ai","intensive","express","glasses","extra_silence","pre_wash"];
   const presets=[...new Set(preferred)].filter(x=>typeof x==="string"&&optionList.includes(x)).slice(0,12);
   if(!presets.length)presets.push(...optionList.slice(0,3));
   const icons={eco:"mdi:leaf",ai:"mdi:autorenew",intensive:"mdi:fire",express:"mdi:flash",glasses:"mdi:glass-wine",pre_wash:"mdi:water",extra_silence:"mdi:volume-mute",machine_care:"mdi:auto-fix",pots_and_pans:"mdi:pot-steam",plastics:"mdi:recycle",drinkware:"mdi:glass-cocktail",babycare:"mdi:baby-bottle",...c.program_icons};
   const remaining=optionList.filter(x=>!presets.includes(x));
   const programActiveOutside=!presets.includes(programCode);
   const canProgramChange=!!pstate&&pstate.state!=="unavailable"&&!running&&!delay.delayed;
   const end=this._state("completion")?.state;
   let completion="";
   if(running&&!delay.delayed&&end){const at=new Date(end);if(Number.isFinite(at.getTime()))completion=at.toLocaleTimeString(this._hass.locale?.language??"en",{hour:"2-digit",minute:"2-digit"});}
   const key=delay.delayed?(c.entities.cancel?"cancel":null):stopped?"start":paused?"resume":running?"pause":null;
   const showSchedule=!!c.schedule_service&&!!c.entities.job_state&&stopped&&!delay.delayed&&remote;
   const label=delay.delayed?(this._confirmCancel?L.confirm_cancel:(key?L.cancel:L.delayed)):stopped?L.start:paused?L.resume:running?L.pause:L.unavailable;
   const allowed=!!key&&this._state(key)?.state!=="unavailable"&&!!this._state(key)&&remote;
   const stateColor=delay.delayed?this._css(c.colors?.scheduled,"var(--dw-orange)"):running?this._css(c.colors?.running,"var(--dw-green)"):paused?this._css(c.colors?.paused,"var(--dw-orange)"):"var(--secondary-text-color,#999)";
   const mainColor=this._css(c.colors?.active,"#ff6a00");
   const locale=this._hass.locale?.language??"en";
   const fmtTime=date=>date&&Number.isFinite(date.getTime())?date.toLocaleTimeString(locale,{hour:"2-digit",minute:"2-digit"}):"";
   const scheduledStart=fmtTime(delay.start),scheduledFinish=fmtTime(delay.end);
   const cardStyle="--dw-orange:"+mainColor+";--dw-green:"+this._css(c.colors?.running,"#52dca5")+";--dw-muted:"+this._css(c.colors?.text,"var(--secondary-text-color,#aaa)")+";--dw-columns:"+this._px(c.appearance?.program_columns,8,1,12)+";--dw-program-height:"+this._px(c.appearance?.program_height,45,28,100)+"px;--dw-program-icon-size:"+this._px(c.appearance?.program_icon_size,17,12,40)+"px;--dw-program-font-size:"+this._px(c.appearance?.program_font_size,9,7,18)+"px;--dw-radius:"+this._px(c.appearance?.corner_radius,13,4,30)+"px;--dw-action-height:"+this._px(c.appearance?.action_height,46,30,80)+"px;--dw-segment-background:"+this._css(c.colors?.background,"var(--secondary-background-color,#292929)")+";";
   const segments=presets.map(code=>{
    const selected=programCode===code;
    const programText=c.program_labels?.[code]??code.replaceAll("_"," ");
    return `<button class="segment-btn ${selected?"selected":""}" data-action="program" data-option="${esc(code)}" aria-pressed="${selected}" title="${esc(programText)}" ${!canProgramChange||selected?"disabled":""}><ha-icon icon="${esc(icons[code]??"mdi:playlist-play")}"></ha-icon><span class="segment-label">${esc(c.program_short_labels?.[code]??programText)}</span></button>`;
   });
   if(remaining.length){
    segments.push(`<button class="segment-btn ${programActiveOutside?"selected":""}" data-action="program-more" title="${esc(L.more)}" aria-label="${esc(L.more)}"><ha-icon icon="mdi:dots-horizontal"></ha-icon><span class="segment-label">${esc(L.more)}</span></button>`);
   }
   this.shadowRoot.innerHTML=`<style>${style}</style><ha-card style="--state-color:${stateColor};${esc(cardStyle)}">${c.show_header!==false?`<div class="head"><div class="headtxt"><div class="title">${esc(c.name??"Dishwasher")}</div></div><button class="details" data-action="details" aria-label="${esc(L.details)}"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div>`:""}${c.show_program!==false||c.show_power!==false?`<div class="overview">${c.show_program!==false?`<div class="current"><div class="eyebrow">${esc(L.program)}</div><div class="program-name">${esc(programName)}</div></div>`:""}${c.show_power!==false?`<div class="power"><div class="eyebrow">${esc(L.power)}</div><div class="power-value">${this._number("power")} W</div></div>`:""}</div>`:""}${(c.show_remote_warning!==false&&!remote)||(c.show_completion!==false&&completion)||(c.show_water===true&&!!this._state("water"))||delay.delayed?`<div class="quick-stats">${delay.delayed?`<span class="scheduled"><ha-icon icon="mdi:clock-start"></ha-icon>${esc(L.delayed)}${scheduledStart?` · ${esc(L.starts)} ${esc(scheduledStart)}`:""}${scheduledFinish?` · ${esc(L.estimated_finish)} ${esc(scheduledFinish)}`:""}</span>`:""}${c.show_remote_warning!==false&&!remote?`<span class="warn"><ha-icon icon="mdi:remote-off"></ha-icon>${esc(L.remote_off)}</span>`:""}${c.show_completion!==false&&completion?`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${esc(L.finish)} ${esc(completion)}</span>`:""}${c.show_water===true&&this._state("water")?`<span><ha-icon icon="mdi:water-outline"></ha-icon>${esc(L.water)} : ${this._number("water")} L</span>`:""}</div>`:""}${c.show_selector!==false&&segments.length?`<div class="segment">${segments.join("")}</div>${this._expanded&&remaining.length?`<div class="segment extras">${remaining.map(code=>`<button class="segment-btn ${code===programCode?"selected":""}" data-action="program" data-option="${esc(code)}" aria-pressed="${code===programCode}" title="${esc(c.program_labels?.[code]??code.replaceAll("_"," "))}" ${!canProgramChange||code===programCode?"disabled":""}><ha-icon icon="${esc(icons[code]??"mdi:playlist-play")}"></ha-icon><span class="segment-label">${esc(c.program_short_labels?.[code]??c.program_labels?.[code]??code.replaceAll("_"," "))}</span></button>`).join("")}</div>`:""}`:""}${this._controlsHtml({c,delay,running,key,allowed,remote,label,L,showSchedule})}${this._scheduleHtml({showSchedule,delay,L})}</ha-card>`;
  }
 }
 customElements.define(TYPE,DishwasherCard);
 window.customCards=window.customCards||[];
 window.customCards.push({type:TYPE,name:"Dishwasher Card",description:"Native-feeling dishwasher card with thermostat-style program selector",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-dishwasher-card"});
})();


/* Visual editor: uses Home Assistant's ha-form and entity/select selectors. */
(function registerVisualEditor(){
  const TYPE="dishwasher-card",EDITOR=TYPE+"-editor";
  const Card=customElements.get(TYPE);
  if(!Card||customElements.get(EDITOR))return;
  const SPEC=[{"title":"Général","fields":[{"path":"name","label":"Nom de l’appareil","kind":"text"},{"path":"detail_path","label":"Chemin de la vue détaillée","kind":"text"},{"path":"show_header","label":"Afficher le titre","kind":"bool","default":true},{"path":"show_program","label":"Afficher le programme en cours","kind":"bool","default":true},{"path":"show_power","label":"Afficher la puissance","kind":"bool","default":true},{"path":"show_water","label":"Afficher le volume d’eau cumulé","kind":"bool","default":false},{"path":"show_remote_warning","label":"Avertissement de commande distante","kind":"bool","default":true},{"path":"show_completion","label":"Afficher l’heure de fin","kind":"bool","default":true},{"path":"show_selector","label":"Sélecteur de programmes","kind":"bool","default":true},{"path":"show_controls","label":"Boutons d’action","kind":"bool","default":true}]},{"title":"Entités — lave-vaisselle","fields":[{"path":"entities.state","label":"État de la machine","kind":"entity","domain":"sensor"},{"path":"entities.program","label":"Programme (select)","kind":"entity","domain":"select"},{"path":"entities.remote","label":"Commande distante activée","kind":"entity","domain":"binary_sensor"},{"path":"entities.completion","label":"Heure de fin estimée","kind":"entity","domain":"sensor"},{"path":"entities.power","label":"Puissance instantanée","kind":"entity","domain":"sensor"},{"path":"entities.job_state","label":"État détaillé (delay_washing)","kind":"entity","domain":"sensor"},{"path":"entities.operating_progress","label":"Phase de fonctionnement (delaywash)","kind":"entity","domain":"sensor"},{"path":"entities.time_left_to_start","label":"Minutes avant démarrage","kind":"entity","domain":"sensor"},{"path":"entities.cycle_duration","label":"Durée du cycle (min)","kind":"entity","domain":"sensor"},{"path":"entities.water","label":"Consommation d’eau","kind":"entity","domain":"sensor"},{"path":"entities.start","label":"Bouton de démarrage","kind":"entity","domain":"button"},{"path":"entities.pause","label":"Bouton pause","kind":"entity","domain":"button"},{"path":"entities.resume","label":"Bouton reprise","kind":"entity","domain":"button"},{"path":"entities.cancel","label":"Bouton annuler le départ différé","kind":"entity","domain":"button"},{"path":"schedule_service","label":"Service de programmation (domaine.service)","kind":"text"}]},{"title":"Programmes et personnalisation","fields":[{"path":"program_presets","label":"Programmes rapides (choix et ordre)","kind":"multi"},{"path":"program_labels","label":"Libellés des programmes (code: nom)","kind":"map"},{"path":"program_short_labels","label":"Libellés courts (code: nom)","kind":"map"},{"path":"program_icons","label":"Icônes (code: mdi:icon)","kind":"map"},{"path":"state_values.running","label":"États correspondant à un cycle actif (CSV)","kind":"text"},{"path":"state_values.paused","label":"États correspondant à une pause (CSV)","kind":"text"},{"path":"state_values.stopped","label":"États correspondant à l’arrêt (CSV)","kind":"text"}]},{"title":"Couleurs et disposition","fields":[{"path":"colors.active","label":"Couleur du programme actif","kind":"color","default":"#FF6A00"},{"path":"colors.running","label":"Couleur du cycle en cours","kind":"color","default":"#52DCA5"},{"path":"colors.paused","label":"Couleur d’un cycle en pause","kind":"color","default":"#FFB34E"},{"path":"colors.text","label":"Couleur des intitulés","kind":"color"},{"path":"colors.background","label":"Fond des segments","kind":"color"},{"path":"colors.scheduled","label":"Départ différé","kind":"color","default":"#FF6A00"},{"path":"appearance.program_columns","label":"Nombre de colonnes","kind":"number","default":8,"min":1,"max":12},{"path":"appearance.program_height","label":"Hauteur des programmes (px)","kind":"number","default":45,"min":28,"max":100},{"path":"appearance.program_icon_size","label":"Taille des icônes (px)","kind":"number","default":17,"min":12,"max":40},{"path":"appearance.program_font_size","label":"Taille des libellés (px)","kind":"number","default":9,"min":7,"max":18},{"path":"appearance.corner_radius","label":"Rayon du conteneur (px)","kind":"number","default":13,"min":4,"max":30},{"path":"appearance.action_height","label":"Hauteur des contrôles (px)","kind":"number","default":46,"min":30,"max":80}]},{"title":"Traduction et libellés","fields":[{"path":"labels.idle","label":"idle","kind":"text"},{"path":"labels.running","label":"running","kind":"text"},{"path":"labels.delayed","label":"delayed","kind":"text"},{"path":"labels.starts","label":"starts","kind":"text"},{"path":"labels.estimated_finish","label":"estimated_finish","kind":"text"},{"path":"labels.paused","label":"paused","kind":"text"},{"path":"labels.unavailable","label":"unavailable","kind":"text"},{"path":"labels.program","label":"program","kind":"text"},{"path":"labels.remote_on","label":"remote_on","kind":"text"},{"path":"labels.remote_off","label":"remote_off","kind":"text"},{"path":"labels.start","label":"start","kind":"text"},{"path":"labels.pause","label":"pause","kind":"text"},{"path":"labels.resume","label":"resume","kind":"text"},{"path":"labels.cancel","label":"cancel","kind":"text"},{"path":"labels.confirm_cancel","label":"confirm_cancel","kind":"text"},{"path":"labels.schedule","label":"schedule","kind":"text"},{"path":"labels.schedule_at","label":"schedule_at","kind":"text"},{"path":"labels.schedule_confirm","label":"schedule_confirm","kind":"text"},{"path":"labels.schedule_close","label":"schedule_close","kind":"text"},{"path":"labels.schedule_hint","label":"schedule_hint","kind":"text"},{"path":"labels.details","label":"details","kind":"text"},{"path":"labels.finish","label":"finish","kind":"text"},{"path":"labels.more","label":"more","kind":"text"},{"path":"labels.power","label":"power","kind":"text"},{"path":"labels.water","label":"water","kind":"text"}]}];
  const toKey=path=>path.replaceAll(".","__");
  const get=(obj,path)=>path.split(".").reduce((a,k)=>a?.[k],obj);
  const put=(obj,path,value)=>{
    const keys=path.split("."),stack=[obj];let at=obj;
    for(const k of keys.slice(0,-1)){if(!at[k]||typeof at[k]!=="object"||Array.isArray(at[k]))at[k]={};at=at[k];stack.push(at);}
    const key=keys.at(-1);
    if(value===undefined||value===null||value==="")delete at[key];else at[key]=value;
    for(let i=keys.length-2;i>=0;i--){if(Object.keys(stack[i+1]).length===0)delete stack[i][keys[i]];}
  };
  const mapAsText=v=>Object.entries(v&&typeof v==="object"&&!Array.isArray(v)?v:{}).map(([k,x])=>k+": "+String(x)).join("\n");
  const parseMap=s=>{const out={};for(const line of String(s??"").split(/\r?\n/)){const i=line.indexOf(":");if(i<1)continue;const key=line.slice(0,i).trim(),v=line.slice(i+1).trim();if(/^[\w.-]+$/.test(key)&&v)out[key]=v;}return out};
  const modesAsText=v=>(Array.isArray(v)?v:[]).map(m=>[m.entity??"",m.label??"",m.icon??"mdi:power"].join(" | ")).join("\n");
  const parseModes=s=>String(s??"").split(/\r?\n/).map(l=>l.split("|").map(x=>x.trim())).filter(v=>/^(switch|input_boolean)\.[\w]+$/.test(v[0]??"")).map(([entity,label,icon])=>({entity,label:label||entity.split(".").at(-1),icon:icon||"mdi:power"}));
  const safeColor=s=>typeof s==="string"&&/^#[\da-f]{3,8}$/i.test(s)?s:"#ff6a00";
  class CardVisualEditor extends HTMLElement {
    constructor(){super();this.attachShadow({mode:"open"});this._config={type:"custom:"+TYPE};this._hass=undefined;this._rendered=false;}
    setConfig(config){this._config=JSON.parse(JSON.stringify(config??{type:"custom:"+TYPE}));this._render();}
    set hass(hass){this._hass=hass;if(!this._rendered)this._render();else{for(const form of this.shadowRoot.querySelectorAll("ha-form"))form.hass=hass;this._refreshProgramOptions();}}
    _refreshProgramOptions(){if(TYPE!=="dishwasher-card")return;const idx=SPEC.findIndex(g=>g.fields.some(f=>f.kind==="multi"));if(idx<0)return;const form=this.shadowRoot.querySelector('ha-form[data-group="'+idx+'"]');if(form)form.schema=SPEC[idx].fields.map(f=>this._fieldSchema(f));}
    _options(){
      if(TYPE!=="dishwasher-card")return [];
      const id=this._config.entities?.program;
      const options=this._hass?.states?.[id]?.attributes?.options;
      const list=[...(Array.isArray(options)?options:[]),...(this._config.program_presets??[])];
      return [...new Set(list.filter(x=>typeof x==="string"&&x.trim()))].map(code=>({value:code,label:this._config.program_labels?.[code]??code.replaceAll("_"," ")}));
    }
    _fieldSchema(field){
      const schema={name:toKey(field.path)};
      if(field.kind==="entity")schema.selector={entity:field.domain?{filter:{domain:field.domain}}:{}};
      else if(field.kind==="bool")schema.selector={boolean:{}};
      else if(field.kind==="number")schema.selector={number:{min:field.min??0,max:field.max??500,step:field.step??1,mode:"box"}};
      else if(field.kind==="multi"){const opts=this._options();schema.selector={select:{options:opts.length?opts:[{value:"eco",label:"eco"}],multiple:true,reorder:true,mode:"dropdown"}};}
      else schema.selector={text:field.kind==="map"||field.kind==="modes"?{multiline:true}:{}};
      return schema;
    }
    _fieldValue(f){
      const v=get(this._config,f.path);
      return f.kind==="map"?mapAsText(v):f.kind==="modes"?modesAsText(v):f.kind==="multi"?(Array.isArray(v)?v:[]):v??f.default;
    }
    _onForm(group,values){
      const next=JSON.parse(JSON.stringify(this._config));
      for(const f of group.fields){
        const key=toKey(f.path);if(!Object.prototype.hasOwnProperty.call(values,key))continue;
        let value=values[key];
        if(f.kind==="map")value=parseMap(value);
        if(f.kind==="modes")value=parseModes(value);
        if(f.kind==="multi")value=Array.isArray(value)?value:[];
        if(f.kind==="number"&&value!=="")value=Number(value);
        put(next,f.path,value);
      }
      const oldProgram=this._config.entities?.program;
      this._config=next;
      if(next.entities?.program!==oldProgram)this._refreshProgramOptions();
      this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:next},bubbles:true,composed:true}));
    }
    _render(){
      if(!this.isConnected&&!this._hass)return;
      const html=SPEC.map((group,i)=>{const colors=group.fields.filter(f=>f.kind==="color").map(f=>'<label class="palette"><span>'+f.label+'</span><input type="color" data-color="'+f.path+'" value="'+safeColor(get(this._config,f.path)??f.default)+'" aria-label="'+f.label+'"></label>').join("");return '<details '+(i===0||i===1?"open":"")+'><summary>'+group.title+'</summary><div class="content"><ha-form data-group="'+i+'"></ha-form>'+(colors?'<div class="colors"><strong>Palette — sélectionner une couleur</strong><div class="color-grid">'+colors+'</div><small>Les champs texte au-dessus acceptent aussi les variables CSS du thème.</small></div>':"")+'</div></details>';}).join("");
      this.shadowRoot.innerHTML='<style>:host{display:block;color:var(--primary-text-color)}details{border:1px solid var(--divider-color);border-radius:var(--ha-border-radius-md,10px);margin:8px 0;overflow:hidden}summary{padding:14px;font-size:14px;font-weight:600;cursor:pointer;background:var(--secondary-background-color)}.content{padding:14px}ha-form{display:block}ha-form::part(root){display:block}.colors{padding-top:15px;margin-top:10px;border-top:1px solid var(--divider-color)}.colors>strong{font-size:12px}.colors small{display:block;color:var(--secondary-text-color);font-size:11px;margin-top:10px}.color-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:10px}.palette{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:12px}.palette input{width:40px;height:32px;padding:0;border:0;cursor:pointer;background:transparent}summary:focus-visible{outline:2px solid var(--primary-color)}</style>'+html;
      this._rendered=true;
      SPEC.forEach((group,i)=>{
        const form=this.shadowRoot.querySelector('ha-form[data-group="'+i+'"]');
        if(!form)return;
        form.hass=this._hass;
        form.schema=group.fields.map(f=>this._fieldSchema(f));
        form.data=Object.fromEntries(group.fields.map(f=>[toKey(f.path),this._fieldValue(f)]).filter(([,v])=>v!==undefined));
        form.computeLabel=schema=>group.fields.find(f=>toKey(f.path)===schema.name)?.label??schema.name;
        form.computeHelper=schema=>group.fields.find(f=>toKey(f.path)===schema.name)?.help;
        form.addEventListener("value-changed",ev=>{ev.stopPropagation();if(ev.detail?.value&&typeof ev.detail.value==="object")this._onForm(group,ev.detail.value);});
        for(const input of this.shadowRoot.querySelectorAll("input[data-color]")){if(!group.fields.some(f=>f.path===input.dataset.color))continue;input.addEventListener("input",()=>{const field=group.fields.find(f=>f.path===input.dataset.color),value=input.value;form.data={...(form.data??{}),[toKey(field.path)]:value};this._onForm({fields:[field]},{[toKey(field.path)]:value});});}
      });
    }
    connectedCallback(){if(!this._rendered)this._render();}
  }
  customElements.define(EDITOR,CardVisualEditor);
  Card.getConfigElement=()=>document.createElement(EDITOR);
})();
