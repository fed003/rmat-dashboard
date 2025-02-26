import { type RmatData } from "./RmatData";

export interface ZipCodeData {
	ZipCode: number;
	TotalNumberOfCompanie: number;
	TotalEmployees: number;
	TotalSales: number;
	City: string;
	County: string;

	RmatNumber: number;
	OriginalRmatNumber: number;

	RmatData: RmatData;
	OriginalRmatData: RmatData;
}
