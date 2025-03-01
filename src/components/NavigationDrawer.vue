<template>
	<v-navigation-drawer app permanent width="310">
		<div class="drawer-content">
			<v-expansion-panels v-model="panels" multiple>
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
								<v-btn color="primary" block @click="applyFilters">
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
import { type Ref, computed, ref, onBeforeMount } from "vue";
import { useStore } from "../stores/dataStore";
import { groupByOptions, FilterOptions } from "../types";
import ChangeLog from "./ChangeLog.vue";

let currentFilterOptions: FilterOptions = {
	selectedAdsRep: [],
	selectedAdvisor: [],
	selectedRmat: [],
	selectedCounty: [],
	zipcodeSearch: "",
	selectedGrouping: groupByOptions[0].value,
};

const filterOptions: Ref<FilterOptions> = ref(currentFilterOptions);

const store = useStore();

const emit = defineEmits(["applyFilters"]);

const panels: Ref<number[]> = ref<number[]>([0, 1]);

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
		(!currentFilterOptions.selectedAdsRep ||
			currentFilterOptions.selectedAdsRep.length == 0) &&
		(!currentFilterOptions.selectedAdvisor ||
			currentFilterOptions.selectedAdvisor.length == 0)
	) {
		return store.rmatOptions;
	}

	return [
		...new Set(
			store.rmatData
				.filter(
					(rmat) =>
						(!currentFilterOptions.selectedAdsRep ||
							currentFilterOptions.selectedAdsRep.length === 0 ||
							(rmat.AdsRep &&
								currentFilterOptions.selectedAdsRep.includes(rmat.AdsRep))) &&
						(!currentFilterOptions.selectedAdvisor ||
							currentFilterOptions.selectedAdvisor.length === 0 ||
							(rmat.ClientAdvisor &&
								currentFilterOptions.selectedAdvisor.includes(
									rmat.ClientAdvisor
								)))
				)
				.map((r) => r.RmatNumber)
		),
	].sort((a, b) => a - b);
});

const isDirty = computed(() => {
	return (
		JSON.stringify(currentFilterOptions) !== JSON.stringify(filterOptions.value)
	);
});

const applyFilters = () => {
	currentFilterOptions = filterOptions.value;
	emit("applyFilters", {
		filterOptions: currentFilterOptions,
		isDirty: isDirty.value,
	});
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
