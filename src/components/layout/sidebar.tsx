'use client';

import { useChatStore, createDefaultSession } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Settings, MessageSquare, Pin, PinOff, Edit2, Bot, Terminal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  onOpenSettings: () => void;
  onOpenLogs: () => void;
  onEditSession: (id: string) => void;
  onSelectSession: () => void;
}

export function Sidebar({ onOpenSettings, onOpenLogs, onEditSession, onSelectSession }: SidebarProps) {
  const { sessions, activeSessionId, addSession, setActiveSession, updateSession } = useChatStore();

  const sortedSessions = [...sessions].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return 0;
  });

  const handleNewSession = () => {
    const newSession = createDefaultSession();
    addSession(newSession);
    setActiveSession(newSession.id);
    onSelectSession();
  };

  const togglePin = (e: React.MouseEvent, id: string, isPinned: boolean) => {
    e.stopPropagation();
    updateSession(id, { isPinned: !isPinned });
  };

  return (
    <div className="w-64 h-screen border-r flex flex-col bg-background">
      <div className="p-4 border-b flex items-center gap-2">
        <Bot size={20} className="shrink-0" />
        <h1 className="font-bold text-lg truncate">chatbot frontend</h1>
      </div>

      <div className="p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={handleNewSession}
              variant="outline"
              className="w-full justify-start gap-2 mb-2"
            >
              <Plus size={16} />
              New Chat Session
            </Button>
          </TooltipTrigger>
          <TooltipContent>Start a new chat session with a server</TooltipContent>
        </Tooltip>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1">
          {sortedSessions.map((session) => (
            <div
              key={session.id}
              onClick={() => {
                setActiveSession(session.id);
                onSelectSession();
              }}
              className={cn(
                "group flex items-center justify-between p-2 rounded-md cursor-pointer text-sm transition-colors",
                activeSessionId === session.id
                  ? "bg-secondary text-secondary-foreground"
                  : "hover:bg-secondary/50"
              )}
            >
              <div className="flex items-center gap-2 truncate flex-1">
                <MessageSquare size={14} className="shrink-0" />
                <span className="truncate">{session.name}</span>
              </div>

              <div className="flex items-center gap-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => togglePin(e, session.id, !!session.isPinned)}
                  className="p-2 hover:bg-current/20 rounded-md transition-colors"
                  title={session.isPinned ? "Unpin" : "Pin"}
                >
                  {session.isPinned ? <PinOff size={12} /> : <Pin size={12} />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditSession(session.id);
                  }}
                  className="p-2 hover:bg-current/20 rounded-md transition-colors"
                  title="Edit Session"
                >
                  <Edit2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4 border-t mt-auto space-y-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={onOpenLogs}
            >
              <Terminal size={16} />
              System Logs
            </Button>
          </TooltipTrigger>
          <TooltipContent>View HTTP and WebSocket activity logs</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2"
              onClick={onOpenSettings}
            >
              <Settings size={16} />
              Web App Settings
            </Button>
          </TooltipTrigger>
          <TooltipContent>Customize app colors and appearance</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
