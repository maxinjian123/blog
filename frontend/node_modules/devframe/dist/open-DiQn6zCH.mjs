import { promisify } from "node:util";
import fs from "node:fs";
import os from "node:os";
import process from "node:process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import childProcess, { execFile } from "node:child_process";
import fs$1, { constants } from "node:fs/promises";
import { Buffer } from "node:buffer";
//#region ../../node_modules/.pnpm/is-docker@3.0.0/node_modules/is-docker/index.js
let isDockerCached;
function hasDockerEnv() {
	try {
		fs.statSync("/.dockerenv");
		return true;
	} catch {
		return false;
	}
}
function hasDockerCGroup() {
	try {
		return fs.readFileSync("/proc/self/cgroup", "utf8").includes("docker");
	} catch {
		return false;
	}
}
function isDocker() {
	if (isDockerCached === void 0) isDockerCached = hasDockerEnv() || hasDockerCGroup();
	return isDockerCached;
}
//#endregion
//#region ../../node_modules/.pnpm/is-inside-container@1.0.0/node_modules/is-inside-container/index.js
let cachedResult;
const hasContainerEnv = () => {
	try {
		fs.statSync("/run/.containerenv");
		return true;
	} catch {
		return false;
	}
};
function isInsideContainer() {
	if (cachedResult === void 0) cachedResult = hasContainerEnv() || isDocker();
	return cachedResult;
}
//#endregion
//#region ../../node_modules/.pnpm/is-wsl@3.1.1/node_modules/is-wsl/index.js
const isWsl = () => {
	if (process.platform !== "linux") return false;
	if (os.release().toLowerCase().includes("microsoft")) {
		if (isInsideContainer()) return false;
		return true;
	}
	try {
		if (fs.readFileSync("/proc/version", "utf8").toLowerCase().includes("microsoft")) return !isInsideContainer();
	} catch {}
	if (fs.existsSync("/proc/sys/fs/binfmt_misc/WSLInterop") || fs.existsSync("/run/WSL")) return !isInsideContainer();
	return false;
};
var is_wsl_default = process.env.__IS_WSL_TEST__ ? isWsl : isWsl();
//#endregion
//#region ../../node_modules/.pnpm/powershell-utils@0.1.0/node_modules/powershell-utils/index.js
const execFile$2 = promisify(childProcess.execFile);
const powerShellPath$1 = () => `${process.env.SYSTEMROOT || process.env.windir || String.raw`C:\Windows`}\\System32\\WindowsPowerShell\\v1.0\\powershell.exe`;
const executePowerShell = async (command, options = {}) => {
	const { powerShellPath: psPath, ...execFileOptions } = options;
	const encodedCommand = executePowerShell.encodeCommand(command);
	return execFile$2(psPath ?? powerShellPath$1(), [...executePowerShell.argumentsPrefix, encodedCommand], {
		encoding: "utf8",
		...execFileOptions
	});
};
executePowerShell.argumentsPrefix = [
	"-NoProfile",
	"-NonInteractive",
	"-ExecutionPolicy",
	"Bypass",
	"-EncodedCommand"
];
executePowerShell.encodeCommand = (command) => Buffer.from(command, "utf16le").toString("base64");
executePowerShell.escapeArgument = (value) => `'${String(value).replaceAll("'", "''")}'`;
//#endregion
//#region ../../node_modules/.pnpm/wsl-utils@0.3.1/node_modules/wsl-utils/utilities.js
function parseMountPointFromConfig(content) {
	for (const line of content.split("\n")) {
		if (/^\s*#/.test(line)) continue;
		const match = /^\s*root\s*=\s*(?<mountPoint>"[^"]*"|'[^']*'|[^#]*)/.exec(line);
		if (!match) continue;
		return match.groups.mountPoint.trim().replaceAll(/^["']|["']$/g, "");
	}
}
//#endregion
//#region ../../node_modules/.pnpm/wsl-utils@0.3.1/node_modules/wsl-utils/index.js
const execFile$1 = promisify(childProcess.execFile);
const wslDrivesMountPoint = (() => {
	const defaultMountPoint = "/mnt/";
	let mountPoint;
	return async function() {
		if (mountPoint) return mountPoint;
		const configFilePath = "/etc/wsl.conf";
		let isConfigFileExists = false;
		try {
			await fs$1.access(configFilePath, constants.F_OK);
			isConfigFileExists = true;
		} catch {}
		if (!isConfigFileExists) return defaultMountPoint;
		const parsedMountPoint = parseMountPointFromConfig(await fs$1.readFile(configFilePath, { encoding: "utf8" }));
		if (parsedMountPoint === void 0) return defaultMountPoint;
		mountPoint = parsedMountPoint;
		mountPoint = mountPoint.endsWith("/") ? mountPoint : `${mountPoint}/`;
		return mountPoint;
	};
})();
const powerShellPathFromWsl = async () => {
	return `${await wslDrivesMountPoint()}c/Windows/System32/WindowsPowerShell/v1.0/powershell.exe`;
};
const powerShellPath = is_wsl_default ? powerShellPathFromWsl : powerShellPath$1;
let canAccessPowerShellPromise;
const canAccessPowerShell = async () => {
	canAccessPowerShellPromise ??= (async () => {
		try {
			const psPath = await powerShellPath();
			await fs$1.access(psPath, constants.X_OK);
			return true;
		} catch {
			return false;
		}
	})();
	return canAccessPowerShellPromise;
};
const wslDefaultBrowser = async () => {
	const psPath = await powerShellPath();
	const { stdout } = await executePowerShell(String.raw`(Get-ItemProperty -Path "HKCU:\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice").ProgId`, { powerShellPath: psPath });
	return stdout.trim();
};
const convertWslPathToWindows = async (path) => {
	if (/^[a-z]+:\/\//i.test(path)) return path;
	try {
		const { stdout } = await execFile$1("wslpath", ["-aw", path], { encoding: "utf8" });
		return stdout.trim();
	} catch {
		return path;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/define-lazy-prop@3.0.0/node_modules/define-lazy-prop/index.js
function defineLazyProperty(object, propertyName, valueGetter) {
	const define = (value) => Object.defineProperty(object, propertyName, {
		value,
		enumerable: true,
		writable: true
	});
	Object.defineProperty(object, propertyName, {
		configurable: true,
		enumerable: true,
		get() {
			const result = valueGetter();
			define(result);
			return result;
		},
		set(value) {
			define(value);
		}
	});
	return object;
}
//#endregion
//#region ../../node_modules/.pnpm/default-browser-id@5.0.1/node_modules/default-browser-id/index.js
const execFileAsync$3 = promisify(execFile);
async function defaultBrowserId() {
	if (process.platform !== "darwin") throw new Error("macOS only");
	const { stdout } = await execFileAsync$3("defaults", [
		"read",
		"com.apple.LaunchServices/com.apple.launchservices.secure",
		"LSHandlers"
	]);
	const browserId = /LSHandlerRoleAll = "(?!-)(?<id>[^"]+?)";\s+?LSHandlerURLScheme = (?:http|https);/.exec(stdout)?.groups.id ?? "com.apple.Safari";
	if (browserId === "com.apple.safari") return "com.apple.Safari";
	return browserId;
}
//#endregion
//#region ../../node_modules/.pnpm/run-applescript@7.1.0/node_modules/run-applescript/index.js
const execFileAsync$2 = promisify(execFile);
async function runAppleScript(script, { humanReadableOutput = true, signal } = {}) {
	if (process.platform !== "darwin") throw new Error("macOS only");
	const outputArguments = humanReadableOutput ? [] : ["-ss"];
	const execOptions = {};
	if (signal) execOptions.signal = signal;
	const { stdout } = await execFileAsync$2("osascript", [
		"-e",
		script,
		outputArguments
	], execOptions);
	return stdout.trim();
}
//#endregion
//#region ../../node_modules/.pnpm/bundle-name@4.1.0/node_modules/bundle-name/index.js
async function bundleName(bundleId) {
	return runAppleScript(`tell application "Finder" to set app_path to application file id "${bundleId}" as string\ntell application "System Events" to get value of property list item "CFBundleName" of property list file (app_path & ":Contents:Info.plist")`);
}
//#endregion
//#region ../../node_modules/.pnpm/default-browser@5.5.0/node_modules/default-browser/windows.js
const execFileAsync$1 = promisify(execFile);
const windowsBrowserProgIds = {
	MSEdgeHTM: {
		name: "Edge",
		id: "com.microsoft.edge"
	},
	MSEdgeBHTML: {
		name: "Edge Beta",
		id: "com.microsoft.edge.beta"
	},
	MSEdgeDHTML: {
		name: "Edge Dev",
		id: "com.microsoft.edge.dev"
	},
	AppXq0fevzme2pys62n3e0fbqa7peapykr8v: {
		name: "Edge",
		id: "com.microsoft.edge.old"
	},
	ChromeHTML: {
		name: "Chrome",
		id: "com.google.chrome"
	},
	ChromeBHTML: {
		name: "Chrome Beta",
		id: "com.google.chrome.beta"
	},
	ChromeDHTML: {
		name: "Chrome Dev",
		id: "com.google.chrome.dev"
	},
	ChromiumHTM: {
		name: "Chromium",
		id: "org.chromium.Chromium"
	},
	BraveHTML: {
		name: "Brave",
		id: "com.brave.Browser"
	},
	BraveBHTML: {
		name: "Brave Beta",
		id: "com.brave.Browser.beta"
	},
	BraveDHTML: {
		name: "Brave Dev",
		id: "com.brave.Browser.dev"
	},
	BraveSSHTM: {
		name: "Brave Nightly",
		id: "com.brave.Browser.nightly"
	},
	FirefoxURL: {
		name: "Firefox",
		id: "org.mozilla.firefox"
	},
	OperaStable: {
		name: "Opera",
		id: "com.operasoftware.Opera"
	},
	VivaldiHTM: {
		name: "Vivaldi",
		id: "com.vivaldi.Vivaldi"
	},
	"IE.HTTP": {
		name: "Internet Explorer",
		id: "com.microsoft.ie"
	}
};
const _windowsBrowserProgIdMap = new Map(Object.entries(windowsBrowserProgIds));
var UnknownBrowserError = class extends Error {};
async function defaultBrowser$1(_execFileAsync = execFileAsync$1) {
	const { stdout } = await _execFileAsync("reg", [
		"QUERY",
		" HKEY_CURRENT_USER\\Software\\Microsoft\\Windows\\Shell\\Associations\\UrlAssociations\\http\\UserChoice",
		"/v",
		"ProgId"
	]);
	const match = /ProgId\s*REG_SZ\s*(?<id>\S+)/.exec(stdout);
	if (!match) throw new UnknownBrowserError(`Cannot find Windows browser in stdout: ${JSON.stringify(stdout)}`);
	const { id } = match.groups;
	const dotIndex = id.lastIndexOf(".");
	const hyphenIndex = id.lastIndexOf("-");
	const baseIdByDot = dotIndex === -1 ? void 0 : id.slice(0, dotIndex);
	const baseIdByHyphen = hyphenIndex === -1 ? void 0 : id.slice(0, hyphenIndex);
	return windowsBrowserProgIds[id] ?? windowsBrowserProgIds[baseIdByDot] ?? windowsBrowserProgIds[baseIdByHyphen] ?? {
		name: id,
		id
	};
}
//#endregion
//#region ../../node_modules/.pnpm/default-browser@5.5.0/node_modules/default-browser/index.js
const execFileAsync = promisify(execFile);
const titleize = (string) => string.toLowerCase().replaceAll(/(?:^|\s|-)\S/g, (x) => x.toUpperCase());
async function defaultBrowser() {
	if (process.platform === "darwin") {
		const id = await defaultBrowserId();
		return {
			name: await bundleName(id),
			id
		};
	}
	if (process.platform === "linux") {
		const { stdout } = await execFileAsync("xdg-mime", [
			"query",
			"default",
			"x-scheme-handler/http"
		]);
		const id = stdout.trim();
		return {
			name: titleize(id.replace(/.desktop$/, "").replace("-", " ")),
			id
		};
	}
	if (process.platform === "win32") return defaultBrowser$1();
	throw new Error("Only macOS, Linux, and Windows are supported");
}
//#endregion
//#region ../../node_modules/.pnpm/is-in-ssh@1.0.0/node_modules/is-in-ssh/index.js
const isInSsh = Boolean(process.env.SSH_CONNECTION || process.env.SSH_CLIENT || process.env.SSH_TTY);
//#endregion
//#region ../../node_modules/.pnpm/open@11.0.0/node_modules/open/index.js
const fallbackAttemptSymbol = Symbol("fallbackAttempt");
const __dirname = import.meta.url ? path.dirname(fileURLToPath(import.meta.url)) : "";
const localXdgOpenPath = path.join(__dirname, "xdg-open");
const { platform, arch } = process;
const tryEachApp = async (apps, opener) => {
	if (apps.length === 0) return;
	const errors = [];
	for (const app of apps) try {
		return await opener(app);
	} catch (error) {
		errors.push(error);
	}
	throw new AggregateError(errors, "Failed to open in all supported apps");
};
const baseOpen = async (options) => {
	options = {
		wait: false,
		background: false,
		newInstance: false,
		allowNonzeroExitCode: false,
		...options
	};
	const isFallbackAttempt = options[fallbackAttemptSymbol] === true;
	delete options[fallbackAttemptSymbol];
	if (Array.isArray(options.app)) return tryEachApp(options.app, (singleApp) => baseOpen({
		...options,
		app: singleApp,
		[fallbackAttemptSymbol]: true
	}));
	let { name: app, arguments: appArguments = [] } = options.app ?? {};
	appArguments = [...appArguments];
	if (Array.isArray(app)) return tryEachApp(app, (appName) => baseOpen({
		...options,
		app: {
			name: appName,
			arguments: appArguments
		},
		[fallbackAttemptSymbol]: true
	}));
	if (app === "browser" || app === "browserPrivate") {
		const ids = {
			"com.google.chrome": "chrome",
			"google-chrome.desktop": "chrome",
			"com.brave.browser": "brave",
			"org.mozilla.firefox": "firefox",
			"firefox.desktop": "firefox",
			"com.microsoft.msedge": "edge",
			"com.microsoft.edge": "edge",
			"com.microsoft.edgemac": "edge",
			"microsoft-edge.desktop": "edge",
			"com.apple.safari": "safari"
		};
		const flags = {
			chrome: "--incognito",
			brave: "--incognito",
			firefox: "--private-window",
			edge: "--inPrivate"
		};
		let browser;
		if (is_wsl_default) {
			const progId = await wslDefaultBrowser();
			browser = _windowsBrowserProgIdMap.get(progId) ?? {};
		} else browser = await defaultBrowser();
		if (browser.id in ids) {
			const browserName = ids[browser.id.toLowerCase()];
			if (app === "browserPrivate") {
				if (browserName === "safari") throw new Error("Safari doesn't support opening in private mode via command line");
				appArguments.push(flags[browserName]);
			}
			return baseOpen({
				...options,
				app: {
					name: apps[browserName],
					arguments: appArguments
				}
			});
		}
		throw new Error(`${browser.name} is not supported as a default browser`);
	}
	let command;
	const cliArguments = [];
	const childProcessOptions = {};
	let shouldUseWindowsInWsl = false;
	if (is_wsl_default && !isInsideContainer() && !isInSsh && !app) shouldUseWindowsInWsl = await canAccessPowerShell();
	if (platform === "darwin") {
		command = "open";
		if (options.wait) cliArguments.push("--wait-apps");
		if (options.background) cliArguments.push("--background");
		if (options.newInstance) cliArguments.push("--new");
		if (app) cliArguments.push("-a", app);
	} else if (platform === "win32" || shouldUseWindowsInWsl) {
		command = await powerShellPath();
		cliArguments.push(...executePowerShell.argumentsPrefix);
		if (!is_wsl_default) childProcessOptions.windowsVerbatimArguments = true;
		if (is_wsl_default && options.target) options.target = await convertWslPathToWindows(options.target);
		const encodedArguments = ["$ProgressPreference = 'SilentlyContinue';", "Start"];
		if (options.wait) encodedArguments.push("-Wait");
		if (app) {
			encodedArguments.push(executePowerShell.escapeArgument(app));
			if (options.target) appArguments.push(options.target);
		} else if (options.target) encodedArguments.push(executePowerShell.escapeArgument(options.target));
		if (appArguments.length > 0) {
			appArguments = appArguments.map((argument) => executePowerShell.escapeArgument(argument));
			encodedArguments.push("-ArgumentList", appArguments.join(","));
		}
		options.target = executePowerShell.encodeCommand(encodedArguments.join(" "));
		if (!options.wait) childProcessOptions.stdio = "ignore";
	} else {
		if (app) command = app;
		else {
			const isBundled = !__dirname || __dirname === "/";
			let exeLocalXdgOpen = false;
			try {
				await fs$1.access(localXdgOpenPath, constants.X_OK);
				exeLocalXdgOpen = true;
			} catch {}
			command = process.versions.electron ?? (platform === "android" || isBundled || !exeLocalXdgOpen) ? "xdg-open" : localXdgOpenPath;
		}
		if (appArguments.length > 0) cliArguments.push(...appArguments);
		if (!options.wait) {
			childProcessOptions.stdio = "ignore";
			childProcessOptions.detached = true;
		}
	}
	if (platform === "darwin" && appArguments.length > 0) cliArguments.push("--args", ...appArguments);
	if (options.target) cliArguments.push(options.target);
	const subprocess = childProcess.spawn(command, cliArguments, childProcessOptions);
	if (options.wait) return new Promise((resolve, reject) => {
		subprocess.once("error", reject);
		subprocess.once("close", (exitCode) => {
			if (!options.allowNonzeroExitCode && exitCode !== 0) {
				reject(/* @__PURE__ */ new Error(`Exited with code ${exitCode}`));
				return;
			}
			resolve(subprocess);
		});
	});
	if (isFallbackAttempt) return new Promise((resolve, reject) => {
		subprocess.once("error", reject);
		subprocess.once("spawn", () => {
			subprocess.once("close", (exitCode) => {
				subprocess.off("error", reject);
				if (exitCode !== 0) {
					reject(/* @__PURE__ */ new Error(`Exited with code ${exitCode}`));
					return;
				}
				subprocess.unref();
				resolve(subprocess);
			});
		});
	});
	subprocess.unref();
	return new Promise((resolve, reject) => {
		subprocess.once("error", reject);
		subprocess.once("spawn", () => {
			subprocess.off("error", reject);
			resolve(subprocess);
		});
	});
};
const open$1 = (target, options) => {
	if (typeof target !== "string") throw new TypeError("Expected a `target`");
	return baseOpen({
		...options,
		target
	});
};
function detectArchBinary(binary) {
	if (typeof binary === "string" || Array.isArray(binary)) return binary;
	const { [arch]: archBinary } = binary;
	if (!archBinary) throw new Error(`${arch} is not supported`);
	return archBinary;
}
function detectPlatformBinary({ [platform]: platformBinary }, { wsl } = {}) {
	if (wsl && is_wsl_default) return detectArchBinary(wsl);
	if (!platformBinary) throw new Error(`${platform} is not supported`);
	return detectArchBinary(platformBinary);
}
const apps = {
	browser: "browser",
	browserPrivate: "browserPrivate"
};
defineLazyProperty(apps, "chrome", () => detectPlatformBinary({
	darwin: "google chrome",
	win32: "chrome",
	linux: [
		"google-chrome",
		"google-chrome-stable",
		"chromium",
		"chromium-browser"
	]
}, { wsl: {
	ia32: "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe",
	x64: ["/mnt/c/Program Files/Google/Chrome/Application/chrome.exe", "/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe"]
} }));
defineLazyProperty(apps, "brave", () => detectPlatformBinary({
	darwin: "brave browser",
	win32: "brave",
	linux: ["brave-browser", "brave"]
}, { wsl: {
	ia32: "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe",
	x64: ["/mnt/c/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe", "/mnt/c/Program Files (x86)/BraveSoftware/Brave-Browser/Application/brave.exe"]
} }));
defineLazyProperty(apps, "firefox", () => detectPlatformBinary({
	darwin: "firefox",
	win32: String.raw`C:\Program Files\Mozilla Firefox\firefox.exe`,
	linux: "firefox"
}, { wsl: "/mnt/c/Program Files/Mozilla Firefox/firefox.exe" }));
defineLazyProperty(apps, "edge", () => detectPlatformBinary({
	darwin: "microsoft edge",
	win32: "msedge",
	linux: ["microsoft-edge", "microsoft-edge-dev"]
}, { wsl: "/mnt/c/Program Files (x86)/Microsoft/Edge/Application/msedge.exe" }));
defineLazyProperty(apps, "safari", () => detectPlatformBinary({ darwin: "Safari" }));
//#endregion
//#region src/utils/open.ts
/**
* Open a URL, file, or other target in its default OS handler
* (browser for URLs, Finder/Explorer for paths, etc.).
*/
async function open(target, options) {
	await open$1(target, options);
}
//#endregion
export { open as t };
