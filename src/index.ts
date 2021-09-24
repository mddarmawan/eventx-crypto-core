import redis from 'redis';
import { Server } from 'ws';
import { tickerWithInterval, Ticker } from './ticker';

const PORT = {
  redis: 6379,
  wss: 8000,
};
const publisher = redis.createClient({
  host: 'redis-server',
  port: PORT.redis
});
const subscriber = redis.createClient({
  host: 'redis-server',
  port: PORT.redis
});
const wss = new Server({
  port: PORT.wss,
});

subscriber.setMaxListeners(0);

setInterval(async () => {
  const seconds = new Date().getSeconds();
  if (seconds === 3) {
    const tickers = await tickerWithInterval() as Ticker[];
    const data = JSON.stringify(tickers);
    publisher.set('tickers', data);
    publisher.publish('tickers', data);
  }
}, 1000);

console.log(`Listening websocket connection to ${String(PORT.wss)}`);
wss.on('connection', async function (ws, req) {
  const ip = req.socket.remoteAddress;
  console.log(`New connection: ${String(ip)}`);

  publisher.get('tickers', async (err, data) => {
    if (!data) {
      const tickers = await tickerWithInterval() as Ticker[];
      const tickersData = JSON.stringify(tickers);
      publisher.set('tickers', tickersData);
      ws.send(tickersData);
    } else {
      ws.send(data);
    }
  });

  subscriber.subscribe('tickers');
  subscriber.on('message', (channel, message) => {
    ws.send(message);
  });
});
