<template>
	<v-data-table
		:headers="rmatHeaders"
		:items="rmatTotals"
		:group-by="[{ key: groupBy, order: 'asc' }]"
		:items-per-page="50"
		hover
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
				<td>
					{{ item.items.reduce((acc, i) => acc + i.raw.SmallBusinesses, 0) }}
				</td>
				<td>
					{{ item.items.reduce((acc, i) => acc + i.raw.MediumBusinesses, 0) }}
				</td>
				<td>
					{{ item.items.reduce((acc, i) => acc + i.raw.LargeBusinesses, 0) }}
				</td>
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

interface GroupedData {
	RmatNumber: number;
	AdsRep: string;
	ClientAdvisor: string;
	County: string;
	TotalEmployees: number;
	TotalNumberOfCompanies: number;
	SmallBusinesses: number;
	MediumBusinesses: number;
	LargeBusinesses: number;
	TotalSales: number;
	OriginalNumberOfCompanies: number;
	OriginalSales: number;
	OriginalEmployees: number;
}

const rmatHeaders = ref([
	{ title: "RMAT", value: "RmatNumber" },
	{ title: "Total Employees", value: "TotalEmployees" },
	{ title: "Total Companies", value: "SmallBusinesses" },
	{ title: "Small ", value: "TotalNumberOfCompanies" },
	{ title: "Medium ", value: "TotalNumberOfCompanies" },
	{ title: "Large ", value: "TotalNumberOfCompanies" },
	{ title: "Total Sales", value: "TotalSales" },
]);

//	Summarize the data by RMAT, this will  be our table input
const rmatTotals: Ref<GroupedData[]> = computed(() => {
	const totals: Record<number, GroupedData> = {};

	function addToRmat(
		rmatNumber: number,
		adsRep: string,
		clientAdvisor: string,
		zip: ZipCodeData,
		type: "new" | "original" | "both"
	) {
		//	For AdsRep and ClientAdvisor, we only want to group by RMAT
		let groupKey = rmatNumber;
		//	If we're grouping by county, then we need to split by both RMAT and County
		if (props.groupBy === "County") {
			groupKey += `-${zip.County}`;
		}

		if (!totals[groupKey]) {
			totals[groupKey] = {
				RmatNumber: rmatNumber,
				AdsRep: adsRep,
				ClientAdvisor: clientAdvisor,
				County: zip.County,
				TotalNumberOfCompanies: 0,
				SmallBusinesses: 0,
				MediumBusinesses: 0,
				LargeBusinesses: 0,
				TotalSales: 0,
				TotalEmployees: 0,

				OriginalNumberOfCompanies: 0,
				OriginalSales: 0,
				OriginalEmployees: 0,
			} as GroupedData;
		}

		function addNumber(value: any) {
			if (typeof value === "number") {
				return value;
			}
			return 0;
		}

		if (type === "new" || type === "both") {
			totals[groupKey].TotalNumberOfCompanies += addNumber(
				zip.TotalNumberOfCompanies
			);
			totals[groupKey].SmallBusinesses += addNumber(zip.Small);
			totals[groupKey].MediumBusinesses += addNumber(zip.Medium);
			totals[groupKey].LargeBusinesses += addNumber(zip.Large);
			totals[groupKey].TotalSales += addNumber(zip.TotalSales);
			totals[groupKey].TotalEmployees += addNumber(zip.TotalEmployees);
		}
		if (type === "original" || type === "both") {
			totals[groupKey].OriginalNumberOfCompanies += addNumber(
				zip.TotalNumberOfCompanies
			);
			totals[groupKey].OriginalSales += addNumber(zip.TotalSales);
			totals[groupKey].OriginalEmployees += addNumber(zip.TotalEmployees);
		}
	}

	props.zipcodes.forEach((zip) => {
		const rmat = zip.RmatNumber || 0;
		const originalRmat = zip.OriginalRmatNumber;
		const type = rmat != originalRmat ? "new" : "both";

		const adsRep = zip.RmatData?.AdsRep ?? "Unassigned";
		const clientAdvisor = zip.RmatData?.ClientAdvisor ?? "Unassigned";

		//	We will add the data to the totals object
		addToRmat(rmat, adsRep, clientAdvisor, zip, type);
		//	If there is an original RMAT, we will add that data as well
		if (zip.RmatNumber != zip.OriginalRmatNumber) {
			addToRmat(zip.OriginalRmatNumber, adsRep, clientAdvisor, zip, "original");
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
