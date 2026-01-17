
import { CalculationData, CalculationResults, ElectricitySubMeter } from '../types';

const KWH_PER_GJ = 277.778;

export const calculateTotals = (data: CalculationData): CalculationResults => {
  if (!data) {
    return { 
      totalEUR: 0, gasCost: 0, electricityCost: 0, waterCost: 0, servicesCost: 0, 
      electricityConsumptionKWh: 0, waterConsumptionM3: 0, gasConsumptionM3: 0,
      totalGJ: 0, totalKWh: 0,
      uk_GJ: 0, uk_KWh: 0, uk_EUR: 0,
      tuv_GJ: 0, tuv_KWh: 0, tuv_EUR: 0
    };
  }
  
  const gasCost = data.gas.totalPriceEUR || 0;

  const gasConsumptionM3 = data.gas.meters.reduce((total, meter) => {
    const consumption = Math.max(0, (meter.endM3 || 0) - (meter.startM3 || 0));
    return total + consumption;
  }, 0);

  // --- Electricity Calculation ---
  let electricityConsumptionKWh = 0;
  let electricityCost = 0;
  
  if (data.electricity && data.electricity.connections) {
    for (const connection of data.electricity.connections) {
      const boilerRoomSubMeter = connection.subMeters.find(sm => sm.name.toLowerCase() === 'kotolňa');
      if (boilerRoomSubMeter) {
        const consumption = Math.max(0, (boilerRoomSubMeter.endKWh || 0) - (boilerRoomSubMeter.startKWh || 0));
        electricityConsumptionKWh += consumption;
        
        const connectionTotalKWh = (connection.monthlyReadings || []).reduce((sum, r) => sum + (r.kWh || 0), 0);
        const connectionTotalEUR = (connection.monthlyReadings || []).reduce((sum, r) => sum + (r.EUR || 0), 0);
        const avgPricePerKWh = connectionTotalKWh > 0 ? connectionTotalEUR / connectionTotalKWh : 0;

        electricityCost += consumption * avgPricePerKWh;
        break; // Assuming only one boiler room meter in the whole system
      }
    }
  }

  // --- Water Calculation ---
  const waterConsumptionM3 = (data.water.monthlyReadings || []).reduce((sum, r) => sum + (r.m3 || 0), 0);
  const waterCost = (data.water.monthlyReadings || []).reduce((sum, r) => sum + (r.EUR || 0), 0) + (data.water.sewerageCost || 0);

  const mandateCost = (data.mandateContractMonthlyCost || 0) * 12;
  const repairFundCost = data.repairFundAnnualCost || 0;
  const otherCostsSum = data.otherCosts.reduce((acc, service) => acc + (service.cost || 0), 0);
  const servicesCost = mandateCost + repairFundCost + otherCostsSum;

  const totalEUR = gasCost + electricityCost + waterCost + servicesCost;

  const totalKWh = gasConsumptionM3 * (data.gasKwhPerM3 || 0);
  const totalGJ = totalKWh / KWH_PER_GJ;

  const ukMeterConsumptionGJ = Math.max(0, (data.ukTuvMeterReadings.ukEndGJ || 0) - (data.ukTuvMeterReadings.ukStartGJ || 0));
  const tuvMeterConsumptionGJ = Math.max(0, (data.ukTuvMeterReadings.tuvEndGJ || 0) - (data.ukTuvMeterReadings.tuvStartGJ || 0));
  const totalMeterConsumptionGJ = ukMeterConsumptionGJ + tuvMeterConsumptionGJ;

  let ukRatio = 0.5;
  let tuvRatio = 0.5;

  if (totalMeterConsumptionGJ > 0) {
    ukRatio = ukMeterConsumptionGJ / totalMeterConsumptionGJ;
    tuvRatio = tuvMeterConsumptionGJ / totalMeterConsumptionGJ;
  }

  // Split total generated heat
  const uk_GJ = totalGJ * ukRatio;
  const tuv_GJ = totalGJ * tuvRatio;
  const uk_KWh = totalKWh * ukRatio;
  const tuv_KWh = totalKWh * tuvRatio;
  
  // Split ONLY gas cost, as other costs are common for the boiler room
  const uk_EUR = gasCost * ukRatio;
  const tuv_EUR = gasCost * tuvRatio;

  return {
    totalEUR,
    gasCost,
    electricityCost,
    waterCost,
    servicesCost,
    electricityConsumptionKWh,
    waterConsumptionM3,
    gasConsumptionM3,
    totalGJ,
    totalKWh,
    uk_GJ,
    uk_KWh,
    uk_EUR,
    tuv_GJ,
    tuv_KWh,
    tuv_EUR,
  };
};