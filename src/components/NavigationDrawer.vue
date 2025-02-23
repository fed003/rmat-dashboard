<template>
	<v-navigation-drawer app permanent>
		<v-list>
			<v-list-item>
				<v-select
					v-model="selectedAdvisor"
					:items="advisorOptions"
					label="Filter by Client Advisor"
					clearable
				></v-select>
			</v-list-item>
			<v-list-item>
				<v-select
					v-model="selectedRMAT"
					:items="rmatOptions"
					label="Filter by RMAT"
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
			<v-list-item>
				<v-btn
					color="success"
					:disabled="!hasPendingChanges"
					@click="$emit('save-all-changes')"
				>
					Save All Changes
				</v-btn>
			</v-list-item>
		</v-list>
	</v-navigation-drawer>
</template>

<script setup>
import { computed } from "vue";
import { useStore } from "../stores/dataStore";

const selectedRMAT = defineModel("selectedRMAT", {
	type: [Number, null],
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

const store = useStore();

const advisorOptions = computed(() => {
	return store.clientAdvisorOptions.sort();
});

const rmatOptions = computed(() => {
	const rmats = store.rmatData;

	return [
		...new Set(
			(selectedAdvisor.value
				? rmats.filter((rmat) => rmat.clientAdvisor == selectedAdvisor.value)
				: rmats
			).map((r) => r.rmatNumber)
		),
	].sort();
});

const hasPendingChanges = computed(
	() => Object.keys(store.pendingChanges).length > 0
);

defineEmits(["save-all-changes"]);
</script>
