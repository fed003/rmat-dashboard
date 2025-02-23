<template>
	<v-data-table
		:headers="rmatHeaders"
		:items="rmatTotals"
		:group-by="[{ key: 'clientAdvisor', order: 'asc' }]"
		:items-per-page="25"
	>
		<template #group-header="{ item, toggleGroup, isGroupOpen }">
			<tr>
				<td>
					<v-btn
						icon="mdi-chevron-down"
						variant="text"
						:class="{ 'rotate-180': isGroupOpen(item) }"
						@click="toggleGroup(item)"
					></v-btn>
				</td>
				<td>{{ item.value }}</td>
				<td>{{ groupTotals(item.value).totalNumberOfCompanies }}</td>
				<td>{{ formatCurrency(groupTotals(item.value).totalSales) }}</td>
				<td>{{ groupTotals(item.value).totalEmployees }}</td>
			</tr>
		</template>
		<template #item.totalSales="{ item }">
			{{ formatCurrency(item.totalSales) }}
		</template>
	</v-data-table>
</template>

<script setup>
import { ref, computed } from "vue";
import { useStore } from "../stores/dataStore";
const store = useStore();

const props = defineProps({
	zipcodes: { type: Array, required: true },
});

const rmatHeaders = ref([
	{ title: "RMAT", value: "rmatNumber" },
	{ title: "Total Companies", value: "totalNumberOfCompanies" },
	{ title: "Total Sales", value: "totalSales" },
	{ title: "Total Employees", value: "totalEmployees" },
]);

//	Summarize the data by RMAT, this will  be our table input
const rmatTotals = computed(() => {
	const totals = {};
	props.zipcodes.forEach((zip) => {
		const rmat = zip.rmatNumber || 0;
		if (!totals[rmat]) {
			totals[rmat] = {
				rmatNumber: rmat,
				clientAdvisor: zip.clientAdvisor,
				totalNumberOfCompanies: 0,
				totalSales: 0,
				totalEmployees: 0,
			};
		}
		totals[rmat].totalNumberOfCompanies += zip.totalNumberOfCompanies || 0;
		totals[rmat].totalSales += zip.totalSales || 0;
		totals[rmat].totalEmployees += zip.totalEmployees || 0;
	});
	return Object.values(totals);
});

const groupTotals = (advisor) => {
	const totals = {
		totalNumberOfCompanies: 0,
		totalSales: 0,
		totalEmployees: 0,
	};
	props.zipcodes
		.filter((zip) => zip.clientAdvisor === advisor)
		.forEach((zip) => {
			totals.totalNumberOfCompanies += zip.totalNumberOfCompanies || 0;
			totals.totalSales += zip.totalSales || 0;
			totals.totalEmployees += zip.totalEmployees || 0;
		});
	return totals;
};

const formatCurrency = (value) => {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(value);
};
</script>

<style>
.rotate-180 {
	transform: rotate(180deg);
}
</style>
