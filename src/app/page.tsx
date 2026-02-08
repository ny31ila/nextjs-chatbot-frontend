'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { ChatArea } from '@/components/layout/chat-area';
import { useChatStore } from '@/store/use-chat-store';
import { AppSettings } from '@/components/settings/app-settings';
import { SessionSettings } from '@/components/settings/session-settings';
import { LogsPage } from '@/components/settings/logs-page';

type ViewState = 'chat' | 'app-settings' | 'session-settings' | 'logs';

export default function Home() {
  const [view, setView] = useState<ViewState>('chat');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const { activeSessionId, setActiveSession } = useChatStore();

  const handleOpenAppSettings = () => {
    setView('app-settings');
  };

  const handleOpenLogs = () => {
    setView('logs');
  };

  const handleEditSession = (id: string) => {
    setEditingSessionId(id);
    setView('session-settings');
  };

  const handleCloseSettings = () => {
    setView('chat');
    setEditingSessionId(null);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        onOpenSettings={handleOpenAppSettings}
        onOpenLogs={handleOpenLogs}
        onEditSession={handleEditSession}
        onSelectSession={() => setView('chat')}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {view === 'chat' && <ChatArea />}
        {view === 'logs' && (
          <div className="flex-1 p-8 overflow-auto">
             <div className="max-w-4xl mx-auto h-full">
               <LogsPage />
             </div>
          </div>
        )}
        {view === 'app-settings' && (
          <div className="flex-1 p-8 overflow-auto">
             <div className="max-w-2xl mx-auto">
               <AppSettings onSave={handleCloseSettings} />
             </div>
          </div>
        )}
        {view === 'session-settings' && editingSessionId && (
          <div className="flex-1 p-8 overflow-auto">
             <div className="max-w-4xl mx-auto">
               <SessionSettings
                sessionId={editingSessionId}
                onSave={handleCloseSettings}
                onCancel={handleCloseSettings}
                onDelete={handleCloseSettings}
               />
             </div>
          </div>
        )}
      </main>
    </div>
  );
}
