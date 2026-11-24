import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const appPath =
  process.env.MARLOW_ANDROID_APP_PATH ??
  path.join(repoRoot, "android/Marlow/app/build/outputs/apk/debug/app-debug.apk");

const deviceName = process.env.MARLOW_ANDROID_DEVICE ?? "Android Emulator";
const platformVersion = process.env.MARLOW_ANDROID_VERSION;
const udid = process.env.MARLOW_ANDROID_UDID;

process.env.APPIUM_HOME ??= path.join(repoRoot, ".appium");

export const config: WebdriverIO.Config = {
  runner: "local",
  tsConfigPath: path.join(__dirname, "tsconfig.json"),
  specs: [path.join(__dirname, "specs/**/*.ts")],
  maxInstances: 1,
  capabilities: [
    {
      platformName: "Android",
      "appium:automationName": "UiAutomator2",
      "appium:deviceName": deviceName,
      ...(platformVersion ? { "appium:platformVersion": platformVersion } : {}),
      ...(udid ? { "appium:udid": udid } : {}),
      "appium:app": appPath,
      "appium:appPackage": "com.marlow.shop",
      "appium:appActivity": "com.marlow.shop.MainActivity",
      "appium:autoGrantPermissions": true,
      "appium:noReset": false,
      "appium:newCommandTimeout": 120,
      "appium:disableWindowAnimation": true,
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
