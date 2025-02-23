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
					v-model="zipcodeSearch"
					label="Search by ZipCode"
					clearable
				></v-text-field>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
const selectedRMAT = defineModel("selectedRMAT", {
	type: [String, null],
	default: null,
});
const selectedAdvisor = defineModel("selectedAdvisor", {
	type: [String, null],
	default: null,
});
const zipcodeSearch = defineModel("zipcodeSearch", {
	type: String,
	default: "",
});

defineProps({
	rmatOptions: { type: Array, required: true },
	advisorOptions: { type: Array, required: true },
});
</script>
