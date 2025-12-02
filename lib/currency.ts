
import { Currency } from "./types";

const API_BASE_URL = "https://api.exchangerate-api.com/v4/latest";

// Cache for exchange rates to avoid too many API calls
const ratesCache: Record<string, { rates: Record<string, number>; timestamp: number }> = {};
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

export async function getExchangeRate(from: Currency, to: Currency): Promise<number> {
  if (from === to) return 1;

  try {
    // Check cache first
    const cached = ratesCache[from];
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return cached.rates[to] || 1;
    }

    const response = await fetch(`${API_BASE_URL}/${from}`);
    if (!response.ok) {
      throw new Error("Failed to fetch exchange rates");
    }

    const data = await response.json();
    
    // Update cache
    ratesCache[from] = {
      rates: data.rates,
      timestamp: Date.now(),
    };

    return data.rates[to] || 1;
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    // Fallback to 1 if fetch fails, or maybe some hardcoded approximate rates could be better?
    // For now, returning 1 is safer than breaking the app, but user won't see conversion.
    // Let's try to provide some fallback static rates for common pairs if API fails.
    return getFallbackRate(from, to);
  }
}

function getFallbackRate(from: Currency, to: Currency): number {
  const rates: Record<string, number> = {
    "USD-EUR": 0.92,
    "USD-GBP": 0.79,
    "USD-INR": 83.5,
    "EUR-USD": 1.09,
    "EUR-GBP": 0.86,
    "EUR-INR": 90.5,
    "GBP-USD": 1.27,
    "GBP-EUR": 1.16,
    "GBP-INR": 105.5,
    "INR-USD": 0.012,
    "INR-EUR": 0.011,
    "INR-GBP": 0.0095,
  };

  const key = `${from}-${to}`;
  return rates[key] || 1;
}
