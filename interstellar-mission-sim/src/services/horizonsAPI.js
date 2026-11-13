// NASA JPL Horizons API Service
const HORIZONS_API_BASE = 'https://ssd.jpl.nasa.gov/api/horizons.api';

// Object IDs for celestial bodies
const OBJECT_IDS = {
  sun: '10',
  earth: '399',
  mars: '499',
  jupiter: '599',
  // C/2019 Y4 ATLAS - we'll use the designation search
  atlas_3i: 'C/2019 Y4'
};

// Cache for API responses to avoid repeated calls
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

class HorizonsAPI {
  static async fetchEphemeris(objectId, startDate, endDate, stepSize = '1d') {
    const cacheKey = `${objectId}_${startDate}_${endDate}_${stepSize}`;
    
    // Check cache first
    if (cache.has(cacheKey)) {
      const cached = cache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
      }
    }

    try {
      const params = new URLSearchParams({
        format: 'json',
        COMMAND: `'${objectId}'`,
        OBJ_DATA: 'YES',
        MAKE_EPHEM: 'YES',
        EPHEM_TYPE: 'VECTORS',
        CENTER: '500@0', // Solar System Barycenter
        START_TIME: startDate,
        STOP_TIME: endDate,
        STEP_SIZE: stepSize,
        OUT_UNITS: 'AU-D', // AU for distance, days for time
        VEC_TABLE: '2', // Position and velocity vectors
        REF_PLANE: 'ECLIPTIC',
        REF_SYSTEM: 'J2000',
        VEC_CORR: 'NONE',
        TIME_DIGITS: 'MINUTES',
        CSV_FORMAT: 'YES'
      });

      const url = `${HORIZONS_API_BASE}?${params.toString()}`;
      console.log('Fetching from Horizons API:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.signature && data.signature.source === 'NASA/JPL Horizons API') {
        // Cache the successful response
        cache.set(cacheKey, {
          data: data,
          timestamp: Date.now()
        });
        
        return data;
      } else {
        throw new Error('Invalid response from Horizons API');
      }

    } catch (error) {
      console.error('Error fetching from Horizons API:', error);
      throw error;
    }
  }

  static async fetchObjectData(objectId) {
    try {
      const params = new URLSearchParams({
        format: 'json',
        COMMAND: `'${objectId}'`,
        OBJ_DATA: 'YES',
        MAKE_EPHEM: 'NO'
      });

      const url = `${HORIZONS_API_BASE}?${params.toString()}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error fetching object data:', error);
      throw error;
    }
  }

  static parseEphemerisData(apiResponse) {
    if (!apiResponse.result) {
      throw new Error('No result data in API response');
    }

    const lines = apiResponse.result.split('\n');
    const dataStart = lines.findIndex(line => line.includes('$$SOE')) + 1;
    const dataEnd = lines.findIndex(line => line.includes('$$EOE'));
    
    if (dataStart === 0 || dataEnd === -1) {
      throw new Error('Could not find ephemeris data in response');
    }

    const ephemerisLines = lines.slice(dataStart, dataEnd);
    const positions = [];

    ephemerisLines.forEach(line => {
      if (line.trim() && !line.startsWith('#')) {
        const parts = line.split(',').map(part => part.trim());
        
        if (parts.length >= 7) {
          const [dateStr, , x, y, z, vx, vy, vz] = parts;
          
          // Parse the date (format: YYYY-MMM-DD HH:MM)
          const date = new Date(dateStr.replace(/(\d{4})-(\w{3})-(\d{2})/, '$1 $2 $3'));
          
          positions.push({
            date: date.toISOString().split('T')[0],
            x: parseFloat(x),
            y: parseFloat(y),
            z: parseFloat(z),
            velocity: {
              x: parseFloat(vx),
              y: parseFloat(vy),
              z: parseFloat(vz)
            }
          });
        }
      }
    });

    return positions;
  }

  static async getAllCelestialBodies(startDate = '2025-01-01', endDate = '2025-12-31') {
    const results = {};
    
    try {
      // Fetch data for all objects in parallel
      const promises = Object.entries(OBJECT_IDS).map(async ([key, objectId]) => {
        try {
          const ephemerisData = await this.fetchEphemeris(objectId, startDate, endDate, '30d');
          const positions = this.parseEphemerisData(ephemerisData);
          
          // Get object metadata
          const objectData = await this.fetchObjectData(objectId);
          
          return {
            key,
            data: {
              name: this.getObjectName(key, objectData),
              positions: positions,
              metadata: this.extractObjectMetadata(objectData)
            }
          };
        } catch (error) {
          console.error(`Error fetching data for ${key}:`, error);
          return { key, data: null, error: error.message };
        }
      });

      const responses = await Promise.all(promises);
      
      responses.forEach(({ key, data, error }) => {
        if (data) {
          results[key] = data;
        } else {
          console.warn(`Failed to fetch data for ${key}: ${error}`);
          // Fallback to mock data for failed requests
          results[key] = this.getFallbackData(key);
        }
      });

      return results;

    } catch (error) {
      console.error('Error fetching celestial bodies data:', error);
      throw error;
    }
  }

  static getObjectName(key, objectData) {
    const names = {
      sun: 'Sun',
      earth: 'Earth',
      mars: 'Mars',
      jupiter: 'Jupiter',
      atlas_3i: 'C/2019 Y4 ATLAS (3I/ATLAS)'
    };
    
    // Try to extract name from API response
    if (objectData && objectData.result) {
      const nameMatch = objectData.result.match(/Target body name:\s*(.+)/);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
    }
    
    return names[key] || key;
  }

  static extractObjectMetadata(objectData) {
    const metadata = {};
    
    if (objectData && objectData.result) {
      const result = objectData.result;
      
      // Extract various orbital parameters
      const patterns = {
        eccentricity: /Eccentricity, e\s*=\s*([\d.]+)/,
        inclination: /Inclination w.r.t X-Y plane, i\s*=\s*([\d.]+)/,
        semiMajorAxis: /Semi-major axis, a\s*=\s*([\d.]+)/,
        period: /Orbital period\s*=\s*([\d.]+)/
      };
      
      Object.entries(patterns).forEach(([key, pattern]) => {
        const match = result.match(pattern);
        if (match) {
          metadata[key] = parseFloat(match[1]);
        }
      });
    }
    
    return metadata;
  }

  static getFallbackData(key) {
    // Return simplified mock data as fallback
    const fallbackData = {
      sun: { name: 'Sun', positions: [{ date: '2025-01-01', x: 0, y: 0, z: 0, velocity: { x: 0, y: 0, z: 0 } }] },
      earth: { name: 'Earth', positions: [{ date: '2025-01-01', x: 1.0, y: 0, z: 0, velocity: { x: 0, y: 29.78, z: 0 } }] },
      mars: { name: 'Mars', positions: [{ date: '2025-01-01', x: 1.52, y: 0, z: 0, velocity: { x: 0, y: 24.07, z: 0 } }] },
      jupiter: { name: 'Jupiter', positions: [{ date: '2025-01-01', x: 5.2, y: 0, z: 0, velocity: { x: 0, y: 13.07, z: 0 } }] },
      atlas_3i: { name: 'C/2019 Y4 ATLAS', positions: [{ date: '2025-01-01', x: 8.5, y: 12.3, z: -4.2, velocity: { x: -15.2, y: -8.7, z: 3.1 } }] }
    };
    
    return fallbackData[key] || { name: key, positions: [] };
  }

  static clearCache() {
    cache.clear();
  }
}

export default HorizonsAPI;
