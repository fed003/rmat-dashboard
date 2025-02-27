<template>
	<l-map
		id="rmat-map"
		ref="leafletMap"
		v-model:zoom="zoom"
		:center="center"
		style="height: 65vh; width: 100%"
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
import { ref, watch, onMounted } from "vue";
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet";
import { useStore } from "../stores/dataStore";
import geoJsonData from "../assets/ca_california_zip_codes_geo.min.json";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Props
const props = defineProps({
	zipcodes: { type: Array, required: true },
	selectedRmat: { type: [Array, null], default: null },
	selectedAdvisor: { type: [Array, null], default: null },
	selectedAdsRep: { type: [Array, null], default: null },
	selectedCounty: { type: [Array, null], default: null },
	selectedGrouping: { type: String },
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
const mapKey = ref(0);

onMounted(() => {
	delete L.Icon.Default.prototype._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: markerIcon2x,
		iconUrl: markerIcon,
		shadowUrl: markerShadow,
	});
});

// GeoJSON styling
const geoJsonStyle = (feature) => {
	const zipcode = feature.properties.ZCTA5CE10;
	const zipData = props.zipcodes.find((z) => z.ZipCode == zipcode);
	// const rmat = zipData?.RmatNumber;
	// const advisor = zipData?.RmatData?.ClientAdvisor;
	// const adsRep = zipData?.RmatData?.AdsRep;

	const filterColor =
		props.selectedRmat?.length > 0 ||
		props.selectedAdvisor?.length > 0 ||
		props.selectedAdsRep?.length > 0
			? darkMapColor
			: unassignedMapColor;

	// Default color unless matched by filter
	let color =
		props.selectedGrouping === "AdsRep"
			? zipData?.RmatData?.AdsRepColor || filterColor
			: zipData?.RmatData?.ClientAdvisorColor || filterColor;

	return {
		fillColor: color,
		weight: 1.5,
		opacity: 1,
		color: "#F5F5F5",
		fillOpacity: 0.4,
	};
};

function updateMapKey() {
	mapKey.value = Math.random();
}

function resetMapZoom() {
	center.value = dfltCenter;
	zoom.value = dfltZoom;
	if (leafletMap.value?.leafletObject) {
		leafletMap.value.leafletObject.setView(dfltCenter, dfltZoom); // Reset to default
		updateMapKey();
	}
}

// Watch filters and zoom to selected regions
watch([() => props.zipcodes, () => props.selectedGrouping], () => {
	// If the map is not yet loaded, stop here
	if (!leafletMap.value?.leafletObject) {
		return;
	}

	// Reset map if no filters are selected
	if (
		!props.selectedRmat?.length > 0 &&
		!props.selectedAdvisor?.length > 0 &&
		!props.selectedAdsRep?.length > 0 &&
		!props.selectedCounty?.length > 0
	) {
		resetMapZoom();
		return;
	}

	// If no zipcodes are selected, reset map
	if (props.zipcodes.length === 0) {
		resetMapZoom();
		return;
	}

	const bounds = {
		latMin: undefined,
		latMax: undefined,
		lngMin: undefined,
		lngMax: undefined,
	};
	props.zipcodes.forEach((zip) => {
		const feature = geoJsonData.features.find(
			(f) => f.properties.ZCTA5CE10 === String(zip.ZipCode)
		);
		if (feature) {
			feature.geometry.coordinates[0].forEach((c) => {
				if (typeof c[0] == "number") {
					bounds.lngMin = Math.min(bounds.lngMin ?? c[0], c[0]);
					bounds.lngMax = Math.max(bounds.lngMax ?? c[0], c[0]);
				}
				if (typeof c[1] == "number") {
					bounds.latMin = Math.min(bounds.latMin ?? c[1], c[1]);
					bounds.latMax = Math.max(bounds.latMax ?? c[1], c[1]);
				}
			});
		}
	});

	if (!bounds.latMin || !bounds.latMax || !bounds.lngMin || !bounds.lngMax) {
		return;
	}

	updateMapKey();

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
		props.zipcodes.find((z) => String(z.ZipCode) === zipcode) || null;
	store.setHoveredZipData(zipData);
};

const onGeoJsonLeave = () => {
	store.setHoveredZipData(null);
};
</script>

<style scoped></style>
