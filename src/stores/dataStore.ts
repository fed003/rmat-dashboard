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
	const hoveredZipData: Ref<ZipCodeData | null> = ref(null);
	const changeLog: Ref<ChangeData[]> = ref([]);

	const getTextFileFromPath = async (path: string) => {
		const response = await fetch(path);
		return await response.text();
	};

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
		// mergeRmatData();
	};

	const loadZipcodeData = async (file: string) => {
		const text = await getTextFileFromPath(file);
		Papa.parse(text, {
			header: true,
			transform: (value, header) => {
				if (["City", "County", "CountyColor"].includes(header.toString())) {
					return value;
				}
				let result = Number(value);
				return isNaN(result) ? 0 : result;
			},
			complete: (result) => {
				zipcodeData.value = result.data as ZipCodeData[];
			},
		});

		//	Merge RMAT data into Zipcode data
		// mergeRmatData();
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

	const assignRMAT = (zipCodeObj: ZipCodeData, newRMAT: number) => {
		//	Get the zip code entry
		const zipEntryIndex = zipcodeData.value.findIndex(
			(z) => z.ZipCode == zipCodeObj.ZipCode
		);

		if (zipEntryIndex < 0) {
			console.error("Zip code not found", zipCodeObj.ZipCode);
			return false;
		}

		//	Find the RMAT entry
		const rmatEntry = rmatData.value.find((r) => r.RmatNumber === newRMAT);

		//	Add the change to the change log
		changeLog.value.unshift({
			ZipCode: zipCodeObj.ZipCode,
			PreviousRmatNumber: zipCodeObj.RmatNumber,
			NewRmatNumber: newRMAT,
			TimeStamp: new Date().toISOString(),
		} as ChangeData);

		//	Update the zip code entry
		zipCodeObj.RmatNumber = newRMAT;
		zipCodeObj.RmatData = { ...rmatEntry } as RmatData;

		zipcodeData.value[zipEntryIndex] = zipCodeObj;

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

	const setHoveredZipData = (zipData: ZipCodeData | null) => {
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

	const rmatOptionDetails = computed(() =>
		[
			...new Set(
				rmatData.value.map((r) => {
					return {
						value: r.RmatNumber,
						title: `${r.RmatNumber} - ${r.ClientAdvisor} - ${r.AdsRep}`,
					};
				})
			),
		].sort((a, b) => a.value - b.value)
	);

	return {
		rmatData,
		zipcodeData,
		hoveredZipData,
		changeLog,
		loadRMATData,
		loadZipcodeData,
		mergeRmatData,
		assignRMAT,
		revertChanges,
		setHoveredZipData,
		clientAdvisorOptions,
		adsRepOptions,
		rmatOptions,
		rmatOptionDetails,
		countyOptions,
	};
});
