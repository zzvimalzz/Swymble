// Generates dist/.well-known/mcp/server-card.json (SEP-1649).
//
// Gated on MCP_SERVER_URL being set, and that gate is the whole point. A server card is a promise
// that an MCP endpoint exists at a given address; publishing one before the Worker is deployed
// costs every agent that finds it a connection timeout to discover otherwise. So the card is
// written only once someone has deployed cloudflare/mcp-worker.js and recorded where it lives.
//
// Setup:
//   1. npx wrangler deploy --config cloudflare/mcp-worker.wrangler.toml
//   2. Set the MCP_SERVER_URL repository variable to the deployed endpoint (e.g.
//      https://swymble-mcp.<subdomain>.workers.dev/mcp). Not a secret — it is published here.
//   3. Re-run the deploy.
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { ROOT_DIR } from './lib/route-data.mjs';

const OUTPUT_DIR = path.join(ROOT_DIR, 'dist', '.well-known', 'mcp');
const OUTPUT_PATH = path.join(OUTPUT_DIR, 'server-card.json');

/** Mirrors the tool list in cloudflare/mcp-worker.js. */
const TOOLS = [
  'get_swymble_overview',
  'list_swymble_labs',
  'get_swymble_lab',
  'list_swymble_projects',
  'search_swymble_writing',
];

const run = async () => {
  const endpoint = process.env.MCP_SERVER_URL?.trim();

  if (!endpoint) {
    console.log('[mcp-card] MCP_SERVER_URL not set — no server card published (correct until the server is deployed).');
    return;
  }

  let parsed;

  try {
    parsed = new URL(endpoint);
  } catch {
    console.warn(`[mcp-card] MCP_SERVER_URL is not a valid URL (${endpoint}) — skipping.`);
    return;
  }

  // An MCP endpoint published over plaintext would have every client's traffic readable in
  // transit, and several clients refuse http:// outright. Better to publish nothing.
  if (parsed.protocol !== 'https:') {
    console.warn('[mcp-card] MCP_SERVER_URL must be https — skipping.');
    return;
  }

  const card = {
    $schema: 'https://modelcontextprotocol.io/schemas/2025-06-18/server-card.json',
    serverInfo: {
      name: 'swymble',
      version: '1.0.0',
      title: 'Swymble',
      description:
        'Read-only access to Swymble\'s public content: the studio overview, Swymble Labs products, client projects and blog posts.',
      websiteUrl: 'https://swymble.com',
    },
    transport: { type: 'streamable-http', endpoint: parsed.toString() },
    capabilities: { tools: { listChanged: false } },
    tools: TOOLS.map((name) => ({ name })),
    // Stated rather than implied: this server needs no credentials, which is also why the site
    // publishes no OAuth metadata. See docs/agent-readiness.md.
    authentication: { required: false },
  };

  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(card, null, 2)}\n`, 'utf8');
  console.log(`[mcp-card] Wrote ${path.relative(ROOT_DIR, OUTPUT_PATH)} → ${parsed.toString()}`);
};

run().catch((error) => {
  console.error('[mcp-card] Failed to generate server card:', error);
  process.exitCode = 1;
});
