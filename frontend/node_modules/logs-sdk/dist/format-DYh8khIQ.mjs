//#region src/format.ts
function formatTag(d) {
	return `[${d.code}]`;
}
function renderFrame(d) {
	const header = `${formatTag(d)} ${d.message}`;
	const details = [];
	if (d.why) details.push(`why: ${d.why}`);
	if (d.fix) details.push(`fix: ${d.fix}`);
	if (d.hint) details.push(`hint: ${d.hint}`);
	if (d.docs) details.push(`see: ${d.docs}`);
	if (details.length === 0) return header;
	return [header, ...details.map((detail, i) => {
		return `${i < details.length - 1 ? "├▶" : "╰▶"} ${detail}`;
	})].join("\n");
}
const plainFormatter = renderFrame;
//#endregion
export { plainFormatter as n, renderFrame as r, formatTag as t };

//# sourceMappingURL=format-DYh8khIQ.mjs.map