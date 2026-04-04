module.exports = {
  apps: [
    {
      name: "pOS",
      script: "serve",
      args: "-s . -l 3005",
      env: {
        NODE_ENV: "production"
      }
    },
    {
      name: "qris-backend",
      script: "./backend-qris/index.js",
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
