interface CalculatorInput {
  woodCost: number;
  laborCost: number;
  machineCost: number;
  electricity: number;
  polish: number;
  packaging: number;
  transport: number;
  desiredMarginPercent?: number;
}

export const ProductCostService = {
  calculate(input: CalculatorInput) {
    const totalCost =
      input.woodCost +
      input.laborCost +
      input.machineCost +
      input.electricity +
      input.polish +
      input.packaging +
      input.transport;

    const marginPercent = input.desiredMarginPercent ?? 25;
    const suggestedSellingPrice = totalCost / (1 - marginPercent / 100);
    const profit = suggestedSellingPrice - totalCost;
    const margin = (profit / suggestedSellingPrice) * 100;

    return {
      totalCost: Number(totalCost.toFixed(2)),
      suggestedSellingPrice: Number(suggestedSellingPrice.toFixed(2)),
      profit: Number(profit.toFixed(2)),
      margin: Number(margin.toFixed(2))
    };
  }
};
