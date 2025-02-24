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
				<td
					v-html="
						displayValues(
							getGroupTotal(item.value, 'totalEmployees'),
							getGroupTotal(item.value, 'originalEmployees')
						)
					"
				></td>
				<td
					v-html="
						displayValues(
							getGroupTotal(item.value, 'totalNumberOfCompanies'),
							getGroupTotal(item.value, 'originalNumberOfCompanies')
						)
					"
				></td>
				<td
					v-html="
						displayValues(
							getGroupTotal(item.value, 'totalSales'),
							getGroupTotal(item.value, 'originalSales'),
							formatCurrency
						)
					"
				></td>
			</tr>
		</template>
		<template #item.totalSales="{ item }">
			{{ formatCurrency(item.totalSales) }}
		</template>
	</v-data-table>
</template>

<script setup>
import { ref, computed } from "vue";
import { formatCurrency } from "../utilities/formatters";

const props = defineProps({
	zipcodes: { type: Array, required: true },
});

const rmatHeaders = ref([
	{ title: "RMAT", value: "rmatNumber" },
	{ title: "Total Employees", value: "totalEmployees" },
	{ title: "Total Companies", value: "totalNumberOfCompanies" },
	{ title: "Total Sales", value: "totalSales" },
]);

//	Placeholder for the group totals
const groupTotals = ref({});

//	Summarize the data by RMAT, this will  be our table input
const rmatTotals = computed(() => {
	const totals = {};

	function addToRmat(
		rmatNumber,
		clientAdvisor,
		companies,
		employees,
		sales,
		type
	) {
		if (!totals[rmatNumber]) {
			totals[rmatNumber] = {
				rmatNumber,
				clientAdvisor: clientAdvisor,
				totalNumberOfCompanies: 0,
				totalSales: 0,
				totalEmployees: 0,

				originalNumberOfCompanies: 0,
				originalSales: 0,
				originalEmployees: 0,
			};
		}

		if (type === "new" || type === "both") {
			totals[rmatNumber].totalNumberOfCompanies += companies;
			totals[rmatNumber].totalSales += sales;
			totals[rmatNumber].totalEmployees += employees;
		}
		if (type === "original" || type === "both") {
			totals[rmatNumber].originalNumberOfCompanies += companies;
			totals[rmatNumber].originalSales += sales;
			totals[rmatNumber].originalEmployees += employees;
		}
	}

	props.zipcodes.forEach((zip) => {
		const rmat = zip.rmatNumber || 0;
		const originalRmat = zip.originalRmatNumber;
		const type = rmat != originalRmat ? "new" : "both";

		//	We will add the data to the totals object
		addToRmat(
			rmat,
			zip.clientAdvisor,
			zip.totalNumberOfCompanies,
			zip.totalEmployees,
			zip.totalSales,
			type
		);
		//	If there is an original RMAT, we will add that data as well
		if (zip.rmatNumber != zip.originalRmatNumber) {
			addToRmat(
				zip.originalRmatNumber,
				zip.clientAdvisor,
				zip.totalNumberOfCompanies,
				zip.totalEmployees,
				zip.totalSales,
				"original"
			);
		}
	});

	let result = Object.values(totals);
	createGroupTotals(result);
	return result;
});

//	We will use this function to calculate the totals for each group
const createGroupTotals = (detailTotals) => {
	groupTotals.value = {};

	detailTotals.forEach((rmat) => {
		const group = rmat.clientAdvisor;
		if (!groupTotals.value[group]) {
			groupTotals.value[group] = {
				totalEmployees: 0,
				originalEmployees: 0,
				totalNumberOfCompanies: 0,
				originalNumberOfCompanies: 0,
				totalSales: 0,
				originalSales: 0,

				employeeDelta: 0,
				companyDelta: 0,
				salesDelta: 0,
			};
		}
		groupTotals.value[group].totalEmployees += rmat.totalEmployees;
		groupTotals.value[group].originalEmployees += rmat.originalEmployees;
		groupTotals.value[group].employeeDelta +=
			rmat.totalEmployees - rmat.originalEmployees;

		groupTotals.value[group].totalNumberOfCompanies +=
			rmat.totalNumberOfCompanies;
		groupTotals.value[group].originalNumberOfCompanies +=
			rmat.originalNumberOfCompanies;
		groupTotals.value[group].companyDelta +=
			rmat.totalNumberOfCompanies - rmat.originalNumberOfCompanies;

		groupTotals.value[group].totalSales += rmat.totalSales;
		groupTotals.value[group].originalSales += rmat.originalSales;
		groupTotals.value[group].salesDelta += rmat.totalSales - rmat.originalSales;
	});
};

const getGroupTotal = (groupName, propertyName) => {
	if (!groupTotals.value[groupName]) return 0;
	return groupTotals.value[groupName][propertyName];
};

const displayValues = (value, originalValue, formatter) => {
	const displayValue = formatter ? formatter(value) : value;

	if (value == originalValue) {
		return displayValue;
	}

	let delta = value - originalValue;
	if (formatter) {
		value = formatter(value);
		delta = formatter(delta);
	}

	const className = value > originalValue ? "success" : "error";
	return `${value} <span class="text-${className} font-weight-bold">(${delta})</span>`;
};
</script>

<style>
.rotate-180 {
	transform: rotate(180deg);
}
</style>
