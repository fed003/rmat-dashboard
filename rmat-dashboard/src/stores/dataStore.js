import { defineStore } from "pinia";
import Papa from "papaparse";

export const useStore = defineStore("dataStore", {
	state: () => ({
		rmatData: [],
		companyData: [],
		pendingChanges: {}, // Stores { zipcode: { rmat: 'newRMAT', advisor: 'newAdvisor' } }
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
		async loadCompanyData(file) {
			const text = await file.text();
			Papa.parse(text, {
				header: true,
				complete: (result) => {
					this.companyData = result.data;
				},
			});
		},
		assignRMAT(zipcode, newRMAT) {
			// Find the Client Advisor associated with the new RMAT
			const rmatEntry = this.rmatData.find((r) => r["RMAT Number"] === newRMAT);
			const newAdvisor = rmatEntry ? rmatEntry["Client Advisor"] : null;
			this.pendingChanges[zipcode] = {
				rmat: newRMAT,
				advisor: newAdvisor,
			};
		},
		saveChanges() {
			for (const [zipcode, changes] of Object.entries(this.pendingChanges)) {
				const rmatIndex = this.rmatData.findIndex((r) => r.ZipCode === zipcode);
				if (rmatIndex !== -1) {
					this.rmatData[rmatIndex]["RMAT Number"] = changes.rmat;
					this.rmatData[rmatIndex]["Client Advisor"] = changes.advisor;
				}
			}
			this.pendingChanges = {};
		},
	},
});
