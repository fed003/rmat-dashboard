<template>
	<v-app>
		<v-app-bar app>
			<v-toolbar>
				<v-btn icon="mdi-menu" @click="drawer = !drawer"></v-btn>
				<v-toolbar-title>RMAT Dashboard</v-toolbar-title>
			</v-toolbar>
		</v-app-bar>

		<section v-if="!loading">
			<navigation-drawer
				v-model="drawer"
				v-model:selected-ads-rep="selectedAdsRep"
				v-model:selected-advisor="selectedAdvisor"
				v-model:selected-rmat="selectedRmat"
				v-model:selected-county="selectedCounty"
				v-model:zipcode-search="zipcodeSearch"
				v-model:selected-grouping="selectedGrouping"
			/>

			<v-main>
				<v-container fluid>
					<v-row>
						<v-col cols="12">
							<rmat-map
								:zipcodes="filteredZipcodes"
								:selected-grouping="selectedGrouping"
								:selected-rmat="selectedRmat"
								:selected-advisor="selectedAdvisor"
								:selected-ads-rep="selectedAdsRep"
								:selected-county="selectedCounty"
								@zipcode-clicked="openRMATDialog"
							/>
						</v-col>
					</v-row>
					<v-row>
						<v-col cols="12">
							<rmat-data-table
								:zipcodes="filteredZipcodes"
								:group-by="selectedGrouping"
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
										<td>{{ selectedZipCode.RmatNumber }}</td>
										<td>{{ selectedZipCode.totalNumberOfCompanies }}</td>
										<td>{{ selectedZipCode.totalEmployees }}</td>
										<td>${{ selectedZipCode.totalSales.toLocaleString() }}</td>
									</tr>
								</tbody>
							</v-table>
							<v-select
								v-model="newRMAT"
								:items="store.rmatOptions"
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

				<v-card class="hover-card">
					<zip-code-data-card />
				</v-card>
			</v-main>
		</section>

		<v-overlay :model-value="loading" class="align-center justify-center">
			<v-progress-circular indeterminate size="128" color="primary">
				{{ loadingMessage }}
			</v-progress-circular>
		</v-overlay>
	</v-app>
</template>

<script setup lang="ts">
import { type Ref, ref, computed, onMounted, onBeforeMount } from "vue";
import { useStore } from "./stores/dataStore";
import { GroupByOption, RmatData, ZipCodeData } from "./types/index";
import NavigationDrawer from "./components/NavigationDrawer.vue";
import RmatMap from "./components/RmatMap.vue";
import RmatDataTable from "./components/RmatDataTable.vue";
import ZipCodeDataCard from "./components/ZipCodeDataCard.vue";

const store = useStore();

const selectedAdsRep: Ref<string | undefined> = ref(undefined);
const selectedAdvisor: Ref<string | undefined> = ref(undefined);
const selectedRmat: Ref<number | undefined> = ref(undefined);
const selectedCounty: Ref<string | undefined> = ref(undefined);
const zipcodeSearch: Ref<string | undefined> = ref("");
const selectedGrouping: Ref<GroupByOption> = ref(GroupByOption.AdsRep);

const selectedZipCode: Ref<ZipCodeData | null> = ref(null);
const newRMAT: Ref<string | null> = ref(null);

const loading = ref(true);
const loadingMessage = ref("Loading Data...");

const dialog = ref(false);
const drawer = ref(true);
const snackbar = ref(false);
const snackbarColor: Ref<string> = ref("success");
const snackbarMessage: Ref<string> = ref("");

const hoveredZipData: Ref<ZipCodeData | null> = ref(null);

const filteredZipcodes: Ref<ZipCodeData[]> = computed(() => {
	if (
		!selectedAdsRep.value &&
		!selectedAdvisor.value &&
		selectedRmat.value !== null &&
		!selectedCounty.value &&
		!zipcodeSearch.value
	) {
		return store.zipcodeData;
	}

	loading.value = true;
	loadingMessage.value = "Filtering Data...";

	const result = store.zipcodeData.filter((item) => {
		const matchesAdsRep = selectedAdsRep.value
			? item.RmatData?.AdsRep === selectedAdsRep.value
			: true;

		const matchesAdvisor = selectedAdvisor.value
			? item.RmatData?.ClientAdvisor === selectedAdvisor.value
			: true;

		const matchesRMAT = selectedRmat.value
			? item.RmatNumber === selectedRmat.value
			: true;

		const matchesCounty = selectedCounty.value
			? item.County === selectedCounty.value
			: true;

		const matchesSearch =
			zipcodeSearch.value && zipcodeSearch.value.length > 0
				? String(item.ZipCode).includes(zipcodeSearch.value)
				: true;
		return (
			matchesAdsRep &&
			matchesAdvisor &&
			matchesRMAT &&
			matchesCounty &&
			matchesSearch
		);
	});

	loading.value = false;
	return result;
});

const loadFiles = async () => {
	try {
		loading.value = true;
		console.log("Loading data files...", loading.value);
		loadingMessage.value = "Loading Data...";

		let rmatDataTask = store.loadRMATData("RMATs.csv");
		let zipDataTask = store.loadZipcodeData("ZipCodes.csv");

		await Promise.all([rmatDataTask, zipDataTask]);
		store.mergeRmatData();

		snackbarMessage.value = "Data files loaded successfully";
		snackbarColor.value = "success";
		snackbar.value = true;
	} catch (error) {
		console.error(error);
		snackbarMessage.value = "Error loading data files";
		snackbarColor.value = "error";
		snackbar.value = true;
	} finally {
		loading.value = false;
	}
};

const openRMATDialog = (zipcode: ZipCodeData) => {
	const zipCodeObject = store.zipcodeData.find((z) => z.ZipCode === zipcode);
	selectedZipCode.value = zipCodeObject;
	newRMAT.value = zipCodeObject ? zipCodeObject.RmatNumber : null;
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

onBeforeMount(async () => {
	await loadFiles();
});
</script>

<style scoped>
.hover-card {
	position: fixed;
	top: 80px;
	right: 10px;
	width: 300px;
	background: rgba(255, 255, 255, 0.9);
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	z-index: 1000; /* Above map and overlays */
}
</style>
