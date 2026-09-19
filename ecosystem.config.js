// pm2 start ecosystem.config.js；環境變數放 .env 或下方 env 區塊
export const apps = [
  {
    name: 'equipment-rental',
    script: './.output/server/index.mjs',
    cwd: import.meta.dirname,
    instances: 1,
    env: { PORT: 3030 },
  },
]
