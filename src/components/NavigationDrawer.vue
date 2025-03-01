<template>
	<v-navigation-drawer app permanent width="310">
		<div class="drawer-content">
			<v-expansion-panels v-model="panels" multiple>
				<v-expansion-panel title="Filters">
					<v-expansion-panel-text>
						<v-list density="compact">
							<v-list-item>
								<v-select
									v-model="selectedAdsRep"
									:items="adsOptions"
									label="Filter by Ads Rep"
									clearable
									multiple
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-select
									v-model="selectedAdvisor"
									:items="advisorOptions"
									label="Filter by Client Advisor"
									clearable
									multiple
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-select
									v-model="selectedRmat"
									:items="rmatOptions"
									label="Filter by RMAT"
									clearable
									multiple
								></v-select>
							</v-list-item>
							<v-list-item>
								<v-autocomplete
									v-model="selectedCounty"
									:items="countyOptions"
									label="Filter by County"
									clearable
									multiple
								></v-autocomplete>
							</v-list-item>
							<v-list-item>
								<v-text-field
									v-model="zipcodeSearch"
									label="Search by ZipCode"
									clearable
								></v-text-field>
							</v-list-item>
							<v-list-item>
								<v-select
									v-model="selectedGrouping"
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
import { computed, ref } from "vue";
import { useStore } from "../stores/dataStore";
import { GroupByOption, groupByOptions } from "../types";
import ChangeLog from "./ChangeLog.vue";

const selectedRmat = defineModel<number[] | undefined>("selectedRmat", {
	default: undefined,
});

const selectedAdsRep = defineModel<string[] | undefined>("selectedAdsRep", {
	default: undefined,
});

const selectedAdvisor = defineModel<string[] | undefined>("selectedAdvisor", {
	default: undefined,
});

const selectedCounty = defineModel<string[] | undefined>("selectedCounty", {
	default: undefined,
});

const zipcodeSearch = defineModel<string>("zipcodeSearch");

const selectedGrouping = defineModel<string>("selectedGrouping", {
	required: true,
});

const store = useStore();

const emit = defineEmits(["applyFilters"]);

const panels = ref([0, 1]);

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
	if (!selectedAdsRep.value && !selectedAdvisor.value) {
		return store.rmatOptions;
	}

	return [
		...new Set(
			store.rmatData
				.filter(
					(rmat) =>
						(!selectedAdsRep.value ||
							selectedAdsRep.value.length === 0 ||
							(rmat.AdsRep && selectedAdsRep.value.includes(rmat.AdsRep))) &&
						(!selectedAdvisor.value ||
							selectedAdvisor.value.length === 0 ||
							(rmat.ClientAdvisor &&
								selectedAdvisor.value.includes(rmat.ClientAdvisor)))
				)
				.map((r) => r.RmatNumber)
		),
	].sort((a, b) => a - b);
});

const applyFilters = () => {
	emit("applyFilters");
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

.v-expansion-panel >>> .v-expansion-panel-text__wrapper {
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
