import { ref, computed, Ref } from "vue";
import { defineStore } from "pinia";
import Papa from "papaparse";

import { type RmatData } from "@/types/RmatData";
import { type ZipCodeData } from "@/types/ZipCodeData";
import { type ChangeData } from "@/types/ChangeData";

export const useStore = defineStore("dataStore", () => {
	// state
	const rmatData: Ref<RmatData[]> = ref([]);
	const zipcodeData: Ref<ZipCodeData[]> = ref([]);
	const hoveredZipData: Ref<ZipCodeData | undefined> = ref();
	const changeLog: Ref<ChangeData[]> = ref([]);

	async function getTextFileFromPath(path: string) {
		const response = await fetch(path);
		return await response.text();
	}

	// actions
	const loadRMATData = async (file: string) => {
		const text = await getTextFileFromPath(file);
		Papa.parse(text, {
			header: true,
			transform: (value, header) => {
				if (header === "RmatNumber") return Number(value);
				return value;
			},
			complete: (result) => {
				rmatData.value = result.data as RmatData[];
			},
		});

		//	Merge RMAT data into Zipcode data
		mergeRmatData();
	};

	const loadZipcodeData = async (file: string) => {
		const text = await getTextFileFromPath(file);
		Papa.parse(text, {
			header: true,
			transform: (value, header) => {
				if (
					[
						"ZipCode",
						"TotalNumberOfCompanies",
						"TotalSales",
						"TotalEmployees",
						"RmatNumber",
					].includes(header.toString())
				) {
					return Number(value);
				}
				return value;
			},
			complete: (result) => {
				zipcodeData.value = result.data as ZipCodeData[];
			},
		});

		//	Merge RMAT data into Zipcode data
		mergeRmatData();
	};

	const mergeRmatData = async () => {
		//	Check that we have both zipcode data to update
		if (!zipcodeData.value.length || !rmatData.value.length) return;

		//	Merge RMAT data into Zipcode data
		for (const zip of zipcodeData.value) {
			//	Store the original RMAT number
			zip.OriginalRmatNumber = zip.RmatNumber;

			//	Find the RMAT entry
			const rmatEntry = rmatData.value.find(
				(r) => r.RmatNumber === zip.RmatNumber
			);

			if (rmatEntry) {
				//	Set the RMAT data values
				zip.RmatData = { ...rmatEntry };

				//	Set the original data values
				zip.OriginalRmatData = { ...rmatEntry };
			}
		}
	};

	const assignRMAT = (zipcode: number, newRMAT: number) => {
		//	Get the zip code entry
		const zipEntryIndex = zipcodeData.value.findIndex(
			(z) => z.ZipCode == zipcode
		);

		if (zipEntryIndex < 0) {
			console.error("Zip code not found", zipcode);
			return false;
		}

		const zipEntry = zipcodeData.value[zipEntryIndex];

		//	Find the RMAT entry
		const rmatEntry = rmatData.value.find((r) => r.RmatNumber === newRMAT);

		//	Add the change to the change log
		changeLog.value.unshift({
			ZipCode: zipEntry.ZipCode,
			PreviousRmatNumber: zipEntry.RmatNumber,
			NewRmatNumber: newRMAT,
			TimeStamp: new Date().toISOString(),
		} as ChangeData);

		//	Update the zip code entry
		zipEntry.RmatNumber = newRMAT;
		zipEntry.RmatData = { ...rmatEntry } as RmatData;

		zipcodeData.value[zipEntryIndex] = zipEntry;

		return true;
	};

	const revertChanges = () => {
		//	Find all zip codes that have the originalRmatNumber property and revert them
		for (const zip of zipcodeData.value) {
			if (zip.RmatNumber !== zip.OriginalRmatNumber) {
				zip.RmatNumber = zip.OriginalRmatNumber;
				zip.RmatData = { ...zip.OriginalRmatData } as RmatData;
			}
		}

		//	Reset the change log
		changeLog.value = [];
	};

	const setHoveredZipData = (zipData: ZipCodeData) => {
		hoveredZipData.value = zipData;
	};

	// getters
	const rmatOptions = computed(() =>
		[...new Set(rmatData.value.map((r) => r.RmatNumber))].sort((a, b) => a - b)
	);

	const clientAdvisorOptions = computed(() =>
		[...new Set(rmatData.value.map((r) => r.ClientAdvisor))].sort()
	);

	const adsRepOptions = computed(() =>
		[...new Set(rmatData.value.map((r) => r.AdsRep))].sort()
	);

	const countyOptions = computed(() =>
		[...new Set(zipcodeData.value.map((z) => z.County))].sort()
	);

	return {
		rmatData,
		zipcodeData,
		hoveredZipData,
		changeLog,
		loadRMATData,
		loadZipcodeData,
		assignRMAT,
		revertChanges,
		setHoveredZipData,
		clientAdvisorOptions,
		adsRepOptions,
		rmatOptions,
		countyOptions,
	};
});
