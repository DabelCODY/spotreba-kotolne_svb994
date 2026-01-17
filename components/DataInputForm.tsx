
import React, { useState } from 'react';
import type { CalculationData, ServiceCost, GasMeter, ElectricalConnection, ElectricitySubMeter, WaterSubMeter } from '../types';

interface InputFieldProps {
  label: string;
  unit: string;
  value: number;
  onChange: (value: number) => void;
  name: string;
  type?: 'number' | 'text';
  integer?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({ label, unit, value, onChange, name, type = 'number', integer = false }) => {
  const getPaddingClass = (unitString: string) => {
    const len = unitString.length;
    if (len > 5) { // For '€/mesiac', 'kWh/m³'
      return 'pr-24';
    }
    if (len === 5) { // For '€/rok'
      return 'pr-16';
    }
    return 'pr-12'; // For 'm³', 'GJ', 'kWh', '€', 'osôb'
  };

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="mt-1 relative rounded-md shadow-sm">
        <input
          type={type}
          name={name}
          id={name}
          className={`block w-full pl-3 ${getPaddingClass(unit)} border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black disabled:bg-slate-200 disabled:cursor-not-allowed`}
          value={value || ''}
          onChange={(e) => {
            const val = integer 
              ? parseInt(e.target.value, 10) 
              : parseFloat(e.target.value.replace(',', '.'));
            onChange(isNaN(val) ? 0 : val);
          }}
          placeholder={integer ? "0" : "0.00"}
          step={integer ? "1" : "any"}
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className="text-slate-500 sm:text-sm">{unit}</span>
        </div>
      </div>
    </div>
  );
};

interface DataInputFormProps {
  data: CalculationData;
  onUpdate: (data: CalculationData) => void;
  currentYear: number;
  onYearChange: (year: number) => void;
  onAddNewYear: () => void;
  onToggleLock: () => void;
}

type Tab = 'gas' | 'electricity' | 'water' | 'sumar';
type ElectricityView = 'overview' | 'monthly';
type WaterView = 'overview' | 'monthly';

