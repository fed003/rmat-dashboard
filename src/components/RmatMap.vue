<template>
	<l-map
		id="rmat-map"
		ref="leafletMap"
		v-model:zoom="zoom"
		:center="center"
		style="height: 80vh; width: 100%"
	>
		<l-tile-layer
			url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			layer-type="base"
			name="OpenStreetMap"
		></l-tile-layer>
		<l-geo-json
			v-if="geoJsonData && !props.loading"
			:geojson="geoJsonData"
			:options-style="geoJsonStyle"
			:key="mapKey"
			@click="onGeoJsonClick"
			@mouseover="onGeoJsonHover"
			@mouseout="onGeoJsonLeave"
		></l-geo-json>
	</l-map>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet";
import { useStore } from "../stores/dataStore";
import geoJsonData from "../assets/ca_california_zip_codes_geo.min.json";

// Props
const props = defineProps({
	zipcodes: { type: Array, required: true },
	selectedRMAT: { type: [Number, null], default: null },
	selectedAdvisor: { type: [String, null], default: null },
});

// Emits
const emit = defineEmits(["zipcode-clicked"]);

// Store
const store = useStore();

// Map state
const darkMapColor = "#020202";
const unassignedMapColor = "#D3D3D3";
const dfltCenter = [36.7783, -119.4179];
const dfltZoom = 6;
const zoom = ref(dfltZoom);
const center = ref(dfltCenter);
const leafletMap = ref(null);
const mapKey = ref("");

// GeoJSON styling
const geoJsonStyle = (feature) => {
	const zipcode = feature.properties.ZCTA5CE10;
	const zipData = props.zipcodes.find((z) => z.zipCode == zipcode);
	const rmat = zipData?.rmatNumber;
	const advisor = zipData?.clientAdvisor;
	// Default color unless matched by filter
	let color = zipData?.color || unassignedMapColor;

	// Check if we need to filter
	if (props.selectedRMAT || props.selectedAdvisor) {
		//  If this zipcode is assigned, then we check the filter
		if (zipData) {
			if (
				(props.selectedRMAT && rmat != Number(props.selectedRMAT)) ||
				(props.selectedAdvisor && advisor != props.selectedAdvisor)
			) {
				color = darkMapColor;
			}
		}
	}

	return {
		fillColor: color,
		weight: 2,
		opacity: 1,
		color: "white",
		fillOpacity: 0.7,
	};
};

function updateMapKey() {
	mapKey.value = Math.random();
}

function resetMapZoom() {
	console.log("Resetting map...");
	center.value = dfltCenter;
	zoom.value = dfltZoom;
	leafletMap.value.leafletObject.setView(dfltCenter, dfltZoom); // Reset to default
}

watch(
	() => props.zipcodes,
	() => {
		updateMapKey();
	},
	{ deep: true }
);

// Watch filters and zoom to selected regions
watch([() => props.selectedRMAT, () => props.selectedAdvisor], () => {
	//	Reset map key to force re-render
	updateMapKey();

	// Reset map if no filters are selected
	if (!props.selectedRMAT && !props.selectedAdvisor) {
		resetMapZoom();
		return;
	}

	const selectedZipcodes = props.zipcodes.filter((zip) => {
		return (
			(props.selectedRMAT && zip.rmatNumber === Number(props.selectedRMAT)) ||
			(props.selectedAdvisor && zip.clientAdvisor === props.selectedAdvisor)
		);
	});

	if (selectedZipcodes.length === 0) {
		resetMapZoom();
		return;
	}

	const bounds = {
		latMin: undefined,
		latMax: undefined,
		lngMin: undefined,
		lngMax: undefined,
	};
	selectedZipcodes.forEach((company) => {
		const feature = geoJsonData.features.find(
			(f) => f.properties.ZCTA5CE10 === String(company.zipCode)
		);
		if (feature) {
			feature.geometry.coordinates[0].forEach((coord) =>
				coord.forEach((c) => {
					if (c[0]) {
						bounds.lngMin = Math.min(bounds.lngMin ?? c[0], c[0]);
						bounds.lngMax = Math.max(bounds.lngMax ?? c[0], c[0]);
					}
					if (c[1]) {
						bounds.latMin = Math.min(bounds.latMin ?? c[1], c[1]);
						bounds.latMax = Math.max(bounds.latMax ?? c[1], c[1]);
					}
				})
			);
		}
	});

	leafletMap.value.leafletObject.fitBounds(
		[
			[bounds.latMin, bounds.lngMin],
			[bounds.latMax, bounds.lngMax],
		],
		{ padding: [50, 50] }
	);
});

const onGeoJsonClick = (event) => {
	const zipcode = Number(event.layer.feature.properties.ZCTA5CE10);
	emit("zipcode-clicked", zipcode);
};

const onGeoJsonHover = (event) => {
	const zipcode = event.layer.feature.properties.ZCTA5CE10;
	const zipData =
		props.zipcodes.find((z) => String(z.zipCode) === zipcode) || null;
	store.setHoveredZipData(zipData);
};

const onGeoJsonLeave = () => {
	store.setHoveredZipData(null);
};
</script>

<style scoped></style>
