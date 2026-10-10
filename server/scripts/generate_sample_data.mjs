import fs from 'fs';
import path from 'path';

const stocks = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Limited', exchange: 'NSE', isin: 'INE002A01018', sector: 'Energy', basePaise: 140000 },
  { symbol: 'TCS', name: 'Tata Consultancy Services Limited', exchange: 'NSE', isin: 'INE467B01029', sector: 'Information Technology', basePaise: 385000 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', exchange: 'NSE', isin: 'INE040A01034', sector: 'Financial Services', basePaise: 165000 },
  { symbol: 'INFY', name: 'Infosys Limited', exchange: 'NSE', isin: 'INE009A01021', sector: 'Information Technology', basePaise: 155000 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', exchange: 'NSE', isin: 'INE090A01021', sector: 'Financial Services', basePaise: 112000 },
  { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Limited', exchange: 'NSE', isin: 'INE030A01027', sector: 'FMCG', basePaise: 248000 },
  { symbol: 'ITC', name: 'ITC Limited', exchange: 'NSE', isin: 'INE154A01025', sector: 'FMCG', basePaise: 44000 },
  { symbol: 'SBIN', name: 'State Bank of India', exchange: 'NSE', isin: 'INE062A01020', sector: 'Financial Services', basePaise: 78000 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', exchange: 'NSE', isin: 'INE397D01024', sector: 'Telecommunication', basePaise: 129000 },
  { symbol: 'LICI', name: 'Life Insurance Corporation of India', exchange: 'NSE', isin: 'INE115A01026', sector: 'Financial Services', basePaise: 98000 },
  { symbol: 'LT', name: 'Larsen & Toubro Limited', exchange: 'NSE', isin: 'INE018A01030', sector: 'Construction', basePaise: 355000 },
  { symbol: 'BAJFINANCE', name: 'Bajaj Finance Limited', exchange: 'NSE', isin: 'INE296A01024', sector: 'Financial Services', basePaise: 695000 },
  { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', exchange: 'NSE', isin: 'INE585B01010', sector: 'Automobile', basePaise: 1180000 },
  { symbol: 'HCLTECH', name: 'HCL Technologies Limited', exchange: 'NSE', isin: 'INE860A01027', sector: 'Information Technology', basePaise: 149000 },
  { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited', exchange: 'NSE', isin: 'INE044A01036', sector: 'Healthcare', basePaise: 158000 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Limited', exchange: 'NSE', isin: 'INE155A01022', sector: 'Automobile', basePaise: 92000 },
  { symbol: 'ONGC', name: 'Oil & Natural Gas Corporation Limited', exchange: 'NSE', isin: 'INE213A01029', sector: 'Energy', basePaise: 27500 },
  { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited', exchange: 'NSE', isin: 'INE237A01028', sector: 'Financial Services', basePaise: 178000 },
  { symbol: 'TITAN', name: 'Titan Company Limited', exchange: 'NSE', isin: 'INE280A01028', sector: 'Consumer Durables', basePaise: 342000 },
  { symbol: 'AXISBANK', name: 'Axis Bank Limited', exchange: 'NSE', isin: 'INE238A01034', sector: 'Financial Services', basePaise: 115000 },
  { symbol: 'NTPC', name: 'NTPC Limited', exchange: 'NSE', isin: 'INE733E01010', sector: 'Utilities', basePaise: 36000 },
  { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Limited', exchange: 'NSE', isin: 'INE752E01010', sector: 'Utilities', basePaise: 29500 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Limited', exchange: 'NSE', isin: 'INE423A01024', sector: 'Metals & Mining', basePaise: 310000 },
  { symbol: 'ADANIPORTS', name: 'Adani Ports & Special Economic Zone Limited', exchange: 'NSE', isin: 'INE742F01042', sector: 'Infrastructure', basePaise: 135000 },
  { symbol: 'COALINDIA', name: 'Coal India Limited', exchange: 'NSE', isin: 'INE522F01014', sector: 'Energy', basePaise: 47000 },
  { symbol: 'WIPRO', name: 'Wipro Limited', exchange: 'NSE', isin: 'INE075A01022', sector: 'Information Technology', basePaise: 46000 },
  { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', exchange: 'NSE', isin: 'INE481G01011', sector: 'Materials', basePaise: 1020000 },
  { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', exchange: 'NSE', isin: 'INE021A01026', sector: 'Consumer Durables', basePaise: 285000 },
  { symbol: 'BAJAJFINSV', name: 'Bajaj Finserv Limited', exchange: 'NSE', isin: 'INE918I01026', sector: 'Financial Services', basePaise: 161000 },
  { symbol: 'TATASTEEL', name: 'Tata Steel Limited', exchange: 'NSE', isin: 'INE081A01020', sector: 'Metals & Mining', basePaise: 16500 },
  { symbol: 'MM', name: 'Mahindra & Mahindra Limited', exchange: 'NSE', isin: 'INE101A01026', sector: 'Automobile', basePaise: 210000 },
  { symbol: 'NESTLEIND', name: 'Nestle India Limited', exchange: 'NSE', isin: 'INE239A01016', sector: 'FMCG', basePaise: 255000 },
  { symbol: 'JSWSTEEL', name: 'JSW Steel Limited', exchange: 'NSE', isin: 'INE019A01038', sector: 'Metals & Mining', basePaise: 89000 },
  { symbol: 'GRASIM', name: 'Grasim Industries Limited', exchange: 'NSE', isin: 'INE047A01021', sector: 'Materials', basePaise: 228000 },
  { symbol: 'TECHM', name: 'Tech Mahindra Limited', exchange: 'NSE', isin: 'INE669C01036', sector: 'Information Technology', basePaise: 132000 },
  { symbol: 'CIPLA', name: 'Cipla Limited', exchange: 'NSE', isin: 'INE059A01026', sector: 'Healthcare', basePaise: 145000 },
  { symbol: 'DRREDDY', name: "Dr. Reddy's Laboratories Limited", exchange: 'NSE', isin: 'INE089A01023', sector: 'Healthcare', basePaise: 610000 },
  { symbol: 'EICHERMOT', name: 'Eicher Motors Limited', exchange: 'NSE', isin: 'INE066A01021', sector: 'Automobile', basePaise: 430000 },
  { symbol: 'TATACONSUM', name: 'Tata Consumer Products Limited', exchange: 'NSE', isin: 'INE192A01025', sector: 'FMCG', basePaise: 112000 },
  { symbol: 'BRITANNIA', name: 'Britannia Industries Limited', exchange: 'NSE', isin: 'INE216A01030', sector: 'FMCG', basePaise: 490000 },
  { symbol: 'DIVISLAB', name: "Divi's Laboratories Limited", exchange: 'NSE', isin: 'INE361B01024', sector: 'Healthcare', basePaise: 395000 },
  { symbol: 'APOLLOHOSP', name: 'Apollo Hospitals Enterprise Limited', exchange: 'NSE', isin: 'INE437A01024', sector: 'Healthcare', basePaise: 620000 },
  { symbol: 'HEROMOTOCO', name: 'Hero MotoCorp Limited', exchange: 'NSE', isin: 'INE158A01026', sector: 'Automobile', basePaise: 480000 },
  { symbol: 'HINDALCO', name: 'Hindalco Industries Limited', exchange: 'NSE', isin: 'INE038A01020', sector: 'Metals & Mining', basePaise: 62000 },
  { symbol: 'SBILIFE', name: 'SBI Life Insurance Company Limited', exchange: 'NSE', isin: 'INE123W01016', sector: 'Financial Services', basePaise: 150000 },
  { symbol: 'BPCL', name: 'Bharat Petroleum Corporation Limited', exchange: 'NSE', isin: 'INE029A01011', sector: 'Energy', basePaise: 60000 },
  { symbol: 'BEL', name: 'Bharat Electronics Limited', exchange: 'NSE', isin: 'INE263A01024', sector: 'Industrials', basePaise: 23000 },
  { symbol: 'HAL', name: 'Hindustan Aeronautics Limited', exchange: 'NSE', isin: 'INE066F01012', sector: 'Industrials', basePaise: 420000 },
  { symbol: 'VBL', name: 'Varun Beverages Limited', exchange: 'NSE', isin: 'INE200M01021', sector: 'FMCG', basePaise: 148000 },
  { symbol: 'TRENT', name: 'Trent Limited', exchange: 'NSE', isin: 'INE849A01020', sector: 'Consumer Services', basePaise: 450000 }
];

// Indian holidays 2026
const holidays2026 = [
  '2026-01-26', // Republic Day
  '2026-03-03', // Holi
  '2026-03-20', // Id-ul-Fitr
  '2026-04-03', // Good Friday
  '2026-04-14', // Dr. Ambedkar Jayanti
  '2026-05-01', // Maharashtra Day
  '2026-05-27', // Bakri Id
  '2026-08-15', // Independence Day
  '2026-10-02', // Mahatma Gandhi Jayanti
  '2026-10-20', // Dussehra
  '2026-11-08', // Diwali (Laxmi Pujan)
  '2026-11-10', // Diwali Balipratipada
  '2026-11-24', // Gurunanak Jayanti
  '2026-12-25'  // Christmas
];

// Generate past 250 trading days ending 2026-10-09 (Friday before today)
const tradingDays = [];
let curr = new Date('2026-10-09T00:00:00Z');
while (tradingDays.length < 250) {
  const dayOfWeek = curr.getUTCDay();
  const dateStr = curr.toISOString().split('T')[0];
  if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidays2026.includes(dateStr)) {
    tradingDays.push(dateStr);
  }
  curr.setUTCDate(curr.getUTCDate() - 1);
}
tradingDays.reverse(); // chronological order

// Generate CSV
let csv = 'symbol,exchange,name,isin,sector,trade_date,open_paise,high_paise,low_paise,close_paise,volume,source\n';

// Seed price paths
const stockHistory = {};

for (const stock of stocks) {
  let price = stock.basePaise;
  stockHistory[stock.symbol] = [];
  
  for (let i = 0; i < tradingDays.length; i++) {
    const date = tradingDays[i];
    // Deterministic pseudo-random variation
    const seed = (stock.symbol.charCodeAt(0) * 31 + i * 17) % 100;
    const changePct = ((seed % 11) - 5) / 200; // -2.5% to +2.5%
    if (i > 0) {
      price = Math.round(price * (1 + changePct));
    }
    // On the final date (2026-10-09), keep basePaise close to anchor
    if (i === tradingDays.length - 1) {
      price = stock.basePaise;
    }
    const high = Math.round(price * 1.015);
    const low = Math.round(price * 0.985);
    const open = Math.round((high + low) / 2);
    const volume = 500000 + (seed * 12345);

    stockHistory[stock.symbol].push({
      date,
      open,
      high,
      low,
      close: price,
      volume
    });

    csv += `${stock.symbol},${stock.exchange},"${stock.name}",${stock.isin},"${stock.sector}",${date},${open},${high},${low},${price},${volume},SAMPLE_EOD\n`;
  }
}

// Ensure data/ directory exists
if (!fs.existsSync('data')) fs.mkdirSync('data');
fs.writeFileSync('data/sample_prices.csv', csv);
console.log('Generated data/sample_prices.csv with 50 stocks x 250 days = 12500 price records.');

// Generate supabase/seed.sql
let sql = `-- Seed script for Mudra: 50 instruments, trading calendar holidays, and initial closing prices\n\n`;

// 1. Instruments
sql += `-- 1. Seed 50 NSE Instruments\n`;
sql += `INSERT INTO public.instruments (symbol, exchange, name, isin, sector, lot_size, is_active)\nVALUES\n`;
sql += stocks.map(s => `  ('${s.symbol}', '${s.exchange}', '${s.name.replace(/'/g, "''")}', '${s.isin}', '${s.sector}', 1, true)`).join(',\n') + '\n';
sql += `ON CONFLICT (exchange, symbol) DO UPDATE SET is_active = true;\n\n`;

// 2. Trading Calendar (2026 Holidays)
sql += `-- 2. Seed Trading Calendar (Holidays)\n`;
sql += `INSERT INTO public.trading_calendar (trade_date, is_open, note)\nVALUES\n`;
sql += holidays2026.map(h => `  ('${h}', false, 'Market Holiday')`).join(',\n') + '\n';
sql += `ON CONFLICT (trade_date) DO NOTHING;\n\n`;

// 3. Seed recent prices (last 30 trading days in seed.sql for lean local migrations)
sql += `-- 3. Seed Recent Closing Prices\n`;
const recentDays = tradingDays.slice(-30);
const priceInserts = [];

for (const stock of stocks) {
  const history = stockHistory[stock.symbol].slice(-30);
  for (const h of history) {
    priceInserts.push(`  ((SELECT id FROM public.instruments WHERE symbol = '${stock.symbol}' LIMIT 1), '${h.date}', ${h.open}, ${h.high}, ${h.low}, ${h.close}, ${h.volume}, 'SAMPLE_EOD')`);
  }
}

sql += `INSERT INTO public.daily_prices (instrument_id, trade_date, open_paise, high_paise, low_paise, close_paise, volume, source)\nVALUES\n`;
sql += priceInserts.join(',\n') + '\n';
sql += `ON CONFLICT (instrument_id, trade_date) DO NOTHING;\n`;

fs.writeFileSync('supabase/seed.sql', sql);
console.log('Generated supabase/seed.sql with instruments, trading calendar, and recent prices.');
