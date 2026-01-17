
export interface ServiceCost {
  id: string;
  name: string;
  cost: number;
}

export interface GasMeter {
  id:string;
  meterNumber: string;
  startM3: number;
  endM3: number;
}

export interface ElectricitySubMeter {
  id: string;
  name: string;
  startKWh: number;
  endKWh: number;
}

export interface MonthlyReading {
  month: number;
  kWh: number;
  EUR: number;
}

export interface WaterMonthlyReading {
  month: number;
  m3: number;
  EUR: number;
}

export interface ElectricalConnection {
  id: string;
  name: string;
  meterNumber: string;
  monthlyReadings: MonthlyReading[];
  subMeters: ElectricitySubMeter[];
}

export interface WaterSubMeter {
  id: string;
  name: string;
  startM3: number;
  endM3: number;
}

export interface CalculationData {
  year: number;
  isLocked: boolean;
  gas: {
    meters: GasMeter[];
    totalPriceEUR: number;
  };
  gasKwhPerM3: number;
  ukTuvMeterReadings: {
    ukStartGJ: number;

    ukEndGJ: number;
    tuvStartGJ: number;
    tuvEndGJ: number;
  };
  electricity: {
    connections: ElectricalConnection[];
    userCounts: {
      vchod25: number;
      vchod23: number;
    };
  };
  water: {
    // For cost tracking
    meterNumber: string;
    monthlyReadings: WaterMonthlyReading[];
    sewerageCost: number;
    // For physical consumption tracking
    mainMeterStartM3: number;
    mainMeterEndM3: number;
    subMeters: WaterSubMeter[];
    measuredConsumptionSV_m3: number;
    measuredConsumptionTUV_m3: number;
    tuvDistributionPercent: number;
  };
  mandateContractMonthlyCost: number;
  repairFundAnnualCost: number;
  otherCosts: ServiceCost[];
}

export type CalculationArchive = Record<number, CalculationData>;

export interface CalculationResults {
  totalEUR: number;
  gasCost: number;
  electricityCost: number;
  waterCost: number;
  servicesCost: number;
  electricityConsumptionKWh: number;
  waterConsumptionM3: number;
  gasConsumptionM3: number;
  totalGJ: number;
  totalKWh: number;
  
  uk_GJ: number;
  uk_KWh: number;
  uk_EUR: number;
  
  tuv_GJ: number;
  tuv_KWh: number;
  tuv_EUR: number;
}