export const DataInputForm: React.FC<DataInputFormProps> = ({ data, onUpdate, currentYear, onYearChange, onAddNewYear, onToggleLock }) => {
  const [activeTab, setActiveTab] = useState<Tab>('gas');
  const [electricityView, setElectricityView] = useState<ElectricityView>('overview');
  const [waterView, setWaterView] = useState<WaterView>('overview');
  
  const handleGasMeterChange = (index: number, field: keyof Omit<GasMeter, 'id'>, value: string | number) => {
    const updatedMeters = [...data.gas.meters];
    const val = typeof value === 'string' ? value : String(value).replace(',', '.');
    updatedMeters[index] = { ...updatedMeters[index], [field]: typeof value === 'string' ? val : parseFloat(val) };
    onUpdate({ ...data, gas: { ...data.gas, meters: updatedMeters }});
  };

  const addGasMeter = () => {
    const newMeter: GasMeter = { id: new Date().toISOString(), meterNumber: '', startM3: 0, endM3: 0 };
    onUpdate({ ...data, gas: { ...data.gas, meters: [...data.gas.meters, newMeter] }});
  };

  const removeGasMeter = (id: string) => {
    const filteredMeters = data.gas.meters.filter(meter => meter.id !== id);
    onUpdate({ ...data, gas: { ...data.gas, meters: filteredMeters }});
  };

  const handleOtherCostChange = (index: number, field: keyof Omit<ServiceCost, 'id'>, value: string | number) => {
    const updatedCosts = [...data.otherCosts];
    const val = typeof value === 'string' ? value : String(value).replace(',', '.');
    updatedCosts[index] = { ...updatedCosts[index], [field]: typeof value === 'string' ? val : parseFloat(val) };
    onUpdate({ ...data, otherCosts: updatedCosts });
  };
  
  const addOtherCost = () => {
    onUpdate({
      ...data,
      otherCosts: [...data.otherCosts, { id: new Date().toISOString(), name: '', cost: 0 }],
    });
  };

  const removeOtherCost = (id: string) => {
    onUpdate({
      ...data,
      otherCosts: data.otherCosts.filter(cost => cost.id !== id),
    });
  };

  const handleUkTuvChange = (field: keyof CalculationData['ukTuvMeterReadings'], value: number) => {
    onUpdate({
      ...data,
      ukTuvMeterReadings: {
        ...data.ukTuvMeterReadings,
        [field]: value,
      },
    });
  };
  
  const handleElectricityChange = (
    connIndex: number, 
    field: 'meterNumber' | 'monthlyReadings', 
    value: string | { monthIndex: number; key: 'kWh' | 'EUR'; val: number }
  ) => {
    const updatedConnections = data.electricity.connections.map((conn, cIdx) => {
        if (cIdx !== connIndex) return conn;

        if (field === 'meterNumber' && typeof value === 'string') {
            return { ...conn, meterNumber: value };
        }

        if (field === 'monthlyReadings' && typeof value === 'object') {
            const updatedReadings = conn.monthlyReadings.map((reading, rIdx) => {
                if(rIdx !== value.monthIndex) return reading;
                return { ...reading, [value.key]: value.val };
            });
            return { ...conn, monthlyReadings: updatedReadings };
        }
        return conn;
    });
    onUpdate({ ...data, electricity: { ...data.electricity, connections: updatedConnections }});
  };

  const handleWaterChange = (
    field: 'meterNumber' | 'monthlyReadings' | 'sewerageCost', 
    value: string | number | { monthIndex: number; key: 'm3' | 'EUR'; val: number }
  ) => {
    let updatedWaterData = { ...data.water };

    if (field === 'meterNumber' && typeof value === 'string') {
        updatedWaterData.meterNumber = value;
    } else if (field === 'sewerageCost' && typeof value === 'number') {
        updatedWaterData.sewerageCost = value;
    } else if (field === 'monthlyReadings' && typeof value === 'object') {
        const updatedReadings = updatedWaterData.monthlyReadings.map((reading, rIdx) => {
            if (rIdx !== value.monthIndex) return reading;
            return { ...reading, [value.key]: value.val };
        });
        updatedWaterData.monthlyReadings = updatedReadings;
    }
    
    onUpdate({ ...data, water: updatedWaterData });
  };


  const handleElecSubMeterChange = (connIndex: number, smIndex: number, field: keyof Omit<ElectricitySubMeter, 'id' | 'name'>, value: number) => {
    const updatedConnections = data.electricity.connections.map((conn, cIdx) => {
        if (cIdx !== connIndex) return conn;
        const updatedSubMeters = conn.subMeters.map((sm, sIdx) => {
            if (sIdx !== smIndex) return sm;
            return { ...sm, [field]: value };
        });
        return { ...conn, subMeters: updatedSubMeters };
    });
    onUpdate({ ...data, electricity: { ...data.electricity, connections: updatedConnections }});
  };

  const handleWaterSubMeterChange = (smIndex: number, field: keyof Omit<WaterSubMeter, 'id' | 'name'>, value: number) => {
    const updatedSubMeters = data.water.subMeters.map((sm, sIdx) => {
        if (sIdx !== smIndex) return sm;
        return { ...sm, [field]: value };
    });
    onUpdate({ ...data, water: { ...data.water, subMeters: updatedSubMeters } });
};

const handleWaterPropertyChange = (field: keyof CalculationData['water'], value: number) => {
    onUpdate({ ...data, water: { ...data.water, [field]: value } });
};
  
  const handleUserCountChange = (vchod: 'vchod25' | 'vchod23', value: number) => {
    onUpdate({
        ...data,
        electricity: {
            ...data.electricity,
            userCounts: {
                ...data.electricity.userCounts,
                [vchod]: value,
            }
        }
    })
  };

  const handleWaterTuvRatioChange = (value: number) => {
    const clampedValue = Math.max(0, Math.min(100, value));
    onUpdate({
        ...data,
        water: {
            ...data.water,
            tuvDistributionPercent: clampedValue,
        },
    });
  };

  const isLocked = data.isLocked;
  const formatNumber = (value: number, digits = 2) => new Intl.NumberFormat('sk-SK', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(value);
  const formatCurrency = (value: number) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);


  const renderTabButton = (tab: Tab, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 text-sm font-medium rounded-t-md flex items-center ${
        activeTab === tab 
        ? 'bg-white border-slate-200 border-t border-l border-r -mb-px' 
        : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
      }`}
    >
      {icon}
      {label}
    </button>
  );
  
  const conn23 = data.electricity.connections.find(c => c.name === 'Vchod 23');
  const conn25 = data.electricity.connections.find(c => c.name === 'Vchod 25');

  const conn23TotalKWh = conn23?.monthlyReadings.reduce((s, r) => s + (r.kWh || 0), 0) || 0;
  const conn23TotalEUR = conn23?.monthlyReadings.reduce((s, r) => s + (r.EUR || 0), 0) || 0;
  const conn25TotalKWh = conn25?.monthlyReadings.reduce((s, r) => s + (r.kWh || 0), 0) || 0;
  const conn25TotalEUR = conn25?.monthlyReadings.reduce((s, r) => s + (r.EUR || 0), 0) || 0;

  const totalHouseKWh = conn23TotalKWh + conn25TotalKWh;
  const totalHouseEUR = conn23TotalEUR + conn25TotalEUR;
  const avgHousePrice = totalHouseKWh > 0 ? totalHouseEUR / totalHouseKWh : 0;
  
  const calculateOsvetlenie25 = () => {
    if (!conn25) return 0;
    const vytah = conn25.subMeters.find(sm => sm.name === 'Výťah 25');
    const stojisko = conn25.subMeters.find(sm => sm.name === 'Stojisko');
    const vytahConsumption = vytah ? (vytah.endKWh || 0) - (vytah.startKWh || 0) : 0;
    const stojiskoConsumption = stojisko ? (stojisko.endKWh || 0) - (stojisko.startKWh || 0) : 0;
    return conn25TotalKWh - vytahConsumption - stojiskoConsumption;
  };

  const calculateOsvetlenie23 = () => {
    if (!conn23) return 0;
    const vytah = conn23.subMeters.find(sm => sm.name === 'Výťah 23');
    const kotolna = conn23.subMeters.find(sm => sm.name === 'Kotolňa');
    const garaz = conn23.subMeters.find(sm => sm.name === 'Garaz');
    const vytahConsumption = vytah ? (vytah.endKWh || 0) - (vytah.startKWh || 0) : 0;
    const kotolnaConsumption = kotolna ? (kotolna.endKWh || 0) - (kotolna.startKWh || 0) : 0;
    const garazConsumption = garaz ? (garaz.endKWh || 0) - (garaz.startKWh || 0) : 0;
    return conn23TotalKWh - vytahConsumption - kotolnaConsumption - garazConsumption;
  };

  const totalUsers = (data.electricity.userCounts?.vchod25 || 0) + (data.electricity.userCounts?.vchod23 || 0);
  const percentage23 = totalUsers > 0 ? Math.round(((data.electricity.userCounts?.vchod23 || 0) / totalUsers) * 100) : 0;
  const percentage25 = totalUsers > 0 ? Math.round(((data.electricity.userCounts?.vchod25 || 0) / totalUsers) * 100) : 0;
  
  // --- Summary Tab Calculations ---
  const osvetlenie23KWh = calculateOsvetlenie23();
  const vytah23SubMeter = conn23?.subMeters.find(sm => sm.name === 'Výťah 23');
  const vytah23KWh = (vytah23SubMeter?.endKWh || 0) - (vytah23SubMeter?.startKWh || 0);
  const stojiskoSubMeter = conn25?.subMeters.find(sm => sm.name === 'Stojisko');
  const stojiskoTotalKWh = (stojiskoSubMeter?.endKWh || 0) - (stojiskoSubMeter?.startKWh || 0);
  const vchod23UserRatio = totalUsers > 0 ? (data.electricity.userCounts.vchod23 || 0) / totalUsers : 0;
  const stojisko23KWh = stojiskoTotalKWh * vchod23UserRatio;
  const osvetlenie23Eur = osvetlenie23KWh * avgHousePrice;
  const vytah23Eur = vytah23KWh * avgHousePrice;
  const stojisko23Eur = stojisko23KWh * avgHousePrice;
  const totalKWh23 = osvetlenie23KWh + vytah23KWh + stojisko23KWh;
  const totalEur23 = osvetlenie23Eur + vytah23Eur + stojisko23Eur;
  const osvetlenie25KWh = calculateOsvetlenie25();
  const vytah25SubMeter = conn25?.subMeters.find(sm => sm.name === 'Výťah 25');
  const vytah25KWh = (vytah25SubMeter?.endKWh || 0) - (vytah25SubMeter?.startKWh || 0);
  const vchod25UserRatio = totalUsers > 0 ? (data.electricity.userCounts.vchod25 || 0) / totalUsers : 0;
  const stojisko25KWh = stojiskoTotalKWh * vchod25UserRatio;
  const osvetlenie25Eur = osvetlenie25KWh * avgHousePrice;
  const vytah25Eur = vytah25KWh * avgHousePrice;
  const stojisko25Eur = stojisko25KWh * avgHousePrice;
  const totalKWh25 = osvetlenie25KWh + vytah25KWh + stojisko25KWh;
  const totalEur25 = osvetlenie25Eur + vytah25Eur + stojisko25Eur;
  const kotolnaSubMeter = conn23?.subMeters.find(sm => sm.name === 'Kotolňa');
  const kotolnaKWh = (kotolnaSubMeter?.endKWh || 0) - (kotolnaSubMeter?.startKWh || 0);
  const kotolnaEur = kotolnaKWh * avgHousePrice;
  const stojiskoTotalEur = stojiskoTotalKWh * avgHousePrice;
  const garazSubMeter = conn23?.subMeters.find(sm => sm.name === 'Garaz');
  const garazTotalKWh = (garazSubMeter?.endKWh || 0) - (garazSubMeter?.startKWh || 0);
  const garazTotalEur = garazTotalKWh * avgHousePrice;
  const garazSplitKWh = garazTotalKWh / 3;
  const garazSplitEur = garazTotalEur / 3;
  
  // --- Water Summary Tab Calculations ---
  const measuredTuvM3 = data.water.measuredConsumptionTUV_m3 || 0;
  const measuredSvM3 = data.water.measuredConsumptionSV_m3 || 0;
  const totalMeasuredM3 = measuredTuvM3 + measuredSvM3;
  const pomerTuvPercent = totalMeasuredM3 > 0 ? (measuredTuvM3 / totalMeasuredM3) * 100 : 0;
  const pomerSvPercent = 100 - pomerTuvPercent;
  
  const mainWaterConsumptionM3 = (data.water.mainMeterEndM3 || 0) - (data.water.mainMeterStartM3 || 0);
  const totalMonthlyWaterEUR = (data.water.monthlyReadings || []).reduce((s, r) => s + (r.EUR || 0), 0);
  const totalWaterCostEUR = totalMonthlyWaterEUR + (data.water.sewerageCost || 0);
  const stratenaVodaM3 = mainWaterConsumptionM3 - totalMeasuredM3;

  const tuvPomerPercent_input = data.water.tuvDistributionPercent || 0;
  const svPomerPercent_input = 100 - tuvPomerPercent_input;
  
  const tuvFakturaEUR = totalWaterCostEUR * (tuvPomerPercent_input / 100);
  const svFakturaEUR = totalWaterCostEUR * (svPomerPercent_input / 100);
  
  const tuvStratenaVodaM3 = stratenaVodaM3 * (tuvPomerPercent_input / 100);
  const svStratenaVodaM3 = stratenaVodaM3 * (svPomerPercent_input / 100);

  const SummaryTable: React.FC<{ title: string; children: React.ReactNode, secondColumnName?: string }> = ({ title, children, secondColumnName = "Užívateľov (%)" }) => (
    <div>
      <h4 className="text-md font-semibold text-slate-800 mb-2">{title}</h4>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-slate-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-slate-600">Popis</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">{secondColumnName}</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Spotreba (kWh)</th>
              <th className="px-4 py-2 text-right font-semibold text-slate-600">Suma (€)</th>
            </tr>
          </thead>
          <tbody>
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
  
  const SummaryTableRow: React.FC<{
    description: string;
    users?: number | string;
    consumption: number;
    cost: number;
    isTotal?: boolean;
  }> = ({ description, users = '-', consumption, cost, isTotal = false }) => (
    <tr className={isTotal ? "font-bold bg-slate-50" : "border-b border-slate-200 last:border-b-0"}>
      <td className="px-4 py-2 text-left">{description}</td>
      <td className="px-4 py-2 text-right">{users}</td>
      <td className="px-4 py-2 text-right">{formatNumber(consumption)}</td>
      <td className="px-4 py-2 text-right">{formatCurrency(cost)}</td>
    </tr>
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h2 className="text-2xl font-bold text-slate-800">Vstupné údaje pre výpočet</h2>
        <div className="flex items-center gap-2">
            <input 
              type="number"
              value={currentYear}
              onChange={(e) => onYearChange(parseInt(e.target.value))}
              className="w-24 pl-3 pr-2 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md bg-white text-black"
            />
            <button onClick={onAddNewYear} className="px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">+ Nový rok</button>
            <button onClick={onToggleLock} title={isLocked ? "Odomknúť rok" : "Zamknúť rok"} className={`p-2 rounded-md ${isLocked ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'} hover:bg-slate-200`}>
                {isLocked ? 
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" /></svg> :
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2V7a5 5 0 00-5-5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" /><path d="M9 4.5a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" /></svg>
                }
            </button>
        </div>
      </div>
      
      <div className="border-b border-slate-200 flex space-x-1">
        {renderTabButton('gas', 'Plyn', <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10.156 2.33a.75.75 0 00-1.312 0C6.6 5.424 5.5 8.788 5.5 11.05c0 2.522 2.028 4.55 4.55 4.55s4.55-2.028 4.55-4.55c0-2.262-1.1-5.626-3.344-8.72z" /></svg>)}
        {renderTabButton('electricity', 'Elektrina', <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>)}
        {renderTabButton('water', 'Voda', <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M10 18a6 6 0 006-6c0-4.14-3.36-10-6-10S4 7.86 4 12a6 6 0 006 6z" /></svg>)}
        {renderTabButton('sumar', 'Sumár', <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor"><path d="M2 11h14v2H2v-2z" /><path d="M2 5h14v2H2V5z" /><path d="M2 17h14v2H2v-2z" /></svg>)}
      </div>

      <fieldset disabled={isLocked} className="space-y-8 border border-slate-200 rounded-b-md border-t-0 p-4">
        {activeTab === 'gas' && (
          <div className="space-y-8">
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-indigo-700">Plyn</h3>
              {data.gas.meters.map((meter, index) => {
                  const consumption = (meter.endM3 || 0) - (meter.startM3 || 0);
                  return (
                    <div key={meter.id} className="p-4 bg-slate-50 rounded-md border space-y-4 relative">
                      {data.gas.meters.length > 1 && (
                         <button onClick={() => removeGasMeter(meter.id)} className="absolute top-2 right-2 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full disabled:opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                         </button>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                        <div className="md:col-span-1">
                          <label htmlFor={`gas-meter-number-${index}`} className="block text-sm font-medium text-slate-700">Číslo merača</label>
                          <input type="text" name={`gas-meter-number-${index}`} id={`gas-meter-number-${index}`} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black disabled:bg-slate-200" value={meter.meterNumber} onChange={(e) => handleGasMeterChange(index, 'meterNumber', e.target.value)} />
                        </div>
                        <InputField label={index === 0 ? "Počiatočný stav (1.1.)" : "Počiatočný stav"} unit="m³" name={`gas-start-${index}`} value={meter.startM3} onChange={(v) => handleGasMeterChange(index, 'startM3', v)} />
                        <InputField label={index === 0 ? "Konečný stav (31.12.)" : "Konečný stav"} unit="m³" name={`gas-end-${index}`} value={meter.endM3} onChange={(v) => handleGasMeterChange(index, 'endM3', v)} />
                         <div className="md:col-span-1">
                              <label className="block text-sm font-medium text-slate-700">Spotreba</label>
                              <div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatNumber(consumption)} m³</div>
                          </div>
                      </div>
                    </div>
                  )
              })}
              <div className="mt-4"><button onClick={addGasMeter} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400">+ Pridať merač (pri výmene)</button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t">
                  <InputField label="Prevod m³ na kWh" unit="kWh/m³" name="gas-kwh-m3" value={data.gasKwhPerM3} onChange={(v) => onUpdate({ ...data, gasKwhPerM3: v })} />
                  <InputField label="Celková cena z faktúry" unit="€" name="gas-total-price" value={data.gas.totalPriceEUR} onChange={(v) => onUpdate({ ...data, gas: { ...data.gas, totalPriceEUR: v }})} />
              </div>
            </section>

            <section className="space-y-4 pt-8 border-t">
              <h3 className="text-lg font-semibold text-indigo-700">Merače ÚK a TÚV</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-md border space-y-4">
                      <h4 className="font-semibold text-slate-800">Ústredné kúrenie</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <InputField label="Počiatočný stav" unit="GJ" name="uk-start" value={data.ukTuvMeterReadings.ukStartGJ} onChange={(v) => handleUkTuvChange('ukStartGJ', v)} />
                          <InputField label="Konečný stav" unit="GJ" name="uk-end" value={data.ukTuvMeterReadings.ukEndGJ} onChange={(v) => handleUkTuvChange('ukEndGJ', v)} />
                          <div><label className="block text-sm font-medium text-slate-700">Spotreba</label><div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatNumber(data.ukTuvMeterReadings.ukEndGJ - data.ukTuvMeterReadings.ukStartGJ)} GJ</div></div>
                      </div>
                  </div>
                   <div className="p-4 bg-slate-50 rounded-md border space-y-4">
                      <h4 className="font-semibold text-slate-800">Teplá úžitková voda</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                          <InputField label="Počiatočný stav" unit="GJ" name="tuv-start" value={data.ukTuvMeterReadings.tuvStartGJ} onChange={(v) => handleUkTuvChange('tuvStartGJ', v)} />
                          <InputField label="Konečný stav" unit="GJ" name="tuv-end" value={data.ukTuvMeterReadings.tuvEndGJ} onChange={(v) => handleUkTuvChange('tuvEndGJ', v)} />
                          <div><label className="block text-sm font-medium text-slate-700">Spotreba</label><div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatNumber(data.ukTuvMeterReadings.tuvEndGJ - data.ukTuvMeterReadings.tuvStartGJ)} GJ</div></div>
                      </div>
                  </div>
               </div>
            </section>

            <section className="space-y-4 pt-8 border-t">
              <h3 className="text-lg font-semibold text-indigo-700">Servis, revízie, opravy</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField label="Mandátna zmluva (mesačne)" unit="€/mesiac" name="mandate-contract" value={data.mandateContractMonthlyCost} onChange={(v) => onUpdate({ ...data, mandateContractMonthlyCost: v })} />
                <InputField label="Fond Opráv (ročne)" unit="€/rok" name="repair-fund" value={data.repairFundAnnualCost} onChange={(v) => onUpdate({ ...data, repairFundAnnualCost: v })} />
              </div>
              <div className="pt-4 mt-4 border-t"><h4 className="text-md font-semibold text-slate-800">Ďalšie položky</h4></div>
              <div className="space-y-3">
                {data.otherCosts.map((cost, index) => (
                  <div key={cost.id} className="flex items-center gap-2">
                    <input type="text" placeholder="Názov položky" className="flex-grow border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black disabled:bg-slate-200" value={cost.name} onChange={(e) => handleOtherCostChange(index, 'name', e.target.value)} />
                    <div className="relative rounded-md shadow-sm">
                        <input type="number" placeholder="0.00" className="w-32 pl-3 pr-8 border-slate-300 rounded-md sm:text-sm bg-white text-black disabled:bg-slate-200" value={cost.cost || ''} onChange={(e) => handleOtherCostChange(index, 'cost', parseFloat(e.target.value.replace(',', '.')) || 0)} step="any" />
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none"><span className="text-slate-500 sm:text-sm">€</span></div>
                    </div>
                    <button onClick={() => removeOtherCost(cost.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-100 rounded-full disabled:opacity-50"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>
                  </div>
                ))}
              </div>
              <button onClick={addOtherCost} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-800 disabled:text-slate-400">+ Pridať ďalšiu položku</button>
            </section>
          </div>
        )}

        {activeTab === 'electricity' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-indigo-700">Elektrina</h3>
                <div className="flex items-center gap-1 rounded-md bg-slate-200 p-1">
                    <button onClick={() => setElectricityView('overview')} className={`px-3 py-1 text-sm rounded-md ${electricityView === 'overview' ? 'bg-white shadow-sm' : ''}`}>Prehľad</button>
                    <button onClick={() => setElectricityView('monthly')} className={`px-3 py-1 text-sm rounded-md ${electricityView === 'monthly' ? 'bg-white shadow-sm' : ''}`}>Mesačné odpočty</button>
                </div>
            </div>

            {electricityView === 'overview' && (
                <div className="space-y-6">
                    {(data.electricity.connections || []).map((conn, connIndex) => {
                      const totalKWh = conn.monthlyReadings.reduce((sum, r) => sum + (r.kWh || 0), 0);
                      const totalEUR = conn.monthlyReadings.reduce((sum, r) => sum + (r.EUR || 0), 0);
                      const avgPrice = totalKWh > 0 ? totalEUR / totalKWh : 0;
                      
                      return (
                        <div key={conn.id} className="p-4 border rounded-md space-y-4 bg-slate-50">
                          <h4 className="text-lg font-semibold text-indigo-700">{conn.name}</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Celková spotreba (z odpočtov)</label>
                                <div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatNumber(totalKWh)} kWh</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Celková cena (z odpočtov)</label>
                                <div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatCurrency(totalEUR)}</div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700">Priemerná cena</label>
                                <div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 }).format(avgPrice)} / kWh</div>
                            </div>
                          </div>
                          <div className="pt-4 border-t">
                            <h4 className="text-md font-semibold text-slate-800">Podružné merače</h4>
                            {conn.subMeters.map((sm, smIndex) => {
                              const consumption = (sm.endKWh || 0) - (sm.startKWh || 0);
                              return (
                                <div key={sm.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-2 p-2 bg-white rounded">
                                   <div className="md:col-span-1"><p className="mt-1 block w-full text-sm font-medium text-slate-800 h-[38px] flex items-center">{sm.name}</p></div>
                                   <InputField label="Počiatočný stav" unit="kWh" name={`sm-start-${connIndex}-${smIndex}`} value={sm.startKWh} onChange={v => handleElecSubMeterChange(connIndex, smIndex, 'startKWh', v)} />
                                   <InputField label="Konečný stav" unit="kWh" name={`sm-end-${connIndex}-${smIndex}`} value={sm.endKWh} onChange={v => handleElecSubMeterChange(connIndex, smIndex, 'endKWh', v)} />
                                   <div><label className="block text-xs font-medium text-slate-600">Spotreba</label><div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatNumber(consumption)} kWh</div></div>
                                </div>
                              )
                            })}
                          </div>
                          {conn.name === 'Vchod 25' && (<div className="pt-4 border-t"><label className="block text-sm font-medium text-slate-700">Vypočítané osvetlenie 25</label><div className="mt-1 p-2 bg-blue-100 text-blue-800 rounded-md font-medium text-sm h-[38px] flex items-center">{formatNumber(calculateOsvetlenie25())} kWh</div></div>)}
                          {conn.name === 'Vchod 23' && (<div className="pt-4 border-t"><label className="block text-sm font-medium text-slate-700">Vypočítané osvetlenie 23</label><div className="mt-1 p-2 bg-blue-100 text-blue-800 rounded-md font-medium text-sm h-[38px] flex items-center">{formatNumber(calculateOsvetlenie23())} kWh</div></div>)}
                        </div>
                      )
                    })}
                    <div className="pt-6 mt-6 border-t"><h3 className="text-lg font-semibold text-indigo-700">Počet užívateľov</h3><div className="p-4 mt-2 border rounded-md space-y-4 bg-slate-50"><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><InputField label="Počet užívateľov Vchod 23" unit="osôb" name="users-23" value={data.electricity.userCounts?.vchod23 || 0} onChange={(v) => handleUserCountChange('vchod23', v)} integer={true} /><InputField label="Počet užívateľov Vchod 25" unit="osôb" name="users-25" value={data.electricity.userCounts?.vchod25 || 0} onChange={(v) => handleUserCountChange('vchod25', v)} integer={true} /></div><div className="pt-4 border-t grid grid-cols-1 md:grid-cols-3 gap-4 text-sm"><div><label className="block font-medium text-slate-700">Celkový počet užívateľov</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{totalUsers} osôb</div></div><div><label className="block font-medium text-slate-700">Podiel Vchod 23</label><div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium h-[38px] flex items-center">{percentage23} %</div></div><div><label className="block font-medium text-slate-700">Podiel Vchod 25</label><div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium h-[38px] flex items-center">{percentage25} %</div></div></div></div></div>
                </div>
            )}
            
            {electricityView === 'monthly' && (
                <div className="space-y-8">
                    {(data.electricity.connections || []).map((conn, connIndex) => {
                        const totalKWh = conn.monthlyReadings.reduce((sum, r) => sum + (r.kWh || 0), 0);
                        const totalEUR = conn.monthlyReadings.reduce((sum, r) => sum + (r.EUR || 0), 0);
                        return (
                        <div key={conn.id} className="p-4 border rounded-md space-y-4 bg-slate-50">
                            <h4 className="text-lg font-semibold text-indigo-700">{conn.name}</h4>
                            <div>
                                <label htmlFor={`meter-number-${connIndex}`} className="block text-sm font-medium text-slate-700">Číslo merača</label>
                                <input type="text" id={`meter-number-${connIndex}`} value={conn.meterNumber} onChange={e => handleElectricityChange(connIndex, 'meterNumber', e.target.value)} className="mt-1 block w-full md:w-1/2 border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white text-sm rounded-md">
                                    <thead className="bg-slate-200"><tr><th className="px-2 py-2 text-center font-semibold text-slate-600">Mesiac</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Spotreba (kWh)</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Suma (€)</th></tr></thead>
                                    <tbody>
                                        {conn.monthlyReadings.map((reading, rIdx) => (
                                            <tr key={rIdx} className="border-b last:border-0">
                                                <td className="px-2 py-1 text-center font-medium text-slate-500">{rIdx < 12 ? reading.month : ''}</td>
                                                <td className="px-2 py-1"><input type="number" step="any" value={reading.kWh || ''} onChange={e => handleElectricityChange(connIndex, 'monthlyReadings', { monthIndex: rIdx, key: 'kWh', val: parseFloat(e.target.value) || 0 })} className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black" /></td>
                                                <td className="px-2 py-1"><input type="number" step="any" value={reading.EUR || ''} onChange={e => handleElectricityChange(connIndex, 'monthlyReadings', { monthIndex: rIdx, key: 'EUR', val: parseFloat(e.target.value) || 0 })} className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="font-bold bg-slate-200"><tr><td className="px-2 py-2 text-center">Spolu</td><td className="px-2 py-2 text-left">{formatNumber(totalKWh)} kWh</td><td className="px-2 py-2 text-left">{formatCurrency(totalEUR)}</td></tr></tfoot>
                                </table>
                            </div>
                        </div>
                    )})}
                    <div className="pt-6 mt-6 border-t">
                        <h3 className="text-lg font-semibold text-indigo-700">Dom spolu</h3>
                        <div className="p-4 mt-2 border rounded-md bg-green-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div><label className="block text-sm font-medium text-slate-700">Celková spotreba spolu</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{`${formatNumber(totalHouseKWh)} kWh`}</div></div>
                                <div><label className="block text-sm font-medium text-slate-700">Celková cena spolu</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{formatCurrency(totalHouseEUR)}</div></div>
                                <div><label className="block text-sm font-medium text-slate-700">Priemerná cena</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{`${new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 }).format(avgHousePrice)} / kWh`}</div></div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
          </section>
        )}

        {activeTab === 'water' && (
          <section className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-indigo-700">Voda</h3>
                <div className="flex items-center gap-1 rounded-md bg-slate-200 p-1">
                    <button onClick={() => setWaterView('overview')} className={`px-3 py-1 text-sm rounded-md ${waterView === 'overview' ? 'bg-white shadow-sm' : ''}`}>Prehľad</button>
                    <button onClick={() => setWaterView('monthly')} className={`px-3 py-1 text-sm rounded-md ${waterView === 'monthly' ? 'bg-white shadow-sm' : ''}`}>Mesačné odpočty</button>
                </div>
            </div>
             {waterView === 'overview' && (() => {
                const mainWaterConsumption = (data.water.mainMeterEndM3 || 0) - (data.water.mainMeterStartM3 || 0);
                const totalMonthlyM3 = (data.water.monthlyReadings || []).reduce((s, r) => s + (r.m3 || 0), 0);
                const apartmentReadingsSum = (data.water.measuredConsumptionSV_m3 || 0) + (data.water.measuredConsumptionTUV_m3 || 0);

                const sumForComparison = apartmentReadingsSum;
                
                const waterDifferenceM3 = mainWaterConsumption - sumForComparison;
                const waterDifferencePercent = mainWaterConsumption > 0 ? (waterDifferenceM3 / mainWaterConsumption) * 100 : 0;
                
                const totalMonthlyEUR = (data.water.monthlyReadings || []).reduce((s, r) => s + (r.EUR || 0), 0);
                const totalWaterCost = totalMonthlyEUR + (data.water.sewerageCost || 0);
                const averageWaterPrice = totalMonthlyM3 > 0 ? totalWaterCost / totalMonthlyM3 : 0;
                
                return (
                    <div className="space-y-6">
                        <div className="p-4 border rounded-md space-y-4 bg-slate-50">
                            <h4 className="text-lg font-semibold text-indigo-700">Hlavný merač vody</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <InputField label="Počiatočný stav" unit="m³" name="water-main-start" value={data.water.mainMeterStartM3} onChange={v => handleWaterPropertyChange('mainMeterStartM3', v)} />
                                <InputField label="Konečný stav" unit="m³" name="water-main-end" value={data.water.mainMeterEndM3} onChange={v => handleWaterPropertyChange('mainMeterEndM3', v)} />
                                <div><label className="block text-sm font-medium text-slate-700">Spotreba</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{formatNumber(mainWaterConsumption)} m³</div></div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-md space-y-4 bg-slate-50">
                             <h4 className="text-md font-semibold text-slate-800">Podružné merače a spotreby</h4>
                            {(data.water.subMeters || []).map((sm, smIndex) => {
                                const consumption = (sm.endM3 || 0) - (sm.startM3 || 0);
                                return (
                                    <div key={sm.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-2 p-2 bg-white rounded">
                                       <div className="md:col-span-1"><p className="mt-1 block w-full text-sm font-medium text-slate-800 h-[38px] flex items-center">{sm.name}</p></div>
                                       <InputField label="Počiatočný stav" unit="m³" name={`water-sm-start-${smIndex}`} value={sm.startM3} onChange={v => handleWaterSubMeterChange(smIndex, 'startM3', v)} />
                                       <InputField label="Konečný stav" unit="m³" name={`water-sm-end-${smIndex}`} value={sm.endM3} onChange={v => handleWaterSubMeterChange(smIndex, 'endM3', v)} />
                                       <div><label className="block text-xs font-medium text-slate-600">Spotreba</label><div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">{formatNumber(consumption)} m³</div></div>
                                    </div>
                                )
                            })}
                            <div className="pt-4 border-t">
                                <label className="block text-sm font-medium text-slate-700">Spotreba z mesačných odpočtov (byty + spoločné)</label>
                                <div className="mt-1 p-2 bg-slate-100 rounded-md text-slate-800 font-medium text-sm h-[38px] flex items-center">
                                    {formatNumber(totalMonthlyM3)} m³
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border rounded-md space-y-4 bg-slate-50">
                            <h4 className="text-lg font-semibold text-indigo-700">Namerané hodnoty z bytov</h4>
                            <p className="text-xs text-slate-500">Súčet nameraných hodnôt zo všetkých bytových meračov za rok.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                <InputField label="Spotreba Studená Voda (SV)" unit="m³" name="water-measured-sv" value={data.water.measuredConsumptionSV_m3} onChange={v => handleWaterPropertyChange('measuredConsumptionSV_m3', v)} />
                                <InputField label="Spotreba Teplá Voda (TÚV)" unit="m³" name="water-measured-tuv" value={data.water.measuredConsumptionTUV_m3} onChange={v => handleWaterPropertyChange('measuredConsumptionTUV_m3', v)} />
                                <div><label className="block text-sm font-medium text-slate-700">Súčet (SV + TÚV)</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{formatNumber((data.water.measuredConsumptionSV_m3 || 0) + (data.water.measuredConsumptionTUV_m3 || 0))} m³</div></div>
                            </div>
                        </div>


                        <div className="p-4 border rounded-md space-y-4 bg-green-50">
                            <h4 className="text-lg font-semibold text-green-800">Súhrn a kontrola odpočtov</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                <div><label className="block font-medium text-slate-700">Spotreba (hlavný merač)</label><div className="mt-1 p-2 bg-white rounded-md text-slate-800 font-bold h-[38px] flex items-center">{formatNumber(mainWaterConsumption)} m³</div></div>
                                <div><label className="block font-medium text-slate-700">Sucet odpoctov SV+TUV</label><div className="mt-1 p-2 bg-white rounded-md text-slate-800 font-bold h-[38px] flex items-center">{formatNumber(sumForComparison)} m³</div></div>
                                <div><label className="block font-medium text-slate-700">Rozdiel</label><div className={`mt-1 p-2 bg-white rounded-md font-bold h-[38px] flex items-center ${waterDifferenceM3 < 0 ? 'text-red-600' : 'text-slate-800'}`}>{formatNumber(waterDifferenceM3)} m³</div></div>
                                <div><label className="block font-medium text-slate-700">Rozdiel (%)</label><div className={`mt-1 p-2 bg-white rounded-md font-bold h-[38px] flex items-center ${waterDifferenceM3 < 0 ? 'text-red-600' : 'text-slate-800'}`}>{formatNumber(waterDifferencePercent)} %</div></div>
                            </div>
                             <div className="pt-4 mt-4 border-t">
                                <label className="block text-sm font-medium text-slate-700">Priemerná cena za vodu (vrátane stočného)</label>
                                <div className="mt-1 p-2 bg-white rounded-md text-slate-800 font-bold text-lg h-[42px] flex items-center">
                                    {`${new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(averageWaterPrice)} / m³`}
                                </div>
                            </div>
                        </div>

                    </div>
                );
            })()}

            {waterView === 'monthly' && (() => {
                const totalM3 = (data.water.monthlyReadings || []).reduce((s, r) => s + (r.m3 || 0), 0);
                const totalEUR = (data.water.monthlyReadings || []).reduce((s, r) => s + (r.EUR || 0), 0);
                
                return (
                    <div className="space-y-8">
                        <div className="p-4 border rounded-md space-y-4 bg-slate-50">
                            <div>
                                <label htmlFor="water-meter-number" className="block text-sm font-medium text-slate-700">Číslo merača (fakturačného)</label>
                                <input type="text" id="water-meter-number" value={data.water.meterNumber} onChange={e => handleWaterChange('meterNumber', e.target.value)} className="mt-1 block w-full md:w-1/2 border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full bg-white text-sm rounded-md">
                                    <thead className="bg-slate-200"><tr><th className="px-2 py-2 text-center font-semibold text-slate-600">Mesiac</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Spotreba (m³)</th><th className="px-2 py-2 text-left font-semibold text-slate-600">Suma (€)</th></tr></thead>
                                    <tbody>
                                        {(data.water.monthlyReadings || []).map((reading, rIdx) => (
                                            <tr key={rIdx} className="border-b last:border-0">
                                                <td className="px-2 py-1 text-center font-medium text-slate-500">{rIdx < 12 ? reading.month : ''}</td>
                                                <td className="px-2 py-1"><input type="number" step="any" value={reading.m3 || ''} onChange={e => handleWaterChange('monthlyReadings', { monthIndex: rIdx, key: 'm3', val: parseFloat(e.target.value) || 0 })} className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black" /></td>
                                                <td className="px-2 py-1"><input type="number" step="any" value={reading.EUR || ''} onChange={e => handleWaterChange('monthlyReadings', { monthIndex: rIdx, key: 'EUR', val: parseFloat(e.target.value) || 0 })} className="w-full border-slate-300 rounded-md shadow-sm sm:text-sm bg-white text-black" /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="font-bold bg-slate-200"><tr><td className="px-2 py-2 text-center">Spolu</td><td className="px-2 py-2 text-left">{formatNumber(totalM3)} m³</td><td className="px-2 py-2 text-left">{formatCurrency(totalEUR)}</td></tr></tfoot>
                                </table>
                            </div>
                        </div>
                        <div className="pt-6 mt-6 border-t">
                            <h3 className="text-lg font-semibold text-indigo-700">Súvisiace náklady</h3>
                            <div className="p-4 mt-2 border rounded-md bg-slate-50">
                                <InputField label="Suma stočné" unit="€" name="sewerage-cost" value={data.water.sewerageCost} onChange={v => handleWaterChange('sewerageCost', v)} />
                            </div>
                        </div>
                    </div>
                )
            })()}
          </section>
        )}

        {activeTab === 'sumar' && (
           <section className="space-y-8">
            <h3 className="text-lg font-semibold text-indigo-700">Sumárny prehľad nákladov na elektrinu</h3>
            <SummaryTable title="Vchod 23"><SummaryTableRow description="Osvetlenie" consumption={osvetlenie23KWh} cost={osvetlenie23Eur} /><SummaryTableRow description="Výťah" consumption={vytah23KWh} cost={vytah23Eur} /><SummaryTableRow description="Stojisko (pomerná časť)" users={percentage23} consumption={stojisko23KWh} cost={stojisko23Eur} /><SummaryTableRow description="Vchod Spolu" consumption={totalKWh23} cost={totalEur23} isTotal /></SummaryTable>
            <SummaryTable title="Vchod 25"><SummaryTableRow description="Osvetlenie" consumption={osvetlenie25KWh} cost={osvetlenie25Eur} /><SummaryTableRow description="Výťah" consumption={vytah25KWh} cost={vytah25Eur} /><SummaryTableRow description="Stojisko (pomerná časť)" users={percentage25} consumption={stojisko25KWh} cost={stojisko25Eur} /><SummaryTableRow description="Vchod Spolu" consumption={totalKWh25} cost={totalEur25} isTotal /></SummaryTable>
            <SummaryTable title="Kotolňa"><SummaryTableRow description="Kotolňa" consumption={kotolnaKWh} cost={kotolnaEur} /></SummaryTable>
            <SummaryTable title="Stojisko"><SummaryTableRow description="Stojisko Spolu" consumption={stojiskoTotalKWh} cost={stojiskoTotalEur} /></SummaryTable>
            <SummaryTable title="Garáže" secondColumnName="Pomer (%)"><SummaryTableRow description="Garáže 1" users="-" consumption={0} cost={0} /><SummaryTableRow description="Garáže 2" users="33,33" consumption={garazSplitKWh} cost={garazSplitEur} /><SummaryTableRow description="Garáže 3" users="33,33" consumption={garazSplitKWh} cost={garazSplitEur} /><SummaryTableRow description="Garáže 4" users="33,33" consumption={garazSplitKWh} cost={garazSplitEur} /><SummaryTableRow description="Garáže Spolu" consumption={garazTotalKWh} cost={garazTotalEur} isTotal /></SummaryTable>
            <div className="pt-6 mt-6 border-t"><h3 className="text-lg font-semibold text-indigo-700">Sumár za celý dom</h3><div className="p-4 mt-2 border rounded-md bg-green-50"><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><div><label className="block text-sm font-medium text-slate-700">Celková spotreba spolu</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{`${formatNumber(totalHouseKWh)} kWh`}</div></div><div><label className="block text-sm font-medium text-slate-700">Celková cena spolu</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{formatCurrency(totalHouseEUR)}</div></div><div><label className="block text-sm font-medium text-slate-700">Priemerná cena</label><div className="mt-1 p-2 bg-slate-200 rounded-md text-slate-800 font-bold h-[38px] flex items-center">{`${new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4 }).format(avgHousePrice)} / kWh`}</div></div></div></div></div>
            
            <div className="pt-8 mt-8 border-t">
              <h3 className="text-lg font-semibold text-indigo-700">Sumárny prehľad pre vodu</h3>
                <div className="overflow-x-auto rounded-lg border border-slate-200 mt-2">
                  <table className="min-w-full bg-white text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-2 text-left font-semibold text-slate-600">Pomer TÚV/SV</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600">%</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600">Merač</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600">Faktúra</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600">Pomer</th>
                        <th className="px-4 py-2 text-right font-semibold text-slate-600">Stratená voda</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-left align-top">
                          <span className="font-medium">Podiel TÚV</span>
                          <span className="block text-xs text-slate-500 font-normal">
                            ({formatNumber(measuredTuvM3)} m³ / {formatNumber(totalMeasuredM3)} m³)
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{formatNumber(pomerTuvPercent)} %</td>
                        <td className="px-4 py-2 text-right">{formatNumber(measuredTuvM3)} m³</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(tuvFakturaEUR)}</td>
                        <td className="px-4 py-2 text-right">
                            <div className="relative rounded-md shadow-sm mx-auto w-24">
                                <input
                                    type="number"
                                    className="block w-full pl-3 pr-8 border-slate-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-black disabled:bg-slate-200"
                                    value={data.water.tuvDistributionPercent || ''}
                                    onChange={(e) => handleWaterTuvRatioChange(parseFloat(e.target.value) || 0)}
                                    step="0.01"
                                />
                                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                    <span className="text-slate-500 sm:text-sm">%</span>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-2 text-right">{formatNumber(tuvStratenaVodaM3)} m³</td>
                      </tr>
                      <tr className="border-b border-slate-200">
                        <td className="px-4 py-2 text-left align-top">
                          <span className="font-medium">Podiel SV</span>
                           <span className="block text-xs text-slate-500 font-normal">
                            ({formatNumber(measuredSvM3)} m³ / {formatNumber(totalMeasuredM3)} m³)
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">{formatNumber(pomerSvPercent)} %</td>
                        <td className="px-4 py-2 text-right">{formatNumber(measuredSvM3)} m³</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(svFakturaEUR)}</td>
                        {/* FIX: Use a template literal to ensure the expression is treated as a single string, resolving a JSX parsing ambiguity. */}
                        <td className="px-4 py-2 text-right">{`${formatNumber(svPomerPercent_input)} %`}</td>
                        <td className="px-4 py-2 text-right">{formatNumber(svStratenaVodaM3)} m³</td>
                      </tr>
                      <tr className="font-bold bg-slate-50">
                        <td className="px-4 py-2 text-left">Spolu</td>
                        <td className="px-4 py-2 text-right">100.00 %</td>
                        <td className="px-4 py-2 text-right">{formatNumber(totalMeasuredM3)} m³</td>
                        <td className="px-4 py-2 text-right">{formatCurrency(totalWaterCostEUR)}</td>
                        <td className="px-4 py-2 text-right">100.00 %</td>
                        <td className="px-4 py-2 text-right">{formatNumber(stratenaVodaM3)} m³</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
            </div>
          </section>
        )}
      </fieldset>
    </div>
  );
};
