
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { DataInputForm } from './components/DataInputForm';
import { ResultsDisplay } from './components/ResultsDisplay';
import { ArchiveView } from './components/ArchiveView';
import { CalculationData, CalculationArchive } from './types';
import { calculateTotals } from './services/calculationService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { Header } from './components/Header';
import { Footer } from './components/Footer';

const createDefaultData = (year: number): CalculationData => ({
  year,
  isLocked: false,
  gas: { 
    meters: [{ id: new Date().toISOString(), meterNumber: '', startM3: 0, endM3: 0 }], 
    totalPriceEUR: 0 
  },
  gasKwhPerM3: 10.92,
  ukTuvMeterReadings: { ukStartGJ: 0, ukEndGJ: 0, tuvStartGJ: 0, tuvEndGJ: 0 },
  electricity: {
    connections: [
      { id: 'conn1', name: 'Vchod 25', meterNumber: '', monthlyReadings: Array.from({ length: 13 }, (_, i) => ({ month: i + 1, kWh: 0, EUR: 0 })), subMeters: [
        { id: 'sm1', name: 'Výťah 25', startKWh: 0, endKWh: 0 },
        { id: 'sm2', name: 'Stojisko', startKWh: 0, endKWh: 0 },
      ]},
      { id: 'conn2', name: 'Vchod 23', meterNumber: '', monthlyReadings: Array.from({ length: 13 }, (_, i) => ({ month: i + 1, kWh: 0, EUR: 0 })), subMeters: [
        { id: 'sm3', name: 'Výťah 23', startKWh: 0, endKWh: 0 },
        { id: 'sm4', name: 'Kotolňa', startKWh: 0, endKWh: 0 },
        { id: 'sm5', name: 'Garaz', startKWh: 0, endKWh: 0 },
      ]}
    ],
    userCounts: {
      vchod25: 0,
      vchod23: 0,
    },
  },
  water: { 
    meterNumber: '',
    monthlyReadings: Array.from({ length: 13 }, (_, i) => ({ month: i + 1, m3: 0, EUR: 0 })),
    sewerageCost: 0,
    mainMeterStartM3: 0,
    mainMeterEndM3: 0,
    subMeters: [
      { id: 'wsm1', name: 'Kotolňa', startM3: 0, endM3: 0 },
      { id: 'wsm2', name: 'Dopúšťanie', startM3: 0, endM3: 0 },
    ],
    measuredConsumptionSV_m3: 0,
    measuredConsumptionTUV_m3: 0,
    tuvDistributionPercent: 50,
  },
  mandateContractMonthlyCost: 0,
  repairFundAnnualCost: 0,
  otherCosts: [],
});

