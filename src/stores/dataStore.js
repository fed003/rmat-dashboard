import { ref, computed } from "vue";
import { defineStore } from "pinia";
import Papa from "papaparse";

export const useStore = defineStore("dataStore", () => {
	// state
	const rmatData = ref([]); // Now RMAT Number, Client Advisor, Color
	const zipcodeData = ref([]); // Now ZipCode, Total number of companies, Total sales, Total employees, RMAT Number
	const pendingChanges = ref({});

	// actions
	async function loadRMATData(file) {
		const text = await file.text();
		Papa.parse(text, {
			header: true,
			transform: (value, header) => {
				if (header === "rmatNumber") return Number(value);
				return value; // clientAdvisor and color stay strings
			},
			complete: (result) => {
				rmatData.value = result.data;
			},
		});

		//	Merge RMAT data into Zipcode data
		mergeRmatData();
	}

	async function loadZipcodeData(file) {
		const text = await file.text();
		Papa.parse(text, {
			header: true,
			transform: (value, header) => {
				if (
					[
						"zipCode",
						"totalNumberOfCompanies",
						"totalSales",
						"totalEmployees",
						"rmatNumber",
					].includes(header)
				) {
					return Number(value);
				}
				return value;
			},
			complete: (result) => {
				zipcodeData.value = result.data;
			},
		});

		//	Merge RMAT data into Zipcode data
		mergeRmatData();
	}

	function mergeRmatData() {
		//	Check that we have both zipcode data to update
		if (!zipcodeData.value.length) return;

		//	Merge RMAT data into Zipcode data
		for (const zip of zipcodeData.value) {
			const rmatEntry = rmatData.value.find(
				(r) => r.rmatNumber === zip.rmatNumber
			);
			if (rmatEntry) {
				zip.clientAdvisor = rmatEntry.clientAdvisor;
				zip.color = rmatEntry.color;
			}
		}
	}

	function assignRMAT(zipcode, newRMAT) {
		newRMAT = Number(newRMAT);
		const rmatEntry = rmatData.value.find((r) => r["RMAT Number"] === newRMAT);
		const newAdvisor = rmatEntry ? rmatEntry["Client Advisor"] : null;
		pendingChanges.value[zipcode] = {
			rmat: newRMAT,
			advisor: newAdvisor,
		};
	}

	function saveChanges() {
		for (const [zipcode, changes] of Object.entries(pendingChanges.value)) {
			const zipIndex = zipcodeData.value.findIndex(
				(z) => z.ZipCode === zipcode
			);
			if (zipIndex !== -1) {
				zipcodeData.value[zipIndex]["RMAT Number"] = changes.rmat;
			}
		}
		pendingChanges.value = {};
	}

	// getters
	const clientAdvisorOptions = computed(() => [
		...new Set(rmatData.value.map((r) => r.clientAdvisor)),
	]);

	return {
		rmatData,
		zipcodeData,
		pendingChanges,
		loadRMATData,
		loadZipcodeData,
		assignRMAT,
		saveChanges,
		clientAdvisorOptions,
	};
});
