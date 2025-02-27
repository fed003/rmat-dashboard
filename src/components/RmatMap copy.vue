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
			v-if="store.geoJsonData"
			:geojson="store.geoJsonData"
			:options-style="geoJsonStyle"
			:key="mapKey"
			@click="onGeoJsonClick"
			@mouseover="onGeoJsonHover"
			@mouseout="onGeoJsonLeave"
		></l-geo-json>
	</l-map>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useStore } from "../stores/dataStore";
import { ZipCodeData, GroupByOption } from "../types";
import type { PointExpression, StyleFunction, LeafletEvent } from "leaflet";
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet";
import type { GeoJSON, Feature } from "geojson";

// Props
const props = withDefaults(
	defineProps<{
		zipcodes: ZipCodeData[];
		selectedGrouping: GroupByOption;
		selectedAdsRep?: string;
		selectedAdvisor?: string;
		selectedRmat?: number;
		selectedCounty?: string;
	}>(),
	{
		selectedGrouping: GroupByOption.AdsRep,
	}
);

// Emits
const emit = defineEmits(["zipcode-clicked"]);

// Store
const store = useStore();

// Using ref to store the GeoJSON data that will be loaded at runtime
// const geoJsonData: Ref<GeoJSON | null> = ref(null);
const leafletMap = ref<typeof LMap | null>(null);

// Map state
const darkMapColor = "#020202";
const unassignedMapColor = "#D3D3D3";
const dfltCenter: PointExpression = [36.7783, -119.4179];
const center = ref<PointExpression>(dfltCenter);
const dfltZoom = 6;
const zoom = ref(dfltZoom);
const mapKey = ref(0);

// Load GeoJSON data
// onMounted(async () => {
// 	try {
// 		const response = await fetch("ca_california_zip_codes_geo.min.json");
// 		geoJsonData.value = await response.json();
// 	} catch (error) {
// 		console.error("Failed to load GeoJSON data:", error);
// 	}
// });

// GeoJSON styling
const geoJsonStyle: StyleFunction = (feature: Feature) => {
	if (!feature.properties) {
		return {};
	}

	const zipcode = feature.properties.ZCTA5CE10;
	const zipData = props.zipcodes.find((z) => z.ZipCode == zipcode);
	const rmat = zipData?.RmatNumber;
	const advisor = zipData?.RmatData?.ClientAdvisor;
	const adsRep = zipData?.RmatData?.AdsRep;

	// Default color unless matched by filter
	let color =
		props.selectedGrouping === GroupByOption.AdsRep
			? zipData?.RmatData?.AdsRepColor || unassignedMapColor
			: zipData?.RmatData?.ClientAdvisorColor || unassignedMapColor;

	// Check if we need to filter
	if (props.selectedRmat || props.selectedAdvisor || props.selectedAdsRep) {
		//  If this zipcode is assigned, then we check the filter
		if (zipData) {
			if (
				(props.selectedRmat && rmat != Number(props.selectedRmat)) ||
				(props.selectedAdvisor && advisor != props.selectedAdvisor) ||
				(props.selectedAdsRep && adsRep != props.selectedAdsRep)
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
	if (!leafletMap.value) {
		return;
	}
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
watch([() => props.selectedRmat, () => props.selectedAdvisor], () => {
	if (!leafletMap.value) {
		return;
	}

	//	Reset map key to force re-render
	updateMapKey();

	// Reset map if no filters are selected
	if (!props.selectedRmat && !props.selectedAdvisor) {
		resetMapZoom();
		return;
	}

	const selectedZipcodes = props.zipcodes.filter((zip) => {
		return (
			(props.selectedRmat && zip.RmatNumber === Number(props.selectedRmat)) ||
			(props.selectedAdvisor &&
				zip.RmatData?.ClientAdvisor === props.selectedAdvisor)
		);
	});

	if (selectedZipcodes.length === 0) {
		resetMapZoom();
		return;
	}

	const bounds = {
		latMin: undefined as number | undefined,
		latMax: undefined as number | undefined,
		lngMin: undefined as number | undefined,
		lngMax: undefined as number | undefined,
	};
	selectedZipcodes.forEach((zip) => {
		const feature = geoJsonData.features.find(
			(f) => f.properties.ZCTA5CE10 === String(zip.ZipCode)
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

const onGeoJsonClick = (event: LeafletEvent) => {
	const zipcode = Number(event.propagatedFrom.feature.properties.ZCTA5CE10);
	emit("zipcode-clicked", zipcode);
};

const onGeoJsonHover = (event: LeafletEvent) => {
	const zipcode = event.propagatedFrom.feature.properties.ZCTA5CE10;
	const zipData =
		props.zipcodes.find((z) => String(z.ZipCode) === zipcode) || null;
	store.setHoveredZipData(zipData);
};

const onGeoJsonLeave = () => {
	store.setHoveredZipData(null);
};

onMounted(() => {
	// delete L.Icon.Default.prototype._getIconUrl;
	// L.Icon.Default.mergeOptions({
	// 	iconRetinaUrl: markerIcon2x,
	// 	iconUrl: markerIcon,
	// 	shadowUrl: markerShadow,
	// });
});
</script>

<style scoped></style>
