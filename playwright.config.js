// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: "http://127.0.0.1:4173",
    trace: "retain-on-failure",
  },
  projects: [
    { name: "desktop-chrome", use: { ...devices["Desktop Chrome"] } },
    // Common Android screen sizes: small (360px), mid (393px) and large (412px).
    { name: "android-galaxy-s9", use: { ...devices["Galaxy S9+"] } },
    { name: "android-pixel-7", use: { ...devices["Pixel 7"] } },
    { name: "android-small-360", use: { ...devices["Galaxy S8"] } },
    { name: "android-tablet", use: { ...devices["Galaxy Tab S4"] } },
  ],
  webServer: {
    command: "node scripts/serve.js",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: true,
  },
});
