// pm2 start deploy/ecosystem.config.js   (run from the repo root)
const path = require('path');

module.exports = {
  apps: [{
    name: 'smartbid-api',
    cwd: path.join(__dirname, '../backend'),
    script: 'src/index.js',
    env: { NODE_ENV: 'production' },
    max_memory_restart: '400M',
  }],
};
