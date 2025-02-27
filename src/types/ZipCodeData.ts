import { type RmatData } from "./RmatData";

export interface ZipCodeData {
	ZipCode: number;
	TotalNumberOfCompanies: number;
	TotalEmployees: number;
	TotalSales: number;

	Small: number;
	Medium: number;
	Large: number;

	City: string;
	County: string;

	RmatNumber: number;
	OriginalRmatNumber: number;

	RmatData: RmatData;
	OriginalRmatData: RmatData;
}
