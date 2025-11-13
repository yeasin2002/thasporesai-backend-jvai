export const PAYMENT_CONFIG = {
	// Commission rates (percentage)
	PLATFORM_FEE_PERCENT: 5, // Charged to buyer
	SERVICE_FEE_PERCENT: 20, // Deducted from seller

	// Calculated rates
	BUYER_TOTAL_PERCENT: 105, // Buyer pays 105%
	CONTRACTOR_PAYOUT_PERCENT: 80, // Contractor gets 80%
	ADMIN_TOTAL_PERCENT: 25, // Admin gets 25% total

	// Currency
	CURRENCY: "USD",

	// Limits
	MIN_JOB_BUDGET: 10, // Minimum $10
	MAX_JOB_BUDGET: 10000, // Maximum $10,000
	MIN_WALLET_BALANCE: 0,

	// Offer expiration
	OFFER_EXPIRY_DAYS: 7, // Offers expire after 7 days
};

/**
 * Calculate all payment amounts for a job
 *
 * @param jobBudget - The job budget amount
 * @returns Object containing all calculated amounts
 *
 * @example
 * calculatePaymentAmounts(100)
 * // Returns:
 * // {
 * //   jobBudget: 100,
 * //   platformFee: 5,
 * //   serviceFee: 20,
 * //   contractorPayout: 80,
 * //   totalCharge: 105,
 * //   adminTotal: 25
 * // }
 */
export const calculatePaymentAmounts = (jobBudget: number) => {
	const platformFee = jobBudget * (PAYMENT_CONFIG.PLATFORM_FEE_PERCENT / 100);
	const serviceFee = jobBudget * (PAYMENT_CONFIG.SERVICE_FEE_PERCENT / 100);
	const contractorPayout = jobBudget - serviceFee;
	const totalCharge = jobBudget + platformFee;
	const adminTotal = platformFee + serviceFee;

	return {
		jobBudget,
		platformFee,
		serviceFee,
		contractorPayout,
		totalCharge,
		adminTotal,
	};
};
