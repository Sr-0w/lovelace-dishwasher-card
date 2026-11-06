"""Expose Samsung dishwasher delayed-start data without overriding SmartThings."""

from homeassistant.config_entries import ConfigEntry, ConfigEntryState
from homeassistant.const import CONF_DEVICE_ID, Platform
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .services import async_setup_schedule_service

PLATFORMS = [Platform.SENSOR]


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    """Register an optional scheduling service, without touching devices."""
    await async_setup_schedule_service(hass)
    return True


def get_smartthings_device(hass: HomeAssistant, device_id: str):
    """Find a loaded official SmartThings instance containing the device."""
    for upstream in hass.config_entries.async_entries("smartthings"):
        if upstream.state is not ConfigEntryState.LOADED:
            continue
        data = upstream.runtime_data
        device = data.devices.get(device_id)
        if device is not None:
            return data.client, device
    return None


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up a companion using the existing official SmartThings connection."""
    found = get_smartthings_device(hass, entry.data[CONF_DEVICE_ID])
    if found is None:
        raise ConfigEntryNotReady("SmartThings dishwasher is not currently loaded")
    entry.runtime_data = found
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload only the companion sensors."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
