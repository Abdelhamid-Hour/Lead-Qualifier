import { supabase } from './supabaseClient.js';

export function generateListName(niche, country, city) {
  const sanitize = (str) => str.replace(/[^a-zA-Z0-9_\-\s\u00C0-\u024F]/g, '').replace(/\s+/g, '_').substring(0, 30);
  return `${sanitize(niche)}-${sanitize(country)}-${sanitize(city)}`;
}

export async function loadCoverage(saveDirectory) {
  try {
    const { data, error } = await supabase
      .from('coverage')
      .select('data')
      .eq('id', 1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    return data ? data.data : { niches: [], countries: [] };
  } catch (err) {
    console.error('Coverage load error:', err);
    return null; // Return null to signal failure — never return empty data
  }
}

export async function saveCoverage(coverageData, saveDirectory) {
  try {
    const { error } = await supabase
      .from('coverage')
      .upsert({ id: 1, data: coverageData });

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Coverage save error:', err);
    return null;
  }
}

export function addNiche(coverageData, nicheName) {
  if (!nicheName || coverageData.niches.includes(nicheName)) return coverageData;
  return {
    ...coverageData,
    niches: [...coverageData.niches, nicheName]
  };
}

export function removeNiche(coverageData, nicheName) {
  return {
    ...coverageData,
    niches: coverageData.niches.filter(n => n !== nicheName),
    countries: coverageData.countries.map(c => ({
      ...c,
      cities: c.cities.map(city => {
        const newScans = { ...city.scans };
        delete newScans[nicheName];
        return { ...city, scans: newScans };
      })
    }))
  };
}

export function addCountry(coverageData, countryName) {
  if (!countryName || coverageData.countries.some(c => c.name === countryName)) return coverageData;
  return {
    ...coverageData,
    countries: [...coverageData.countries, { name: countryName, cities: [] }]
  };
}

export function removeCountry(coverageData, countryName) {
  return {
    ...coverageData,
    countries: coverageData.countries.filter(c => c.name !== countryName)
  };
}

export function addCity(coverageData, countryName, cityName) {
  if (!cityName) return coverageData;
  
  return {
    ...coverageData,
    countries: coverageData.countries.map(c => {
      if (c.name === countryName) {
        if (c.cities.some(city => city.name === cityName)) return c;
        
        const scans = {};
        coverageData.niches.forEach(niche => {
          scans[niche] = {
            scanned: false,
            linkedList: generateListName(niche, countryName, cityName)
          };
        });
        
        return {
          ...c,
          cities: [...c.cities, { name: cityName, scans }]
        };
      }
      return c;
    })
  };
}

export function removeCity(coverageData, countryName, cityName) {
  return {
    ...coverageData,
    countries: coverageData.countries.map(c => {
      if (c.name === countryName) {
        return {
          ...c,
          cities: c.cities.filter(city => city.name !== cityName)
        };
      }
      return c;
    })
  };
}

export function toggleScan(coverageData, countryName, cityName, nicheName) {
  return {
    ...coverageData,
    countries: coverageData.countries.map(c => {
      if (c.name === countryName) {
        return {
          ...c,
          cities: c.cities.map(city => {
            if (city.name === cityName) {
              const currentScan = city.scans?.[nicheName] || {};
              const isNowScanned = !currentScan.scanned;
              return {
                ...city,
                scans: {
                  ...city.scans,
                  [nicheName]: {
                    ...currentScan,
                    scanned: isNowScanned,
                    date: isNowScanned ? new Date().toISOString().slice(0, 10) : null
                  }
                }
              };
            }
            return city;
          })
        };
      }
      return c;
    })
  };
}

export function updateCityNote(coverageData, countryName, cityName, note) {
  return {
    ...coverageData,
    countries: coverageData.countries.map(c => {
      if (c.name === countryName) {
        return {
          ...c,
          cities: c.cities.map(city => {
            if (city.name === cityName) {
              return { ...city, note };
            }
            return city;
          })
        };
      }
      return c;
    })
  };
}

