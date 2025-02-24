<template>
	<v-card class="change-log" elevation="0">
		<v-card-title class="border-b">Change Log</v-card-title>
		<v-card-text class="pa-0">
			<v-virtual-scroll
				:items="store.changeLog"
				:item-height="48"
				class="scrollable-list"
			>
				<template #default="{ item }">
					<v-hover v-slot="{ hover }">
						<v-list-item class="border-b hover-item">
							<v-list-item-title>
								Zip {{ item.zipCode }}: RMAT {{ item.oldRmat }} →
								{{ item.newRmat }}
							</v-list-item-title>
							<v-list-item-subtitle>
								{{ new Date(item.timestamp).toLocaleString() }}
							</v-list-item-subtitle>
						</v-list-item>
					</v-hover>
				</template>
			</v-virtual-scroll>
		</v-card-text>
	</v-card>
</template>

<script setup>
import { useStore } from "../stores/dataStore";
const store = useStore();
</script>

<style>
.change-log {
	background: rgba(255, 255, 255, 0.9);
	border-radius: 4px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
	height: 100%; /* Fill flexed space */
	display: flex;
	flex-direction: column;
}

.change-log .v-card-text {
	height: 100%; /* Fill remaining space */

	.hover-item {
		&:hover {
			background-color: rgba(0, 0, 0, 0.1);
		}
	}
}

.scrollable-list {
	height: 100%; /* Fill card-text height */
	overflow-y: auto; /* Ensure scrolling */
}
</style>
