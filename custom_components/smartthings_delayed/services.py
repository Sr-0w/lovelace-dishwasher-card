"""Safe delayed-start scheduling through the existing official SmartThings client."""

from typing import Any

import voluptuous as vol
from pysmartthings import Attribute, Capability, Command

from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import ATTR_ENTITY_ID
from homeassistant.core import HomeAssistant, ServiceCall, SupportsResponse
from homeassistant.exceptions import ServiceValidationError
from homeassistant.helpers import config_validation as cv, entity_registry as er

from .const import DOMAIN

SERVICE_SCHEDULE_START = "schedule_start"
ATTR_DELAY_MINUTES = "delay_minutes"
ATTR_DRY_RUN = "dry_run"

SCHEDULE_SCHEMA = vol.Schema(
    {
        vol.Required(ATTR_ENTITY_ID): cv.entity_id,
        vol.Required(ATTR_DELAY_MINUTES): vol.All(vol.Coerce(int), vol.Range(min=1, max=1440)),
        vol.Optional(ATTR_DRY_RUN, default=False): cv.boolean,
    }
)


def _get_attribute(device: Any, capability: Capability, attribute: Attribute) -> Any:
    """Read a live in-memory SmartThings status attribute or None."""
    obj = device.status.get("main", {}).get(capability, {}).get(attribute)
    return None if obj is None else obj.value


def _get_target(hass: HomeAssistant, entity_id: str) -> tuple[Any, Any]:
    """Resolve a companion sensor to its loaded official SmartThings device."""
    registered = er.async_get(hass).async_get(entity_id)
    if not registered or registered.platform != DOMAIN or not registered.config_entry_id:
        raise ServiceValidationError("Select a sensor from SmartThings Dishwasher Delayed Start")
    entry = hass.config_entries.async_get_entry(registered.config_entry_id)
    if not entry or entry.state is not ConfigEntryState.LOADED:
        raise ServiceValidationError("SmartThings delayed-start integration is not loaded")
    client, device = entry.runtime_data
    if not device.online:
        raise ServiceValidationError("The dishwasher is offline")
    return client, device


async def async_setup_schedule_service(hass: HomeAssistant) -> None:
    """Register once, for any number of configured SmartThings dishwashers."""
    if hass.services.has_service(DOMAIN, SERVICE_SCHEDULE_START):
        return

    async def schedule_start(call: ServiceCall) -> dict[str, Any]:
        """Set an appliance delay and request the corresponding scheduled start."""
        client, device = _get_target(hass, call.data[ATTR_ENTITY_ID])
        minutes: int = call.data[ATTR_DELAY_MINUTES]
        status = device.status.get("main", {})

        if (
            Capability.CUSTOM_DISHWASHER_DELAY_START_TIME not in status
            or Capability.SAMSUNG_CE_DISHWASHER_OPERATION not in status
        ):
            raise ServiceValidationError("The dishwasher does not expose scheduled start controls")
        remote = _get_attribute(
            device, Capability.REMOTE_CONTROL_STATUS, Attribute.REMOTE_CONTROL_ENABLED
        )
        if remote not in ("true", True):
            raise ServiceValidationError("Enable remote control on the dishwasher first")
        state = _get_attribute(
            device, Capability.DISHWASHER_OPERATING_STATE, Attribute.MACHINE_STATE
        )
        if state != "stop":
            raise ServiceValidationError(
                f"Dishwasher must be stopped before scheduling; current state: {state}"
            )

        hh, mm = divmod(minutes, 60)
        delay_value = f"{hh:02d}:{mm:02d}:00"
        if call.data[ATTR_DRY_RUN]:
            return {
                "validated": True,
                "delay_minutes": minutes,
                "device_ready": True,
                "dry_run": True,
            }

        # Program the selected delay before starting; never use a stale, cached value.
        await client.execute_device_command(
            device.device.device_id,
            Capability.CUSTOM_DISHWASHER_DELAY_START_TIME,
            Command.SET_DISHWASHER_DELAY_START_TIME,
            "main",
            argument=delay_value,
        )
        await client.execute_device_command(
            device.device.device_id,
            Capability.SAMSUNG_CE_DISHWASHER_OPERATION,
            Command.START_LATER,
            "main",
            # Samsung expects startLater's delay in seconds: sending minutes
            # made the appliance start after ~minutes/60 minutes instead.
            argument=[minutes * 60],
        )
        return {
            "validated": True,
            "delay_minutes": minutes,
            "scheduled_command_sent": True,
        }

    hass.services.async_register(
        DOMAIN,
        SERVICE_SCHEDULE_START,
        schedule_start,
        schema=SCHEDULE_SCHEMA,
        supports_response=SupportsResponse.OPTIONAL,
    )
