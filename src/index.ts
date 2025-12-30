#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import type { ToolConfig } from './types.js';
import { handleErrorResult, handleSuccessResult, logger } from './utils/index.js';
import { WebSocketClientTransport } from './transports/websocket.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Lấy WebSocket URL và token từ environment variables
const XIAOZHI_WS_URL = process.env.XIAOZHI_WS_URL || 'wss://api.xiaozhi.me/mcp/';
const XIAOZHI_TOKEN = process.env.XIAOZHI_TOKEN || 'eyJhbGciOiJFUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjY5MjYzMiwiYWdlbnRJZCI6MTE0ODM1NywiZW5kcG9pbnRJZCI6ImFnZW50XzExNDgzNTciLCJwdXJwb3NlIjoibWNwLWVuZHBvaW50IiwiaWF0IjoxNzY3MDcwMzUxLCJleHAiOjE3OTg2Mjc5NTF9.8bW9DmY5cDf5ug7PREMUThk7vhh2OYe9qVIB2b3Fl7dZTlyFxoIGu9JhQw_jOf-HZCr97jClktB1b3y9yKminA';
const wsUrl = `${XIAOZHI_WS_URL}?token=${XIAOZHI_TOKEN}`;

async function loadToolConfigurations() {
  const toolsDir = path.join(__dirname, 'tools');
  const toolFiles = fs.readdirSync(toolsDir).filter(file => file.endsWith('.js') || file.endsWith('.ts'));
  
  const toolPromises = toolFiles.map(async (file) => {
    try {
      const toolPath = path.join(toolsDir, file);
      const toolModule = await import(toolPath);
      return toolModule.default;
    } catch (error) {
      logger.error(`Failed to load tool from ${file}: ${error}`);
      return null;
    }
  });

  const validTools = (await Promise.all(toolPromises)).filter((tool): tool is ToolConfig => !!tool);
  const toolConfigMap = new Map(validTools.map((tool) => [tool.name, tool]));

  return {
    toolConfigMap,
    validTools,
  };
}

const mcpServer = new Server(
  {
    name: 'VN News Hub',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
      logging: {},
    },
  },
);

(async () => {
  try {
    const { toolConfigMap, validTools } = await loadToolConfigurations();

    logger.info(`✅ Loaded ${validTools.length} tools:`);
    validTools.forEach(tool => {
      logger.info(`  - ${tool.name}: ${tool.description.substring(0, 50)}...`);
    });

    // Handle tool list requests
    mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      logger.info('📋 Tool list requested');
      const tools = validTools.map((tool) => {
        const { name, description, zodSchema = z.object({}) } = tool;
        // Cast to any to avoid deep type instantiation
        const schema: any = zodToJsonSchema(zodSchema);
        return {
          name,
          description,
          inputSchema: schema,
        };
      });
      return { tools };
    });

    // Handle tool call requests
    mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        logger.info(`🔧 Tool called: ${request.params.name}`);
        const tool = toolConfigMap.get(request.params.name);
        if (!tool) {
          throw new Error(`Tool not found: ${request.params.name}`);
        }
        const result = await tool.func(request.params.arguments ?? {});
        logger.info(`✅ Tool ${request.params.name} returned ${result.length} items`);
        return handleSuccessResult(result, request.params.name);
      } catch (error) {
        logger.error(`❌ Tool ${request.params.name} failed: ${error}`);
        return handleErrorResult(error);
      }
    });

    // Kết nối tới Xiaozhi API qua WebSocket
    logger.info(`🔌 Connecting to Xiaozhi API at: ${XIAOZHI_WS_URL}`);
    logger.info(`🎫 Using token: ${XIAOZHI_TOKEN.substring(0, 50)}...`);
    const transport = new WebSocketClientTransport(wsUrl);
    await transport.start();
    await mcpServer.connect(transport);
    
    logger.info('🎉 VN News MCP Server connected to Xiaozhi API successfully');
    logger.info(`📡 Server is now listening for requests with ${validTools.length} tools available`);
    
    // Keep the process alive
    process.on('SIGINT', async () => {
      logger.info('Shutting down...');
      await transport.close();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down...');
      await transport.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start MCP server');
    logger.error(error);
    process.exit(1);
  }
})();
