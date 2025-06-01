import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { queryDb } from "../rag/query-db";

// Create an MCP server
const server = new McpServer({
  name: "Custom Contents MCP",
  version: "1.0.0",
  instructions: `
  You are a helpful assistant that can answer questions about the project-specific contents.
  The purpose is to let LLM know about the project-specific contents such as 
  - Project documentation
  - Project requirements
  - Project specifications
  - Project architecture
  - Other project-specific contents

  You can use the \`query\` tool to search the database for the most relevant information.
  `
});

server.tool("query",
  { query: z.string(), topK: z.number().optional() },
  async ({ query, topK }) => {
    const result = await queryDb(query, topK)

    return {
      content: [{ type: "text", text: result.map(r => r.metadata?.text ?? '').join("\n") }]
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
