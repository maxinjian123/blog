import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
//#region src/adapters/mcp/transports.ts
/**
* Start the MCP server on stdio. Returns a stop function.
* @internal
*/
async function startStdioTransport(server) {
	const transport = new StdioServerTransport();
	await server.connect(transport);
	return async () => {
		await server.close();
	};
}
//#endregion
export { startStdioTransport };
