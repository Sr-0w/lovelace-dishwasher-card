/*
 * Dishwasher Card for Home Assistant
 * https://github.com/Sr-0w/lovelace-dishwasher-card
 * MIT License
 */
(() => {
  const VERSION = "1.0.0";
  const TYPE = "dishwasher-card";
  const EDITOR = `${TYPE}-editor`;
  if (customElements.get(TYPE)) return;

  /* ------------------------------------------------------------------ */
  /* Helpers                                                             */
  /* ------------------------------------------------------------------ */

  const esc = (v) =>
    String(v ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const norm = (v) => String(v ?? "").trim().toLowerCase().replace(/[\s-]+/g, "_");
  const lang = (hass) => String(hass?.locale?.language ?? hass?.language ?? "en").toLowerCase().split(/[-_]/)[0];
  const INVALID = new Set(["unknown", "unavailable", "none", ""]);
  const valid = (st) => !!st && !INVALID.has(String(st.state).toLowerCase());
  const clamp = (v, fallback, min, max) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const csv = (v, fallback) => (v == null || v === "" ? fallback : String(v).split(",").map(norm).filter(Boolean));

  // Theme colour names offered by Home Assistant's own colour picker (ui_color selector).
  const THEME_COLORS = new Set([
    "primary", "accent", "red", "pink", "purple", "deep-purple", "indigo", "blue", "light-blue", "cyan", "teal",
    "green", "light-green", "lime", "yellow", "amber", "orange", "deep-orange", "brown", "light-grey", "grey",
    "dark-grey", "blue-grey", "black", "white", "disabled",
  ]);
  const cssColor = (value, fallback) => {
    if (Array.isArray(value) && value.length === 3 && value.every((n) => Number.isFinite(Number(n)))) {
      return `rgb(${value.map((n) => Math.max(0, Math.min(255, Math.round(Number(n))))).join(",")})`;
    }
    if (typeof value !== "string") return fallback;
    const v = value.trim();
    if (/^#[0-9a-f]{3,8}$/i.test(v)) return v;
    if (/^(rgb|rgba|hsl|hsla)\([\d\s.,%/]+\)$/i.test(v)) return v;
    if (/^var\(--[a-z0-9-]+(\s*,\s*#[0-9a-f]{3,8})?\)$/i.test(v)) return v;
    if (THEME_COLORS.has(v)) return `var(--${v}-color)`;
    return fallback;
  };

  // Durations: HA reports them in s, min, h or d (device_class duration), sometimes as "H:MM:SS".
  const toMinutes = (st) => {
    if (!valid(st)) return null;
    const raw = String(st.state);
    if (/^\d+:\d{2}(:\d{2})?$/.test(raw)) {
      const [h, m, s = 0] = raw.split(":").map(Number);
      return h * 60 + m + s / 60;
    }
    const n = Number(raw);
    if (!Number.isFinite(n)) return null;
    const unit = String(st.attributes?.unit_of_measurement ?? "min").toLowerCase();
    if (unit === "s") return n / 60;
    if (unit === "h") return n * 60;
    if (unit === "d") return n * 1440;
    return n;
  };
  const toDate = (st) => {
    if (!valid(st)) return null;
    const d = new Date(st.state);
    return Number.isFinite(d.getTime()) ? d : null;
  };
  const updatedAt = (st) => {
    const t = new Date(st?.last_updated ?? st?.last_changed ?? Date.now()).getTime();
    return Number.isFinite(t) ? t : Date.now();
  };

  /* ------------------------------------------------------------------ */
  /* Translations                                                        */
  /* ------------------------------------------------------------------ */

  const STRINGS = {
    en: {
      dishwasher: "Dishwasher", idle: "Idle", running: "Running", paused: "Paused", finished: "Finished",
      unavailable: "Unavailable", attention: "Needs attention", delayed: "Delayed start", program: "Program",
      power: "Power", water: "Water", finish: "Ends", starts: "Starts", estimated_finish: "Ends", start: "Start",
      pause: "Pause", resume: "Resume", stop: "Stop", cancel: "Cancel delayed start", confirm_cancel: "Confirm cancellation",
      schedule: "Delay start", schedule_at: "Start at", schedule_confirm: "Schedule", schedule_close: "Close",
      schedule_hint: "Within the next {hours} h", schedule_sent: "Delayed start requested", invalid_time: "Invalid time",
      out_of_range: "Pick a time within the next {hours} h", remote_off: "Remote control off", more: "More",
      details: "Details", door_open: "Door open", setup: "Pick your dishwasher in the card editor.",
    },
    fr: {
      dishwasher: "Lave-vaisselle", idle: "À l’arrêt", running: "En cours", paused: "En pause", finished: "Terminé",
      unavailable: "Indisponible", attention: "Intervention requise", delayed: "Départ programmé", program: "Programme",
      power: "Puissance", water: "Eau", finish: "Fin", starts: "Début", estimated_finish: "Fin estimée", start: "Démarrer",
      pause: "Pause", resume: "Reprendre", stop: "Arrêter", cancel: "Annuler le départ", confirm_cancel: "Confirmer l’annulation",
      schedule: "Différer", schedule_at: "Départ à", schedule_confirm: "Programmer", schedule_close: "Fermer",
      schedule_hint: "Dans les {hours} prochaines heures", schedule_sent: "Départ différé demandé", invalid_time: "Heure invalide",
      out_of_range: "Choisissez une heure dans les {hours} prochaines heures", remote_off: "Commande à distance désactivée",
      more: "Autres", details: "Détails", door_open: "Porte ouverte", setup: "Choisissez votre lave-vaisselle dans l’éditeur de la carte.",
    },
    de: {
      dishwasher: "Geschirrspüler", idle: "Aus", running: "Läuft", paused: "Pausiert", finished: "Fertig",
      unavailable: "Nicht verfügbar", attention: "Eingriff nötig", delayed: "Startzeitvorwahl", program: "Programm",
      power: "Leistung", water: "Wasser", finish: "Ende", starts: "Start", estimated_finish: "Ende ca.", start: "Starten",
      pause: "Pause", resume: "Fortsetzen", stop: "Stoppen", cancel: "Startvorwahl abbrechen", confirm_cancel: "Abbruch bestätigen",
      schedule: "Später starten", schedule_at: "Start um", schedule_confirm: "Planen", schedule_close: "Schließen",
      schedule_hint: "Innerhalb der nächsten {hours} Std.", schedule_sent: "Startzeitvorwahl gesendet", invalid_time: "Ungültige Uhrzeit",
      out_of_range: "Bitte eine Zeit in den nächsten {hours} Std. wählen", remote_off: "Fernstart deaktiviert", more: "Mehr",
      details: "Details", door_open: "Tür offen", setup: "Wählen Sie Ihren Geschirrspüler im Karteneditor.",
    },
    nl: {
      dishwasher: "Vaatwasser", idle: "Uit", running: "Bezig", paused: "Gepauzeerd", finished: "Klaar",
      unavailable: "Niet beschikbaar", attention: "Actie vereist", delayed: "Uitgestelde start", program: "Programma",
      power: "Vermogen", water: "Water", finish: "Klaar om", starts: "Start", estimated_finish: "Klaar om", start: "Starten",
      pause: "Pauze", resume: "Hervatten", stop: "Stoppen", cancel: "Uitgestelde start annuleren", confirm_cancel: "Annulering bevestigen",
      schedule: "Later starten", schedule_at: "Starten om", schedule_confirm: "Plannen", schedule_close: "Sluiten",
      schedule_hint: "Binnen de komende {hours} uur", schedule_sent: "Uitgestelde start aangevraagd", invalid_time: "Ongeldige tijd",
      out_of_range: "Kies een tijd binnen de komende {hours} uur", remote_off: "Bediening op afstand uit", more: "Meer",
      details: "Details", door_open: "Deur open", setup: "Kies je vaatwasser in de kaarteditor.",
    },
    es: {
      dishwasher: "Lavavajillas", idle: "Apagado", running: "En marcha", paused: "En pausa", finished: "Terminado",
      unavailable: "No disponible", attention: "Requiere atención", delayed: "Inicio diferido", program: "Programa",
      power: "Potencia", water: "Agua", finish: "Fin", starts: "Inicio", estimated_finish: "Fin estimado", start: "Iniciar",
      pause: "Pausa", resume: "Reanudar", stop: "Detener", cancel: "Cancelar inicio diferido", confirm_cancel: "Confirmar cancelación",
      schedule: "Diferir", schedule_at: "Iniciar a las", schedule_confirm: "Programar", schedule_close: "Cerrar",
      schedule_hint: "En las próximas {hours} h", schedule_sent: "Inicio diferido solicitado", invalid_time: "Hora no válida",
      out_of_range: "Elige una hora en las próximas {hours} h", remote_off: "Control remoto desactivado", more: "Más",
      details: "Detalles", door_open: "Puerta abierta", setup: "Elige tu lavavajillas en el editor de la tarjeta.",
    },
    it: {
      dishwasher: "Lavastoviglie", idle: "Spenta", running: "In funzione", paused: "In pausa", finished: "Terminato",
      unavailable: "Non disponibile", attention: "Intervento richiesto", delayed: "Partenza ritardata", program: "Programma",
      power: "Potenza", water: "Acqua", finish: "Fine", starts: "Inizio", estimated_finish: "Fine prevista", start: "Avvia",
      pause: "Pausa", resume: "Riprendi", stop: "Ferma", cancel: "Annulla partenza ritardata", confirm_cancel: "Conferma annullamento",
      schedule: "Ritarda", schedule_at: "Avvio alle", schedule_confirm: "Programma", schedule_close: "Chiudi",
      schedule_hint: "Entro le prossime {hours} ore", schedule_sent: "Partenza ritardata richiesta", invalid_time: "Ora non valida",
      out_of_range: "Scegli un orario entro le prossime {hours} ore", remote_off: "Controllo remoto disattivato", more: "Altro",
      details: "Dettagli", door_open: "Sportello aperto", setup: "Scegli la lavastoviglie nell’editor della scheda.",
    },
  };
  const LABEL_KEYS = Object.keys(STRINGS.en).filter((k) => !["setup", "dishwasher"].includes(k));

  /* ------------------------------------------------------------------ */
  /* States, phases, programs                                            */
  /* ------------------------------------------------------------------ */

  // Normalised state values, covering SmartThings, Home Connect, Miele, LG ThinQ, Electrolux and others.
  const STATE_DEFAULTS = {
    running: ["run", "running", "in_use", "washing", "wash", "rinsing", "rinse", "drying", "dry", "prewash", "pre_wash",
      "main_wash", "program_running", "in_progress", "operating", "working", "busy", "cleaning", "detecting", "draining",
      "heating", "sanitizing", "active", "started"],
    paused: ["pause", "paused", "suspended", "hold", "rinse_hold", "program_interrupted", "interrupted"],
    delayed: ["delayedstart", "delayed_start", "delay_start", "delay_wash", "delay_washing", "delaywash", "delaywashing",
      "programmed_waiting_to_start", "waiting_to_start", "reserved", "reservation", "scheduled", "scheduled_start", "delayed"],
    finished: ["finished", "finish", "end", "ended", "program_ended", "complete", "completed", "done"],
    stopped: ["stop", "stopped", "idle", "off", "on", "ready", "inactive", "standby", "programmed", "power_off", "sleep",
      "not_running", "initial", "none"],
    attention: ["error", "failure", "fault", "actionrequired", "action_required", "service", "alarm"],
  };

  // Map any vendor phase to one of four steps: pre-wash, wash, rinse, drying.
  const STEP_RULES = [[/pre|soak/, 0], [/rins/, 2], [/dry|cool|air|fan/, 3], [/wash|clean|main|sanit|steam|heat/, 1]];
  const stepOf = (code) => {
    const s = norm(code);
    if (!s || /^(none|not_running|idle|ready|off|finish|finished|end|delay|delay_wash|delay_washing)$/.test(s)) return -1;
    for (const [re, i] of STEP_RULES) if (re.test(s)) return i;
    return -2; // active, but in a phase we cannot place
  };
  const PHASE_ICONS = { pre_drain: "mdi:water-pump", draining: "mdi:water-pump", cooling: "mdi:snowflake",
    air_wash: "mdi:fan", spin: "mdi:rotate-right" };
  const STEP_ICONS = ["mdi:water-sync", "mdi:dishwasher", "mdi:water", "mdi:heat-wave"];

  const PROGRAM_ICONS = [
    [/^eco|eco_?50|green/, "mdi:leaf"],
    [/^(ai|auto|smart|sensor)/, "mdi:autorenew"],
    [/baby/, "mdi:baby-bottle"],
    [/pot|pan|heavy|intens|power|strong/, "mdi:pot-steam"],
    [/express|quick|fast|short|speed|rapid|turbo|1_?h|hour|half/, "mdi:flash"],
    [/glas|delicate|gentle|crystal|fragile/, "mdi:glass-wine"],
    [/drink/, "mdi:glass-cocktail"],
    [/plastic/, "mdi:recycle"],
    [/silen|quiet|night/, "mdi:volume-mute"],
    [/pre_?wash|pre_?rinse|rinse|soak|pre_?blast/, "mdi:water"],
    [/care|self_?clean|clean|hygien|sanit|steril/, "mdi:auto-fix"],
    [/dry/, "mdi:heat-wave"],
    [/normal|daily|standard|universal|regular|everyday|chef/, "mdi:dishwasher"],
  ];
  // Vendor prefixes such as Home Connect's "dishcare_dishwasher_program_" carry no meaning.
  const bareProgram = (code) => norm(code).replace(/^.*?_program_/, "");
  const programIcon = (code, custom) => custom?.[code] ?? PROGRAM_ICONS.find(([re]) => re.test(bareProgram(code)))?.[1] ?? "mdi:playlist-play";
  const PRESET_PRIORITY = [/^eco/, /^(ai|auto|smart)/, /intens|heavy|power|pots/, /express|quick|fast|short|speed|rapid/,
    /glas|delicate|gentle|crystal/, /silen|night|quiet/, /pre_?wash|rinse/];
  const defaultPresets = (options) => {
    const picked = [];
    for (const re of PRESET_PRIORITY) {
      const hit = options.find((o) => re.test(bareProgram(o)) && !picked.includes(o));
      if (hit) picked.push(hit);
    }
    for (const o of options) if (picked.length < 7 && !picked.includes(o)) picked.push(o);
    return picked.slice(0, 7);
  };

  /* ------------------------------------------------------------------ */
  /* Entity discovery                                                    */
  /* ------------------------------------------------------------------ */

  // Entity ids start with the device name; that prefix says nothing about the entity itself.
  const slug = (v) => String(v ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  const devicePrefixes = (hass, deviceId) => {
    const d = hass?.devices?.[deviceId];
    return d ? [d.name_by_user, d.name].filter(Boolean).map(slug).filter(Boolean).sort((a, b) => b.length - a.length) : [];
  };
  const stripPrefix = (obj, prefixes) => {
    for (const p of prefixes) if (obj.startsWith(`${p}_`)) return obj.slice(p.length + 1);
    return obj;
  };
  const deviceEntities = (hass, deviceId) => {
    const out = [];
    const prefixes = devicePrefixes(hass, deviceId);
    if (!deviceId || !hass?.entities) return out;
    for (const e of Object.values(hass.entities)) {
      if (e.device_id !== deviceId || e.hidden) continue;
      const st = hass.states?.[e.entity_id];
      if (!st) continue;
      const [domain, object] = e.entity_id.split(".");
      out.push({
        id: e.entity_id, domain, key: norm(e.translation_key), obj: stripPrefix(norm(object), prefixes),
        dc: st.attributes?.device_class, unit: st.attributes?.unit_of_measurement, category: e.entity_category, st,
      });
    }
    return out;
  };
  const DURATION_UNITS = /^(s|min|h|d)$/;

  const detectEntities = (hass, deviceId) => {
    const list = deviceEntities(hass, deviceId), used = new Set(), out = {};
    const has = (e, re) => re.test(e.key) || re.test(e.obj);
    const where = (domains, re, extra, not) => list
      .filter((e) => domains.includes(e.domain) && (!re || has(e, re)) && (!not || !has(e, not)) && (!extra || extra(e)))
      .sort((a, b) => (a.category ? 1 : 0) - (b.category ? 1 : 0));
    const take = (key, ...groups) => {
      const e = groups.flat().find((c) => !used.has(c.id));
      if (e) { out[key] = e.id; used.add(e.id); }
    };
    const isDuration = (e) => e.dc === "duration" || DURATION_UNITS.test(String(e.unit ?? ""));

    take("state",
      where(["sensor"], /machine_state|operation_state|operating_state|appliance_state|run_state|current_status|program_state/),
      where(["sensor"], /(^|_)status$|(^|_)state$/, null, /door|job|phase|filter|child|remote|connect|wifi|salt|rinse_aid|detailed/),
      where(["select"], /operating_state|machine_state|operation_state/));
    take("program",
      where(["select", "input_select"], /selected_program|washing_course|program|course|cycle/, null,
        /zone|operating|state|delay|start|option|level|temperature|phase/),
      where(["sensor"], /(^|_)program($|_id|_type|_name)|washing_course|(^|_)course$|(^|_)cycle$/, null, /phase|state|progress|time/));
    take("phase", where(["sensor"], /(^|_)job_state$|program_phase|cycle_phase|wash_phase|(^|_)phase$|process_state|current_course|run_phase/, null, /detailed/));
    take("job_state", where(["sensor"], /detailed_job_state|detailed_state|operating_progress/));
    take("completion", where(["sensor"], /completion|finish|end_time|ends?_at|program_end|estimated_end/, (e) => e.dc === "timestamp"));
    take("delayed_start_time", where(["sensor"], /delay|start_time|starts?_at|scheduled_start/, (e) => e.dc === "timestamp"));
    take("time_left_to_start", where(["sensor"], /start_time|time_to_start|start_in|starts_in|time_left_to_start|relative_to_start/, isDuration));
    take("remaining", where(["sensor"], /remaining|time_left|left_time|time_to_end|remain/, isDuration, /start/));
    take("elapsed", where(["sensor"], /elapsed|running_time|run_time/, isDuration));
    take("progress", where(["sensor"], /progress/, (e) => e.unit === "%"));
    take("power", where(["sensor"], null, (e) => e.dc === "power"));
    take("water", where(["sensor"], /water/, (e) => e.dc === "water" || /^(l|m³|gal)$/i.test(String(e.unit ?? ""))));
    take("remote", where(["binary_sensor"], /remote_control|remote_start|remote/));
    take("door", where(["binary_sensor"], /door/), where(["binary_sensor"], null, (e) => e.dc === "door"));
    take("start_later", where(["button"], /start_later|delayed_start|delay_start|start_delay/));
    take("delay", where(["number", "input_number"], /delay|start_in|starts_in|start_relative|delayed_start/));
    take("start", where(["button"], /(^|_)start($|_)|start_program|(^|_)run$/, null, /later|delay|reset/));
    take("pause", where(["button"], /pause/));
    take("resume", where(["button"], /resume|continue/));
    take("cancel", where(["button"], /(^|_)cancel$/, null, /drain/), where(["button"], /cancel/));
    take("stop", where(["button"], /(^|_)stop($|_)|abort/));
    return out;
  };

  const deviceName = (hass, deviceId) => {
    const d = hass?.devices?.[deviceId];
    return d ? d.name_by_user || d.name || "" : "";
  };

  // Find the most dishwasher-looking device, for the card picker preview.
  const findDevice = (hass) => {
    let best = null;
    for (const d of Object.values(hass?.devices ?? {})) {
      const text = norm(`${d.name_by_user ?? ""} ${d.name ?? ""} ${d.model ?? ""}`);
      const named = /dish|lave_?vaisselle|vaisselle|geschirr|vaatwas|lavavaj|lavastov|_dw_|^dw_/.test(text);
      if (!named) continue;
      const found = detectEntities(hass, d.id);
      const score = (found.state ? 2 : 0) + (found.program ? 2 : 0) + Object.keys(found).length / 10;
      if (score >= 2 && (!best || score > best.score)) best = { id: d.id, score, entities: found };
    }
    return best;
  };

  /* ------------------------------------------------------------------ */
  /* Styles                                                              */
  /* ------------------------------------------------------------------ */

  const STYLE = `
    :host{display:block;--dw-accent:#ff6a00;--dw-running:#52dca5;--dw-muted:var(--secondary-text-color,#aaa)}
    *{box-sizing:border-box}
    ha-card{display:block;overflow:hidden;color:var(--primary-text-color)}
    .head{position:relative;display:flex;align-items:center;justify-content:center;min-height:48px;padding:13px 50px 8px}
    .title{font-size:var(--ha-font-size-l,16px);font-weight:600;line-height:1.4;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .details{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;cursor:pointer;width:40px;height:40px;display:grid;place-items:center;border-radius:50%;color:var(--dw-muted)}
    .details:hover{background:color-mix(in srgb,var(--primary-text-color) 6%,transparent)}
    .overview{padding:15px 17px 11px;display:flex;align-items:center;justify-content:space-between;gap:10px}
    .current{min-width:0}
    .eyebrow{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--dw-muted)}
    .program-name{font-size:25px;font-weight:650;line-height:1.25;letter-spacing:-.035em;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;margin-top:3px}
    .power{text-align:right;min-width:70px}
    .power-value{font-size:19px;font-weight:600;white-space:nowrap;margin-top:4px}
    .quick-stats{padding:0 17px 12px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 10px;color:var(--dw-muted);font-size:11px}
    .quick-stats span{display:flex;align-items:center;gap:5px}
    .quick-stats ha-icon{--mdc-icon-size:15px}
    .quick-stats .scheduled,.quick-stats .warn{color:var(--dw-scheduled)}
    .quick-stats .error{color:var(--error-color,#db4437)}
    .quick-stats .phase{color:var(--state-color);font-weight:500}
    .quick-stats .phase.live ha-icon{animation:dw-breathe 2.4s ease-in-out infinite}
    .steps{display:grid;grid-template-columns:repeat(var(--dw-steps,4),minmax(0,1fr));gap:4px;padding:0 17px 13px;margin-top:-3px}
    .step{position:relative;height:4px;border-radius:2px;overflow:hidden;background:var(--dw-segment-background);transition:background-color .4s ease}
    .step.done{background:var(--state-color)}
    .step.current{background:color-mix(in srgb,var(--state-color) 32%,transparent)}
    .step.current::after,.bar .fill::after{content:"";position:absolute;top:0;bottom:0;left:0;width:45%;border-radius:2px;background:linear-gradient(90deg,transparent,var(--state-color),transparent);animation:dw-sweep 1.9s cubic-bezier(.4,0,.2,1) infinite}
    .bar{position:relative;height:4px;margin:-3px 17px 13px;border-radius:2px;overflow:hidden;background:var(--dw-segment-background)}
    .bar .fill{position:absolute;inset:0 auto 0 0;border-radius:2px;background:var(--state-color);transition:width .6s ease;overflow:hidden}
    .bar .fill::after{background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent)}
    .paused .step.current{background:var(--state-color);opacity:.55}
    .paused .step.current::after,.paused .fill::after{display:none}
    @keyframes dw-sweep{from{transform:translateX(-100%)}to{transform:translateX(225%)}}
    @keyframes dw-breathe{0%,100%{opacity:1}50%{opacity:.45}}
    @media(prefers-reduced-motion:reduce){.quick-stats .phase.live ha-icon{animation:none}.step.current::after,.bar .fill::after{animation:none;width:100%;transform:none;opacity:.6}}
    .segment{--segment-radius:var(--dw-radius,13px);--segment-inset:3px;margin:8px 12px 10px;padding:var(--segment-inset);display:grid;grid-template-columns:repeat(var(--dw-columns,8),minmax(0,1fr));gap:2px;background:var(--dw-segment-background);border:1px solid var(--divider-color,#393939);border-radius:var(--segment-radius);overflow:hidden}
    .segment.extras{margin-top:-4px;background:transparent;border-style:dashed}
    .segment-btn{height:var(--dw-program-height,45px);min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:3px 1px;border:0;border-radius:calc(var(--segment-radius) - var(--segment-inset) - 1px);background:transparent;color:var(--secondary-text-color,#b8b8b8);font-family:inherit;font-size:var(--dw-program-font-size,9px);font-weight:500;white-space:nowrap;cursor:pointer;transition:background-color .18s,color .18s,transform .12s}
    .segment-label{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2}
    .segment-btn ha-icon{--mdc-icon-size:var(--dw-program-icon-size,17px)}
    .segment-btn.selected{background:var(--dw-accent);color:var(--dw-on-accent,#fff)}
    .segment-btn:disabled{opacity:.35;cursor:not-allowed}
    .segment-btn.selected:disabled{opacity:.8}
    .segment-btn:focus-visible,.button:focus-visible,.details:focus-visible{outline:2px solid var(--primary-color);outline-offset:-2px}
    .segment-btn:active:not(:disabled){transform:scale(.97)}
    .controls{display:grid;grid-template-columns:minmax(0,1fr) 48px;gap:8px;padding:5px 12px 12px}
    .play-split{display:grid;grid-template-columns:minmax(0,1fr) 45px;min-width:0;gap:3px;border-radius:var(--ha-border-radius-lg,10px);overflow:hidden}
    .play-split>.button{border-radius:0}
    .button{height:var(--dw-action-height,46px);display:flex;align-items:center;justify-content:center;gap:7px;border:1px solid var(--divider-color,#404040);border-radius:var(--ha-border-radius-lg,10px);cursor:pointer;font-family:inherit;font-size:13px;font-weight:600;min-width:0}
    .button span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .button:disabled{opacity:.35;cursor:not-allowed}
    .button:active:not(:disabled){transform:scale(.98)}
    .button ha-icon{--mdc-icon-size:20px;flex:none}
    .primary,.schedule-toggle{background:var(--dw-accent);border-color:var(--dw-accent);color:var(--dw-on-accent,#fff)}
    .primary.cancel{background:var(--error-color,#d9534f);border-color:var(--error-color,#d9534f)}
    .secondary{background:var(--dw-segment-background);color:var(--secondary-text-color,#ccc)}
    .secondary ha-icon{--mdc-icon-size:22px}
    .schedule-panel{margin:0 12px 12px;padding:12px;border-radius:var(--ha-border-radius-lg,10px);background:var(--dw-segment-background);border:1px solid var(--divider-color,#444)}
    .schedule-title{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;margin-bottom:10px}
    .schedule-title ha-icon{--mdc-icon-size:18px}
    .schedule-edit{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px}
    .schedule-edit input{min-width:0;width:100%;font:inherit;font-size:19px;color:var(--primary-text-color);background:var(--card-background-color,#202020);border:1px solid var(--divider-color);border-radius:var(--ha-border-radius-md,8px);padding:8px 10px;color-scheme:light dark}
    .schedule-edit button{padding:0 14px;background:var(--dw-accent);color:var(--dw-on-accent,#fff);border:0;border-radius:var(--ha-border-radius-md,8px);font:inherit;font-weight:600;cursor:pointer}
    .schedule-edit button:disabled{opacity:.35}
    .schedule-hint{color:var(--secondary-text-color);font-size:11px;margin-top:8px}
    .schedule-error{color:var(--error-color,#f66);font-size:12px;margin-top:8px}
    .schedule-close{margin-top:7px;padding:4px 0;border:0;background:transparent;color:var(--secondary-text-color);font:inherit;cursor:pointer}
    .setup{display:flex;align-items:center;gap:14px;padding:18px;color:var(--secondary-text-color)}
    .setup ha-icon{--mdc-icon-size:34px;color:var(--dw-accent)}
    @media(max-width:355px){.segment{margin:7px 8px 9px;padding:2px;gap:1px}.segment-btn{height:43px;font-size:8px}.segment-btn ha-icon{--mdc-icon-size:16px}.overview{padding:11px}.program-name{font-size:23px}.controls{padding:8px}.button{font-size:11px}}
  `;

  /* ------------------------------------------------------------------ */
  /* Card                                                                */
  /* ------------------------------------------------------------------ */

  class DishwasherCard extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: "open" });
      this._expanded = false;
      this._confirmCancel = false;
      this._scheduleOpen = false;
      this._scheduleTime = "";
      this._scheduleBusy = false;
      this._scheduleError = "";
      this._scheduleNotice = "";
      this.shadowRoot.addEventListener("click", (e) => this._click(e));
      const keep = (e) => { if (e.target.matches?.("input[data-schedule-time]")) this._scheduleTime = e.target.value; };
      this.shadowRoot.addEventListener("input", keep);
      this.shadowRoot.addEventListener("change", keep);
    }

    static getConfigElement() { return document.createElement(EDITOR); }

    static getStubConfig(hass) {
      const found = findDevice(hass);
      if (!found) return { entities: {} };
      return { device: found.id, entities: found.entities };
    }

    setConfig(config) {
      if (!config || typeof config !== "object") throw new Error("Dishwasher Card: invalid configuration");
      this._config = { ...config, entities: { ...(config.entities ?? {}) } };
      this._detected = null;
      this._signature = "";
      this._render();
    }

    set hass(hass) {
      const first = !this._hass;
      this._hass = hass;
      if (first || hass.entities !== this._entitiesRef) { this._detected = null; this._entitiesRef = hass.entities; }
      const ids = Object.values(this._ents()).filter((x) => typeof x === "string");
      const sig = lang(hass) + "|" + ids.map((id) => {
        const st = hass.states[id];
        return `${id}:${st?.state}:${st?.last_updated}:${st?.attributes?.options?.length ?? ""}`;
      }).join("|");
      if (sig === this._signature) return;
      this._signature = sig;
      if (this._scheduleOpen && this.shadowRoot.activeElement?.matches?.("input[data-schedule-time]")) return;
      this._render();
    }

    getCardSize() { return 7; }
    getGridOptions() { return { columns: 12, rows: "auto", min_columns: 6 }; }

    // Entities: what the user mapped, completed by what the device offers.
    _ents() {
      const c = this._config ?? {};
      if (!c.device || !this._hass) return c.entities ?? {};
      if (!this._detected) this._detected = detectEntities(this._hass, c.device);
      return { ...this._detected, ...c.entities };
    }
    _st(key) { const id = this._ents()[key]; return id ? this._hass?.states?.[id] ?? null : null; }
    _t(key, vars) {
      const c = this._config ?? {};
      let s = c.labels?.[key] ?? STRINGS[lang(this._hass)]?.[key] ?? STRINGS.en[key] ?? key;
      for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, v);
      return s;
    }
    _fmtNumber(st, digits = 0) {
      const n = Number(st?.state);
      return valid(st) && Number.isFinite(n)
        ? n.toLocaleString(lang(this._hass), { maximumFractionDigits: digits, minimumFractionDigits: 0 }) : "—";
    }
    _fmtTime(date) {
      if (!date || !Number.isFinite(date.getTime())) return "";
      const loc = this._hass?.locale ?? {}, opts = { hour: "2-digit", minute: "2-digit" };
      if (loc.time_format === "24") opts.hourCycle = "h23";
      else if (loc.time_format === "12") opts.hour12 = true;
      return date.toLocaleTimeString(loc.language ?? "en", opts);
    }
    _stateName(st, value) {
      if (!st) return value ?? "";
      const raw = value ?? st.state;
      let out = raw;
      try { if (typeof this._hass.formatEntityState === "function") out = this._hass.formatEntityState(st, raw); } catch (_) { /* older frontends */ }
      if (!out || out === raw) out = bareProgram(raw).replaceAll("_", " ").replace(/^./, (ch) => ch.toUpperCase());
      return out;
    }
    _programName(code) {
      const c = this._config;
      return c.program_labels?.[code] ?? this._stateName(this._st("program"), code);
    }

    _status() {
      const c = this._config, sv = c.state_values ?? {};
      const sets = Object.fromEntries(Object.entries(STATE_DEFAULTS).map(([k, def]) => [k, csv(sv[k], def)]));
      const st = this._st("state"), raw = norm(st?.state);
      const job = norm(this._st("job_state")?.state), progress = norm(this._st("operating_progress")?.state);
      if (sets.delayed.includes(raw) || sets.delayed.includes(job) || ["delaywash", "delay_wash", "delaywashing", "delay_washing"].includes(progress)) return "delayed";
      if (!st || ["unavailable", "unknown"].includes(raw)) return "unavailable";
      for (const k of ["paused", "running", "attention", "finished", "stopped"]) if (sets[k].includes(raw)) return k;
      return "stopped";
    }

    _delayInfo() {
      let start = toDate(this._st("delayed_start_time"));
      if (!start) {
        const wait = this._st("time_left_to_start"), minutes = toMinutes(wait);
        if (minutes != null && minutes > 0) start = new Date(updatedAt(wait) + minutes * 60000);
      }
      const length = toMinutes(this._st("cycle_duration")) ?? toMinutes(this._st("remaining"));
      let end = null;
      if (start && length) end = new Date(start.getTime() + length * 60000);
      else {
        const done = toDate(this._st("completion"));
        if (start && done && done > start) end = done;
      }
      return { start, end };
    }

    _completion() {
      const at = toDate(this._st("completion"));
      if (at) return at;
      const rem = this._st("remaining"), minutes = toMinutes(rem);
      return minutes != null ? new Date(updatedAt(rem) + minutes * 60000) : null;
    }

    _progressPercent() {
      const p = Number(this._st("progress")?.state);
      if (valid(this._st("progress")) && Number.isFinite(p)) return Math.max(0, Math.min(100, p));
      const el = toMinutes(this._st("elapsed")), rem = toMinutes(this._st("remaining"));
      if (el != null && rem != null && el + rem > 0) return Math.max(0, Math.min(100, (100 * el) / (el + rem)));
      return null;
    }

    _remoteOk() {
      const r = this._st("remote");
      return !this._ents().remote || r?.state === "on";
    }

    _scheduler() {
      const c = this._config, e = this._ents();
      const delay = this._st("delay"), button = this._st("start_later");
      if (e.delay && e.start_later && valid(delay) && button && button.state !== "unavailable") {
        const unit = String(delay.attributes?.unit_of_measurement ?? "min").toLowerCase();
        const factor = unit === "s" ? 1 / 60 : unit === "h" ? 60 : 1; // minutes per unit
        const max = Number(delay.attributes?.max);
        const maxMinutes = Number.isFinite(max) && max > 0 ? Math.min(max * factor, 7 * 1440) : 1440;
        return { kind: "entities", factor, step: Number(delay.attributes?.step) > 0 ? Number(delay.attributes.step) : 1, maxMinutes };
      }
      const [domain, service] = String(c.schedule_service ?? "").split(".");
      if (domain && service && e.job_state) return { kind: "service", domain, service, maxMinutes: 1440 };
      return null;
    }

    _moreInfo(id) {
      if (id) this.dispatchEvent(new CustomEvent("hass-more-info", { detail: { entityId: id }, bubbles: true, composed: true }));
    }

    _call(domain, service, data) {
      return Promise.resolve(this._hass.callService(domain, service, data));
    }

    async _schedule() {
      const sched = this._scheduler();
      if (!sched || this._scheduleBusy) return;
      const chosen = this.shadowRoot.querySelector("input[data-schedule-time]")?.value ?? this._scheduleTime;
      const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(chosen ?? "");
      const hours = Math.floor(sched.maxMinutes / 60);
      if (!m) { this._scheduleError = this._t("invalid_time"); this._render(); return; }
      const now = new Date(), at = new Date(now);
      at.setHours(Number(m[1]), Number(m[2]), 0, 0);
      if (at <= now) at.setDate(at.getDate() + 1);
      const minutes = Math.ceil((at.getTime() - now.getTime()) / 60000);
      if (minutes < 1 || minutes > sched.maxMinutes) { this._scheduleError = this._t("out_of_range", { hours }); this._render(); return; }
      this._scheduleTime = chosen;
      this._scheduleBusy = true;
      this._scheduleError = "";
      this._render();
      const e = this._ents();
      try {
        if (sched.kind === "entities") {
          const value = Math.ceil(minutes / sched.factor / sched.step) * sched.step;
          const domain = e.delay.split(".")[0];
          await this._call(domain, "set_value", { entity_id: e.delay, value });
          await this._call("button", "press", { entity_id: e.start_later });
        } else {
          await this._call(sched.domain, sched.service, { entity_id: e.job_state, delay_minutes: minutes });
        }
        this._scheduleOpen = false;
        this._scheduleNotice = this._t("schedule_sent");
      } catch (err) {
        this._scheduleError = String(err?.message ?? err);
      } finally {
        this._scheduleBusy = false;
        this._render();
      }
    }

    _click(ev) {
      const el = ev.target.closest("[data-action]");
      if (!el || el.disabled) return;
      const action = el.dataset.action, c = this._config, e = this._ents();
      if (action === "details") {
        if (c.detail_path) { history.pushState(null, "", c.detail_path); window.dispatchEvent(new Event("location-changed")); }
        else this._moreInfo(e.state ?? e.program);
        return;
      }
      if (action === "schedule-toggle") {
        if (this._scheduleBusy) return;
        this._scheduleOpen = !this._scheduleOpen;
        this._scheduleError = "";
        if (this._scheduleOpen && !this._scheduleTime) {
          const t = new Date(Date.now() + 3600000);
          this._scheduleTime = `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
        }
        this._render();
        return;
      }
      if (action === "schedule-close") { if (!this._scheduleBusy) { this._scheduleOpen = false; this._scheduleError = ""; this._render(); } return; }
      if (action === "schedule-confirm") { this._schedule(); return; }
      if (action === "program-more") { this._expanded = !this._expanded; this._render(); return; }
      if (action === "program") {
        const st = this._st("program"), option = el.dataset.option, domain = e.program?.split(".")[0];
        const status = this._status();
        if (!["select", "input_select"].includes(domain) || ["running", "paused", "delayed"].includes(status)) return;
        if (!(st?.attributes?.options ?? []).includes(option) || st.state === option) return;
        this._expanded = false;
        el.disabled = true;
        this._call(domain, "select_option", { entity_id: e.program, option })
          .catch((err) => console.error("Dishwasher Card: program selection failed", err))
          .finally(() => { if (el.isConnected) el.disabled = false; });
        return;
      }
      if (action === "command") {
        const key = el.dataset.key;
        if (key === "cancel" || (key === "stop" && this._status() === "delayed")) {
          if (!this._confirmCancel) { this._confirmCancel = true; this._render(); return; }
          this._confirmCancel = false;
        }
        if (!this._remoteOk()) return;
        const id = e[key];
        if (!id?.startsWith("button.") || !this._hass.states[id]) return;
        el.disabled = true;
        this._call("button", "press", { entity_id: id })
          .catch((err) => console.error("Dishwasher Card: command failed", err))
          .finally(() => { if (el.isConnected) el.disabled = false; });
      }
    }

    _render() {
      if (!this._config) return;
      if (!this._hass) return;
      const c = this._config, e = this._ents(), hass = this._hass;
      const accent = cssColor(c.colors?.active, "#ff6a00");
      const cardStyle = [
        `--dw-accent:${accent}`,
        `--dw-running:${cssColor(c.colors?.running, "#52dca5")}`,
        `--dw-paused:${cssColor(c.colors?.paused, "#ffb34e")}`,
        `--dw-scheduled:${cssColor(c.colors?.scheduled, accent)}`,
        `--dw-muted:${cssColor(c.colors?.text, "var(--secondary-text-color,#aaa)")}`,
        `--dw-segment-background:${cssColor(c.colors?.background, "var(--secondary-background-color,#292929)")}`,
        `--dw-program-height:${clamp(c.appearance?.program_height, 45, 28, 100)}px`,
        `--dw-program-icon-size:${clamp(c.appearance?.program_icon_size, 17, 12, 40)}px`,
        `--dw-program-font-size:${clamp(c.appearance?.program_font_size, 9, 7, 18)}px`,
        `--dw-radius:${clamp(c.appearance?.corner_radius, 13, 4, 30)}px`,
        `--dw-action-height:${clamp(c.appearance?.action_height, 46, 30, 80)}px`,
      ];

      if (!e.state && !e.program) {
        this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card style="${esc(cardStyle.join(";"))}"><div class="setup"><ha-icon icon="mdi:dishwasher"></ha-icon><div>${esc(this._t("setup"))}</div></div></ha-card>`;
        return;
      }

      const status = this._status();
      const running = status === "running", paused = status === "paused", delayed = status === "delayed";
      const idle = status === "stopped" || status === "finished";
      if (!delayed) this._confirmCancel = false;
      else { this._scheduleOpen = false; this._scheduleNotice = ""; }
      const remote = this._remoteOk();
      const stateColor = delayed ? "var(--dw-scheduled)" : running ? "var(--dw-running)" : paused ? "var(--dw-paused)"
        : status === "attention" ? "var(--error-color,#db4437)" : "var(--secondary-text-color,#999)";

      // Program
      const pst = this._st("program"), programCode = valid(pst) ? pst.state : "";
      const selectable = ["select", "input_select"].includes(e.program?.split(".")[0]);
      const options = selectable && Array.isArray(pst?.attributes?.options) ? pst.attributes.options : [];
      const preferred = Array.isArray(c.program_presets) && c.program_presets.length ? c.program_presets : defaultPresets(options);
      const presets = [...new Set(preferred)].filter((x) => options.includes(x)).slice(0, 12);
      let rest = options.filter((x) => !presets.includes(x));
      if (rest.length === 1 && presets.length < 12) { presets.push(rest[0]); rest = []; }
      const canChange = selectable && valid(pst) && !running && !paused && !delayed;
      const shortName = (code) => c.program_short_labels?.[code] ?? this._programName(code);
      const button = (code) => {
        const sel = code === programCode, name = this._programName(code);
        return `<button class="segment-btn ${sel ? "selected" : ""}" data-action="program" data-option="${esc(code)}" aria-pressed="${sel}" title="${esc(name)}" ${!canChange || sel ? "disabled" : ""}><ha-icon icon="${esc(programIcon(code, c.program_icons))}"></ha-icon><span class="segment-label">${esc(shortName(code))}</span></button>`;
      };
      const segments = presets.map(button);
      if (rest.length) {
        segments.push(`<button class="segment-btn ${programCode && !presets.includes(programCode) ? "selected" : ""}" data-action="program-more" title="${esc(this._t("more"))}" aria-expanded="${this._expanded}"><ha-icon icon="mdi:dots-horizontal"></ha-icon><span class="segment-label">${esc(this._t("more"))}</span></button>`);
      }
      const columns = clamp(c.appearance?.program_columns, Math.min(8, Math.max(1, segments.length)), 1, 12);

      // Phase and progress
      const phaseSt = this._st("phase") ?? (running || paused ? this._st("job_state") : null);
      const phaseCode = valid(phaseSt) ? phaseSt.state : "";
      const step = stepOf(phaseCode);
      const phaseShown = c.show_phase !== false && (running || paused) && phaseCode && step !== -1;
      const phase = phaseShown ? c.phase_labels?.[phaseCode] ?? this._stateName(phaseSt, phaseCode) : "";
      const phaseIcon = c.phase_icons?.[phaseCode] ?? PHASE_ICONS[norm(phaseCode)] ?? (step >= 0 ? STEP_ICONS[step] : "mdi:progress-clock");
      let progressHtml = "";
      if (c.show_progress !== false && (running || paused)) {
        const pct = this._progressPercent();
        if (pct != null) {
          progressHtml = `<div class="bar ${paused ? "paused" : ""}" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(pct)}"><div class="fill" style="width:${pct.toFixed(1)}%"></div></div>`;
        } else if (step >= 0) {
          progressHtml = `<div class="steps ${paused ? "paused" : ""}" role="progressbar" aria-label="${esc(phase)}" aria-valuemin="1" aria-valuemax="4" aria-valuenow="${step + 1}">${[0, 1, 2, 3].map((i) => `<span class="step ${i < step ? "done" : i === step ? "current" : ""}"></span>`).join("")}</div>`;
        } else {
          progressHtml = `<div class="steps ${paused ? "paused" : ""}" style="--dw-steps:1" role="progressbar" aria-label="${esc(phase || this._t("running"))}"><span class="step current"></span></div>`;
        }
      }

      // Chips
      const chips = [];
      if (phase) chips.push(`<span class="phase ${running ? "live" : ""}"><ha-icon icon="${esc(phaseIcon)}"></ha-icon>${esc(phase)}</span>`);
      if (delayed) {
        const { start, end } = this._delayInfo();
        const s = this._fmtTime(start), f = this._fmtTime(end);
        chips.push(`<span class="scheduled"><ha-icon icon="mdi:clock-start"></ha-icon>${esc(this._t("delayed"))}${s ? ` · ${esc(this._t("starts"))} ${esc(s)}` : ""}${f ? ` · ${esc(this._t("estimated_finish"))} ${esc(f)}` : ""}</span>`);
      }
      if (status === "attention") chips.push(`<span class="error"><ha-icon icon="mdi:alert-circle-outline"></ha-icon>${esc(this._stateName(this._st("state")))}</span>`);
      if (c.show_remote_warning !== false && !remote) chips.push(`<span class="warn"><ha-icon icon="mdi:remote-off"></ha-icon>${esc(this._t("remote_off"))}</span>`);
      if (this._st("door")?.state === "on" && !running) chips.push(`<span class="warn"><ha-icon icon="mdi:door-open"></ha-icon>${esc(this._t("door_open"))}</span>`);
      if (c.show_completion !== false && (running || paused)) {
        const end = this._fmtTime(this._completion());
        if (end) chips.push(`<span><ha-icon icon="mdi:clock-outline"></ha-icon>${esc(this._t("finish"))} ${esc(end)}</span>`);
      }
      if (c.show_water === true && valid(this._st("water"))) chips.push(`<span><ha-icon icon="mdi:water-outline"></ha-icon>${esc(this._t("water"))} ${this._fmtNumber(this._st("water"))} ${esc(this._st("water").attributes?.unit_of_measurement ?? "L")}</span>`);
      if (this._scheduleNotice && !delayed) chips.push(`<span><ha-icon icon="mdi:clock-check-outline"></ha-icon>${esc(this._scheduleNotice)}</span>`);

      // Controls
      const has = (k) => !!e[k] && !!hass.states[e[k]] && hass.states[e[k]].state !== "unavailable";
      let key = null, label = this._t("unavailable"), icon = "mdi:play";
      if (delayed) { key = has("cancel") ? "cancel" : has("stop") ? "stop" : null; label = this._confirmCancel ? this._t("confirm_cancel") : key ? this._t("cancel") : this._t("delayed"); icon = this._confirmCancel ? "mdi:alert-circle-outline" : "mdi:close-circle-outline"; }
      else if (idle) { key = has("start") ? "start" : null; label = this._t("start"); }
      else if (paused) { key = has("resume") ? "resume" : has("start") ? "start" : null; label = this._t("resume"); }
      else if (running) { key = has("pause") ? "pause" : has("stop") ? "stop" : null; label = key === "stop" ? this._t("stop") : this._t("pause"); icon = key === "stop" ? "mdi:stop" : "mdi:pause"; }
      const allowed = !!key && remote;
      const sched = this._scheduler();
      const showSchedule = !!sched && idle && remote && c.show_schedule !== false;
      let controls = "";
      if (c.show_controls !== false) {
        const primary = `<button class="button primary ${delayed && key ? "cancel" : ""}" data-action="command" data-key="${esc(key ?? "")}" ${allowed ? "" : "disabled"}><ha-icon icon="${icon}"></ha-icon><span>${esc(remote ? label : this._t("remote_off"))}</span></button>`;
        const clock = showSchedule ? `<button class="button schedule-toggle" data-action="schedule-toggle" aria-label="${esc(this._t("schedule"))}" title="${esc(this._t("schedule"))}" aria-expanded="${this._scheduleOpen}"><ha-icon icon="mdi:clock-plus-outline"></ha-icon></button>` : "";
        controls = `<div class="controls">${showSchedule ? `<div class="play-split">${primary}${clock}</div>` : primary}<button class="button secondary" data-action="details" aria-label="${esc(this._t("details"))}" title="${esc(this._t("details"))}"><ha-icon icon="mdi:tune-variant"></ha-icon></button></div>`;
      }
      let panel = "";
      if (showSchedule && this._scheduleOpen) {
        const hours = Math.floor(sched.maxMinutes / 60);
        panel = `<div class="schedule-panel"><div class="schedule-title"><ha-icon icon="mdi:clock-outline"></ha-icon>${esc(this._t("schedule_at"))}</div><div class="schedule-edit"><input type="time" data-schedule-time value="${esc(this._scheduleTime)}" aria-label="${esc(this._t("schedule_at"))}" ${this._scheduleBusy ? "disabled" : ""}><button data-action="schedule-confirm" ${this._scheduleBusy ? "disabled" : ""}>${esc(this._scheduleBusy ? "…" : this._t("schedule_confirm"))}</button></div><div class="schedule-hint">${esc(this._t("schedule_hint", { hours }))}</div>${this._scheduleError ? `<div class="schedule-error">${esc(this._scheduleError)}</div>` : ""}<button class="schedule-close" data-action="schedule-close">${esc(this._t("schedule_close"))}</button></div>`;
      }

      const name = c.name ?? (deviceName(hass, c.device) || this._t("dishwasher"));
      const powerSt = this._st("power");
      const showPower = c.show_power !== false && !!e.power;
      const showProgram = c.show_program !== false;
      const header = c.show_header !== false
        ? `<div class="head"><div class="title">${esc(name)}</div><button class="details" data-action="details" aria-label="${esc(this._t("details"))}"><ha-icon icon="mdi:dots-vertical"></ha-icon></button></div>` : "";
      const overview = showProgram || showPower
        ? `<div class="overview">${showProgram ? `<div class="current"><div class="eyebrow">${esc(this._t("program"))}</div><div class="program-name">${esc(programCode ? this._programName(programCode) : "—")}</div></div>` : "<div></div>"}${showPower ? `<div class="power"><div class="eyebrow">${esc(this._t("power"))}</div><div class="power-value">${this._fmtNumber(powerSt)} ${esc(powerSt?.attributes?.unit_of_measurement ?? "W")}</div></div>` : ""}</div>` : "";
      const selector = c.show_selector !== false && segments.length
        ? `<div class="segment" style="--dw-columns:${columns}">${segments.join("")}</div>${this._expanded && rest.length ? `<div class="segment extras" style="--dw-columns:${columns}">${rest.map(button).join("")}</div>` : ""}` : "";

      this.shadowRoot.innerHTML = `<style>${STYLE}</style><ha-card style="--state-color:${stateColor};${esc(cardStyle.join(";"))}">${header}${overview}${chips.length ? `<div class="quick-stats">${chips.join("")}</div>` : ""}${progressHtml}${selector}${controls}${panel}</ha-card>`;
    }
  }

  customElements.define(TYPE, DishwasherCard);

  /* ------------------------------------------------------------------ */
  /* Visual editor                                                       */
  /* ------------------------------------------------------------------ */

  const EDITOR_STRINGS = {
    en: {
      device: "Device", device_helper: "Entities are found automatically. You can adjust them below.",
      detected: "{count} entities found on this device.", missing: "Not found on this device: {keys}. Pick them below if your dishwasher has them.",
      name: "Name", detail_path: "Details link (view path, optional)",
      sec_display: "Display", sec_entities: "Entities", sec_programs: "Programs", sec_colors: "Colors",
      sec_layout: "Layout", sec_labels: "Texts", sec_advanced: "Advanced",
      show_header: "Title", show_program: "Current program", show_power: "Power", show_water: "Water consumption",
      show_phase: "Cycle phase", show_progress: "Animated progress", show_completion: "End time",
      show_remote_warning: "Remote control warning", show_selector: "Program buttons", show_controls: "Action buttons",
      show_schedule: "Delayed start button",
      e_state: "Machine state", e_program: "Program", e_phase: "Cycle phase", e_job_state: "Detailed state (delayed start)",
      e_completion: "End time", e_remaining: "Remaining time", e_elapsed: "Elapsed time", e_progress: "Progress (%)",
      e_delayed_start_time: "Delayed start time", e_time_left_to_start: "Time left before start", e_delay: "Delay (number)",
      e_start_later: "Start later button", e_power: "Power", e_water: "Water", e_remote: "Remote control enabled",
      e_door: "Door", e_start: "Start button", e_pause: "Pause button", e_resume: "Resume button",
      e_cancel: "Cancel button", e_stop: "Stop button",
      program_presets: "Shortcut programs (order kept)", program_label: "Name", program_short: "Short name", program_icon: "Icon",
      c_active: "Selected program and buttons", c_running: "Running", c_paused: "Paused", c_scheduled: "Delayed start",
      c_text: "Captions", c_background: "Button strip",
      a_program_columns: "Program columns", a_program_height: "Program button height", a_program_icon_size: "Program icon size",
      a_program_font_size: "Program text size", a_corner_radius: "Program strip corner radius", a_action_height: "Action button height",
      default_is: "Default: {value}", schedule_service: "Legacy scheduling action (domain.action)",
      sv_running: "States meaning running (comma separated)", sv_paused: "States meaning paused",
      sv_delayed: "States meaning delayed start", sv_finished: "States meaning finished", sv_stopped: "States meaning idle",
      sv_attention: "States meaning an error",
    },
    fr: {
      device: "Appareil", device_helper: "Les entités sont trouvées automatiquement. Vous pouvez les ajuster plus bas.",
      detected: "{count} entités trouvées sur cet appareil.", missing: "Introuvable sur cet appareil : {keys}. Choisissez-les plus bas si votre lave-vaisselle les a.",
      name: "Nom", detail_path: "Lien des détails (chemin d’une vue, facultatif)",
      sec_display: "Affichage", sec_entities: "Entités", sec_programs: "Programmes", sec_colors: "Couleurs",
      sec_layout: "Disposition", sec_labels: "Textes", sec_advanced: "Avancé",
      show_header: "Titre", show_program: "Programme en cours", show_power: "Puissance", show_water: "Consommation d’eau",
      show_phase: "Phase du cycle", show_progress: "Progression animée", show_completion: "Heure de fin",
      show_remote_warning: "Avertissement de commande à distance", show_selector: "Boutons de programmes",
      show_controls: "Boutons d’action", show_schedule: "Bouton de départ différé",
      e_state: "État de la machine", e_program: "Programme", e_phase: "Phase du cycle", e_job_state: "État détaillé (départ différé)",
      e_completion: "Heure de fin", e_remaining: "Temps restant", e_elapsed: "Temps écoulé", e_progress: "Progression (%)",
      e_delayed_start_time: "Heure du départ différé", e_time_left_to_start: "Temps avant le départ", e_delay: "Délai (nombre)",
      e_start_later: "Bouton démarrer plus tard", e_power: "Puissance", e_water: "Eau", e_remote: "Commande à distance activée",
      e_door: "Porte", e_start: "Bouton démarrer", e_pause: "Bouton pause", e_resume: "Bouton reprendre",
      e_cancel: "Bouton annuler", e_stop: "Bouton arrêter",
      program_presets: "Programmes en raccourci (ordre conservé)", program_label: "Nom", program_short: "Nom court", program_icon: "Icône",
      c_active: "Programme choisi et boutons", c_running: "En cours", c_paused: "En pause", c_scheduled: "Départ différé",
      c_text: "Intitulés", c_background: "Bandeau des boutons",
      a_program_columns: "Colonnes de programmes", a_program_height: "Hauteur des boutons de programmes", a_program_icon_size: "Taille des icônes",
      a_program_font_size: "Taille du texte des programmes", a_corner_radius: "Arrondi du bandeau", a_action_height: "Hauteur des boutons d’action",
      default_is: "Par défaut : {value}", schedule_service: "Action de programmation historique (domaine.action)",
      sv_running: "États signifiant « en cours » (séparés par des virgules)", sv_paused: "États signifiant « en pause »",
      sv_delayed: "États signifiant « départ différé »", sv_finished: "États signifiant « terminé »", sv_stopped: "États signifiant « à l’arrêt »",
      sv_attention: "États signifiant une erreur",
    },
  };
  const ENTITY_FIELDS = [
    ["state", ["sensor", "select", "input_select"]], ["program", ["select", "input_select", "sensor"]], ["phase", ["sensor"]],
    ["completion", ["sensor"]], ["remaining", ["sensor"]], ["progress", ["sensor"]], ["elapsed", ["sensor"]],
    ["power", ["sensor"]], ["water", ["sensor"]], ["remote", ["binary_sensor"]], ["door", ["binary_sensor"]],
    ["start", ["button"]], ["pause", ["button"]], ["resume", ["button"]], ["stop", ["button"]], ["cancel", ["button"]],
    ["delay", ["number", "input_number"]], ["start_later", ["button"]], ["delayed_start_time", ["sensor"]],
    ["time_left_to_start", ["sensor"]], ["job_state", ["sensor"]],
  ];
  const SHOW = [["show_header", true], ["show_program", true], ["show_power", true], ["show_phase", true], ["show_progress", true],
    ["show_completion", true], ["show_selector", true], ["show_controls", true], ["show_schedule", true],
    ["show_remote_warning", true], ["show_water", false]];
  const COLORS = [["active", "orange"], ["running", "green"], ["paused", "amber"], ["scheduled", "orange"], ["text", ""], ["background", ""]];
  const LAYOUT = [["program_columns", 1, 12, 1, ""], ["program_height", 28, 100, 1, "px"], ["program_icon_size", 12, 40, 1, "px"],
    ["program_font_size", 7, 18, 1, "px"], ["corner_radius", 4, 30, 1, "px"], ["action_height", 30, 80, 1, "px"]];
  const STATE_KEYS = ["running", "paused", "delayed", "finished", "stopped", "attention"];

  class DishwasherCardEditor extends HTMLElement {
    constructor() { super(); this.attachShadow({ mode: "open" }); this._config = {}; }
    setConfig(config) { this._config = JSON.parse(JSON.stringify(config ?? {})); this._update(); }
    set hass(hass) { const first = !this._hass; this._hass = hass; if (first) this._update(); else if (this._form) this._form.hass = hass; }
    _e(key, vars) {
      let s = EDITOR_STRINGS[lang(this._hass)]?.[key] ?? EDITOR_STRINGS.en[key] ?? key;
      for (const [k, v] of Object.entries(vars ?? {})) s = s.replace(`{${k}}`, v);
      return s;
    }
    _cardT(key) { return STRINGS[lang(this._hass)]?.[key] ?? STRINGS.en[key] ?? key; }

    _programOptions() {
      const id = this._config.entities?.program ?? (this._config.device ? detectEntities(this._hass, this._config.device).program : null);
      const st = this._hass?.states?.[id];
      return { st, options: Array.isArray(st?.attributes?.options) ? st.attributes.options : [] };
    }
    _programName(st, code) {
      let out = code;
      try { if (st && typeof this._hass.formatEntityState === "function") out = this._hass.formatEntityState(st, code); } catch (_) { /* ignore */ }
      return !out || out === code ? bareProgram(code).replaceAll("_", " ").replace(/^./, (c) => c.toUpperCase()) : out;
    }

    _schema() {
      const { st, options } = this._programOptions();
      const programRows = options.map((code) => ({
        type: "grid", name: "", column_min_width: "110px",
        schema: [
          { name: `pl__${code}`, selector: { text: {} } },
          { name: `ps__${code}`, selector: { text: {} } },
          { name: `pi__${code}`, selector: { icon: {} } },
        ],
      }));
      return [
        { name: "device", selector: { device: {} } },
        { type: "grid", name: "", schema: [{ name: "name", selector: { text: {} } }, { name: "detail_path", selector: { text: {} } }] },
        { type: "expandable", name: "", flatten: true, title: this._e("sec_display"), icon: "mdi:eye-outline",
          schema: [{ type: "grid", name: "", column_min_width: "200px", schema: SHOW.map(([k]) => ({ name: k, selector: { boolean: {} } })) }] },
        { type: "expandable", name: "entities", title: this._e("sec_entities"), icon: "mdi:format-list-bulleted-type",
          schema: ENTITY_FIELDS.map(([k, domains]) => ({ name: k, selector: { entity: { filter: { domain: domains } } } })) },
        ...(options.length ? [{ type: "expandable", name: "", flatten: true, title: this._e("sec_programs"), icon: "mdi:playlist-check",
          schema: [
            { name: "program_presets", selector: { select: { multiple: true, reorder: true, mode: "dropdown",
              options: options.map((code) => ({ value: code, label: this._programName(st, code) })) } } },
            ...programRows,
          ] }] : []),
        { type: "expandable", name: "colors", title: this._e("sec_colors"), icon: "mdi:palette-outline",
          schema: [{ type: "grid", name: "", schema: COLORS.map(([k, def]) => ({ name: k, selector: { ui_color: def ? { default_color: def } : {} } })) }] },
        { type: "expandable", name: "appearance", title: this._e("sec_layout"), icon: "mdi:page-layout-body",
          schema: LAYOUT.map(([k, min, max, step, unit]) => ({ name: k, selector: { number: { min, max, step, mode: "slider", unit_of_measurement: unit || undefined } } })) },
        { type: "expandable", name: "labels", title: this._e("sec_labels"), icon: "mdi:translate",
          schema: [{ type: "grid", name: "", schema: LABEL_KEYS.map((k) => ({ name: k, selector: { text: {} } })) }] },
        { type: "expandable", name: "", flatten: true, title: this._e("sec_advanced"), icon: "mdi:cog-outline",
          schema: [
            ...STATE_KEYS.map((k) => ({ name: `sv__${k}`, selector: { text: {} } })),
            { name: "schedule_service", selector: { text: {} } },
          ] },
      ];
    }

    _data() {
      const c = this._config, data = { ...c };
      for (const [k, def] of SHOW) data[k] = c[k] ?? def;
      for (const k of STATE_KEYS) data[`sv__${k}`] = c.state_values?.[k] ?? "";
      for (const code of this._programOptions().options) {
        data[`pl__${code}`] = c.program_labels?.[code] ?? "";
        data[`ps__${code}`] = c.program_short_labels?.[code] ?? "";
        data[`pi__${code}`] = c.program_icons?.[code] ?? "";
      }
      return data;
    }

    _label(schema) {
      const n = schema.name;
      if (n.startsWith("pl__")) return `${this._programName(this._programOptions().st, n.slice(4))} — ${this._e("program_label")}`;
      if (n.startsWith("ps__")) return this._e("program_short");
      if (n.startsWith("pi__")) return this._e("program_icon");
      if (n.startsWith("sv__")) return this._e(`sv_${n.slice(4)}`);
      if (ENTITY_FIELDS.some(([k]) => k === n) && schema.selector?.entity) return this._e(`e_${n}`);
      if (COLORS.some(([k]) => k === n) && schema.selector?.ui_color) return this._e(`c_${n}`);
      if (LAYOUT.some(([k]) => k === n)) return this._e(`a_${n}`);
      if (LABEL_KEYS.includes(n) && schema.selector?.text) return this._cardT(n);
      return this._e(n);
    }
    _helper(schema) {
      const n = schema.name;
      if (n === "device") return this._e("device_helper");
            if (n.startsWith("sv__")) return this._e("default_is", { value: STATE_DEFAULTS[n.slice(4)].slice(0, 6).join(", ") + "…" });
      if (n.startsWith("pi__")) return undefined;
      return undefined;
    }

    _changed(ev) {
      ev.stopPropagation();
      const v = ev.detail.value, prev = this._config, next = {};
      const skip = (k) => /^(pl|ps|pi|sv)__/.test(k);
      for (const [k, val] of Object.entries(v)) if (!skip(k)) next[k] = val;
      for (const [k, def] of SHOW) if (next[k] === def) delete next[k];
      const maps = { pl__: "program_labels", ps__: "program_short_labels", pi__: "program_icons" };
      for (const [prefix, key] of Object.entries(maps)) {
        const out = { ...(prev[key] ?? {}) };
        for (const [k, val] of Object.entries(v)) {
          if (!k.startsWith(prefix)) continue;
          const code = k.slice(prefix.length);
          if (val) out[code] = val; else delete out[code];
        }
        if (Object.keys(out).length) next[key] = out; else delete next[key];
      }
      const sv = {};
      for (const k of STATE_KEYS) if (v[`sv__${k}`]) sv[k] = v[`sv__${k}`];
      if (Object.keys(sv).length) next.state_values = sv; else delete next.state_values;
      for (const k of ["entities", "colors", "appearance", "labels"]) {
        if (next[k] && typeof next[k] === "object") {
          for (const [kk, vv] of Object.entries(next[k])) if (vv === "" || vv == null) delete next[k][kk];
          if (!Object.keys(next[k]).length && k !== "entities") delete next[k];
        }
      }
      for (const k of ["name", "detail_path", "schedule_service", "device"]) if (!next[k]) delete next[k];
      if (Array.isArray(next.program_presets) && !next.program_presets.length) delete next.program_presets;
      // A new device: map its entities and forget the previous device's.
      if (next.device && next.device !== prev.device) {
        next.entities = detectEntities(this._hass, next.device);
        delete next.program_presets;
        this._detectedCount = Object.keys(next.entities).length;
      }
      next.type = prev.type ?? `custom:${TYPE}`;
      this._config = next;
      this._update();
      this.dispatchEvent(new CustomEvent("config-changed", { detail: { config: next }, bubbles: true, composed: true }));
    }

    _update() {
      if (!this._hass) return;
      if (!this._form) {
        this.shadowRoot.innerHTML = `<style>:host{display:block}ha-alert{display:block;margin-bottom:12px}</style><div id="alert"></div><ha-form></ha-form>`;
        this._form = this.shadowRoot.querySelector("ha-form");
        this._form.computeLabel = (s) => this._label(s);
        this._form.computeHelper = (s) => this._helper(s);
        this._form.addEventListener("value-changed", (ev) => this._changed(ev));
      }
      this._form.hass = this._hass;
      this._form.schema = this._schema();
      this._form.data = this._data();
      const alert = this.shadowRoot.getElementById("alert");
      const e = this._config.entities ?? {};
      if (this._config.device) {
        const missing = ["state", "program"].filter((k) => !e[k]).map((k) => this._e(`e_${k}`));
        alert.innerHTML = missing.length
          ? `<ha-alert alert-type="warning">${esc(this._e("missing", { keys: missing.join(", ") }))}</ha-alert>`
          : this._detectedCount ? `<ha-alert alert-type="success">${esc(this._e("detected", { count: this._detectedCount }))}</ha-alert>` : "";
      } else alert.innerHTML = "";
    }
  }
  customElements.define(EDITOR, DishwasherCardEditor);

  window.customCards = window.customCards || [];
  window.customCards.push({
    type: TYPE,
    name: "Dishwasher Card",
    description: "Dishwasher status, program selector, cycle progress and delayed start.",
    preview: true,
    documentationURL: "https://github.com/Sr-0w/lovelace-dishwasher-card",
  });
  console.info(`%c DISHWASHER-CARD %c ${VERSION} `, "color:#fff;background:#ff6a00;font-weight:700", "color:#ff6a00;background:#222");
})();
