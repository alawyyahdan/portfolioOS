module.exports = {
  apps: [
    {
      name: "portfolio-frontend",
      script: "./server-ui.js",
      watch: false,
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
