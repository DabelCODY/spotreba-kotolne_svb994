
import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white mt-8">
      <div className="container mx-auto py-4 px-4 md:px-8 text-center text-sm text-slate-500">
        <p>&copy; {new Date().getFullYear()} Kalkulačka nákladov kotolne. Všetky práva vyhradené.</p>
      </div>
    </footer>
  );
};
