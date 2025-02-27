<template>
	<v-data-table
		:headers="rmatHeaders"
		:items="rmatTotals"
		:group-by="[{ key: groupBy, order: 'asc' }]"
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
							item.items.reduce((acc, i) => acc + i.raw.TotalEmployees, 0),
							item.items.reduce((acc, i) => acc + i.raw.OriginalEmployees, 0)
						)
					"
				></td>
				<td
					v-html="
						displayValues(
							item.items.reduce(
								(acc, i) => acc + i.raw.TotalNumberOfCompanies,
								0
							),
							item.items.reduce(
								(acc, i) => acc + i.raw.OriginalNumberOfCompanies,
								0
							)
						)
					"
				></td>
				<td
					v-html="
						displayValues(
							item.items.reduce((acc, i) => acc + i.raw.TotalSales, 0),
							item.items.reduce((acc, i) => acc + i.raw.OriginalSales, 0),
							formatCurrency
						)
					"
				></td>
			</tr>
		</template>
		<template #item.TotalSales="{ item }">
			{{ formatCurrency(item.TotalSales) }}
		</template>
	</v-data-table>
</template>

<script setup lang="ts">
import { type Ref, ref, computed } from "vue";
import { type ZipCodeData } from "../types";
import { formatCurrency } from "../utilities/formatters";

const props = defineProps<{
	zipcodes: ZipCodeData[];
	groupBy: string;
}>();

interface RmatTotal {
	RmatNumber: number;
	TotalEmployees: number;
	TotalNumberOfCompanies: number;
	TotalSales: number;
	AdsRep: string;
	ClientAdvisor: string;
	OriginalNumberOfCompanies: number;
	OriginalSales: number;
	OriginalEmployees: number;
}

const rmatHeaders = ref([
	{ title: "RMAT", value: "RmatNumber" },
	{ title: "Total Employees", value: "TotalEmployees" },
	{ title: "Total Companies", value: "TotalNumberOfCompanies" },
	{ title: "Total Sales", value: "TotalSales" },
]);

//	Summarize the data by RMAT, this will  be our table input
const rmatTotals: Ref<RmatTotal[]> = computed(() => {
	console.log("Computing RMAT totals", props.groupBy);
	const totals: Record<number, RmatTotal> = {};

	function addToRmat(
		rmatNumber: number,
		adsRep: string,
		clientAdvisor: string,
		companies: number,
		employees: number,
		sales: number,
		type: "new" | "original" | "both"
	) {
		if (!totals[rmatNumber]) {
			totals[rmatNumber] = {
				RmatNumber: rmatNumber,
				AdsRep: adsRep,
				ClientAdvisor: clientAdvisor,
				TotalNumberOfCompanies: 0,
				TotalSales: 0,
				TotalEmployees: 0,

				OriginalNumberOfCompanies: 0,
				OriginalSales: 0,
				OriginalEmployees: 0,
			} as RmatTotal;
		}

		if (type === "new" || type === "both") {
			totals[rmatNumber].TotalNumberOfCompanies += companies;
			totals[rmatNumber].TotalSales += sales;
			totals[rmatNumber].TotalEmployees += employees;
		}
		if (type === "original" || type === "both") {
			totals[rmatNumber].OriginalNumberOfCompanies += companies;
			totals[rmatNumber].OriginalSales += sales;
			totals[rmatNumber].OriginalEmployees += employees;
		}
	}

	props.zipcodes.forEach((zip) => {
		const rmat = zip.RmatNumber || 0;
		const originalRmat = zip.OriginalRmatNumber;
		const type = rmat != originalRmat ? "new" : "both";

		const adsRep = zip.RmatData?.AdsRep ?? "Unassigned";
		const clientAdvisor = zip.RmatData?.ClientAdvisor ?? "Unassigned";

		//	We will add the data to the totals object
		addToRmat(
			rmat,
			adsRep,
			clientAdvisor,
			zip.TotalNumberOfCompanies,
			zip.TotalEmployees,
			zip.TotalSales,
			type
		);
		//	If there is an original RMAT, we will add that data as well
		if (zip.RmatNumber != zip.OriginalRmatNumber) {
			addToRmat(
				zip.OriginalRmatNumber,
				adsRep,
				clientAdvisor,
				zip.TotalNumberOfCompanies,
				zip.TotalEmployees,
				zip.TotalSales,
				"original"
			);
		}
	});

	let result = Object.values(totals);
	return result;
});

const displayValues = (
	value: number,
	originalValue: number,
	formatter?: (v: number) => string
) => {
	const displayValue = formatter ? formatter(value) : value;

	if (value == originalValue) {
		return displayValue;
	}

	let delta = value - originalValue;
	const className = value > originalValue ? "success" : "error";
	return `${
		formatter ? formatter(value) : value
	} <span class="text-${className} font-weight-bold">(${
		formatter ? formatter(delta) : delta
	})</span>`;
};
</script>

<style>
.rotate-180 {
	transform: rotate(180deg);
}
</style>
