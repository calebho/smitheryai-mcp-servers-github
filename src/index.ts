#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
import { Octokit } from "octokit"
import { fetch as undiciFetch, EnvHttpProxyAgent } from "undici"
import { z } from "zod"
import { registerIssueTools } from "./tools/issues.js"
import { registerPullRequestTools } from "./tools/pullrequests.js"
import { registerRepositoryTools } from "./tools/repositories.js"
import { registerSearchTools } from "./tools/search.js"

export const configSchema = z.object({
	githubPersonalAccessToken: z.string(),
})

export default function ({ config }: { config: z.infer<typeof configSchema> }) {
	try {
		console.log("Starting GitHub MCP Server...")

		// Create a new MCP server
		const server = new McpServer({
			name: "GitHub MCP Server",
			version: "1.0.0",
		})

		// Create custom fetch with proxy support
		const proxyFetch = (url: string, options?: RequestInit) => {
			// @ts-expect-error - undici's fetch signature differs from standard fetch
			return undiciFetch(url, {
				...options,
				dispatcher: new EnvHttpProxyAgent(),
			})
		}

		// Initialize Octokit client with proxy support
		const octokit = new Octokit({
			auth: config.githubPersonalAccessToken,
			request: {
				fetch: proxyFetch,
			},
		})

		// Register tool groups
		registerSearchTools(server, octokit)
		registerIssueTools(server, octokit)
		registerRepositoryTools(server, octokit)
		registerPullRequestTools(server, octokit)

		return server.server
	} catch (e) {
		console.error(e)
		throw e
	}
}
