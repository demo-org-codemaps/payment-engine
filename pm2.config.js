module.exports = {
  apps: [
    {
      name: 'nestjs-boilerplate',
      script: './dist/src/main.js',
      max_restarts: 5,
      min_uptime: '1m',
    },
  ],
};
