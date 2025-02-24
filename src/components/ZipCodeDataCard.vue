<template>
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
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "../stores/dataStore";
import { formatCurrency } from "../utilities/formatters";

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
</script>

<style lang="scss" scoped></style>
