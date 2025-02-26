export const formatCurrency = (
	value: number | string | null | undefined
): string => {
	if (!value) return "";

	//	Ensure that the input is a number
	const number = Number(value);
	if (isNaN(number)) return "";

	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency: "USD",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(number);
};
