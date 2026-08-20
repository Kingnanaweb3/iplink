let cached = null;
let cachedAt = 0;

export async function getCtcUsdPrice() {
  const now = Date.now();
  if (cached && now - cachedAt < 5 * 60 * 1000) return cached;
  try {
    const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=creditcoin&vs_currencies=usd");
    const data = await res.json();
    const price = data?.creditcoin?.usd;
    if (typeof price === "number") {
      cached = price;
      cachedAt = now;
      return price;
    }
    return null;
  } catch {
    return null;
  }
}
