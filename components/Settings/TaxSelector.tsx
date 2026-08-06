// components/Settings/TaxSelector.tsx
import { useState, useEffect } from 'react';
import { getAvailableCountries, updateCompanyTax } from '@/lib/tax-utils';

interface CountryOption {
  value: string;
  label: string;
  taxName: string;
  taxRate: number;
}

export function TaxSelector({ companyId, currentCountry }: { companyId: string; currentCountry: string }) {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [selectedCountry, setSelectedCountry] = useState(currentCountry);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cargar países disponibles
    getAvailableCountries().then(setCountries);
  }, []);

  const handleCountryChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const country = e.target.value;
    setLoading(true);
    
    try {
      const result = await updateCompanyTax(companyId, country);
      if (result.success) {
        setSelectedCountry(country);
        alert(`Impuesto actualizado a ${result.company.taxName} (${result.company.taxRate}%)`);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert('Error al actualizar el impuesto');
    } finally {
      setLoading(false);
    }
  };

  const selectedTax = countries.find(c => c.value === selectedCountry);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          País
        </label>
        <select
          value={selectedCountry}
          onChange={handleCountryChange}
          disabled={loading}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          {countries.map((country) => (
            <option key={country.value} value={country.value}>
              {country.label} - {country.taxName} ({country.taxRate}%)
            </option>
          ))}
        </select>
      </div>
      
      {selectedTax && (
        <div className="bg-gray-50 p-4 rounded-md">
          <p className="text-sm">
            <span className="font-medium">Impuesto:</span> {selectedTax.taxName}
          </p>
          <p className="text-sm">
            <span className="font-medium">Tasa:</span> {selectedTax.taxRate}%
          </p>
        </div>
      )}
      
      {loading && (
        <p className="text-sm text-gray-500">Actualizando...</p>
      )}
    </div>
  );
}