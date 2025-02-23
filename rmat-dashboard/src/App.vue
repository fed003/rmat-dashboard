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
			v-model:company-search="companySearch"
			:rmat-options="rmatOptions"
			:advisor-options="advisorOptions"
		/>

		<v-main>
			<v-container fluid>
				<v-row>
					<v-col cols="12">
						<rmat-map
							:companies="filteredCompanies"
							:selected-r-m-a-t="selectedRMAT"
							:selected-advisor="selectedAdvisor"
							@zipcode-clicked="openRMATDialog"
						/>
					</v-col>
				</v-row>
				<v-row>
					<v-col cols="12">
						<rmat-data-table
							:companies="filteredCompanies"
							@row-clicked="openRMATDialog"
						/>
					</v-col>
				</v-row>
				<v-row>
					<v-col>
						<v-btn
							color="success"
							@click="saveAllChanges"
							:disabled="!hasPendingChanges"
						>
							Save All Changes
						</v-btn>
					</v-col>
				</v-row>
			</v-container>

			<v-dialog v-model="dialog" max-width="400">
				<v-card>
					<v-card-title
						>Reassign RMAT for ZipCode {{ selectedZipCode }}</v-card-title
					>
					<v-card-text>
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

const store = useStore();

const selectedRMAT = ref(null);
const selectedAdvisor = ref(null);
const companySearch = ref("");
const dialog = ref(false);
const selectedZipCode = ref(null);
const newRMAT = ref(null);

const rmatOptions = computed(() => [
	...new Set(store.rmatData.map((item) => item["RMAT Number"])),
]);
const advisorOptions = computed(() => [
	...new Set(store.rmatData.map((item) => item["Client Advisor"])),
]);

const filteredCompanies = computed(() => {
	const mergedData = store.companyData.map((company) => {
		const rmat =
			store.rmatData.find((r) => r.ZipCode === company.ZipCode) || {};
		return { ...company, ...rmat };
	});

	return mergedData.filter((item) => {
		const matchesRMAT = selectedRMAT.value
			? item["RMAT Number"] === selectedRMAT.value
			: true;
		const matchesAdvisor = selectedAdvisor.value
			? item["Client Advisor"] === selectedAdvisor.value
			: true;
		const matchesSearch = companySearch.value
			? item.ZipCode.toLowerCase().includes(companySearch.value.toLowerCase())
			: true;
		return matchesRMAT && matchesAdvisor && matchesSearch;
	});
});

const hasPendingChanges = computed(
	() => Object.keys(store.pendingChanges).length > 0
);

const loadFiles = async () => {
	try {
		const rmatResponse = await fetch("/RMATs_and_ZipCodes.csv");
		const rmatText = await rmatResponse.text();
		store.loadRMATData({ text: () => rmatText });

		const companyResponse = await fetch("/Companies.csv");
		const companyText = await companyResponse.text();
		store.loadCompanyData({ text: () => companyText });
	} catch (error) {
		console.error("Error loading CSV files:", error);
	}
};

const openRMATDialog = (zipcode) => {
	selectedZipCode.value = zipcode;
	const rmat = store.rmatData.find((r) => r.ZipCode === zipcode);
	newRMAT.value = rmat ? rmat["RMAT Number"] : null;
	dialog.value = true;
};

const saveRMATChange = () => {
	if (selectedZipCode.value && newRMAT.value) {
		store.assignRMAT(selectedZipCode.value, newRMAT.value);
	}
	dialog.value = false;
};

const saveAllChanges = () => {
	store.saveChanges();
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
