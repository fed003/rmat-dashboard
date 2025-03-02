<template>
	<v-app>
		<v-app-bar app>
			<v-toolbar>
				<v-btn icon="mdi-menu" @click="drawer = !drawer"></v-btn>
				<v-toolbar-title>RMAT Dashboard</v-toolbar-title>
			</v-toolbar>
		</v-app-bar>

		<section v-if="!loading">
			<navigation-drawer v-model="drawer" @applyFilters="onApplyFilters" />

			<v-main>
				<v-container fluid>
					<v-row>
						<v-col cols="12" class="map-wrapper">
							<rmat-map
								:zipcodes="displayedZipcodes"
								:selected-grouping="selectedGrouping"
								:filter-id="filterId"
								@zipcode-clicked="openRMATDialog"
							/>
						</v-col>
					</v-row>
					<v-row>
						<v-col cols="12">
							<rmat-data-table
								:zipcodes="displayedZipcodes"
								:group-by="selectedGrouping"
							/>
						</v-col>
					</v-row>
				</v-container>

				<v-dialog v-model="dialog" max-width="600">
					<v-card
						:title="`RMAT for Zip Code ${selectedZipCode?.ZipCode}`"
						:subtitle="selectedZipCode?.RmatData?.ClientAdvisor"
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
										<td>{{ selectedZipCode?.RmatNumber }}</td>
										<td>
											{{
												selectedZipCode?.TotalNumberOfCompanies.toLocaleString()
											}}
										</td>
										<td>
											{{ selectedZipCode?.TotalEmployees.toLocaleString() }}
										</td>
										<td>${{ formatCurrency(selectedZipCode?.TotalSales) }}</td>
									</tr>
								</tbody>
							</v-table>
							<v-select
								v-model="newRMAT"
								:items="store.rmatOptionDetails"
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

				<v-card class="hover-card">
					<zip-code-data-card />
				</v-card>
			</v-main>
		</section>

		<v-snackbar v-model="snackbar" :color="snackbarColor" timeout="3000">
			{{ snackbarMessage }}
			<template #actions>
				<v-btn color="white" variant="text" @click="snackbar = false"
					>Close</v-btn
				>
			</template>
		</v-snackbar>

		<v-overlay
			:model-value="loading || updating"
			class="align-center justify-center"
		>
			<v-progress-circular indeterminate size="128" color="primary">
				{{ loadingMessage }}
			</v-progress-circular>
		</v-overlay>
	</v-app>
</template>

<script setup lang="ts">
import { type Ref, ref, onBeforeMount } from "vue";
import { useStore } from "./stores/dataStore";
import { ZipCodeData, FilterOptions, groupByOptions } from "./types/index";
import { formatCurrency } from "./utilities/formatters";
import NavigationDrawer from "./components/NavigationDrawer.vue";
import RmatMap from "./components/RmatMap.vue";
import RmatDataTable from "./components/RmatDataTable.vue";
import ZipCodeDataCard from "./components/ZipCodeDataCard.vue";

const store = useStore();

const selectedZipCode: Ref<ZipCodeData | null> = ref(null);
const newRMAT: Ref<number | null> = ref(null);

const loading = ref(true);
const updating = ref(false);
const loadingMessage = ref("Loading Data...");

const dialog = ref(false);
const drawer = ref(true);
const snackbar = ref(false);
const snackbarColor: Ref<string> = ref("success");
const snackbarMessage: Ref<string> = ref("");

const displayedZipcodes: Ref<ZipCodeData[]> = ref([]);
const selectedGrouping: Ref<string> = ref("");
const filterId: Ref<number> = ref(0);

onBeforeMount(async () => {
	await loadFiles();
});

const filterZipcodes = (filterOptions?: FilterOptions): ZipCodeData[] => {
	if (!filterOptions) {
		return store.zipcodeData;
	}

	if (
		(!filterOptions.selectedAdsRep ||
			filterOptions.selectedAdsRep.length === 0) &&
		(!filterOptions.selectedAdvisor ||
			filterOptions.selectedAdvisor.length === 0) &&
		(filterOptions.selectedRmat == null ||
			filterOptions.selectedRmat == undefined ||
			filterOptions.selectedRmat.length === 0) &&
		(!filterOptions.selectedCounty ||
			filterOptions.selectedCounty.length === 0) &&
		!filterOptions.zipcodeSearch
	) {
		return store.zipcodeData;
	}

	const result = store.zipcodeData.filter((item) => {
		const matchesAdsRep =
			filterOptions.selectedAdsRep && filterOptions.selectedAdsRep.length > 0
				? filterOptions.selectedAdsRep.includes(item.RmatData?.AdsRep)
				: true;

		const matchesAdvisor =
			filterOptions.selectedAdvisor && filterOptions.selectedAdvisor.length > 0
				? filterOptions.selectedAdvisor.includes(item.RmatData?.ClientAdvisor)
				: true;

		const matchesRMAT =
			filterOptions.selectedRmat && filterOptions.selectedRmat.length > 0
				? filterOptions.selectedRmat.includes(item.RmatData?.RmatNumber)
				: true;

		const matchesCounty =
			filterOptions.selectedCounty && filterOptions.selectedCounty.length > 0
				? filterOptions.selectedCounty.includes(item.County)
				: true;

		const matchesSearch =
			filterOptions.zipcodeSearch && filterOptions.zipcodeSearch.length > 0
				? String(item.ZipCode).includes(filterOptions.zipcodeSearch)
				: true;

		return (
			matchesAdsRep &&
			matchesAdvisor &&
			matchesRMAT &&
			matchesCounty &&
			matchesSearch
		);
	});

	return result;
};

const onApplyFilters = ({
	filterOptions,
	isDirty,
}: {
	filterOptions?: FilterOptions;
	isDirty: boolean;
}) => {
	loadingMessage.value = "Filtering Data...";
	updating.value = true;

	// Short pause to let the loading message display
	setTimeout(() => {
		displayedZipcodes.value = filterZipcodes(filterOptions);
		selectedGrouping.value =
			filterOptions?.selectedGrouping || groupByOptions[0].value;
		if (isDirty) {
			filterId.value++;
		}
		updating.value = false;
	}, 200);
};

const openRMATDialog = (zipcode: number) => {
	const zipCodeObject = store.zipcodeData.find((z) => z.ZipCode === zipcode);
	selectedZipCode.value = zipCodeObject ?? null;
	newRMAT.value = zipCodeObject?.RmatNumber ?? null;
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
			snackbarMessage.value = `RMAT for Zip Code ${selectedZipCode.value?.ZipCode} updated to ${newRMAT.value}`;
			snackbarColor.value = "success";
		} else {
			snackbarMessage.value = `RMAT for Zip Code ${selectedZipCode.value?.ZipCode} could not be updated`;
			snackbarColor.value = "error";
		}
	}
	snackbar.value = true;
	dialog.value = false;
};

const loadFiles = async () => {
	try {
		loading.value = true;
		loadingMessage.value = "Loading Data...";
		let rmatDataTask = store.loadRMATData("RMATs.csv");
		let zipDataTask = store.loadZipcodeData("ZipCodes.csv");

		await Promise.all([rmatDataTask, zipDataTask]);
		store.mergeRmatData();

		onApplyFilters({ filterOptions: undefined, isDirty: true });

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
</script>

<style scoped>
.map-wrapper {
	height: 60vh;
}

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
