/* Dishwasher Card — MIT, 2026. Experimental version; validate on a real Home Assistant instance before releasing. */
(function DishwasherCardModule(){
  const TYPE="dishwasher-card";
  if(customElements.get(TYPE))return;
  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  const ico=(p,n=20)=>`<svg width="${n}" height="${n}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
  const I={
    dish:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M4 8h16"/><circle cx="12" cy="15" r="4"/><path d="M7 5h.01M10 5h.01"/>',
    play:'<path d="m8 5 11 7-11 7V5Z"/>',
    pause:'<path d="M8 5v14M16 5v14"/>',
    chevron:'<path d="m9 18 6-6-6-6"/>',
    bolt:'<path d="m13 2-9 12h7l-1 8 10-12h-7V2"/>',
    remote:'<rect x="7" y="2" width="10" height="20" rx="3"/><circle cx="12" cy="7" r="1"/><path d="M10 12h4M10 16h4"/>',
    timer:'<circle cx="12" cy="13" r="9"/><path d="M12 7v6l4 2M9 2h6"/>',
    tune:'<path d="M4 7h16M4 17h16"/><circle cx="9" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="15" cy="17" r="2" fill="currentColor" stroke="none"/>',
    water:'<path d="M12 22a8 8 0 0 0 8-8c0-4-8-12-8-12S4 10 4 14a8 8 0 0 0 8 8Z"/>'
  };
  const style=`
    :host{display:block;--dw-blue:#68b5ff;--dw-green:#52dcb1;--dw-orange:#ffb34e;--dw-muted:var(--secondary-text-color,#aaa)}
    *{box-sizing:border-box}
    ha-card{display:block;background:var(--ha-card-background,var(--card-background-color,#1b1b1b));border:1px solid var(--divider-color,#383838);border-radius:17px;overflow:hidden;color:var(--primary-text-color,#fafafa)}
    .head{display:flex;align-items:center;gap:12px;height:54px;padding:10px 15px;border-bottom:1px solid var(--divider-color,#363636)}
    .appico{width:33px;height:33px;display:grid;place-items:center;background:color-mix(in srgb,var(--dw-blue) 13%,transparent);border-radius:10px;color:var(--dw-blue)}
    .headtxt{min-width:0;flex:1}.title{font-size:15px;font-weight:650}.sub{margin-top:2px;color:var(--dw-muted);font-size:11px;display:flex;align-items:center;gap:5px}
    .dot{height:6px;width:6px;background:var(--accent);border-radius:50%;box-shadow:0 0 7px color-mix(in srgb,var(--accent) 45%,transparent)}
    .details{background:none;border:0;color:var(--dw-muted);cursor:pointer;padding:7px;border-radius:8px}
    .details:hover,.button:hover{filter:brightness(1.15)}
    .hero{display:grid;grid-template-columns:140px 1fr;align-items:center;gap:14px;padding:13px 18px 12px;min-height:155px}
    .dial{height:137px;width:137px;position:relative;display:grid;place-items:center}
    .dial::before{content:"";position:absolute;inset:9px;border:8px solid #33373d;border-radius:50%}
    .dial::after{content:"";position:absolute;inset:9px;border:8px solid transparent;border-top-color:var(--accent);border-right-color:var(--accent);border-radius:50%;transform:rotate(-40deg);opacity:.85}
    .dial.running::after{animation:cycle 5s linear infinite}
    .dial.paused::after{opacity:.45}
    .dial-core{width:99px;height:99px;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:linear-gradient(135deg,#272d33,#151719);border:1px solid #454b50;z-index:1;box-shadow:inset 0 0 18px #0007}
    .dial-core svg{color:var(--accent)}.mode{font-size:12px;font-weight:700;letter-spacing:.02em}.mini{font-size:10px;color:var(--dw-muted)}
    @keyframes cycle{to{transform:rotate(320deg)}}
    .reading{min-width:0}.eyebrow{font-size:10px;text-transform:uppercase;color:var(--dw-muted);letter-spacing:.1em;font-weight:700}
    .program{font-size:24px;font-weight:650;line-height:1.25;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;letter-spacing:-.03em}
    .datum{display:flex;gap:6px;align-items:center;margin-top:12px;font-size:12px;color:var(--dw-muted);white-space:nowrap}
    .datum b{color:var(--primary-text-color,#f6f6f6);font-weight:650}.divider{height:1px;background:var(--divider-color,#363636);margin-top:9px}
    .line{display:flex;justify-content:space-between;align-items:center;gap:9px;padding:0 14px 11px;color:var(--dw-muted);font-size:11px}
    .line span{display:flex;align-items:center;gap:5px}.line b{color:var(--primary-text-color,#eee)}.line .bad{color:var(--dw-orange)}
    .controls{border-top:1px solid var(--divider-color,#353535);padding:10px 12px 12px;display:grid;grid-template-columns:1.35fr 1fr;gap:8px}
    .button{height:44px;display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--divider-color,#383838);border-radius:10px;font-family:inherit;font-size:12px;font-weight:650;cursor:pointer;transition:transform .13s,background .13s}
    .button:active{transform:scale(.98)}.button:disabled{opacity:.48;cursor:not-allowed}
    .primary{background:color-mix(in srgb,var(--accent) 16%,var(--secondary-background-color,#272727));color:var(--accent);border-color:color-mix(in srgb,var(--accent) 30%,#343434)}
    .secondary{background:var(--secondary-background-color,#292929);color:var(--primary-text-color,#eee)}
    @media(max-width:355px){.hero{grid-template-columns:115px 1fr;padding:10px 11px;gap:5px}.dial{width:111px;height:111px}.dial-core{width:78px;height:78px}.program{font-size:21px}.mode{font-size:10px}}
  `;
  class DishwasherCard extends HTMLElement{
    constructor(){super();this.attachShadow({mode:"open"});this.shadowRoot.addEventListener("click",e=>this._click(e));}
    setConfig(config){if(!config?.entities?.state||!config.entities.program)throw Error("Dishwasher Card: entities.state and entities.program are required");this._config=config;this._signature="";this._render();}
    set hass(hass){this._hass=hass;const keys=Object.values(this._config?.entities??{}).filter(x=>typeof x==="string");const sig=keys.map(id=>`${id}:${hass.states[id]?.state??"unknown"}`).join("|");if(sig!==this._signature){this._signature=sig;this._render();}}
    getCardSize(){return 5;}
    getGridOptions(){return {columns:12,rows:5,min_rows:4};}
    static getStubConfig(){return {name:"Dishwasher",entities:{state:"sensor.dishwasher_state",program:"select.dishwasher_program"}};}
    _state(key){const id=this._config?.entities?.[key];return id?this._hass?.states?.[id]??null:null;}
    _number(key){const st=this._state(key),n=Number(st?.state);return st&&Number.isFinite(n)?Math.round(n).toLocaleString(this._hass?.locale?.language??"en"):"—";}
    _moreInfo(id){if(id)this.dispatchEvent(new CustomEvent("hass-more-info",{detail:{entityId:id},bubbles:true,composed:true}));}
    _click(e){const el=e.target.closest("[data-action]");if(!el)return;const action=el.dataset.action;if(action==="details"){if(this._config?.detail_path){history.pushState(null,"",this._config.detail_path);window.dispatchEvent(new Event("location-changed"));}else this._moreInfo(this._config.entities.state);return;}if(action!=="command")return;if(this._config.entities.remote&&this._state("remote")?.state!=="on")return;const id=this._config.entities[el.dataset.key];if(!id||!this._hass?.states?.[id])return;this._hass.callService("button","press",{entity_id:id}).catch(err=>console.error("Dishwasher Card:",err));}
    _render(){
      if(!this._config||!this._hass)return;
      const L={idle:this._config.labels?.idle??"Idle",running:this._config.labels?.running??"Running",paused:this._config.labels?.paused??"Paused",unavailable:this._config.labels?.unavailable??"Unavailable",program:this._config.labels?.program??"Program",remote_on:this._config.labels?.remote_on??"Remote enabled",remote_off:this._config.labels?.remote_off??"Remote disabled",start:this._config.labels?.start??"Start",pause:this._config.labels?.pause??"Pause",resume:this._config.labels?.resume??"Resume",details:this._config.labels?.details??"Options & details",finish:this._config.labels?.finish??"Finish"};
      const raw=this._state("state")?.state?.toLowerCase()??"unknown";
      const running=["run","running","washing","drying","active","on"].includes(raw),paused=["pause","paused"].includes(raw),stopped=["stop","stopped","idle","off","ready","complete","finished"].includes(raw);
      const stateName=running?L.running:paused?L.paused:stopped?L.idle:L.unavailable;
      const accent=running?"var(--dw-green)":paused?"var(--dw-orange)":"var(--dw-blue)";
      const remote=!this._config.entities.remote||this._state("remote")?.state==="on";
      const programCode=this._state("program")?.state??"—";
      const program=this._config.program_labels?.[programCode]??programCode.replaceAll("_"," ");
      const end=this._state("completion")?.state;
      let completion="";
      if(running&&end){const at=new Date(end);if(Number.isFinite(at.getTime()))completion=at.toLocaleTimeString(this._hass.locale?.language??"en",{hour:"2-digit",minute:"2-digit"});}
      const key=stopped?"start":paused?"resume":running?"pause":null,label=stopped?L.start:paused?L.resume:running?L.pause:L.unavailable;
      const allowed=!!key&&!!this._state(key)&&remote;
      this.shadowRoot.innerHTML=`<style>${style}</style><ha-card style="--accent:${accent}"><div class="head"><div class="appico">${ico(I.dish)}</div><div class="headtxt"><div class="title">${esc(this._config.name||"Dishwasher")}</div><div class="sub"><i class="dot"></i>${esc(stateName)}</div></div><button class="details" data-action="details" aria-label="Details">${ico(I.chevron,19)}</button></div><div class="hero"><div class="dial ${running?"running":paused?"paused":""}"><div class="dial-core">${ico(running?I.water:paused?I.pause:I.dish,26)}<span class="mode">${esc(running?L.running.toUpperCase():paused?L.paused.toUpperCase():L.idle.toUpperCase())}</span><span class="mini">${esc(completion?`${L.finish} ${completion}`:"")}</span></div></div><div class="reading"><div class="eyebrow">${esc(L.program)}</div><div class="program" title="${esc(program)}">${esc(program)}</div><div class="divider"></div><div class="datum">${ico(I.bolt,16)}<b>${this._number("power")} W</b></div>${completion?`<div class="datum">${ico(I.timer,16)}${esc(L.finish)} <b>${esc(completion)}</b></div>`:""}</div></div><div class="line"><span class="${remote?"":"bad"}">${ico(I.remote,14)}<b>${esc(remote?L.remote_on:L.remote_off)}</b></span>${this._config.entities.water?`<span>${ico(I.water,14)}${this._number("water")} L</span>`:""}</div><div class="controls"><button class="button primary" data-action="command" data-key="${key??""}" ${!allowed?"disabled":""}>${ico(running?I.pause:I.play,18)}${esc(remote?label:L.remote_off)}</button><button class="button secondary" data-action="details">${ico(I.tune,18)}${esc(L.details)}</button></div></ha-card>`;
    }
  }
  customElements.define(TYPE,DishwasherCard);
  window.customCards=window.customCards||[];
  window.customCards.push({type:TYPE,name:"Dishwasher Card",description:"Compact device-agnostic dishwasher card with configurable Home Assistant entities",preview:false,documentationURL:"https://github.com/Sr-0w/lovelace-dishwasher-card"});
})();
