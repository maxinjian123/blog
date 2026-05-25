import { createFileReporter } from "./reporters/node.mjs";
import { createUnplugin } from "unplugin";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import MagicString from "magic-string";
import { parseSync } from "oxc-parser";
import process from "node:process";
//#region src/code-transform/transform.ts
/**
* Transforms code that imports from `logs-sdk`:
* - Adds `\/*#__PURE__*\/` to `defineDiagnostics()` and `createLogger()` call expressions
* - Prepends `process.env.NODE_ENV !== 'production' &&` to expression statements using logger variables
*
* Also handles cross-file patterns: if a file imports a variable that was
* created from `createLogger()` or `defineDiagnostics()` in another file,
* the usage is tracked and wrapped.
*/
function transform(code, id, options, trackedExportsMap) {
	const packageName = options?.packageName ?? "logs-sdk";
	const ast = parseSync(id, code).program;
	const importedNames = /* @__PURE__ */ new Map();
	for (const node of ast.body) if (node.type === "ImportDeclaration" && node.source.value === packageName) {
		for (const spec of node.specifiers) if (spec.type === "ImportSpecifier") {
			const importedName = spec.imported.type === "Identifier" ? spec.imported.name : spec.imported.value;
			importedNames.set(spec.local.name, importedName);
		}
	}
	const crossFileTracked = /* @__PURE__ */ new Set();
	if (trackedExportsMap) {
		for (const node of ast.body) if (node.type === "ImportDeclaration" && node.source.value !== packageName) {
			const source = node.source.value;
			if (!source.startsWith(".")) continue;
			const resolvedPath = resolveModulePath(source, id);
			if (!resolvedPath) continue;
			if (!trackedExportsMap.has(resolvedPath)) analyzeModule(resolvedPath, packageName, trackedExportsMap);
			const trackedNames = trackedExportsMap.get(resolvedPath);
			if (trackedNames) {
				for (const spec of node.specifiers) if (spec.type === "ImportSpecifier") {
					const importedName = spec.imported.type === "Identifier" ? spec.imported.name : spec.imported.value;
					if (trackedNames.has(importedName)) crossFileTracked.add(spec.local.name);
				}
			}
		}
	}
	if (importedNames.size === 0 && crossFileTracked.size === 0) return void 0;
	const s = new MagicString(code);
	const trackedVars = new Set(crossFileTracked);
	walkStatements(ast.body, s, importedNames, trackedVars);
	if (!s.hasChanged()) return void 0;
	if (trackedExportsMap) {
		const exportedTracked = /* @__PURE__ */ new Set();
		for (const node of ast.body) if (node.type === "ExportNamedDeclaration" && node.declaration?.type === "VariableDeclaration") {
			for (const decl of node.declaration.declarations) if (decl.id?.type === "Identifier" && trackedVars.has(decl.id.name)) exportedTracked.add(decl.id.name);
		}
		if (exportedTracked.size > 0) trackedExportsMap.set(id, exportedTracked);
	}
	return {
		code: s.toString(),
		map: s.generateMap({ hires: "boundary" })
	};
}
const CONDITION = "process.env.NODE_ENV !== 'production'";
/**
* Check if an expression has lower precedence than `&&` and needs inner parens
* when used as the right-hand side of `guard && expr`.
*/
function expressionNeedsParens(node) {
	if (node.type === "ConditionalExpression") return true;
	if (node.type === "LogicalExpression" && (node.operator === "||" || node.operator === "??")) return true;
	if (node.type === "SequenceExpression") return true;
	if (node.type === "AssignmentExpression") return true;
	return false;
}
const EXTENSIONS = [
	".ts",
	".tsx",
	".js",
	".jsx",
	".mts",
	".mjs"
];
function resolveModulePath(source, importer) {
	const base = join(dirname(importer), source);
	if (existsSync(base)) return base;
	for (const ext of EXTENSIONS) {
		const candidate = base + ext;
		if (existsSync(candidate)) return candidate;
	}
	for (const ext of EXTENSIONS) {
		const candidate = join(base, `index${ext}`);
		if (existsSync(candidate)) return candidate;
	}
}
/**
* Analyze a module to find exported variables derived from logs-sdk calls.
* Results are cached in trackedExportsMap.
*/
function analyzeModule(filePath, packageName, trackedExportsMap) {
	trackedExportsMap.set(filePath, /* @__PURE__ */ new Set());
	let source;
	try {
		source = readFileSync(filePath, "utf-8");
	} catch {
		return;
	}
	if (!source.includes(packageName)) return;
	const ast = parseSync(filePath, source).program;
	const importedNames = /* @__PURE__ */ new Set();
	for (const node of ast.body) if (node.type === "ImportDeclaration" && node.source.value === packageName) {
		for (const spec of node.specifiers) if (spec.type === "ImportSpecifier") importedNames.add(spec.local.name);
	}
	if (importedNames.size === 0) return;
	const trackedExports = /* @__PURE__ */ new Set();
	for (const node of ast.body) if (node.type === "ExportNamedDeclaration" && node.declaration?.type === "VariableDeclaration") {
		for (const decl of node.declaration.declarations) if (decl.init?.type === "CallExpression" && decl.init.callee?.type === "Identifier" && importedNames.has(decl.init.callee.name) && decl.id?.type === "Identifier") trackedExports.add(decl.id.name);
	}
	if (trackedExports.size > 0) trackedExportsMap.set(filePath, trackedExports);
}
function walkStatements(body, s, importedNames, trackedVars) {
	for (const stmt of body) {
		if (stmt.type === "VariableDeclaration") {
			for (const decl of stmt.declarations) if (decl.init?.type === "CallExpression" && decl.init.callee?.type === "Identifier" && importedNames.has(decl.init.callee.name) && decl.id?.type === "Identifier") {
				trackedVars.add(decl.id.name);
				s.appendLeft(decl.init.start, "/*#__PURE__*/ ");
			}
		}
		if (stmt.type === "ExpressionStatement") {
			if (expressionUsesTrackedVar(stmt.expression, trackedVars)) if (expressionNeedsParens(stmt.expression)) {
				s.appendLeft(stmt.expression.start, `${CONDITION} && (`);
				s.appendRight(stmt.expression.end, `)`);
			} else s.appendLeft(stmt.expression.start, `${CONDITION} && `);
		}
		if (stmt.type === "BlockStatement" || stmt.type === "Program") walkStatements(stmt.body, s, importedNames, trackedVars);
		if (stmt.type === "IfStatement") {
			if (stmt.consequent?.type === "BlockStatement") walkStatements(stmt.consequent.body, s, importedNames, trackedVars);
			if (stmt.alternate?.type === "BlockStatement") walkStatements(stmt.alternate.body, s, importedNames, trackedVars);
		}
		if (stmt.type === "ForStatement" || stmt.type === "WhileStatement" || stmt.type === "DoWhileStatement") {
			if (stmt.body?.type === "BlockStatement") walkStatements(stmt.body.body, s, importedNames, trackedVars);
		}
		if (stmt.type === "FunctionDeclaration" || stmt.type === "ArrowFunctionExpression") {
			if (stmt.body?.type === "BlockStatement") walkStatements(stmt.body.body, s, importedNames, trackedVars);
		}
		if (stmt.type === "ExportNamedDeclaration" && stmt.declaration) walkStatements([stmt.declaration], s, importedNames, trackedVars);
	}
}
/**
* Check if an expression references a tracked variable as the root of a member/call chain.
*/
function expressionUsesTrackedVar(node, trackedVars) {
	if (!node) return false;
	if (node.type === "Identifier") return trackedVars.has(node.name);
	if (node.type === "MemberExpression") return expressionUsesTrackedVar(node.object, trackedVars);
	if (node.type === "CallExpression") return expressionUsesTrackedVar(node.callee, trackedVars);
	if (node.type === "LogicalExpression") return expressionUsesTrackedVar(node.left, trackedVars) || expressionUsesTrackedVar(node.right, trackedVars);
	if (node.type === "ConditionalExpression") return expressionUsesTrackedVar(node.consequent, trackedVars) || expressionUsesTrackedVar(node.alternate, trackedVars);
	if (node.type === "UnaryExpression") return expressionUsesTrackedVar(node.argument, trackedVars);
	if (node.type === "AwaitExpression") return expressionUsesTrackedVar(node.argument, trackedVars);
	if (node.type === "SequenceExpression") return node.expressions.some((expr) => expressionUsesTrackedVar(expr, trackedVars));
	if (node.type === "ParenthesizedExpression") return expressionUsesTrackedVar(node.expression, trackedVars);
	return false;
}
//#endregion
//#region src/code-transform/server-plugin.ts
const logsSDKServer = createUnplugin((options) => {
	const logFile = options?.logFile ?? ".diagnostics.log";
	const log = options?.debug ?? !!process.env.DEBUG ? (...args) => console.log("[logs-sdk]", ...args) : () => {};
	const reporter = createFileReporter({ logFile });
	return {
		name: "logs-sdk-server",
		enforce: "pre",
		vite: { configureServer(server) {
			const resolvedLogFile = resolve(server.config.root, logFile);
			if (!existsSync(resolvedLogFile)) writeFileSync(resolvedLogFile, "");
			const displayPath = relative(process.cwd(), resolvedLogFile) || logFile;
			server.config.logger.info(`📋 logs-sdk ··· saving logs to ${displayPath}`);
			log("listening for diagnostics on ws");
			server.ws.on("logs-sdk:report", (data) => {
				log("received diagnostic", data.code ?? data);
				reporter(data, "");
				log("wrote diagnostic to", displayPath);
			});
		} }
	};
});
//#endregion
//#region src/code-transform/unplugin.ts
const JS_EXTENSIONS_RE = /\.[jt]sx?$/;
const NODE_MODULES_RE = /\/node_modules\//;
const unpluginFactory = (options) => {
	const trackedExportsMap = /* @__PURE__ */ new Map();
	return {
		name: "logs-sdk",
		transform: {
			filter: { id: {
				include: JS_EXTENSIONS_RE,
				exclude: NODE_MODULES_RE
			} },
			handler(code, id) {
				const result = transform(code, id, options, trackedExportsMap);
				if (!result) return;
				return {
					code: result.code,
					map: result.map
				};
			}
		}
	};
};
const logsSDK = /* @__PURE__ */ createUnplugin(unpluginFactory);
//#endregion
export { logsSDK as default, logsSDK, logsSDKServer };

//# sourceMappingURL=unplugin.mjs.map