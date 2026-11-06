# Dishwasher Card — configuration reference

Everything below can be set in the visual editor. YAML is only needed for the
few options marked *YAML only*.

## General

| Option | Default | Description |
| --- | --- | --- |
| `device` | — | Device id. Its entities are discovered automatically. |
| `name` | device name | Title of the card. |
| `detail_path` | — | View opened by the ⋮ and ⚙ buttons, e.g. `/dashboard-home/dishwasher`. Without it they open the more-info dialog of the state entity. |

## Entities

All optional when `device` is set; the ones you set override discovery.

| Key | Domain | Used for |
| --- | --- | --- |
| `state` | sensor, select | Machine state (running, paused, idle…). Required without `device`. |
| `program` | select, input_select, sensor | Current program. A `select` makes the program buttons work; a `sensor` only shows the name. |
| `phase` | sensor | Cycle phase shown while running (pre-wash, wash, rinse, drying…). |
| `completion` | sensor (timestamp) | End time. |
| `remaining` | sensor (duration) | Remaining time; used for the end time when there is no `completion`. |
| `progress` | sensor (%) | Progress bar in percent. |
| `elapsed` | sensor (duration) | With `remaining`, gives a progress percentage. |
| `power` | sensor | Power shown at the top right. Hidden when not set. |
| `water` | sensor | Water reading (`show_water: true`). |
| `remote` | binary_sensor | Remote control allowed. Commands are disabled while it is off. |
| `door` | binary_sensor | Shows *Door open* when the machine is not running. |
| `start`, `pause`, `resume`, `stop`, `cancel` | button | Commands. The main button picks the right one for the state. |
| `delay` | number, input_number | Delay before starting (s, min or h, read from its unit). |
| `start_later` | button | Starts the program after `delay`. With `delay`, enables the clock button. |
| `delayed_start_time` | sensor (timestamp) | When a delayed start begins. |
| `time_left_to_start` | sensor (duration) | Countdown to a delayed start, when there is no timestamp. |
| `job_state` | sensor | Detailed state used to recognise a pending delayed start (SmartThings `delay_washing`). |

## Display

| Option | Default |
| --- | --- |
| `show_header` | `true` |
| `show_program` | `true` |
| `show_power` | `true` (only when a power entity exists) |
| `show_phase` | `true` |
| `show_progress` | `true` |
| `show_completion` | `true` |
| `show_selector` | `true` |
| `show_controls` | `true` |
| `show_schedule` | `true` (only when delayed start is possible) |
| `show_remote_warning` | `true` |
| `show_water` | `false` |

## Programs

| Option | Description |
| --- | --- |
| `program_presets` | Programs shown as buttons, in this order. Default: Eco, Auto, Intensive, Express, Glasses, Silence, Pre-wash when available. The others are under *More*. |
| `program_labels` | `code: name` overrides. By default names come from Home Assistant's translations. |
| `program_short_labels` | Shorter names for the buttons, e.g. `intensive: Intens.` |
| `program_icons` | `code: mdi:icon` overrides. |
| `phase_labels`, `phase_icons` | *YAML only.* Same for phases. |

## Colours

Each accepts a theme colour name (`orange`, `deep-purple`, `primary`…), a hex
colour or a `var(--…)` CSS variable.

| Option | Default | Used for |
| --- | --- | --- |
| `colors.active` | `#ff6a00` | Selected program, main and clock buttons |
| `colors.running` | `#52dca5` | Phase and progress while running |
| `colors.paused` | `#ffb34e` | Phase and progress while paused |
| `colors.scheduled` | `colors.active` | Delayed start and remote warning |
| `colors.text` | secondary text | Captions |
| `colors.background` | secondary background | Program strip and progress track |

## Layout

`appearance.program_columns` (number of buttons per row, default: as many as
needed up to 8), `appearance.program_height` (45 px),
`appearance.program_icon_size` (17 px), `appearance.program_font_size` (9 px),
`appearance.corner_radius` (13 px), `appearance.action_height` (46 px).

## Texts

`labels.<key>` overrides any text: `idle`, `running`, `paused`, `finished`,
`unavailable`, `attention`, `delayed`, `program`, `power`, `water`, `finish`,
`starts`, `estimated_finish`, `start`, `pause`, `resume`, `stop`, `cancel`,
`confirm_cancel`, `schedule`, `schedule_at`, `schedule_confirm`,
`schedule_close`, `schedule_hint` (`{hours}` is replaced), `schedule_sent`,
`invalid_time`, `out_of_range`, `remote_off`, `more`, `details`, `door_open`.

## Advanced

`state_values.<group>`: comma-separated state values, for appliances whose
states the card does not know. Groups: `running`, `paused`, `delayed`,
`finished`, `stopped`, `attention`. Values are compared in lower case, with
spaces and dashes turned into underscores.

`schedule_service` (*legacy*): an action called as
`{entity_id: <job_state>, delay_minutes: N}` when there is no `delay` +
`start_later` pair.
