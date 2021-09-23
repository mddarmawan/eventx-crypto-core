import got from 'got';

export interface Ticker {
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
  | 'SJCX'
  | 'ZEC';

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
  | 'Storjoin X'
  | 'Zcash';


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
  'ZEC-USD': 'Zcash',
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

export const tickerWithInterval = async (): Promise<unknown> => {
  return new Promise(async (resolve): Promise<void> => {
    await Promise.allSettled(await getTickers()).then((results) => {
      const filteredResult: Ticker[] = [];
      results.forEach((item) => {
        if (item.status === 'fulfilled') {
          filteredResult.push(item.value);
        }
      });
      resolve(filteredResult);
    });
  })
};
