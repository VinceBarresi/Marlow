import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const appPath =
  process.env.MARLOW_APP_PATH ??
  path.join(repoRoot, "ios/Marlow/build/Build/Products/Debug-iphonesimulator/Marlow.app");

const deviceName = process.env.MARLOW_IOS_DEVICE ?? "iPhone 16";
const platformVersion = process.env.MARLOW_IOS_VERSION;

process.env.APPIUM_HOME ??= path.join(repoRoot, ".appium");

export const config: WebdriverIO.Config = {
  runner: "local",
  tsConfigPath: path.join(__dirname, "tsconfig.json"),
  specs: [path.join(__dirname, "specs/**/*.ts")],
  maxInstances: 1,
  capabilities: [
    {
      platformName: "iOS",
      "appium:automationName": "XCUITest",
      "appium:deviceName": deviceName,
      ...(platformVersion ? { "appium:platformVersion": platformVersion } : {}),
      "appium:app": appPath,
      "appium:noReset": false,
      "appium:newCommandTimeout": 120,
      "appium:wdaLaunchTimeout": 120000,
      "appium:wdaConnectionTimeout": 120000,
    },
  ],
  logLevel: "info",
  bail: 0,
  waitforTimeout: 15000,
  connectionRetryTimeout: 180000,
  connectionRetryCount: 2,
  services: [
    [
      "appium",
      {
        command: "appium",
        args: {
          relaxedSecurity: true,
        },
      },
    ],
  ],
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 180000,
  },
};
