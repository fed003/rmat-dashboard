<template>
	<v-navigation-drawer app permanent width="310">
		<div class="drawer-content">
			<v-list density="compact">
				<v-list-item>
					<v-select
						v-model="selectedAdsRep"
						:items="adsOptions"
						label="Filter by Ads Rep"
						clearable
					></v-select>
				</v-list-item>
				<v-list-item>
					<v-select
						v-model="selectedAdvisor"
						:items="advisorOptions"
						label="Filter by Client Advisor"
						clearable
					></v-select>
				</v-list-item>
				<v-list-item>
					<v-select
						v-model="selectedRmat"
						:items="rmatOptions"
						label="Filter by RMAT"
						clearable
					></v-select>
				</v-list-item>
				<v-list-item>
					<v-select
						v-model="selectedCounty"
						:items="countyOptions"
						label="Filter by County"
						clearable
					></v-select>
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
			</v-list>
			<change-log class="change-log-flex" />
		</div>
	</v-navigation-drawer>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useStore } from "../stores/dataStore";
import { GroupByOption } from "../types";
import ChangeLog from "./ChangeLog.vue";

const selectedRmat = defineModel<number | null>("selectedRmat", {
	default: null,
});

const selectedAdsRep = defineModel<string | null>("selectedAdsRep", {
	default: null,
});

const selectedAdvisor = defineModel<string | null>("selectedAdvisor", {
	default: null,
});

const selectedCounty = defineModel<string | null>("selectedCounty", {
	default: null,
});

const zipcodeSearch = defineModel<string | null>("zipcodeSearch", {
	default: null,
});

const selectedGrouping = defineModel<GroupByOption>("selectedGrouping", {
	required: true,
});

const store = useStore();

const groupByOptions = computed(() => {
	return Object.keys(GroupByOption).map((key) => {
		const typedKey = key as keyof typeof GroupByOption;
		return {
			title: GroupByOption[typedKey],
			value: key,
		};
	});
});

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
						(selectedAdvisor.value &&
							rmat.ClientAdvisor == selectedAdvisor.value) ||
						(selectedAdsRep.value && rmat.AdsRep == selectedAdsRep.value)
				)
				.map((r) => r.RmatNumber)
		),
	].sort((a, b) => a - b);
});
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

.v-list {
	flex: 0 0 auto; /* Fixed height based on content */
	padding: 8px; /* Consistent with Vuetify default */
}

.change-log-flex {
	flex: 1 1 auto; /* Expand to fill remaining space */
	overflow: hidden; /* Contain scrolling within component */
}
</style>
