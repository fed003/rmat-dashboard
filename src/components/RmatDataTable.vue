<template>
	<v-data-table
		:headers="rmatHeaders"
		:items="rmatTotals"
		:group-by="[{ key: groupBy, order: 'asc' }]"
		:items-per-page="50"
		density="compact"
		fixed-header
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

				<td>
					<RmatDataTableGroupHeaderItem
						:itemName="item.value"
						:value="
							item.items.reduce((acc, i) => acc + i.raw.TotalEmployees, 0)
						"
						:originalValue="
							item.items.reduce((acc, i) => acc + i.raw.OriginalEmployees, 0)
						"
						:averageValue="groupAverages?.Employees"
						:formatter="formatNumber"
					/>
				</td>
				<td>
					<RmatDataTableGroupHeaderItem
						:itemName="item.value"
						:value="
							item.items.reduce(
								(acc, i) => acc + i.raw.TotalNumberOfCompanies,
								0
							)
						"
						:originalValue="
							item.items.reduce(
								(acc, i) => acc + i.raw.TotalNumberOfCompanies,
								0
							)
						"
						:averageValue="groupAverages?.Companies"
						:formatter="formatNumber"
					/>
				</td>
				<td>
					{{
						item.items
							.reduce((acc, i) => acc + i.raw.SmallBusinesses, 0)
							.toLocaleString()
					}}
				</td>
				<td>
					{{
						item.items
							.reduce((acc, i) => acc + i.raw.MediumBusinesses, 0)
							.toLocaleString()
					}}
				</td>
				<td>
					{{
						item.items
							.reduce((acc, i) => acc + i.raw.LargeBusinesses, 0)
							.toLocaleString()
					}}
				</td>
				<td>
					<RmatDataTableGroupHeaderItem
						:itemName="item.value"
						:value="item.items.reduce((acc, i) => acc + i.raw.TotalSales, 0)"
						:originalValue="
							item.items.reduce((acc, i) => acc + i.raw.TotalSales, 0)
						"
						:averageValue="groupAverages?.Sales"
						:formatter="formatCurrency"
					/>
				</td>
			</tr>
		</template>
		<template v-slot:body.append v-if="groupAverages">
			<tr class="text-h6">
				<th colspan="2" class="text-center">Averages:</th>
				<th>{{ groupAverages.Employees.toLocaleString() }}</th>
				<th>{{ groupAverages.Companies.toLocaleString() }}</th>
				<th></th>
				<th></th>
				<th></th>
				<th>{{ formatCurrency(groupAverages.Sales) }}</th>

				<!-- Add more columns as needed -->
			</tr>
		</template>
	</v-data-table>
</template>

<script setup lang="ts">
import { type Ref, ref, computed } from "vue";
import { type ZipCodeData } from "../types";
import { formatCurrency } from "../utilities/formatters";
import RmatDataTableGroupHeaderItem from "./RmatDataTableGroupHeaderItem.vue";

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

	EmployeesAvgDelta: number;
	CompaniesAvgDelta: number;
	SalesAvgDelta: number;
}

interface GroupAverages {
	Employees: number;
	Companies: number;
	Sales: number;
}

const rmatHeaders = ref([
	{ title: "RMAT", key: "RmatNumber" },
	{
		key: "TotalEmployees",
		title: "Total Employees",
		value: (item: GroupedData) => item.TotalEmployees.toLocaleString(),
	},
	{
		key: "TotalNumberOfCompanies",
		title: "Total Companies",
		value: (item: GroupedData) => item.TotalNumberOfCompanies.toLocaleString(),
	},
	{
		key: "SmallBusinesses",
		title: "Small ",
		value: (item: GroupedData) => item.SmallBusinesses.toLocaleString(),
	},
	{
		key: "MediumBusinesses",
		title: "Medium ",
		value: (item: GroupedData) => item.MediumBusinesses.toLocaleString(),
	},
	{
		key: "LargeBusinesses",
		title: "Large ",
		value: (item: GroupedData) => item.LargeBusinesses.toLocaleString(),
	},
	{
		key: "TotalSales",
		title: "Total Sales",
		value: (item: GroupedData) => formatCurrency(item.TotalSales),
	},
]);

let groupAverages: GroupAverages | null = null;

//	Summarize the data by RMAT, this will  be our table input
const rmatTotals: Ref<GroupedData[]> = computed(() => {
	const totals: Record<string, GroupedData> = {};

	function addToRmat(
		rmatNumber: number,
		adsRep: string,
		clientAdvisor: string,
		zip: ZipCodeData,
		type: "new" | "original" | "both"
	) {
		//	For AdsRep and ClientAdvisor, we only want to group by RMAT
		let groupKey = rmatNumber.toString();
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

				EmployeesAvgDelta: 0,
				CompaniesAvgDelta: 0,
				SalesAvgDelta: 0,
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

	//	Calculate the average delta for each RMAT - as compared to the overall average values for all RMATS
	const totalRmats = result.length;
	const avgEmployees =
		result.reduce((acc, i) => acc + i.TotalEmployees, 0) / totalRmats;
	const avgCompanies =
		result.reduce((acc, i) => acc + i.TotalNumberOfCompanies, 0) / totalRmats;
	const avgSales =
		result.reduce((acc, i) => acc + i.TotalSales, 0) / totalRmats;

	result = result.map((rmat) => {
		rmat.EmployeesAvgDelta = rmat.TotalEmployees - avgEmployees;
		rmat.CompaniesAvgDelta = rmat.TotalNumberOfCompanies - avgCompanies;
		rmat.SalesAvgDelta = rmat.TotalSales - avgSales;
		return rmat;
	});

	//	Calculate the group averages
	calculateGroupAverages(result);

	return result;
});

const calculateGroupAverages = (allRmatData: GroupedData[]) => {
	if (props.groupBy === "County") {
		//	We don't want to show averages by county so return an empty object
		groupAverages = null;
		return;
	}

	if (allRmatData.length === 0) {
		groupAverages = {
			Employees: 0,
			Companies: 0,
			Sales: 0,
		};
		return;
	}

	//	Create a map of groups so we can calculate the averages
	const groups: Record<string, number> = {};

	//	Filter out any "Unassigned" values
	const rmatData = allRmatData.filter((r) =>
		props.groupBy == "AdsRep"
			? r.AdsRep !== "Unassigned"
			: r.ClientAdvisor !== "Unassigned"
	);

	//	Get a count of how many groups we have based on the groupBy prop
	const groupCount = rmatData.reduce((acc, r) => {
		const groupKey = props.groupBy == "AdsRep" ? r.AdsRep : r.ClientAdvisor;
		if (!groups[groupKey]) {
			groups[groupKey] = 1;
			return acc + 1;
		}
		return acc;
	}, 0);

	//	Now we can calculate the averages
	const avgEmployees =
		rmatData.reduce((acc, r) => acc + r.TotalEmployees, 0) / groupCount;
	const avgCompanies =
		rmatData.reduce((acc, r) => acc + r.TotalNumberOfCompanies, 0) / groupCount;
	const avgSales =
		rmatData.reduce((acc, r) => acc + r.TotalSales, 0) / groupCount;

	//	Return the averages
	groupAverages = {
		Employees: Math.round(avgEmployees),
		Companies: Math.round(avgCompanies),
		Sales: Math.round(avgSales),
	};
};

const formatNumber = (v: number) => v.toLocaleString();
</script>

<style>
.rotate-180 {
	transform: rotate(180deg);
}
</style>
