
import React from 'react';
import type { CalculationArchive } from '../types';
import { calculateTotals } from '../services/calculationService';

interface ArchiveViewProps {
  archive: CalculationArchive;
  onSelectYear: (year: number) => void;
  currentYear: number;
}

export const ArchiveView: React.FC<ArchiveViewProps> = ({ archive, onSelectYear, currentYear }) => {
  const sortedYears = Object.keys(archive)
    .map(Number)
    .sort((a, b) => b - a);

  if (sortedYears.length === 0) {
    return (
        <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Archív</h3>
            <p className="text-sm text-slate-500">Zatiaľ neboli uložené žiadne dáta. Uložte dáta pre aktuálny rok a zobrazia sa tu.</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-slate-700 mb-2">Archív</h3>
      <div className="max-h-60 overflow-y-auto pr-2">
        <ul className="space-y-2">
          {sortedYears.map((year) => {
            const data = archive[year];
            const results = calculateTotals(data);
            const isActive = year === currentYear;
            return (
              <li key={year}>
                <button
                  onClick={() => onSelectYear(year)}
                  className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${
                    isActive
                      ? 'bg-indigo-100 text-indigo-800 shadow'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`font-bold ${isActive ? 'text-indigo-800' : 'text-slate-800'}`}>{year}</span>
                    <span className="text-sm font-medium">{new Intl.NumberFormat('sk-SK', { style: 'currency', currency: 'EUR' }).format(results.totalEUR)}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    {new Intl.NumberFormat('sk-SK').format(results.totalGJ)} GJ
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
};
