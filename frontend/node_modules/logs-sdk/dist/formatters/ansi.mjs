import { t as formatTag } from "../format-DYh8khIQ.mjs";
//#region src/formatters/ansi.ts
function levelColor(colors, level) {
	switch (level) {
		case "error": return colors.red;
		case "warn":
		case "deprecation": return colors.yellow;
		case "suggestion": return colors.cyan;
		default: return (s) => s;
	}
}
function ansiFormatter(colors) {
	return (d) => {
		const colorize = levelColor(colors, d.level);
		const header = `${colors.bold(colorize(formatTag(d)))} ${d.message}`;
		const details = [];
		if (d.why) details.push(`${colors.dim("why:")} ${d.why}`);
		if (d.fix) details.push(`${colors.dim("fix:")} ${d.fix}`);
		if (d.hint) details.push(`${colors.dim("hint:")} ${colors.gray(d.hint)}`);
		if (d.docs) details.push(`${colors.dim("see:")} ${colors.cyan(d.docs)}`);
		if (details.length === 0) return header;
		return [header, ...details.map((detail, i) => {
			return `${i < details.length - 1 ? colors.dim("├▶") : colors.dim("╰▶")} ${detail}`;
		})].join("\n");
	};
}
//#endregion
export { ansiFormatter };

//# sourceMappingURL=ansi.mjs.map