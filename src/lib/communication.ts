import { BodyNode, ChatSession } from "@/store/use-chat-store";

/**
 * Converts the recursive BodyNode structure into a real JSON object.
 */
export function buildRequestBody(node: BodyNode, message: string): any {
  return transformNode(node, message);
}

function transformNode(node: BodyNode, message: string): any {
  switch (node.type) {
    case 'primitive':
      return node.isMessageSource ? message : node.value;
    case 'array':
      return node.items.map(n => transformNode(n, message));
    case 'object':
      const obj: any = {};
      node.properties.forEach(prop => {
        obj[prop.key] = transformNode(prop.value, message);
      });
      return obj;
  }
}

/**
 * Extracts the bot message from a response object based on the mapping.
 */
export function extractBotMessage(mapping: BodyNode, responseBody: any): string {
  let foundMessage = "";

  const findInNode = (node: BodyNode, data: any) => {
    if (data === undefined || data === null) return;

    if (node.type === 'primitive' && node.isMessageSource) {
      foundMessage = String(data);
    } else if (node.type === 'array' && Array.isArray(data)) {
      node.items.forEach((childNode, idx) => {
        findInNode(childNode, data[idx]);
      });
    } else if (node.type === 'object' && typeof data === 'object') {
      node.properties.forEach(prop => {
        findInNode(prop.value, data[prop.key]);
      });
    }
  };

  findInNode(mapping, responseBody);

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
    rawRequest: {
        url: session.url,
        method: session.method,
        headers: options.headers as Record<string, string>,
        body: body
    },
    rawResponse: responseData,
    extractedMessage: extractBotMessage(session.responseBodyMapping, responseData)
  };
}
