import { BodyNode, ChatSession } from "@/store/use-chat-store";

/**
 * Converts the recursive BodyNode structure into a real JSON object.
 * Replaces the 'isMessageSource' node value with the actual user message.
 */
export function buildRequestBody(nodes: BodyNode[], message: string): any {
  // If there's only one top-level node and it's an object/array, we might want to return it directly.
  // But let's assume the root is an array of items that could be combined.
  // Usually, a request body is a single object or array.

  if (nodes.length === 1) {
    return transformNode(nodes[0], message);
  }

  // If multiple nodes, we'll try to merge them if they are objects, or return as array.
  const transformed = nodes.map(n => transformNode(n, message));
  return transformed.length > 1 ? transformed : transformed[0];
}

function transformNode(node: BodyNode, message: string): any {
  switch (node.type) {
    case 'kv':
      return node.isMessageSource ? message : node.value;
    case 'array':
      return node.items.map(n => transformNode(n, message));
    case 'object':
      const obj: any = {};
      node.items.forEach(item => {
        obj[item.key] = transformNode(item.value, message);
      });
      return obj;
  }
}

/**
 * Extracts the bot message from a response object based on the mapping.
 */
export function extractBotMessage(mapping: BodyNode[], responseBody: any): string {
  if (mapping.length === 0) return typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);

  let foundMessage = "";

  const findInNode = (node: BodyNode, data: any) => {
    if (!data) return;

    if (node.type === 'kv' && node.isMessageSource) {
      foundMessage = data;
    } else if (node.type === 'array' && Array.isArray(data)) {
      node.items.forEach((childNode, idx) => {
        findInNode(childNode, data[idx]);
      });
    } else if (node.type === 'object' && typeof data === 'object') {
      node.items.forEach(item => {
        findInNode(item.value, data[item.key]);
      });
    }
  };

  mapping.forEach(m => findInNode(m, responseBody));

  return foundMessage || (typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody));
}

export async function sendHttpRequest(session: ChatSession, message: string) {
  const body = buildRequestBody(session.requestBody, message);
  const headers: Record<string, string> = {};
  session.headers.forEach(h => {
    if (h.key) headers[h.key] = h.value;
  });

  if (session.cookies && session.cookies.length > 0) {
    const cookieString = session.cookies
      .filter(c => c.key && c.value)
      .map(c => `${c.key}=${c.value}`)
      .join('; ');
    if (cookieString) {
      headers['Cookie'] = cookieString;
    }
  }

  const options: RequestInit = {
    method: session.method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
  };

  if (session.method === 'POST') {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(session.url, options);
  const responseData = await response.json();

  return {
    rawRequest: body,
    rawResponse: responseData,
    extractedMessage: extractBotMessage(session.responseBodyMapping, responseData)
  };
}

// WebSocket Manager
const wsConnections: Record<string, WebSocket> = {};

export function getWebSocket(session: ChatSession, onMessage: (data: any) => void) {
    if (wsConnections[session.id]) {
        return wsConnections[session.id];
    }

    const ws = new WebSocket(session.url);

    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            onMessage(data);
        } catch (e) {
            onMessage(event.data);
        }
    };

    wsConnections[session.id] = ws;
    return ws;
}

export function sendWebSocketMessage(session: ChatSession, message: string) {
    const ws = wsConnections[session.id];
    if (ws && ws.readyState === WebSocket.OPEN) {
        const body = buildRequestBody(session.requestBody, message);
        ws.send(JSON.stringify(body));
        return body;
    }
    return null;
}
