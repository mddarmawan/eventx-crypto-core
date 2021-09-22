import WebSocket, { Server } from 'ws';
import got from 'got';

const port = 8000;
const wss = new Server({
  port,
});

interface Ticker {
  ticker: TickerData;
  timestamp: number;
  success: boolean;
  error: string;
  code: TickerCode;
  name: TickerName;
}

interface TickerData {
  base: TickerBase;
  target: TickerTarget;
  price: string;
  volume: string;
  change: string;
}

type TickerBase =
  | 'BTC'
  | 'ETH'
  | 'LTC'
  | 'XMR'
  | 'XRP'
  | 'DOGE'
  | 'DASH'
  | 'MAID'
  | 'LSK'
  | 'SJCX';

type TickerTarget = 'USD';
type TickerCode = `${TickerBase}-${TickerTarget}`;

type TickerName =
  | 'Bitcoin'
  | 'Ether'
  | 'Litecoin'
  | 'Monero'
  | 'Ripple'
  | 'Dogecoin'
  | 'Dash'
  | 'MaidSafeeCoin'
  | 'Lisk'
  | 'Storjoin X';

const tickers: Record<TickerCode, TickerName> = {
  'BTC-USD': 'Bitcoin',
  'ETH-USD': 'Ether',
  'LTC-USD': 'Litecoin',
  'XMR-USD': 'Monero',
  'XRP-USD': 'Ripple',
  'DOGE-USD': 'Dogecoin',
  'DASH-USD': 'Dash',
  'MAID-USD': 'MaidSafeeCoin',
  'LSK-USD': 'Lisk',
  'SJCX-USD': 'Storjoin X',
};

const getTickers = async (): Promise<Array<Promise<Ticker>>> => {
  const promises: Array<Promise<Ticker>> = [];

  Object.keys(tickers).forEach((code) => {
    promises.push(getTicker(code as TickerCode, tickers[code as TickerCode]));
  });

  return promises;
};

const getTicker = async (
  code: TickerCode,
  name: TickerName,
): Promise<Ticker> => {
  const BASE_URL = 'https://api.cryptonator.com/api/ticker';
  const url = `${BASE_URL}/${code}`;
  const { body } = await got.get<Ticker>(url, {
    responseType: 'json',
  });

  body.code = code;
  body.name = name;

  return body;
};

const tickerWithInterval = async (ws: WebSocket): Promise<void> => {
  await Promise.allSettled(await getTickers()).then((results) => {
    const filteredResult: Ticker[] = [];
    results.forEach((item) => {
      if (item.status === 'fulfilled') {
        filteredResult.push(item.value);
      }
    });
    ws.send(JSON.stringify(filteredResult));
  });
};

console.log(`Listening websocket connection to ${String(port)}`);

wss.on('connection', async function (ws, req) {
  const ip = req.socket.remoteAddress;
  console.log(`New connection: ${String(ip)}`);

  await tickerWithInterval(ws);

  setInterval(async () => {
    const seconds = new Date().getSeconds();
    if (seconds === 3) {
      await tickerWithInterval(ws);
    }
  }, 1000);
});
