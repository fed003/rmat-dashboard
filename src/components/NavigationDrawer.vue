<template>
	<v-navigation-drawer app permanent width="310">
		<div class="drawer-content">
			<v-list density="compact">
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
						v-model="selectedRMAT"
						:items="rmatOptions"
						label="Filter by RMAT"
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
			</v-list>
			<change-log class="change-log-flex" />
		</div>
	</v-navigation-drawer>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "../stores/dataStore";

import ChangeLog from "./ChangeLog.vue";

const selectedRMAT = defineModel("selectedRMAT", {
	type: [Number, null],
	default: null,
});

const selectedAdvisor = defineModel("selectedAdvisor", {
	type: [String, null],
	default: null,
});

const zipcodeSearch = defineModel("zipcodeSearch", {
	type: String,
	default: "",
});

const store = useStore();

const advisorOptions = computed(() => {
	return store.clientAdvisorOptions.sort();
});

const rmatOptions = computed(() => {
	const rmats = store.rmatData;

	return [
		...new Set(
			(selectedAdvisor.value
				? rmats.filter((rmat) => rmat.clientAdvisor == selectedAdvisor.value)
				: rmats
			).map((r) => r.rmatNumber)
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

.zip-tooltip {
	background-color: rgba(255, 255, 255, 0.9);
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
