import { CalculationData, CalculationArchive } from '../types';

const API_URL = '/api/archive';

export const fetchArchive = async (): Promise<CalculationArchive> => {
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error('Failed to fetch archive');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching archive:', error);
    return {};
  }
};

export const saveYearData = async (year: number, data: CalculationData): Promise<void> => {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ year, data }),
    });
    if (!response.ok) {
      throw new Error('Failed to save year data');
    }
  } catch (error) {
    console.error('Error saving year data:', error);
  }
};
