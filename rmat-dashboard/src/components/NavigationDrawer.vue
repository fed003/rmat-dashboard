<template>
	<v-navigation-drawer app permanent>
		<v-list>
			<v-list-item>
				<v-select
					v-model="selectedRMAT"
					:items="rmatOptions"
					label="Filter by RMAT"
					clearable
				></v-select>
			</v-list-item>
			<v-list-item>
				<v-select
					v-model="selectedAdvisor"
					:items="advisorOptions"
					label="Filter by Client Advisor"
					clearable
				></v-select>
			</v-list-item>
			<v-list-item>
				<v-text-field
					v-model="companySearch"
					label="Search by Company"
					clearable
				></v-text-field>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
// Define models for two-way binding
const selectedRMAT = defineModel("selectedRMAT", {
	type: [String, null],
	default: null,
});
const selectedAdvisor = defineModel("selectedAdvisor", {
	type: [String, null],
	default: null,
});
const companySearch = defineModel("companySearch", {
	type: String,
	default: "",
});

// Props for options (no v-model needed here)
defineProps({
	rmatOptions: { type: Array, required: true },
	advisorOptions: { type: Array, required: true },
});
</script>
