<template>
	<v-app>
		<v-app-bar app>
			<v-toolbar>
				<v-toolbar-title>Sales Manager Dashboard</v-toolbar-title>
			</v-toolbar>
		</v-app-bar>

		<navigation-drawer
			v-model:selected-r-m-a-t="selectedRMAT"
			v-model:selected-advisor="selectedAdvisor"
			v-model:zipcode-search="zipcodeSearch"
		/>

		<v-main>
			<v-container fluid>
				<v-row>
					<v-col cols="12">
						<rmat-map
							:zipcodes="filteredZipcodes"
							:selected-r-m-a-t="selectedRMAT"
							:selected-advisor="selectedAdvisor"
							@zipcode-clicked="openRMATDialog"
							@zipcode-hovered="onZipcodeHovered"
							@zipcode-left="onZipcodeLeft"
						/>
					</v-col>
				</v-row>
				<v-row>
					<v-col cols="12">
						<rmat-data-table
							:zipcodes="filteredZipcodes"
							@row-clicked="openRMATDialog"
						/>
					</v-col>
				</v-row>
			</v-container>

			<v-dialog v-model="dialog" max-width="600">
				<v-card
					:title="`RMAT for Zip Code ${selectedZipCode.zipCode}`"
					:subtitle="selectedZipCode.clientAdvisor"
				>
					<v-card-text>
						<v-table density="compact" class="mb-4">
							<thead>
								<tr class="text-center">
									<th>RMAT</th>
									<th>Total Companies</th>
									<th>Total Employees</th>
									<th>Total Sales</th>
								</tr>
							</thead>
							<tbody>
								<tr class="text-center">
									<td>{{ selectedZipCode.rmatNumber }}</td>
									<td>{{ selectedZipCode.totalNumberOfCompanies }}</td>
									<td>{{ selectedZipCode.totalEmployees }}</td>
									<td>${{ selectedZipCode.totalSales.toLocaleString() }}</td>
								</tr>
							</tbody>
						</v-table>
						<v-select
							v-model="newRMAT"
							:items="rmatOptions"
							label="New RMAT"
						></v-select>
					</v-card-text>
					<v-card-actions>
						<v-spacer></v-spacer>
						<v-btn color="primary" @click="saveRMATChange">Save</v-btn>
						<v-btn @click="dialog = false">Cancel</v-btn>
					</v-card-actions>
				</v-card>
			</v-dialog>

			<v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
				{{ snackbarMessage }}
				<template #actions>
					<v-btn color="white" variant="text" @click="snackbar = false"
						>Close</v-btn
					>
				</template>
			</v-snackbar>

			<v-overlay :model-value="loading" class="align-center justify-center">
				<v-progress-circular indeterminate size="128" color="primary">
					{{ loadingMessage }}
				</v-progress-circular>
			</v-overlay>
		</v-main>
	</v-app>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useStore } from "./stores/dataStore";
import NavigationDrawer from "./components/NavigationDrawer.vue";
import RmatMap from "./components/RmatMap.vue";
import RmatDataTable from "./components/RmatDataTable.vue";
import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

import ChangeLog from "./components/ChangeLog.vue";

const store = useStore();

const selectedRMAT = ref(null);
const selectedAdvisor = ref(null);
const zipcodeSearch = ref("");
const dialog = ref(false);
const selectedZipCode = ref(null);
const newRMAT = ref(null);

const rmatOptions = computed(() =>
	[...new Set(store.rmatData.map((r) => r.rmatNumber))].sort((a, b) => a - b)
);

const snackbar = ref(false);
const snackbarColor = ref("success");
const snackbarMessage = ref("");

const loading = ref(false);
const loadingMessage = ref("Loading Data...");

const hoveredZipData = ref(null);

const filteredZipcodes = computed(() => {
	loading.value = true;
	loadingMessage.value = "Filtering Data...";

	if (!selectedRMAT.value && !selectedAdvisor.value && !zipcodeSearch.value) {
		loading.value = false;
		return store.zipcodeData;
	}

	const result = store.zipcodeData.filter((item) => {
		const matchesRMAT = selectedRMAT.value
			? item.rmatNumber === selectedRMAT.value
			: true;
		const matchesAdvisor = selectedAdvisor.value
			? item.clientAdvisor === selectedAdvisor.value
			: true;
		const matchesSearch =
			zipcodeSearch.value.length > 0
				? String(item.zipCode).includes(zipcodeSearch.value)
				: true;
		return matchesRMAT && matchesAdvisor && matchesSearch;
	});

	loading.value = false;
	return result;
});

const loadFiles = async () => {
	try {
		loading.value = true;
		loadingMessage.value = "Loading Data...";

		const rmatResponse = await fetch("/RMATs.csv"); // Updated filename
		const rmatText = await rmatResponse.text();
		store.loadRMATData({ text: () => rmatText });

		const zipResponse = await fetch("/ZipCodes.csv"); // Updated filename
		const zipText = await zipResponse.text();
		store.loadZipcodeData({ text: () => zipText });
	} catch (error) {
		console.error("Error loading CSV files:", error);
	} finally {
		loading.value = false;
	}
};

const openRMATDialog = (zipcode) => {
	const zipCodeObject = store.zipcodeData.find((z) => z.zipCode === zipcode);
	selectedZipCode.value = zipCodeObject ?? {
		zipCode: zipcode,
		rmatNumber: null,
		totalNumberOfCompanies: 0,
		totalEmployees: 0,
		totalSales: 0,
	};
	newRMAT.value = zipCodeObject ? zipCodeObject.rmatNumber : null;
	dialog.value = true;
};

const saveRMATChange = () => {
	//	Have to check for null and undefined because 0 is a valid value
	if (
		selectedZipCode.value &&
		newRMAT.value !== null &&
		newRMAT.value !== undefined
	) {
		let rmatUpdated = store.assignRMAT(selectedZipCode.value, newRMAT.value);
		if (rmatUpdated) {
			snackbarMessage.value = `RMAT for Zip Code ${selectedZipCode.value.zipCode} updated to ${newRMAT.value}`;
			snackbarColor.value = "success";
		} else {
			snackbarMessage.value = `RMAT for Zip Code ${selectedZipCode.value.zipCode} could not be updated`;
			snackbarColor.value = "error";
		}
	}
	snackbar.value = true;
	dialog.value = false;
};

const onZipcodeHovered = (zipData) => {
	hoveredZipData.value = zipData;
};

const onZipcodeLeft = () => {
	hoveredZipData.value = null;
};

onMounted(() => {
	delete L.Icon.Default.prototype._getIconUrl;
	L.Icon.Default.mergeOptions({
		iconRetinaUrl: markerIcon2x,
		iconUrl: markerIcon,
		shadowUrl: markerShadow,
	});

	loadFiles();
});
</script>

<style>
.custom-marker {
	border: none;
}
</style>
