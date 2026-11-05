"""Pick a Samsung dishwasher already connected through official SmartThings."""

import voluptuous as vol
from pysmartthings import Capability

from homeassistant import config_entries
from homeassistant.config_entries import ConfigEntryState
from homeassistant.const import CONF_DEVICE_ID

from .const import DOMAIN


class SmartThingsDelayedFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Create companion sensors for a SmartThings dishwasher."""

    VERSION = 1

    async def async_step_user(self, user_input: dict | None = None):
        """Select an existing Samsung dishwasher; never request cloud credentials."""
        devices = {}
        for entry in self.hass.config_entries.async_entries("smartthings"):
            if entry.state is not ConfigEntryState.LOADED:
                continue
            for device_id, device in entry.runtime_data.devices.items():
                capabilities = device.status.get("main", {})
                if Capability.SAMSUNG_CE_DISHWASHER_JOB_STATE in capabilities:
                    devices[device_id] = device.device.label or device.device.name or device_id
        if not devices:
            return self.async_abort(reason="no_supported_dishwashers")

        if user_input is not None:
            device_id = user_input[CONF_DEVICE_ID]
            if device_id not in devices:
                return self.async_show_form(
                    step_id="user", errors={"base": "invalid_device"},
                    data_schema=vol.Schema({vol.Required(CONF_DEVICE_ID): vol.In(devices)}),
                )
            await self.async_set_unique_id(device_id)
            self._abort_if_unique_id_configured()
            return self.async_create_entry(
                title=f"{devices[device_id]} delayed start",
                data={CONF_DEVICE_ID: device_id},
            )
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({vol.Required(CONF_DEVICE_ID): vol.In(devices)}),
        )
