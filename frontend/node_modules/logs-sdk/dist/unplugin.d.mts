import { UnpluginInstance } from "unplugin";
import MagicString from "magic-string";

//#region src/code-transform/transform.d.ts
interface TransformOptions {
  /**
  * The package name to detect imports from.
  * @default 'logs-sdk'
  */
  packageName?: string;
}
//#endregion
//#region src/code-transform/server-plugin.d.ts
interface LogsSdkServerOptions {
  /**
  * Path to the log file.
  * @default '.diagnostics.log'
  */
  logFile?: string;
  /**
  * Enable debug logging for the plugin.
  * @default !!process.env.DEBUG
  */
  debug?: boolean;
}
declare const logsSDKServer: UnpluginInstance<LogsSdkServerOptions | undefined>;
//#endregion
//#region src/code-transform/unplugin.d.ts
type LogsSdkPluginOptions = TransformOptions;
declare const logsSDK: UnpluginInstance<LogsSdkPluginOptions | undefined>;
//#endregion
export { LogsSdkPluginOptions, type LogsSdkServerOptions, logsSDK as default, logsSDK, logsSDKServer };
//# sourceMappingURL=unplugin.d.mts.map