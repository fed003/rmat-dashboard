<template>
	<v-data-table
		:headers="headers"
		:items="companies"
		:items-per-page="10"
		:item-class="getRowClass"
		@click:row="rowClicked"
	></v-data-table>
</template>

<script setup>
import { ref } from "vue";
const props = defineProps({
	companies: { type: Array, required: true },
});

const emit = defineEmits(["row-clicked"]);

const headers = ref([
	{ title: "ZipCode", value: "ZipCode" },
	{ title: "RMAT", value: "RMAT Number" },
	{ title: "Client Advisor", value: "Client Advisor" },
	{ title: "Companies", value: "Total number of companies" },
	{ title: "Sales", value: "Total sales" },
	{ title: "Employees", value: "Total employees" },
]);

const getRowClass = (item) => {
	const color = getColorForAdvisor(item["Client Advisor"]);
	return `advisor-row-${color.replace("#", "")}`;
};

const getColorForAdvisor = (advisor) => {
	const colorMap = {
		"John Doe": "#FF0000",
		"Jane Smith": "#00FF00",
	};
	return colorMap[advisor] || "#0000FF";
};

const rowClicked = (event, { item }) => {
	emit("row-clicked", item.ZipCode);
};
</script>

<style>
.advisor-row-FF0000 {
	background-color: rgba(255, 0, 0, 0.1);
}
.advisor-row-00FF00 {
	background-color: rgba(0, 255, 0, 0.1);
}
.advisor-row-0000FF {
	background-color: rgba(0, 0, 255, 0.1);
}
</style>
