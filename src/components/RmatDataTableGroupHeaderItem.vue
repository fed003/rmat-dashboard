<template>
	<div>
		<v-icon :color="badgeColor" :icon="badgeIcon"></v-icon>
		{{ displayValue }}
		<v-tooltip activator="parent" location="top start">
			{{ formatter ? formatter(avgDelta) : avgDelta }}
		</v-tooltip>
		<span
			v-if="value !== originalValue"
			:class="['font-weight-bold', changeValueClass]"
		>
			({{ formatter ? formatter(changeValue) : changeValue }})
		</span>
	</div>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
	itemName: string;
	value: number;
	originalValue: number;
	averageValue?: number;
	formatter?: (v: number) => string;
}>();

const avgDelta = computed(() =>
	props.averageValue == undefined || props.itemName == "Unassigned"
		? 0
		: props.value - props.averageValue
);

const badgeColor = computed(() => (avgDelta.value > 0 ? "success" : "error"));

const badgeIcon = computed(() =>
	avgDelta.value == 0
		? ""
		: avgDelta.value > 0
		? "mdi-arrow-up"
		: "mdi-arrow-down"
);

const displayValue = computed(() =>
	props.formatter ? props.formatter(props.value) : props.value
);

const changeValue = computed(() => props.value - props.originalValue);

const changeValueClass = computed(() =>
	changeValue.value > 0 ? "text-success" : "text-error"
);
</script>

<style scoped></style>
