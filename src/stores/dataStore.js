import { defineStore } from "pinia";
import Papa from "papaparse";

export const useStore = defineStore("dataStore", {
	state: () => ({
		rmatData: [], // Now RMAT Number, Client Advisor, Color
		zipcodeData: [], // Now ZipCode, Total number of companies, Total sales, Total employees, RMAT Number
		pendingChanges: {},
	}),
	actions: {
		async loadRMATData(file) {
			const text = await file.text();
			Papa.parse(text, {
				header: true,
				complete: (result) => {
					this.rmatData = result.data;
				},
			});
		},
		async loadZipcodeData(file) {
			const text = await file.text();
			Papa.parse(text, {
				header: true,
				complete: (result) => {
					this.zipcodeData = result.data;
				},
			});
			console.log(this.zipcodeData.length);
		},
		assignRMAT(zipcode, newRMAT) {
			const rmatEntry = this.rmatData.find((r) => r["RMAT Number"] === newRMAT);
			const newAdvisor = rmatEntry ? rmatEntry["Client Advisor"] : null;
			this.pendingChanges[zipcode] = {
				rmat: newRMAT,
				advisor: newAdvisor,
			};
		},
		saveChanges() {
			for (const [zipcode, changes] of Object.entries(this.pendingChanges)) {
				const zipIndex = this.zipcodeData.findIndex(
					(z) => z.ZipCode === zipcode
				);
				if (zipIndex !== -1) {
					this.zipcodeData[zipIndex]["RMAT Number"] = changes.rmat;
					// Client Advisor is derived, not stored directly in zipcodeData
				}
			}
			this.pendingChanges = {};
		},
	},
});
