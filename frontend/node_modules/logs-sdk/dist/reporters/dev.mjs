//#region src/reporters/dev.ts
const devReporter = (diagnostic) => {
	if (import.meta.hot && typeof import.meta.hot.send === "function") import.meta.hot.send("logs-sdk:report", diagnostic);
	else console.warn("[logs-sdk]: import.meta.hot.send() is not available. This must be running on Vite.");
};
//#endregion
export { devReporter };

//# sourceMappingURL=dev.mjs.map