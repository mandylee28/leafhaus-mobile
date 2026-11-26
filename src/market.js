// Leafhaus — market (country) selection: Malaysia or Singapore.
// The choice is saved on the device; Malaysia is the default and the
// only market with stores so far (Singapore is coming soon).

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEFAULT_MARKET_ID, MARKETS, MARKET_STORAGE_KEY } from './data';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [marketId, setMarketId] = useState(DEFAULT_MARKET_ID);

  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(MARKET_STORAGE_KEY);
        if (saved && MARKETS.some((m) => m.id === saved)) {
          setMarketId(saved);
        }
      } catch (e) {
        // Keep the default market when the saved choice cannot be read.
      }
    })();
  }, []);

  async function setMarket(id) {
    if (!MARKETS.some((m) => m.id === id)) {
      return;
    }
    setMarketId(id);
    try {
      await AsyncStorage.setItem(MARKET_STORAGE_KEY, id);
    } catch (e) {
      // The choice still applies for this session when saving fails.
    }
  }

  const market = MARKETS.find((m) => m.id === marketId);
  const value = useMemo(() => ({ market, setMarket }), [market]);

  return <MarketContext.Provider value={value}>{children}</MarketContext.Provider>;
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used inside MarketProvider');
  return ctx;
}
