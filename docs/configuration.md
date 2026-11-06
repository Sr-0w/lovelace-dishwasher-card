# Dishwasher Card — Configuration guide

## Delayed-start support

### Cancel a scheduled start

If `entities.cancel` points to an official SmartThings `button` entity, a delayed-start state shows an **Annuler le départ** action rather than a disabled **Départ programmé** button. The command is deliberately **two-step**: the first tap changes the label to **Confirmer l'annulation**, and only the second tap calls Home Assistant's `button.press` service. It is blocked when the remote-control entity is off, and it is never exposed as the main action after a delayed start ends.

```yaml
entities:
  cancel: button.my_dishwasher_cancel
labels:
  cancel: Annuler le départ
  confirm_cancel: Confirmer l'annulation
```

The action uses the official `CANCEL` command, **not** `cancel_and_drain`. It cancels the scheduled cycle; it does not pause or edit the scheduled start time. The `cancel` entity is optional for other dishwasher brands. **No cancellation command is sent during the card's test or installation.**



Configure the following optional mapping when your integration provides the corresponding entities:

```yaml
entities:
  job_state: sensor.dishwasher_detailed_job_state
  time_left_to_start: sensor.dishwasher_time_left_to_start
  cycle_duration: sensor.dishwasher_remaining_cycle_time
  # Optional alternate indicator:
  operating_progress: sensor.dishwasher_operating_progress
labels:
  delayed: Départ programmé
  starts: Début
  estimated_finish: Fin estimée
```

The card detects `delayWashing`, `delay_washing`, `delayWash`, or `delaywash`, shows an expected local start based on `time_left_to_start` at the state update timestamp, and optionally an estimated finish based on cycle duration. It disables the misleading Pause button during the delay and never presents the standard `completion_time` as a trustworthy delayed-finish time. There is no power-consumption heuristic. Once the cycle starts, it uses regular state and completion sensors.

Home Assistant's official SmartThings integration currently omits these Samsung CE sensor entities. The [proposed upstream change](upstream-smartthings-delayed-start.patch) includes an additional detailed job-state sensor, minutes until start, and remaining cycle time. The update to the core integration is **not yet merged**. The card alone cannot expose raw cloud API fields.


## Native visual editor

Open **Home Assistant → Dashboard → Edit → Dishwasher Card → Edit**. The card registers a native `ha-form` editor with searchable entity selectors, a multiple-choice and reorderable program picker, color swatches, display toggles, and expandable groups.

The groups are **General**, **Entities**, **Programs and customizations**, **Colors and layout**, and **Labels**. Existing YAML settings and unrecognized fields are preserved.

### Entities

| Key | Domain | Function |
|---|---|---|
| `entities.state` | sensor | Machine state (required) |
| `entities.program` | select | Supported programs/options (required) |
| `entities.remote` | binary_sensor | Remote enabled (`on` = enabled) |
| `entities.completion` | sensor | Estimated cycle end (ISO-8601) |
| `entities.power` | sensor | Instant power (W) |
| `entities.water` | sensor | **Cumulative** water consumption (L) |
| `entities.start` | button | Start |
| `entities.pause` | button | Pause |
| `entities.resume` | button | Resume |

### Program customization

The **program preset picker** is populated with the real `options` of your selected `select` entity. Pick up to 12 programs and reorder them using the selector. The remaining programs are accessible via **Other**.

`program_labels`, `program_short_labels` and `program_icons` can be edited in the text area, **one entry per line**:

```text
eco: Éco
ai: Auto
intensive: Intensif
extra_silence: Silence
```

Icons must be specified in MDI format, such as `eco: mdi:leaf`. Use the short labels for dense mobile layouts.

To adapt other brands, `state_values.running`, `state_values.paused`, and `state_values.stopped` are CSV lists of the corresponding raw sensor values. Example: `wash,running,drying`.

### Colors and layout

The visual editor offers color swatches and text inputs for `colors.active`, `colors.running`, `colors.paused`, `colors.text`, and `colors.background`. Hex colors and CSS theme variables are supported.

`appearance.program_columns` selects the number of buttons per row (default 8), `appearance.program_height` their height in pixels (default 45), `appearance.program_icon_size` the icon size (default 17), `appearance.program_font_size` the label size (default 9), `appearance.corner_radius` the segment radius (default 13), and `appearance.action_height` the primary action height (default 46).

Visibility flags: `show_header`, `show_program`, `show_power`, `show_remote_warning`, `show_completion`, `show_selector`, `show_controls` (true unless explicitly false). Optional `show_water: true` shows cumulative liters when an entity is provided.

All strings in `labels` can be translated or customized in the visual editor.

### Example

```yaml
type: custom:dishwasher-card
name: Lave-vaisselle
entities:
  state: sensor.my_dishwasher_state
  program: select.my_dishwasher_program
  remote: binary_sensor.my_dishwasher_remote
  power: sensor.my_dishwasher_power
  start: button.my_dishwasher_start
  pause: button.my_dishwasher_pause
  resume: button.my_dishwasher_resume
program_presets:
  - eco
  - ai
  - intensive
program_labels:
  eco: Éco
  ai: Auto
  intensive: Intensif
colors:
  active: "#FF6A00"
appearance:
  program_columns: 4
  program_height: 48
show_water: false
```

Commands use native Home Assistant services: `select.select_option` and `button.press`. All requests run under the current user's permissions. If a remote-control sensor is configured and reports `off`, actions are blocked.
