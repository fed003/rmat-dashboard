<template>
	<v-list density="compact" class="elevation-1">
		<v-list-item class="pb-0 border-b">
			<strong>RMAT:</strong> {{ store.hoveredZipData?.RmatNumber }}
		</v-list-item>
		<v-list-item class="pb-0 border-b">
			<strong>ZipCode:</strong> {{ store.hoveredZipData?.ZipCode }}
		</v-list-item>
		<v-list-item class="pb-0 border-b">
			<strong>Ads Rep:</strong>
			{{ store.hoveredZipData?.RmatData?.AdsRep }}
		</v-list-item>
		<v-list-item class="pb-0 border-b">
			<strong>Advisor:</strong>
			{{ store.hoveredZipData?.RmatData?.ClientAdvisor }}
		</v-list-item>
		<v-list-item class="pb-0 border-b">
			<strong>Employees:</strong>
			{{ store.hoveredZipData?.TotalEmployees }}
		</v-list-item>
		<v-list-item class="pb-0 border-b">
			<strong>Sales:</strong>
			{{ formatCurrency(store.hoveredZipData?.TotalSales) }}
		</v-list-item>
		<v-list-item class="pb-0 border-b">
			<strong>Companies:</strong>
			{{ store.hoveredZipData?.TotalNumberOfCompanies }}
		</v-list-item>
	</v-list>
</template>

<script setup lang="ts">
import { useStore } from "../stores/dataStore";
import { formatCurrency } from "../utilities/formatters";

const store = useStore();
</script>

<style lang="scss" scoped></style>
