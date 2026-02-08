'use client';

import { useState, useEffect, useRef } from 'react';
import { useChatStore, Message } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Terminal, Wifi, WifiOff, HelpCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { sendHttpRequest, buildRequestBody, extractBotMessage } from '@/lib/communication';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export function ChatArea() {
  const { activeSessionId, sessions, addMessage, addLog } = useChatStore();
  const [input, setInput] = useState('');
  const [debugMode, setDebugMode] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [input]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.history, activeSessionId]);

  // Handle WebSocket Connection
  useEffect(() => {
    if (activeSession?.protocol === 'websocket' && activeSession.url) {
      if (wsRef.current) wsRef.current.close();

      try {
        const ws = new WebSocket(activeSession.url);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsConnected(true);
          addLog({ type: 'info', message: `WebSocket connected to ${activeSession.url}` });
        };
        ws.onclose = () => {
          setWsConnected(false);
          addLog({ type: 'info', message: `WebSocket disconnected from ${activeSession.url}` });
        };
        ws.onerror = () => {
            setWsConnected(false);
            toast.error("WebSocket connection error");
            addLog({ type: 'error', message: `WebSocket error at ${activeSession.url}` });
        };
        ws.onmessage = (event) => {
            let data;
            try {
                data = JSON.parse(event.data);
            } catch (e) {
                data = event.data;
            }

            const botMessage: Message = {
                id: crypto.randomUUID(),
                role: 'bot',
                content: extractBotMessage(activeSession.responseBodyMapping, data),
                timestamp: Date.now(),
                rawResponse: data
            };
            addMessage(activeSession.id, botMessage);
            addLog({ type: 'response', message: 'Received WebSocket message', data });
        };
      } catch (e) {
        console.error(e);
      }
    } else {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
        setWsConnected(false);
      }
    }

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [activeSessionId, activeSession?.protocol, activeSession?.url, addMessage]);

  const handleSend = async () => {
    if (!input.trim() || !activeSession) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      rawRequest: {
          url: activeSession.url,
          method: activeSession.method,
          headers: activeSession.headers.reduce((acc, h) => {
              if (h.key) acc[h.key] = h.value;
              return acc;
          }, {} as Record<string, string>),
          body: buildRequestBody(activeSession.requestBody, input)
      }
    };

    addMessage(activeSession.id, userMessage);
    setInput('');
    textareaRef.current?.focus();

    if (activeSession.protocol === 'http') {
      setIsLoading(true);
      addLog({ type: 'request', message: `HTTP ${activeSession.method} to ${activeSession.url}`, data: userMessage.rawRequest });
      try {
        const result = await sendHttpRequest(activeSession, input);
        addLog({ type: 'response', message: 'Received HTTP response', data: result.rawResponse });
        const botMessage: Message = {
          id: crypto.randomUUID(),
          role: 'bot',
          content: result.extractedMessage,
          timestamp: Date.now(),
          rawRequest: result.rawRequest,
          rawResponse: result.rawResponse,
        };
        addMessage(activeSession.id, botMessage);
      } catch (error: any) {
        toast.error(`Request failed: ${error.message}`);
        addLog({ type: 'error', message: `HTTP Request failed: ${error.message}` });
      } finally {
        setIsLoading(false);
      }
    } else if (activeSession.protocol === 'websocket') {
        if (wsRef.current && wsConnected) {
            const body = buildRequestBody(activeSession.requestBody, input);
            wsRef.current.send(JSON.stringify(body));
            addLog({ type: 'request', message: 'Sent WebSocket message', data: body });
            // We update the last message (user message) with rawRequest if needed,
            // but we already did that above.
        } else {
            toast.error("WebSocket is not connected");
        }
    }
  };

  if (!activeSession) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Select or create a chat session to start
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
      <header className="p-4 border-b flex justify-between items-center">
        <div className="flex items-center gap-2">
            <h2 className="font-semibold">{activeSession.name}</h2>
            {activeSession.protocol === 'websocket' && (
                wsConnected ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-red-500" />
            )}
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={debugMode ? "secondary" : "outline"}
              size="sm"
              onClick={() => setDebugMode(!debugMode)}
              className="gap-2"
            >
              <Terminal size={14} />
              Debug Mode
            </Button>
          </TooltipTrigger>
          <TooltipContent>Show raw JSON request and response data</TooltipContent>
        </Tooltip>
      </header>

      <ScrollArea className="flex-1 p-4 min-h-0">
        <div className="max-w-3xl mx-auto space-y-4">
          {activeSession.history.map((msg) => (
            <div
              key={msg.id}
              className={cn(
                "flex flex-col",
                msg.role === 'user' ? "items-end" : "items-start"
              )}
            >
              <div
                className={cn(
                  "max-w-[80%] p-3 rounded-lg border",
                  msg.role === 'user'
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-background text-foreground"
                )}
              >
                {debugMode ? (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center opacity-50">
                      <span className="text-[8px] font-bold uppercase tracking-widest">
                        {msg.role === 'user' ? 'Outgoing Request' : 'Incoming Response'}
                      </span>
                    </div>
                    <pre className="text-[10px] overflow-auto max-h-80 p-2 bg-black/5 rounded font-mono border border-primary/10">
                      {JSON.stringify(msg.role === 'user' ? msg.rawRequest : msg.rawResponse, null, 2)}
                    </pre>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert break-words">
                    {activeSession.isMarkdown ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {msg.content}
                        </ReactMarkdown>
                    ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] mt-1 opacity-50">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
               <div className="bg-background border p-3 rounded-lg animate-pulse">
                 Bot is thinking...
               </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <footer className="p-4 border-t">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={activeSession.protocol === 'websocket' && !wsConnected ? "WebSocket disconnected..." : "Type a message..."}
            className="flex-1 min-h-[40px] max-h-[120px] p-3 rounded-md border-2 border-input bg-background resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 text-base shadow-inner"
            disabled={isLoading || (activeSession.protocol === 'websocket' && !wsConnected)}
            rows={1}
          />
          <Button
            onClick={handleSend}
            size="icon"
            className="h-[40px] w-[40px] shrink-0"
            disabled={isLoading || (activeSession.protocol === 'websocket' && !wsConnected) || !input.trim()}
          >
            <Send size={18} />
          </Button>
        </div>
      </footer>
    </div>
  );
}
