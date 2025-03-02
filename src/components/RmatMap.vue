<template>
	<l-map
		id="rmat-map"
		ref="leafletMap"
		style="height: 100%; width: 100%"
		:zoom="dfltZoom"
		:center="dfltCenter"
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
			@mouseover="onGeoJsonHover"
			@mouseout="onGeoJsonLeave"
		></l-geo-json>
	</l-map>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, Ref } from "vue";
import { useStore } from "../stores/dataStore";
import { ZipCodeData } from "../types";
import { FeatureCollection, Feature } from "geojson";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { LMap, LTileLayer, LGeoJson } from "@vue-leaflet/vue-leaflet";

import zipCodeGeoJson from "../assets/ca_california_zip_codes_geo.min.json";

// Props
const props = defineProps<{
	zipcodes: ZipCodeData[];
	selectedGrouping?: string;
	filterId?: number;
}>();

// Emits
const emit = defineEmits<{
	(event: "zipcode-clicked", zipcode: number): void;
}>();

// Store
const store = useStore();

// GeoJSON data - should not be reactive to prevent re-rendering
let geoJsonData: FeatureCollection = zipCodeGeoJson;

// Map state
const leafletMap: Ref<L.Map | null> = ref(null);
const mapKey = ref(0);
let isManualZoom = false;

//	Constants
const darkMapColor = "#020202";
// const unassignedMapColor = "#D3D3D3";
const dfltCenter: [number, number] = [36.7783, -119.4179];
const dfltZoom = 6;

onMounted(() => {
	delete L.Icon.Default.prototype._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: markerIcon2x,
		iconUrl: markerIcon,
		shadowUrl: markerShadow,
	});
});

// GeoJSON styling
const geoJsonStyle = (feature: Feature): L.PathOptions => {
	const zipcode = feature.properties?.ZCTA5CE10;
	const zipData = props.zipcodes.find((z) => z.ZipCode == Number(zipcode));

	const filterColor = darkMapColor;

	// Default color unless matched by filter
	let color =
		props.selectedGrouping === "County"
			? zipData?.CountyColor || filterColor
			: props.selectedGrouping === "AdsRep"
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
	if (leafletMap.value) {
		leafletMap.value.setView(dfltCenter, dfltZoom); // Reset to default
		updateMapKey();
		isManualZoom = false;
	}
}

watch(
	() => props.filterId,
	() => {
		//	At least one filter changed, so we need to check the map bounds

		// If the map is not yet loaded, stop here
		if (!leafletMap.value) {
			return;
		}

		// If no zipcodes are selected, reset map
		if (props.zipcodes.length === 0) {
			resetMapZoom();
			return;
		}

		//	Get the new bounds for the map
		const bounds = {
			latMin: undefined as number | undefined,
			latMax: undefined as number | undefined,
			lngMin: undefined as number | undefined,
			lngMax: undefined as number | undefined,
		};
		props.zipcodes.forEach((zip) => {
			//	Find the feature for the zip code or county
			const feature =
				props.selectedGrouping === "County"
					? geoJsonData.features.find((f) => f.properties?.NAME === zip.County)
					: geoJsonData.features.find(
							(f) => f.properties?.ZCTA5CE10 === String(zip.ZipCode)
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

		leafletMap.value.leafletObject.fitBounds(
			[
				[bounds.latMin, bounds.lngMin],
				[bounds.latMax, bounds.lngMax],
			],
			{ padding: [50, 50] }
		);
	}
);

//	Need to trigger a map update when the selected grouping or the zipcodes change
watch(
	[() => props.selectedGrouping, () => props.zipcodes],
	() => {
		updateMapKey();
		return;
	},
	{
		deep: true,
	}
);

const onGeoJsonClick = (event: L.LeafletMouseEvent) => {
	const zipcode = Number(event.propagatedFrom.feature.properties?.ZCTA5CE10);
	if (props.zipcodes.find((z) => z.ZipCode === zipcode)) {
		emit("zipcode-clicked", zipcode);
	}
};

const onGeoJsonHover = (event: L.LeafletMouseEvent) => {
	const zipcode = event.propagatedFrom.feature.properties?.ZCTA5CE10;
	const zipData =
		props.zipcodes.find((z) => String(z.ZipCode) === zipcode) || null;
	store.setHoveredZipData(zipData);
};

const onGeoJsonLeave = () => {
	store.setHoveredZipData(null);
};
</script>

<style scoped></style>
