import { COMPANY_DETAILS } from "./constants";

export function calculateTax(
  basePrice: number, 
  quantity: number, 
  taxRate: number, 
  partyState: string
) {
  const totalBase = basePrice * quantity;
  const isInterState = partyState.toLowerCase() !== COMPANY_DETAILS.state.toLowerCase();
  
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  const totalTaxAmount = totalBase * (taxRate / 100);

  if (isInterState) {
    igstAmount = totalTaxAmount;
  } else {
    cgstAmount = totalTaxAmount / 2;
    sgstAmount = totalTaxAmount / 2;
  }

  return {
    totalBase,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax: totalTaxAmount,
    finalAmount: totalBase + totalTaxAmount,
    isInterState
  };
}