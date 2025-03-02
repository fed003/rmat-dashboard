<template>
	<v-navigation-drawer app permanent width="310">
		<div class="drawer-content">
			<v-expansion-panels v-model="panel" variant="accordion" multiple>
				<v-expansion-panel title="Filters">
					<v-expansion-panel-text>
						<v-list density="compact">
							<v-list-item>
								<v-select
									v-model="filterOptions.selectedAdsRep"
									:items="adsOptions"
									label="Filter by Ads Rep"
									clearable
									multiple
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-select
									v-model="filterOptions.selectedAdvisor"
									:items="advisorOptions"
									label="Filter by Client Advisor"
									clearable
									multiple
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-select
									v-model="filterOptions.selectedRmat"
									:items="rmatOptions"
									label="Filter by RMAT"
									clearable
									multiple
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-autocomplete
									v-model="filterOptions.selectedCounty"
									:items="countyOptions"
									label="Filter by County"
									clearable
									multiple
								></v-autocomplete>
							</v-list-item>
							<v-list-item>
								<v-text-field
									v-model="filterOptions.zipcodeSearch"
									label="Search by ZipCode"
									clearable
								></v-text-field>
							</v-list-item>
							<v-list-item>
								<v-select
									v-model="filterOptions.selectedGrouping"
									:items="groupByOptions"
									label="Select Grouping"
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-btn
									color="primary"
									block
									:disabled="isDirty != true"
									@click="applyFilters"
								>
									Apply Filters
								</v-btn>
							</v-list-item>
						</v-list>
					</v-expansion-panel-text>
				</v-expansion-panel>

				<v-expansion-panel title="Change Log">
					<v-expansion-panel-text>
						<change-log class="change-log-content" />
					</v-expansion-panel-text>
				</v-expansion-panel>
			</v-expansion-panels>
		</div>
	</v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useStore } from "../stores/dataStore";
import { groupByOptions, FilterOptions } from "../types";
import ChangeLog from "./ChangeLog.vue";

const currentFilterOptions = ref<FilterOptions>({
	selectedAdsRep: [],
	selectedAdvisor: [],
	selectedRmat: [],
	selectedCounty: [],
	zipcodeSearch: "",
	selectedGrouping: groupByOptions[0].value,
});

const filterOptions = ref<FilterOptions>({
	...currentFilterOptions.value,
});

const store = useStore();

const emit = defineEmits(["applyFilters"]);

const panel = ref<number[]>([0, 1]);

const adsOptions = computed(() => {
	return store.adsRepOptions;
});

const advisorOptions = computed(() => {
	return store.clientAdvisorOptions;
});

const countyOptions = computed(() => {
	return store.countyOptions;
});

const rmatOptions = computed(() => {
	if (
		(!currentFilterOptions.value.selectedAdsRep ||
			currentFilterOptions.value.selectedAdsRep.length == 0) &&
		(!currentFilterOptions.value.selectedAdvisor ||
			currentFilterOptions.value.selectedAdvisor.length == 0)
	) {
		return store.rmatOptions;
	}

	return [
		...new Set(
			store.rmatData
				.filter(
					(rmat) =>
						(!currentFilterOptions.value.selectedAdsRep ||
							currentFilterOptions.value.selectedAdsRep.length === 0 ||
							(rmat.AdsRep &&
								currentFilterOptions.value.selectedAdsRep.includes(
									rmat.AdsRep
								))) &&
						(!currentFilterOptions.value.selectedAdvisor ||
							currentFilterOptions.value.selectedAdvisor.length === 0 ||
							(rmat.ClientAdvisor &&
								currentFilterOptions.value.selectedAdvisor.includes(
									rmat.ClientAdvisor
								)))
				)
				.map((r) => r.RmatNumber)
		),
	].sort((a, b) => a - b);
});

const filterChanged = computed(() => {
	// Check if any filter option has changed from its current value
	return (
		!arraysEqual(
			currentFilterOptions.value.selectedAdsRep,
			filterOptions.value.selectedAdsRep
		) ||
		!arraysEqual(
			currentFilterOptions.value.selectedAdvisor,
			filterOptions.value.selectedAdvisor
		) ||
		!arraysEqual(
			currentFilterOptions.value.selectedRmat,
			filterOptions.value.selectedRmat
		) ||
		!arraysEqual(
			currentFilterOptions.value.selectedCounty,
			filterOptions.value.selectedCounty
		) ||
		currentFilterOptions.value.zipcodeSearch !==
			filterOptions.value.zipcodeSearch
	);

	// Helper function to compare arrays
	function arraysEqual(
		arr1: number[] | string[] | undefined,
		arr2: number[] | string[] | undefined
	) {
		if (!arr1 && !arr2) return true;
		if (!arr1 || !arr2) return false;
		if (arr1.length !== arr2.length) return false;

		// Sort arrays to ensure consistent comparison
		const sorted1 = [...arr1].sort();
		const sorted2 = [...arr2].sort();

		return sorted1.every((val, index) => val === sorted2[index]);
	}
});

const isDirty = computed(() => {
	return (
		filterChanged.value ||
		currentFilterOptions.value.selectedGrouping !==
			filterOptions.value.selectedGrouping
	);
});

const applyFilters = () => {
	emit("applyFilters", {
		filterOptions: filterOptions.value,
		isDirty: filterChanged.value,
	});
	currentFilterOptions.value = { ...filterOptions.value };
};
</script>

<style scoped>
.nav-drawer {
	display: flex;
	flex-direction: column;
}

.drawer-content {
	display: flex;
	flex-direction: column;
	height: 100%; /* Fill drawer height */
}

:deep(.v-expansion-panel .v-expansion-panel-text__wrapper) {
	padding-left: 0 !important;
	padding-right: 0 !important;
}

.v-list {
	flex: 0 0 auto; /* Fixed height based on content */
	padding: 8px; /* Consistent with Vuetify default */
}

.change-log-flex {
	flex: 1 1 auto; /* Expand to fill remaining space */
	overflow: hidden; /* Contain scrolling within component */
}
</style>
