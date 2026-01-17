
import React from 'react';
import type { CalculationResults } from '../types';

interface ResultsDisplayProps {
  results: CalculationResults;
}

const ResultCard: React.FC<{ title: string; value: string; color: string, sub?: string }> = ({ title, value, color, sub }) => (
  <div className={`p-4 rounded-lg flex flex-col justify-between ${color}`}>
    <div>
      <p className="text-sm font-medium text-white/80">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    {sub && <p className="text-sm text-white/80 text-right">{sub}</p>}
  </div>
);

const BreakdownItem: React.FC<{ label: string; value: string; subValue?: string; }> = ({ label, value, subValue }) => (
  <div className="flex justify-between items-baseline py-2 border-b border-slate-200">
    <div>
      <p className="text-sm text-slate-600">{label}</p>
      {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
    </div>
    <p className="text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

const HeatSplitCard: React.FC<{title: string, gj: number, kwh: number, eur: number}> = ({ title, gj, kwh, eur }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
    const formatNumber = (value: number, decimals = 2) => new Intl.NumberFormat('sk-SK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg">
            <h4 className="font-bold text-slate-800">{title}</h4>
            <div className="mt-2 space-y-1 text-sm">
                <div className="flex justify-between">
                    <span className="text-slate-600">Energia (GJ):</span>
                    <span className="font-medium">{formatNumber(gj)}</span>
                </div>
                <div className="flex justify-between">
                    <span className="text-slate-600">Energia (kWh):</span>
                    <span className="font-medium">{formatNumber(kwh)}</span>
                </div>
                 <div className="flex justify-between mt-2 pt-2 border-t">
                    <span className="text-slate-600 font-semibold">Náklady na teplo:</span>
                    <span className="font-bold text-indigo-700">{formatCurrency(eur)}</span>
                </div>
                <div className="text-right text-xs text-slate-500">
                    <span>{new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(eur / (gj || 1))}/GJ</span>
                </div>
            </div>
        </div>
    )
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({ results }) => {
  const formatCurrency = (value: number) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
  const formatNumber = (value: number, decimals = 2) => new Intl.NumberFormat('sk-SK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md space-y-6">
      <h2 className="text-2xl font-bold text-slate-800">Výsledky výpočtu</h2>
      <div className="grid grid-cols-1 gap-4">
        <ResultCard
          title="Celkové náklady"
          value={formatCurrency(results.totalEUR)}
          color="bg-indigo-600"
          sub={`Vyrobené teplo: ${formatNumber(results.totalGJ)} GJ`}
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Rozdelenie vyrobeného tepla</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HeatSplitCard title="Ústredné kúrenie (ÚK)" gj={results.uk_GJ} kwh={results.uk_KWh} eur={results.uk_EUR} />
            <HeatSplitCard title="Teplá úžitková voda (TÚV)" gj={results.tuv_GJ} kwh={results.tuv_KWh} eur={results.tuv_EUR} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Rozpis vstupných nákladov</h3>
        <div className="space-y-1">
          <BreakdownItem 
            label="Plyn" 
            value={formatCurrency(results.gasCost)}
            subValue={`${formatNumber(results.gasConsumptionM3)} m³`}
          />
          <BreakdownItem 
            label="Elektrina" 
            value={formatCurrency(results.electricityCost)} 
            subValue={`${formatNumber(results.electricityConsumptionKWh)} kWh`}
          />
          <BreakdownItem 
            label="Voda" 
            value={formatCurrency(results.waterCost)} 
            subValue={`${formatNumber(results.waterConsumptionM3)} m³`}
          />
          <BreakdownItem label="Služby a ostatné" value={formatCurrency(results.servicesCost)} />
        </div>
      </div>
       <div className="text-xs text-slate-500 pt-4 border-t">
        <p><strong>Poznámka:</strong> Výpočet tepla (GJ, kWh) je založený primárne na spotrebe plynu a zadanom prevodnom koeficiente. Rozdelenie nákladov na teplo je odvodené od pomeru spotrieb na meračoch ÚK a TÚV.</p>
      </div>
    </div>
  );
};
