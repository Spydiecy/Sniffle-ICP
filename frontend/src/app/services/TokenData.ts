// services/TokenData.ts
'use client';

// Keep all your existing interfaces - they're perfect
export interface TokenCoin {
  name: string;
  symbol: string;
  symbol1: string;
  price: string;
  volume: string;
  liquidity: string;
  mcap: string;
  transactions: string;
  age: string;
  'change-5m': string;
  'change-1h': string;
  'change-6h': string;
  'change-24h': string;
  href: string;
}

export interface TokenDataResponse {
  data: TokenCoin[];
}

export interface AIAnalyzerToken {
  id: number;
  symbol: string;
  symbol1: string;
  price: number;
  volume: string;
  marketCap: string;
  change24h: number;
  age: string;
  favorite: boolean;
  potential: number;
  investmentPotential?: number;
  risk: number;
  href: string;
  rationale?: string;
}

export interface AIAnalyzerResponse {
  data: AIAnalyzerToken[];
}

export interface FormattedMemecoin {
  id: number;
  symbol: string;
  symbol1: string;
  price: number;
  volume: string;
  marketCap: string;
  change24h: number;
  age: string;
  favorite: boolean;
  potential: number;
  risk: number;
  href: string;
}

// Keep all your helper functions exactly as they are
const parsePrice = (priceStr: string | number): number => {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr || priceStr === 'N/A' || priceStr === '') return 0;
  const cleaned = String(priceStr).replace(/,/g, '').replace(/[^\d.-]/g, '');
  const price = parseFloat(cleaned);
  return isNaN(price) ? 0 : price;
};

const parseChange = (changeStr: string | number): number => {
  if (typeof changeStr === 'number') return changeStr;
  if (!changeStr || changeStr === 'N/A' || changeStr === '') return 0;
  const cleaned = String(changeStr).replace(/[^\d.-]/g, '');
  const change = parseFloat(cleaned);
  return isNaN(change) ? 0 : change;
};

const calculateRisk = (price: number, changeStr: string | number): number => {
  const change = parseChange(changeStr);
  const volatilityRisk = Math.min(Math.abs(change) / 20, 10);
  const priceRisk = price < 0.000001 ? 9 : price < 0.00001 ? 8 : price < 0.0001 ? 7 : price < 0.001 ? 6 : price < 0.01 ? 5 : 3;
  return Math.min(Math.round((volatilityRisk * 0.4 + priceRisk * 0.6)), 10);
};

const calculatePotential = (price: number, changeStr: string | number): number => {
  const change = parseChange(changeStr);
  const changePotential = change > 50 ? 9 : change > 20 ? 8 : change > 10 ? 7 : change > 5 ? 6 : change > 0 ? 5 : 3;
  const pricePotential = price < 0.000001 ? 9 : price < 0.00001 ? 8 : price < 0.0001 ? 7 : price < 0.001 ? 6 : price < 0.01 ? 5 : 4;
  return Math.min(Math.round((changePotential * 0.3 + pricePotential * 0.7)), 10);
};

// Keep your data processing functions exactly as they are
const processAIAnalyzerData = (data: AIAnalyzerToken[]): FormattedMemecoin[] => {
  return data.map((item, index) => {
    return {
      id: item.id || (index + 1),
      symbol: item.symbol || '',
      symbol1: item.symbol1 || '',
      price: parsePrice(item.price),
      volume: item.volume || 'N/A',
      marketCap: item.marketCap || 'N/A',
      change24h: parseChange(item.change24h),
      age: item.age || 'N/A',
      favorite: false,
      potential: item.potential || item.investmentPotential || calculatePotential(parsePrice(item.price), item.change24h),
      risk: item.risk || calculateRisk(parsePrice(item.price), item.change24h),
      href: item.href || '#'
    };
  });
};

const processLegacyTokenData = (data: any[]): FormattedMemecoin[] => {
  return data.map((item, index) => {
    const ensureNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value.replace(/[^\d.-]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    const ensureChangeNumber = (value: any): number => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const cleaned = value.replace(/[^\d.-]/g, '');
        const parsed = parseFloat(cleaned);
        return isNaN(parsed) ? 0 : parsed;
      }
      return 0;
    };
    
    const price = ensureNumber(item.price);
    const change24h = ensureChangeNumber(item.change24h || item['change-24h']);
    
    return {
      id: index + 1,
      symbol: item.symbol || '',
      symbol1: item.symbol1 || '',
      price: price,
      volume: item.volume || 'N/A',
      marketCap: item.marketCap || item.mcap || 'N/A',
      change24h: change24h,
      age: item.age || 'N/A',
      favorite: false,
      potential: item.investmentPotential || item.potential || calculatePotential(price, change24h),
      risk: item.risk || calculateRisk(price, change24h),
      href: item.href || '#'
    };
  });
};

const processTokenData = (data: any[]): FormattedMemecoin[] => {
  if (!data || data.length === 0) return [];
  
  console.log('Processing token data:', { 
    length: data.length, 
    firstItem: data[0] ? Object.keys(data[0]) : 'none'
  });
  
  const firstItem = data[0];
  const isAIFormat = firstItem && (
    (typeof firstItem.id === 'number' && typeof firstItem.risk === 'number' && typeof firstItem.potential === 'number') ||
    (firstItem.hasOwnProperty('risk') && firstItem.hasOwnProperty('potential'))
  );
  
  console.log('Detected format:', isAIFormat ? 'AI Analyzer' : 'Legacy');
  console.log('Sample item:', firstItem);
  
  if (isAIFormat) {
    return processAIAnalyzerData(data as AIAnalyzerToken[]);
  } else {
    return processLegacyTokenData(data);
  }
};

