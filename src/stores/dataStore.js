import { ref, computed } from "vue";
import { defineStore } from "pinia";
import Papa from "papaparse";

export const useStore = defineStore("dataStore", () => {
	// state
	const rmatData = ref([]); // Now RMAT Number, Client Advisor, Color
	const zipcodeData = ref([]); // Now ZipCode, Total number of companies, Total sales, Total employees, RMAT Number
	const pendingChanges = ref({});
	const hoveredZipData = ref(null);
	const changeLog = ref([]);

	// actions
	const loadRMATData = async (file) => {
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
	};

	const loadZipcodeData = async (file) => {
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
	};

	const mergeRmatData = async () => {
		//	Check that we have both zipcode data to update
		if (!zipcodeData.value.length) return;

		//	Merge RMAT data into Zipcode data
		for (const zip of zipcodeData.value) {
			zip.originalRmatNumber = zip.rmatNumber;

			const rmatEntry = rmatData.value.find(
				(r) => r.rmatNumber === zip.rmatNumber
			);

			if (rmatEntry) {
				zip.clientAdvisor = rmatEntry.clientAdvisor;
				zip.color = rmatEntry.color;

				//	Set the original data values
				zip.originalClientAdvisor = rmatEntry.clientAdvisor;
				zip.originalColor = rmatEntry.color;
			}
		}
	};

	const assignRMAT = (zipcodeObject, newRMAT) => {
		//	Get the zip code entry
		const zipEntryIndex = zipcodeData.value.findIndex(
			(z) => z.zipCode == zipcodeObject.zipCode
		);

		if (zipEntryIndex < 0) {
			console.error("Zip code not found", zipcodeObject);
			return false;
		}

		const zipEntry = zipcodeData.value[zipEntryIndex];

		//	Find the RMAT entry
		const rmatEntry = rmatData.value.find((r) => r.rmatNumber === newRMAT);

		//	Add the change to the change log
		changeLog.value.unshift({
			zipCode: zipEntry.zipCode,
			oldRmat: zipEntry.rmatNumber,
			newRmat: newRMAT,
			// oldEmployees: zipEntry.totalEmployees,
			// oldSales: zipEntry.totalSales,
			// oldCompanies: zipEntry.totalNumberOfCompanies,
			// oldClientAdvisor: zipEntry.clientAdvisor,
			// oldColor: zipEntry.color,
			// newEmployees: zipEntry.totalEmployees,
			// newSales: zipEntry.totalSales,
			// newCompanies: zipEntry.totalNumberOfCompanies,
			// newClientAdvisor: rmatEntry ? rmatEntry.clientAdvisor : null,
			// newColor: rmatEntry ? rmatEntry.color : null,
			timestamp: new Date().toISOString(),
		});

		//	Update the zip code entry
		zipEntry.rmatNumber = newRMAT;
		zipEntry.clientAdvisor = rmatEntry ? rmatEntry.clientAdvisor : null;
		zipEntry.color = rmatEntry ? rmatEntry.color : null;

		zipcodeData.value[zipEntryIndex] = zipEntry;

		return true;
	};

	const revertChanges = () => {
		//	Find all zip codes that have the originalRmatNumber property and revert them
		for (const zip of zipcodeData.value) {
			if (zip.originalRmatNumber) {
				zip.rmatNumber = zip.originalRmatNumber.value;
				zip.clientAdvisor = zip.originalClientAdvisor.value;
				zip.color = zip.originalColor.value;

				// delete zip.originalRmatNumber;
				// delete zip.originalClientAdvisor;
				// delete zip.originalColor;
			}
		}

		//	Reset the change log
		changeLog.value = [];
	};

	const setHoveredZipData = (zipData) => {
		hoveredZipData.value = zipData;
	};

	// getters
	const clientAdvisorOptions = computed(() => [
		...new Set(rmatData.value.map((r) => r.clientAdvisor)),
	]);

	return {
		rmatData,
		zipcodeData,
		pendingChanges,
		hoveredZipData,
		changeLog,
		loadRMATData,
		loadZipcodeData,
		assignRMAT,
		revertChanges,
		setHoveredZipData,
		clientAdvisorOptions,
	};
});
