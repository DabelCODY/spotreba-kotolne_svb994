
import React from 'react';
import type { CalculationResults } from '../types';

const InfoIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 text-slate-400 shrink-0 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

interface ResultsDisplayProps {
  results: CalculationResults;
}

const ResultCard: React.FC<{ title: React.ReactNode; value: string; color: string, sub?: string, tooltip?: string }> = ({ title, value, color, sub, tooltip }) => (
  <div className={`p-4 rounded-lg flex flex-col justify-between ${color}`} title={tooltip}>
    <div>
      <p className="text-sm font-medium text-white/80 flex items-center">
        {title}
        {tooltip && <InfoIcon className="text-white/70" />}
        </p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
    {sub && <p className="text-sm text-white/80 text-right">{sub}</p>}
  </div>
);

const BreakdownItem: React.FC<{ label: string; value: string; subValue?: string; tooltip?: string; }> = ({ label, value, subValue, tooltip }) => (
  <div className="flex justify-between items-center py-2 border-b border-slate-200" title={tooltip}>
    <div className="flex items-center">
      <div>
        <p className="text-sm text-slate-600">{label}</p>
        {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
      </div>
      {tooltip && <InfoIcon />}
    </div>
    <p className="text-sm font-semibold text-slate-800">{value}</p>
  </div>
);

const HeatSplitCard: React.FC<{title: string, gj: number, kwh: number, eur: number, tooltip?: string}> = ({ title, gj, kwh, eur, tooltip }) => {
    const formatCurrency = (value: number) => new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(value);
    const formatNumber = (value: number, decimals = 2) => new Intl.NumberFormat('sk-SK', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
    const unitPriceTooltip = "Jednotková cena tepla, vypočítaná ako podiel nákladov na teplo a spotrebovanej energie v GJ.";
    
    return (
        <div className="bg-slate-50 p-4 rounded-lg" title={tooltip}>
            <h4 className="font-bold text-slate-800 flex items-center">
                {title}
                {tooltip && <InfoIcon />}
            </h4>
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
                    <span title={unitPriceTooltip} className="inline-flex items-center">
                        {new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR', minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(eur / (gj || 1))}/GJ
                        <InfoIcon />
                    </span>
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
          tooltip="Súčet všetkých nákladov na prevádzku kotolne (plyn, elektrina, voda, služby)."
        />
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Rozdelenie vyrobeného tepla</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <HeatSplitCard 
                title="Ústredné kúrenie (ÚK)" 
                gj={results.uk_GJ} 
                kwh={results.uk_KWh} 
                eur={results.uk_EUR} 
                tooltip="Náklady a energia priradené k ústrednému kúreniu. Rozdelenie je založené na pomere spotreby zistenom na fyzických meračoch tepla pre ÚK a TÚV."
            />
            <HeatSplitCard 
                title="Teplá úžitková voda (TÚV)" 
                gj={results.tuv_GJ} 
                kwh={results.tuv_KWh} 
                eur={results.tuv_EUR} 
                tooltip="Náklady a energia priradené k príprave teplej úžitkovej vody. Rozdelenie je založené na pomere spotreby zistenom na fyzických meračoch tepla pre ÚK a TÚV."
            />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Rozpis vstupných nákladov</h3>
        <div className="space-y-1">
          <BreakdownItem 
            label="Plyn" 
            value={formatCurrency(results.gasCost)}
            subValue={`${formatNumber(results.gasConsumptionM3)} m³`}
            tooltip="Celkové ročné náklady na plyn."
          />
          <BreakdownItem 
            label="Elektrina" 
            value={formatCurrency(results.electricityCost)} 
            subValue={`${formatNumber(results.electricityConsumptionKWh)} kWh`}
            tooltip="Náklady na elektrinu spotrebovanú priamo v kotolni (napr. pre čerpadlá). Vypočítané zo spotreby na podružnom merači 'Kotolňa' a priemernej ceny elektriny."
          />
          <BreakdownItem 
            label="Voda" 
            value={formatCurrency(results.waterCost)} 
            subValue={`${formatNumber(results.waterConsumptionM3)} m³`}
            tooltip="Celkové ročné náklady na vodné a stočné podľa faktúr."
          />
          <BreakdownItem 
            label="Služby a ostatné" 
            value={formatCurrency(results.servicesCost)} 
            tooltip="Súčet nákladov na mandátnu zmluvu, fond opráv a ďalšie zadané položky."
          />
        </div>
      </div>
       <div className="text-xs text-slate-500 pt-4 border-t">
        <p><strong>Poznámka:</strong> Výpočet tepla (GJ, kWh) je založený primárne na spotrebe plynu a zadanom prevodnom koeficiente. Rozdelenie nákladov na teplo je odvodené od pomeru spotrieb na meračoch ÚK a TÚV.</p>
      </div>
    </div>
  );
};
