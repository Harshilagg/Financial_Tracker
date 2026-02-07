async function getExchangeRate(from, to) {
  if (from === to) return 1;

  const rates = {
    USD: 83,
    INR: 1,
    EUR: 90
  };

  return rates[from] / rates[to];
}

async function convertToBase(amount, currency, baseCurrency) {
  const rate = await getExchangeRate(currency, baseCurrency);

  return {
    exchange_rate: rate,
    base_amount: Number(amount) * rate
  };
}

module.exports = { getExchangeRate, convertToBase };