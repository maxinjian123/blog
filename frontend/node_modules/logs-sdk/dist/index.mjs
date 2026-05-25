import { n as plainFormatter, r as renderFrame, t as formatTag } from "./format-DYh8khIQ.mjs";
//#region src/diagnostics.ts
/**
* Resolves a {@link MessageTemplate} into a string, or `undefined` if the template is absent.
*/
function resolveTemplate(template, params) {
	if (template == null) return void 0;
	if (typeof template === "function") return template(params);
	return template;
}
/**
* Creates a typed diagnostics object from a set of code definitions. Each code
* becomes a callable factory that produces {@link Diagnostic} objects with
* template interpolation and optional per-call overrides.
*/
function defineDiagnostics(options) {
	const { docsBase, codes } = options;
	const result = {};
	const codeKeys = Object.keys(codes);
	for (const code of codeKeys) {
		const def = codes[code];
		result[code] = (paramsOrOverrides, maybeOverrides) => {
			const hasParams = typeof def.message === "function" || typeof def.fix === "function" || typeof def.why === "function" || typeof def.hint === "function";
			const params = hasParams ? paramsOrOverrides : void 0;
			const overrides = hasParams ? maybeOverrides : paramsOrOverrides;
			const docs = typeof docsBase === "function" ? docsBase(code) : docsBase != null ? `${docsBase}/${code.toLowerCase()}` : void 0;
			return {
				code,
				level: def.level ?? "error",
				message: resolveTemplate(def.message, params),
				...docs != null && { docs },
				...resolveTemplate(def.fix, params) != null && { fix: resolveTemplate(def.fix, params) },
				...resolveTemplate(def.why, params) != null && { why: resolveTemplate(def.why, params) },
				...resolveTemplate(def.hint, params) != null && { hint: resolveTemplate(def.hint, params) },
				...overrides
			};
		};
	}
	Object.defineProperties(result, {
		codes: {
			value: () => codeKeys,
			enumerable: false
		},
		has: {
			value: (code) => code in codes,
			enumerable: false
		},
		get: {
			value: (code) => codes[code],
			enumerable: false
		},
		extend: {
			value: (defs) => defineDiagnostics({
				...options,
				codes: {
					...codes,
					...defs
				}
			}),
			enumerable: false
		}
	});
	return result;
}
//#endregion
//#region src/error.ts
var CodedError = class extends Error {
	diagnostic;
	constructor(diagnostic) {
		super(`[${diagnostic.code}] ${diagnostic.message}`);
		this.name = "CodedError";
		this.diagnostic = diagnostic;
		if (diagnostic.cause != null) this.cause = diagnostic.cause;
	}
};
//#endregion
//#region src/reporter.ts
const consoleReporter = (diagnostic, formatted) => {
	if (diagnostic.level === "error") console.error(formatted);
	else console.warn(formatted);
};
function createFetchReporter(url) {
	return (diagnostic, _formatted) => {
		fetch(url, {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify(diagnostic)
		}).catch(() => {});
	};
}
//#endregion
//#region src/logger.ts
function captureStackTrace() {
	const err = {};
	if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(err, captureStackTrace);
	else err.stack = (/* @__PURE__ */ new Error()).stack;
	if (!err.stack) return void 0;
	const lines = err.stack.split("\n");
	let frameStart = 0;
	while (frameStart < lines.length && !lines[frameStart].trimStart().startsWith("at ")) frameStart++;
	const skipInternal = typeof Error.captureStackTrace === "function" ? 1 : 2;
	const frames = lines.slice(frameStart + skipInternal).filter((line) => !line.includes("/node_modules/") && !line.includes("(node:")).map((line) => line.trim());
	return frames.length > 0 ? frames.join("\n") : void 0;
}
function formatAndReport(formatter, reporters, diagnostic) {
	const formatted = formatter(diagnostic);
	for (const reporter of reporters) reporter(diagnostic, formatted);
	return formatted;
}
function createActions(diagnostic, formatter, reporters, shouldCaptureStack) {
	return Object.assign({}, diagnostic, {
		throw() {
			const stack = shouldCaptureStack ? captureStackTrace() : void 0;
			const d = stack ? {
				...diagnostic,
				stack
			} : diagnostic;
			formatAndReport(formatter, reporters, d);
			throw new CodedError(d);
		},
		warn() {
			const stack = shouldCaptureStack ? captureStackTrace() : void 0;
			formatAndReport(formatter, reporters, {
				...diagnostic,
				level: "warn",
				...stack && { stack }
			});
		},
		error() {
			const stack = shouldCaptureStack ? captureStackTrace() : void 0;
			formatAndReport(formatter, reporters, {
				...diagnostic,
				level: "error",
				...stack && { stack }
			});
		},
		log() {
			const stack = shouldCaptureStack ? captureStackTrace() : void 0;
			formatAndReport(formatter, reporters, stack ? {
				...diagnostic,
				stack
			} : diagnostic);
		},
		format() {
			return formatter(diagnostic);
		}
	});
}
function createLogger(options) {
	const formatter = options.formatter ?? plainFormatter;
	const reporters = Array.isArray(options.reporters) ? options.reporters : [options.reporters ?? consoleReporter];
	const shouldCaptureStack = options.captureStack !== false;
	const result = {};
	for (const diagnostics of options.diagnostics) {
		const codeKeys = typeof diagnostics.codes === "function" ? diagnostics.codes() : Object.keys(diagnostics);
		for (const code of codeKeys) if (typeof diagnostics[code] === "function") result[code] = (...args) => {
			return createActions(diagnostics[code](...args), formatter, reporters, shouldCaptureStack);
		};
	}
	result.throw = (diagnostic) => {
		const stack = shouldCaptureStack ? captureStackTrace() : void 0;
		const d = stack ? {
			...diagnostic,
			stack
		} : diagnostic;
		formatAndReport(formatter, reporters, d);
		throw new CodedError(d);
	};
	result.warn = (diagnostic) => {
		const stack = shouldCaptureStack ? captureStackTrace() : void 0;
		formatAndReport(formatter, reporters, {
			...diagnostic,
			level: "warn",
			...stack && { stack }
		});
	};
	result.error = (diagnostic) => {
		const stack = shouldCaptureStack ? captureStackTrace() : void 0;
		formatAndReport(formatter, reporters, {
			...diagnostic,
			level: "error",
			...stack && { stack }
		});
	};
	result.log = (diagnostic) => {
		const stack = shouldCaptureStack ? captureStackTrace() : void 0;
		formatAndReport(formatter, reporters, stack ? {
			...diagnostic,
			stack
		} : diagnostic);
	};
	result.format = (diagnostic) => {
		return formatter(diagnostic);
	};
	return result;
}
//#endregion
export { CodedError, consoleReporter, createFetchReporter, createLogger, defineDiagnostics, formatTag, plainFormatter, renderFrame };

//# sourceMappingURL=index.mjs.map