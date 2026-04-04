module.exports = {
  apps: [
    {
      name: "portfolio-frontend",
      script: "serve",               // Fitur bawaan PM2 untuk host static HTML
      env: {
        PM2_SERVE_PATH: ".",         // Lokasi file HTML (Project/Home)
        PM2_SERVE_PORT: 3005,        // Frontend akan di-host di port 3005
        PM2_SERVE_HOMEPAGE: "./index.html"
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
