"""Read-only SmartThings dishwasher job and delayed-start sensors."""

from dataclasses import dataclass
from typing import Any

from pysmartthings import Attribute, Capability
from pysmartthings.models import HealthStatus

from homeassistant.components.sensor import SensorDeviceClass, SensorEntity, SensorEntityDescription
from homeassistant.const import UnitOfTime
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback


@dataclass(frozen=True, kw_only=True)
class DishwasherSensorDescription(SensorEntityDescription):
    """Map a Samsung SmartThings attribute to one entity."""

    capability: Capability
    attribute: Attribute


SENSORS = (
    DishwasherSensorDescription(
        key="detailed_job_state",
        name="Detailed job state",
        capability=Capability.SAMSUNG_CE_DISHWASHER_JOB_STATE,
        attribute=Attribute.DISHWASHER_JOB_STATE,
    ),
    DishwasherSensorDescription(
        key="time_left_to_start",
        name="Time left to start",
        capability=Capability.SAMSUNG_CE_DISHWASHER_OPERATION,
        attribute=Attribute.TIME_LEFT_TO_START,
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MINUTES,
    ),
    DishwasherSensorDescription(
        key="remaining_cycle_time",
        name="Remaining cycle time",
        capability=Capability.SAMSUNG_CE_DISHWASHER_OPERATION,
        attribute=Attribute.REMAINING_TIME,
        device_class=SensorDeviceClass.DURATION,
        native_unit_of_measurement=UnitOfTime.MINUTES,
    ),
)


async def async_setup_entry(hass: HomeAssistant, entry, async_add_entities: AddConfigEntryEntitiesCallback) -> None:
    """Create sensors for Samsung attributes present on the target device."""
    client, device = entry.runtime_data
    attributes = device.status.get("main", {})
    available = [
        DishwasherDelaySensor(client, device, description)
        for description in SENSORS
        if description.capability in attributes
        and description.attribute in attributes[description.capability]
    ]
    async_add_entities(available)


class DishwasherDelaySensor(SensorEntity):
    """A read-only sensor driven by official SmartThings push events."""

    _attr_has_entity_name = True
    _attr_should_poll = False

    def __init__(self, client: Any, device: Any, description: DishwasherSensorDescription) -> None:
        """Use the official SmartThings client; never create a second connection."""
        self.entity_description = description
        self._client = client
        self._device_id = device.device.device_id
        self._attr_unique_id = f"{self._device_id}_delayed_{description.key}"
        self._attr_device_info = DeviceInfo(identifiers={("smartthings", self._device_id)})
        self._attr_available = device.online
        self._attr_native_value = self._normalize(
            device.status["main"][description.capability][description.attribute].value
        )

    def _normalize(self, value: Any) -> str | float | None:
        """Preserve Samsung's job state and numeric durations without guessing."""
        if value is None or value == "unknown":
            return None
        if self.entity_description.key == "detailed_job_state":
            return {"delayWashing": "delay_washing", "delayWash": "delay_wash"}.get(value, str(value))
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    async def async_added_to_hass(self) -> None:
        """Subscribe to the exact Samsung capability and device health."""
        await super().async_added_to_hass()
        desc = self.entity_description
        self.async_on_remove(
            self._client.add_device_capability_event_listener(
                self._device_id, "main", desc.capability, self._update_handler
            )
        )
        self.async_on_remove(
            self._client.add_device_availability_event_listener(
                self._device_id, self._availability_handler
            )
        )

    def _update_handler(self, event: Any) -> None:
        """Ignore sibling attributes and update only the matching sensor."""
        if event.attribute is not self.entity_description.attribute:
            return
        self._attr_native_value = self._normalize(event.value)
        self.async_write_ha_state()

    def _availability_handler(self, event: Any) -> None:
        """Follow the existing integration's connection status."""
        self._attr_available = event.status != HealthStatus.OFFLINE
        self.async_write_ha_state()
