<template>
	<v-navigation-drawer app permanent width="300">
		<v-list>
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
			<v-list-item class="zip-tooltip">
				<v-list density="compact" class="elevation-1">
					<v-list-item class="pb-0 border-b">
						<strong>RMAT:</strong> {{ displayedHoveredZipData.rmatNumber }}
					</v-list-item>
					<v-list-item class="pb-0 border-b">
						<strong>ZipCode:</strong> {{ displayedHoveredZipData.zipCode }}
					</v-list-item>
					<v-list-item class="pb-0 border-b">
						<strong>Advisor:</strong>
						{{ displayedHoveredZipData.clientAdvisor }}
					</v-list-item>
					<v-list-item class="pb-0 border-b">
						<strong>Employees:</strong>
						{{ displayedHoveredZipData.totalEmployees }}
					</v-list-item>
					<v-list-item class="pb-0 border-b">
						<strong>Sales:</strong>
						{{ formatCurrency(displayedHoveredZipData.totalSales) }}
					</v-list-item>
					<v-list-item class="pb-0 border-b">
						<strong>Companies:</strong>
						{{ displayedHoveredZipData.totalNumberOfCompanies }}
					</v-list-item>
				</v-list>
				<v-btn color="primary" block class="mt-4" @click="store.revertChanges">
					Revert Changes
				</v-btn>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "../stores/dataStore";
import { formatCurrency } from "../utilities/formatters";

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

const displayedHoveredZipData = computed(() => {
	return (
		store.hoveredZipData ?? {
			zipCode: "",
			totalNumberOfCompanies: "",
			totalSales: "",
			totalEmployees: "",
			rmatNumber: "",
			clientAdvisor: "",
		}
	);
});

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
.zip-tooltip {
	background-color: rgba(255, 255, 255, 0.9);
	padding: 8px;
	border-radius: 4px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>
