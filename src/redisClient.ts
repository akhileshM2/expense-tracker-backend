import { createClient } from 'redis';

const redis = createClient({
    username: 'default',
    password: '0AXjb132W8CPgUTQkJablDPLHybhFJGe',
    socket: {
        host: 'redis-15681.c212.ap-south-1-1.ec2.cloud.redislabs.com',
        port: 15681
    }
});

redis.on('error', err => {
    console.log('Redis Client Error', err)
});

(async () => {
  if (!redis.isOpen) {
    await redis.connect();
  }
})();

export default redis;

