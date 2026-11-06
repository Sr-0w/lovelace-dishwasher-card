# Dishwasher Card for Home Assistant

## Scheduled / delayed start support (v0.7.0-dev)

The card can display a **scheduled start** instead of a misleading "Pause" action when a supported detailed job-state entity reports `delay_washing` (or `delayWashing`). It accepts optional `entities.job_state`, `entities.operating_progress`, `entities.time_left_to_start`, and `entities.cycle_duration` entity mappings. When delayed, it shows the computed starting time and optionally the projected finish, suppresses the old `completion_time` and disables misleading pause/program commands. The displayed time uses the reported minutes relative to the sensor's `last_updated` timestamp. These options are also in the visual editor.

**Dependency:** Standard Home Assistant SmartThings currently does **not** expose these Samsung CE attributes as sensors. [A proposed upstream patch](docs/upstream-smartthings-delayed-start.patch) adds them. Until those entities exist in HA, the card cannot reliably detect a delayed start. It does not guess based on idle power or `machineState: run`.


A compact, device-agnostic Lovelace card with a segmented program selector, simple power/status summary, and context-aware **Start / Pause / Resume** action. The oversized detail button has been replaced by an icon-only settings button.

**Status: v0.6.0 development prototype.** Tested with simulated device states, but **installed for live Home Assistant testing, but visual/device-level testing is still pending**. Do not publish a stable release before testing on real hardware.

![Dishwasher Card concept preview](docs/preview.svg)

## Visual editor (v0.6.0 development build)

**No YAML required for normal setup.** In Home Assistant's Dashboard edit mode, choose **Edit card** to open the graphical editor. It includes native searchable entity pickers, customizable colors (pickers and CSS inputs), appearance controls, visibility switches and localizable labels. The program selector reads options from your actual dishwasher and allows selecting/reordering presets, custom program labels/icons, and state mappings.

**52 configurable fields** are currently exposed in the visual editor. Full reference: **[Configuration guide](docs/configuration.md)**.

Existing YAML is kept compatible. These are experimental builds; real-browser testing and cross-version validation are required before a stable HACS release.

## Install (development branch)

1. In **HACS / Marketplace**, add this repository as a **custom Dashboard repository**:
   `https://github.com/Sr-0w/lovelace-dishwasher-card`
2. Install **Dishwasher Card**, then reload Home Assistant.
3. If the resource was not registered automatically, add `/hacsfiles/lovelace-dishwasher-card/dishwasher-card.js` as a **JavaScript module** in **Settings → Dashboards → Resources**.
4. Add a **Manual** dashboard card.

## Example

```yaml
type: custom:dishwasher-card
name: Lave-vaisselle
detail_path: /dashboard-maison/cuisine-lave-vaisselle
entities:
  state: sensor.my_dishwasher_state
  program: select.my_dishwasher_program
  phase: sensor.my_dishwasher_job_state
  completion: sensor.my_dishwasher_completion_time
  power: sensor.my_dishwasher_power
  water: sensor.my_dishwasher_water_consumption
  remote: binary_sensor.my_dishwasher_remote_control
  start: button.my_dishwasher_start
  pause: button.my_dishwasher_pause
  resume: button.my_dishwasher_resume
program_labels:
  eco: Éco
  ai: Auto
  intensive: Intensif
  glasses: Verres
  express: Express
  pre_wash: Prélavage
  extra_silence: Silencieux
labels:
  idle: À l'arrêt
  running: En cours
  paused: En pause
  unavailable: Indisponible
  program: Programme
  remote_on: Commande distante active
  remote_off: Commande distante désactivée
  start: Démarrer
  pause: Pause
  resume: Reprendre
  details: Options et détails
  finish: Fin
```

The card uses a **native-looking segmented program selector**, without an appliance illustration or circular progress dial. The default visible shortcuts are **Eco**, **Auto** (`ai`), **Intensive**, **Express**, **Glasses**, **Extra silence**, and **Pre-wash** (shown in a single compact row of 7 buttons plus **Other**). The active choice has an orange background. **Other** expands a second set of selectable program buttons for the remaining supported cycles, directly inside the card. Only supported choices from the `select.*` entity's `options` attribute are shown. Changing a program invokes `select.select_option` and is disabled while a cycle is running.

Use `program_presets` to change the visible shortcuts, `program_short_labels` for short captions that fit on phones (e.g. `intensive: Intens.`), and optionally `program_icons` to provide MDI icons (e.g. `eco: mdi:leaf`). Both are device-agnostic. For example:

```yaml
program_presets:
  - eco
  - ai
  - intensive
  - express
  - glasses
  - extra_silence
  - pre_wash
program_short_labels:
  intensive: Intens.
  extra_silence: Silence
  pre_wash: Prélav.
program_icons:
  eco: mdi:leaf
  ai: mdi:autorenew
  intensive: mdi:fire
```

Required entity mappings: `state` and `program`. All others are optional. The state entity supports `run`, `running`, `pause`, `paused`, `stop`, `idle` and other common values.

Remote commands **require** button entities for `start`, `pause`, and `resume`. If the optional `remote` binary sensor is configured, commands are disabled unless it is `on`. Some appliances require remote control to be activated physically on the device before commands become available. No attempt is made to bypass that.

While a cycle runs or is paused, the optional `phase` entity (for SmartThings, the dishwasher's **Job state** sensor) is shown as a chip next to the finish time: *Pre-wash*, *Wash*, *Rinse*, *Drying*… The name comes from Home Assistant's own translation of that entity, so it follows the user's language without configuration. Override it with `phase_labels` (e.g. `drying: Séchage doux`), change icons with `phase_icons`, or hide the chip with `show_phase: false`. Nothing is shown before the cycle starts, while a delayed start is pending, or once the phase is `finish`.

`power` is displayed in watts, `water` is the **cumulative** water reading (not one-cycle consumption), and `completion` expects an ISO-8601 timestamp. The configurable `detail_path` opens an existing view, not one created by this card.

## Portability and safety

All entity IDs are user-configured. There is **no vendor-specific API**, no external backend, and no network request outside the Home Assistant card interface. Button actions call `hass.callService('button', 'press', ...)` under the HA user's permissions.

The primary context-aware Start/Pause/Resume command is shown on the card, alongside an icon-only settings button that navigates to the existing `detail_path`. Program presets are directly accessible on the card. Cancel/drain, zone selection, and sanitation belong in the optional advanced view. Remote-control availability is only highlighted when commands are unavailable; a normal/active remote status is intentionally not shown.

## Planned before HACS catalog submission

- Test against multiple appliance integrations and unavailable/disconnected states
- GUI editor, translations, configurable state mapping
- Real-world action/error tests, responsive and accessibility tests
- Tagged releases and automated validation

MIT license. Contributions welcome.