<template>
	<l-map
		ref="leafletMap"
		v-model:zoom="zoom"
		:center="center"
		style="height: 700px; width: 100%"
	>
		<l-tile-layer
			url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
			layer-type="base"
			name="OpenStreetMap"
		></l-tile-layer>
		<l-geo-json
			v-if="geoJsonData"
			:geojson="geoJsonData"
			:options-style="geoJsonStyle"
			:key="mapKey"
			@click="onGeoJsonClick"
		></l-geo-json>
	</l-map>
</template>

<script setup>
import { ref, watch, computed } from "vue";
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet";
import geoJsonData from "../assets/ca_california_zip_codes_geo.min.json";

// Props
const props = defineProps({
	zipcodes: { type: Array, required: true },
	selectedRMAT: { type: [Number, null], default: null },
	selectedAdvisor: { type: [Number, null], default: null },
});

// Emits
const emit = defineEmits(["zipcode-clicked"]);

// Map state
const darkMapColor = "#D3D3D3";
const unassignedMapColor = "#D3D3D3";
// const dfltCenter = [37.127655, -118.480532];
const dfltCenter = [36.7783, -119.4179];
const dfltZoom = 6;
const zoom = ref(dfltZoom);
const center = ref(dfltCenter);
const leafletMap = ref(null);

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

const mapKey = computed(() => {
	console.log(
		"mapKey computed",
		props.zipcodes,
		props.selectedRMAT,
		props.selectedAdvisor
	);
	return `${props.selectedRMAT}-${props.selectedAdvisor}-${props.zipcodes.length}`;
});

// Watch filters and zoom to selected regions
watch([() => props.selectedRMAT, () => props.selectedAdvisor], () => {
	if (!leafletMap.value || (!props.selectedRMAT && !props.selectedAdvisor)) {
		center.value = dfltCenter;
		zoom.value = dfltZoom;
		leafletMap.value.leafletObject.setView(dfltCenter, dfltZoom); // Reset to default
		return;
	}

	const selectedZipcodes = props.zipcodes.filter((zip) => {
		return (
			(props.selectedRMAT &&
				zip["RMAT Number"] === Number(props.selectedRMAT)) ||
			(props.selectedAdvisor && zip["Client Advisor"] === props.selectedAdvisor)
		);
	});

	if (selectedZipcodes.length === 0) return;

	const bounds = [];
	selectedZipcodes.forEach((company) => {
		const feature = geoJsonData.features.find(
			(f) => f.properties.ZCTA5CE10 === company.ZipCode
		);
		if (feature) {
			feature.geometry.coordinates[0].forEach((coord) =>
				bounds.push([coord[1], coord[0]])
			);
		}
	});

	if (bounds.length > 0) {
		leafletMap.value.leafletObject.fitBounds(bounds, { padding: [50, 50] });
	}
});

const onGeoJsonClick = (event) => {
	const zipcode = Number(event.layer.feature.properties.ZCTA5CE10);
	emit("zipcode-clicked", zipcode);
};
</script>
