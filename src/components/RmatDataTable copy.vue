<template>
	<v-data-table
		:headers="rmatHeaders"
		:items="rmatTotals"
		:group-by="[{ key: 'AdsRep', order: 'asc' }]"
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
				<td>{{ displayItems(item) }}</td>
				<td
					v-html="
						displayValues(
							getGroupTotal(item.value, 'TotalEmployees'),
							getGroupTotal(item.value, 'OriginalEmployees')
						)
					"
				></td>
				<td
					v-html="
						displayValues(
							getGroupTotal(item.value, 'TotalNumberOfCompanies'),
							getGroupTotal(item.value, 'OriginalNumberOfCompanies')
						)
					"
				></td>
				<td
					v-html="
						displayValues(
							getGroupTotal(item.value, 'TotalSales'),
							getGroupTotal(item.value, 'OriginalSales'),
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
import { type ZipCodeData, GroupByOption } from "../types";
import { formatCurrency } from "../utilities/formatters";

const props = defineProps<{
	zipcodes: ZipCodeData[];
	groupBy: GroupByOption;
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

interface GroupData {
	GroupTitle: string;
	GroupValue: string;
	TotalEmployees: number;
	OriginalEmployees: number;
	TotalNumberOfCompanies: number;
	OriginalNumberOfCompanies: number;
	TotalSales: number;
	OriginalSales: number;
	EmployeeDelta: number;
	CompanyDelta: number;
	SalesDelta: number;
}

const groupByKey = computed(() => {
	console.log(props.groupBy);
	return props.groupBy;
});

const rmatHeaders = ref([
	{ title: "RMAT", value: "RmatNumber" },
	{ title: "Total Employees", value: "TotalEmployees" },
	{ title: "Total Companies", value: "TotalNumberOfCompanies" },
	{ title: "Total Sales", value: "TotalSales" },
]);

//	Placeholder for the group totals
const groupTotals: Ref<Record<string, GroupData>> = ref({});

//	Summarize the data by RMAT, this will  be our table input
const rmatTotals: Ref<RmatTotal[]> = computed(() => {
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
	createGroupTotals(result);

	console.log(result);
	console.log(groupTotals.value);

	return result;
});

//	We will use this function to calculate the totals for each group
const createGroupTotals = (detailTotals: RmatTotal[]) => {
	groupTotals.value = {};

	detailTotals.forEach((rmat) => {
		let group;
		switch (props.groupBy.toString()) {
			case GroupByOption.AdsRep.toString():
				group = rmat.AdsRep;
				console.log("Grouping by AdsRep", group);
				break;
			case GroupByOption.ClientAdvisor.toString():
				group = rmat.ClientAdvisor;
				console.log("Grouping by ClientAdvisor", group);
				break;
			default:
				group = rmat.AdsRep;
				console.log("Grouping by Unassigned", group);
				break;
		}

		if (!groupTotals.value[group]) {
			groupTotals.value[group] = {
				GroupValue: group,
				TotalEmployees: 0,
				OriginalEmployees: 0,
				TotalNumberOfCompanies: 0,
				OriginalNumberOfCompanies: 0,
				TotalSales: 0,
				OriginalSales: 0,

				EmployeeDelta: 0,
				CompanyDelta: 0,
				SalesDelta: 0,
			} as GroupData;
		}
		groupTotals.value[group].TotalEmployees += rmat.TotalEmployees;
		groupTotals.value[group].OriginalEmployees += rmat.OriginalEmployees;
		groupTotals.value[group].EmployeeDelta +=
			rmat.TotalEmployees - rmat.OriginalEmployees;

		groupTotals.value[group].TotalNumberOfCompanies +=
			rmat.TotalNumberOfCompanies;
		groupTotals.value[group].OriginalNumberOfCompanies +=
			rmat.OriginalNumberOfCompanies;
		groupTotals.value[group].CompanyDelta +=
			rmat.TotalNumberOfCompanies - rmat.OriginalNumberOfCompanies;

		groupTotals.value[group].TotalSales += rmat.TotalSales;
		groupTotals.value[group].OriginalSales += rmat.OriginalSales;
		groupTotals.value[group].SalesDelta += rmat.TotalSales - rmat.OriginalSales;
	});
};

const getGroupTotal = (
	groupName: string,
	propertyName: keyof GroupData
): number => {
	let group = groupTotals.value[groupName];
	if (!group) {
		console.error(`Group ${groupName} not found`);
		return 0;
	}

	console.log(group, propertyName);
	return Number(group[propertyName]);
};

const displayItems = (item: any) => {
	console.log(item);
	return item.value;
};

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
