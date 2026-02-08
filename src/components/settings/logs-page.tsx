'use client';

import { useChatStore, LogEntry } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Terminal, ChevronDown, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function LogsPage() {
  const { logs, clearLogs } = useChatStore();
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleLog = (id: string) => {
    setExpandedLogs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getLogColor = (type: LogEntry['type']) => {
    switch (type) {
      case 'error': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'request': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'response': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'info': return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
      default: return '';
    }
  };

  return (
    <Card className="w-full h-full flex flex-col overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b py-4">
        <div className="flex items-center gap-2">
            <Terminal size={20} />
            <CardTitle>System Logs</CardTitle>
        </div>
        <Button variant="outline" size="sm" onClick={clearLogs} className="gap-2">
            <Trash2 size={14} />
            Clear Logs
        </Button>
      </CardHeader>
      <CardContent className="flex-1 p-0 overflow-hidden">
        <ScrollArea className="h-[600px] w-full">
          <div className="p-4 space-y-2">
            {logs.length === 0 ? (
                <div className="text-center py-20 text-muted-foreground">
                    No logs yet. Start chatting to see activity here.
                </div>
            ) : (
                logs.map((log) => (
                    <div key={log.id} className={cn("border rounded-md overflow-hidden", getLogColor(log.type))}>
                        <div
                            className="p-3 flex items-center justify-between cursor-pointer hover:bg-black/5"
                            onClick={() => toggleLog(log.id)}
                        >
                            <div className="flex items-center gap-3 overflow-hidden">
                                {log.data ? (
                                    expandedLogs[log.id] ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                                ) : (
                                    <div className="w-[14px]" />
                                )}
                                <Badge variant="outline" className={cn("uppercase text-[10px]", getLogColor(log.type))}>
                                    {log.type}
                                </Badge>
                                <span className="text-sm font-mono truncate">{log.message}</span>
                            </div>
                            <span className="text-[10px] opacity-70 shrink-0">
                                {new Date(log.timestamp).toLocaleTimeString()}
                            </span>
                        </div>
                        {expandedLogs[log.id] && log.data && (
                            <div className="p-3 bg-black/10 border-t border-current/10 overflow-auto">
                                <pre className="text-xs font-mono">
                                    {JSON.stringify(log.data, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