const createDataFromPreviousYear = (prevData: CalculationData): CalculationData => {
    const newYear = prevData.year + 1;
    return {
        year: newYear,
        isLocked: false,
        gas: {
            meters: prevData.gas.meters.map(meter => ({
                id: `${new Date().toISOString()}-${meter.meterNumber}`,
                meterNumber: meter.meterNumber,
                startM3: meter.endM3,
                endM3: meter.endM3,
            })),
            totalPriceEUR: 0,
        },
        gasKwhPerM3: prevData.gasKwhPerM3,
        ukTuvMeterReadings: {
            ukStartGJ: prevData.ukTuvMeterReadings.ukEndGJ,
            ukEndGJ: prevData.ukTuvMeterReadings.ukEndGJ,
            tuvStartGJ: prevData.ukTuvMeterReadings.tuvEndGJ,
            tuvEndGJ: prevData.ukTuvMeterReadings.tuvEndGJ,
        },
        electricity: {
          connections: prevData.electricity.connections.map(conn => ({
            ...conn,
            id: `${new Date().toISOString()}-${conn.name}`,
            meterNumber: conn.meterNumber,
            monthlyReadings: Array.from({ length: 13 }, (_, i) => ({ month: i + 1, kWh: 0, EUR: 0 })),
            subMeters: conn.subMeters.map(sm => ({
              ...sm,
              id: `${new Date().toISOString()}-${sm.name}`,
              startKWh: sm.endKWh,
              endKWh: sm.endKWh,
            }))
          })),
          userCounts: { ...prevData.electricity.userCounts },
        },
        water: {
            meterNumber: prevData.water.meterNumber,
            monthlyReadings: Array.from({ length: 13 }, (_, i) => ({ month: i + 1, m3: 0, EUR: 0 })),
            sewerageCost: 0,
            mainMeterStartM3: prevData.water.mainMeterEndM3,
            mainMeterEndM3: prevData.water.mainMeterEndM3,
            subMeters: prevData.water.subMeters.map(sm => ({
              ...sm,
              id: `${new Date().toISOString()}-${sm.name}`,
              startM3: sm.endM3,
              endM3: sm.endM3,
            })),
            measuredConsumptionSV_m3: 0,
            measuredConsumptionTUV_m3: 0,
            tuvDistributionPercent: prevData.water.tuvDistributionPercent,
        },
        mandateContractMonthlyCost: prevData.mandateContractMonthlyCost,
        repairFundAnnualCost: prevData.repairFundAnnualCost,
        otherCosts: prevData.otherCosts.map(cost => ({
            id: `${new Date().toISOString()}-${cost.name}`,
            name: cost.name,
            cost: cost.cost,
        })),
    };
};


const App: React.FC = () => {
  const [archive, setArchive] = useLocalStorage<CalculationArchive>('boiler-room-calculator-archive', {});
  const [currentYear, setCurrentYear] = useState<number>(() => {
    const years = Object.keys(archive).map(Number);
    return years.length > 0 ? Math.max(...years) : new Date().getFullYear() - 1;
  });

  const [currentData, setCurrentData] = useState<CalculationData>(() => {
    return archive[currentYear] || createDefaultData(currentYear);
  });

  useEffect(() => {
    setCurrentData(archive[currentYear] || createDefaultData(currentYear));
  }, [currentYear, archive]);

  const handleDataChange = useCallback((updatedData: CalculationData) => {
    setCurrentData(updatedData);
    setArchive(prev => ({ ...prev, [updatedData.year]: updatedData }));
  }, [setArchive]);
  
  const handleYearChange = (year: number) => {
    if(year > 1900 && year < 2100) {
      setCurrentYear(year);
    }
  };
  
  const handleAddNewYear = () => {
    const years = Object.keys(archive).map(Number);
    const latestYear = years.length > 0 ? Math.max(...years) : new Date().getFullYear() - 1;
    const newYear = latestYear + 1;
    
    let newData: CalculationData;
    const latestYearData = archive[latestYear];

    if (latestYearData) {
        newData = createDataFromPreviousYear(latestYearData);
    } else {
        newData = createDefaultData(newYear);
    }
    
    // Check if new year already exists from manual input to prevent overwriting
    if (!archive[newYear]) {
      setArchive(prev => ({ ...prev, [newYear]: newData }));
    }
    setCurrentYear(newYear);
  };

  const handleToggleLock = () => {
    const updatedData = { ...currentData, isLocked: !currentData.isLocked };
    handleDataChange(updatedData);
  };

  const results = useMemo(() => calculateTotals(currentData), [currentData]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      <Header />
      <main className="flex-grow container mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2">
            <DataInputForm
              data={currentData}
              onUpdate={handleDataChange}
              currentYear={currentYear}
              onYearChange={handleYearChange}
              onAddNewYear={handleAddNewYear}
              onToggleLock={handleToggleLock}
            />
          </div>
          <div className="lg:col-span-1 space-y-8 sticky top-8">
            <ResultsDisplay results={results} />
            <ArchiveView archive={archive} onSelectYear={handleYearChange} currentYear={currentYear} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default App;