// UPDATED: Direct backend call instead of Next.js API route
export const fetchTokenData = async (forceRefresh: boolean = false): Promise<FormattedMemecoin[]> => {
  try {
    console.log('🔄 Fetching token data directly from backend at:', new Date().toISOString());
    
    const cacheBuster = `_=${Date.now()}&r=${Math.random()}${forceRefresh ? '&force=1' : ''}`;
    // Direct call to your backend instead of Next.js API route
    const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/token-data?${cacheBuster}`;
    
    console.log('📡 Direct backend fetch URL:', url);
    
    const response = await fetch(url, { 
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    
    console.log('📊 Backend response status:', response.status);
    
    if (!response.ok) {
      console.error('❌ Backend request failed:', response.status, response.statusText);
      
      try {
        const errorData = await response.json();
        console.error('❌ Backend error details:', errorData);
      } catch (e) {
        console.error('❌ Could not parse backend error response');
      }
      
      return [];
    }
    
    const raw = await response.json();
    console.log('📄 Backend response structure:', {
      topLevelKeys: Object.keys(raw),
      hasData: Array.isArray(raw.data),
      hasResults: Array.isArray(raw.results),
      dataLength: raw.data?.length || 0,
      resultsLength: raw.results?.length || 0,
    });
    
    const firstItem = raw.data?.[0] || raw.results?.[0];
    if (firstItem) {
      console.log('📋 First item structure:', {
        keys: Object.keys(firstItem),
        sample: {
          symbol: firstItem.symbol,
          price: firstItem.price,
          risk: firstItem.risk,
          potential: firstItem.potential,
          investmentPotential: firstItem.investmentPotential
        }
      });
    }
    
    let tokens: any[] = [];
    
    if (Array.isArray(raw.data)) {
      tokens = raw.data;
      console.log('✅ Using raw.data array');
    } else if (Array.isArray(raw.results)) {
      tokens = raw.results;
      console.log('✅ Using raw.results array');
    } else if (Array.isArray(raw)) {
      tokens = raw;
      console.log('✅ Using direct array response');
    } else {
      console.error('❌ No valid token array found in backend response');
      console.error('Response structure:', raw);
      return [];
    }
    
    console.log(`📈 Tokens found: ${tokens.length}`);
    
    if (!tokens.length) {
      console.warn('⚠️ No token data found in backend response');
      return [];
    }
    
    const processed = processTokenData(tokens);
    console.log(`✅ Processed tokens: ${processed.length}`);
    
    if (processed.length > 0) {
      console.log('📊 Sample processed token:', {
        symbol: processed[0].symbol,
        price: processed[0].price,
        risk: processed[0].risk,
        potential: processed[0].potential
      });
    }
    
    return processed;
  } catch (error) {
    console.error('💥 Error fetching token data from backend:', error);
    return [];
  }
};

// UPDATED: Client-side cache invalidation (no Next.js server features)
export const invalidateTokenCache = async (): Promise<boolean> => {
  try {
    console.log('🗑️ Client-side cache invalidation - clearing browser cache');
    
    // Clear browser cache for our domain
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      );
    }
    
    console.log('✅ Browser cache cleared');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear browser cache:', error);
    return false;
  }
};

// Keep all your validation functions exactly as they are
export const validateTokenData = (data: any[]): { isValid: boolean, format: string, errors: string[] } => {
  const errors: string[] = [];
  
  if (!Array.isArray(data)) {
    errors.push('Data is not an array');
    return { isValid: false, format: 'unknown', errors };
  }
  
  if (data.length === 0) {
    return { isValid: true, format: 'empty', errors };
  }
  
  const firstItem = data[0];
  
  if (firstItem.risk !== undefined && firstItem.potential !== undefined) {
    const requiredFields = ['symbol', 'price', 'volume', 'marketCap', 'change24h', 'age', 'potential', 'risk', 'href'];
    const missingFields = requiredFields.filter(field => firstItem[field] === undefined);
    
    if (missingFields.length > 0) {
      errors.push(`Missing AI format fields: ${missingFields.join(', ')}`);
    }
    
    if (typeof firstItem.risk !== 'number') errors.push('risk should be a number');
    if (typeof firstItem.potential !== 'number') errors.push('potential should be a number');
    if (typeof firstItem.price !== 'number' && typeof firstItem.price !== 'string') errors.push('price should be a number or string');
    
    return { 
      isValid: missingFields.length === 0 && errors.length === 0, 
      format: 'AI Analyzer', 
      errors 
    };
  }
  
  if (firstItem.symbol !== undefined) {
    return { isValid: true, format: 'Legacy', errors };
  }
  
  errors.push('Unknown data format - missing required fields');
  return { isValid: false, format: 'unknown', errors };
};

export const isAIAnalyzerFormat = (data: any[]): boolean => {
  if (!data || data.length === 0) return false;
  const firstItem = data[0];
  return !!(firstItem.risk !== undefined && firstItem.potential !== undefined);
};

export const debugTokenData = (data: any): void => {
  console.group('🔍 Token Data Debug');
  console.log('Data type:', typeof data);
  console.log('Is array:', Array.isArray(data));
  
  if (Array.isArray(data) && data.length > 0) {
    console.log('Length:', data.length);
    console.log('First item keys:', Object.keys(data[0]));
    console.log('First item:', data[0]);
    
    const validation = validateTokenData(data);
    console.log('Validation:', validation);
  }
  
  console.groupEnd();
};
