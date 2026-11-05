# Proposed upstream Home Assistant Core contribution

**Target:** [home-assistant/core](https://github.com/home-assistant/core), branch `dev`  
**Integration:** `homeassistant/components/smartthings`  
**Proposed title:** `SmartThings: expose Samsung dishwasher delayed-start state and timing`

## Problem

Some Samsung dishwashers report `dishwasherOperatingState.machineState=run` while the start is still delayed. The existing `dishwasherOperatingState.dishwasherJobState` may be `unknown`. However, the SmartThings API supplies the state and timing through separate Samsung capabilities:

- `samsungce.dishwasherJobState.dishwasherJobState=delayWashing`
- `samsungce.dishwasherOperation.timeLeftToStart=634` (minutes at the timestamp of the report)
- `samsungce.dishwasherOperation.remainingTime=180` (cycle duration in minutes)

The standard Home Assistant SmartThings integration does not expose these attributes as entities. The machine appears to be already running; a frontend may therefore incorrectly offer **Pause** and show the ordinary completion time despite the delayed start.

## Solution

- Add a `Detailed job state` sensor sourced from `samsungce.dishwasherJobState`, mapping `delayWashing` to `delay_washing`.
- Add `Time left to start` and `Remaining cycle time` duration sensors (minutes), sourced from `samsungce.dishwasherOperation`.
- Include English translation keys for the three sensors.
- Add a test using the already-existing dishwasher fixture `da_wm_dw_01011`, setting the delayed state and timing attributes.

Only new sensors are added; no SmartThings commands or API permissions are changed. The existing `machineState` value remains untouched. SDK `pysmartthings` 4.0.3 already knows the required capability and attribute constants, so the change requires no library update.

## Files

See [`upstream-smartthings-delayed-start.patch`](upstream-smartthings-delayed-start.patch). It modifies `sensor.py`, `strings.json`, and adds `test_dishwasher_delayed_start.py`. It has been context-checked against current `home-assistant/core` `dev` and the translated JSON has been parsed, but **Core pytest, formatting, and snapshot regeneration have not been run**.

## Submitting upstream

The authenticated GitHub user `Sr-0w` has no write access to `home-assistant/core`, and `Sr-0w/core` did not exist when the patch was prepared. The available GitHub connector does not expose repository forking.

After manually forking `https://github.com/home-assistant/core` to `Sr-0w/core`:

1. Create a feature branch in the fork from the current upstream `dev`.
2. Apply the patch and check it with `git apply --check`.
3. Run Ruff, the relevant SmartThings tests, and regenerate the affected `test_sensor` snapshots if needed.
4. Open a PR from `Sr-0w:feature/smartthings-dishwasher-delayed-start` into `home-assistant:dev` with this description.

No PR has been opened until the fork and testing steps are completed.

## Frontend consumer

The reusable [Dishwasher Card](../README.md) supports the optional entities `job_state`, `time_left_to_start` and `cycle_duration` and suppresses the misleading Pause button and regular completion timestamp during a delayed start. The dashboard can be preconfigured without affecting current device controls.
