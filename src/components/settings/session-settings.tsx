'use client';

import { useState } from 'react';
import { useChatStore, ChatSession, BodyNode } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Trash2, Plus, AlertCircle, HelpCircle } from 'lucide-react';
import { BodyBuilder } from './body-builder';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SessionSettingsProps {
  sessionId: string;
  onSave: () => void;
  onCancel: () => void;
  onDelete: () => void;
}

export function SessionSettings({ sessionId, onSave, onCancel, onDelete }: SessionSettingsProps) {
  const { sessions, updateSession, deleteSession } = useChatStore();
  const session = sessions.find(s => s.id === sessionId);

  const [formData, setFormData] = useState<ChatSession | null>(session ? { ...session } : null);

  if (!formData) return <div>Session not found</div>;

  const handleSave = () => {
    updateSession(sessionId, formData);
    onSave();
  };

  const addHeader = () => {
    setFormData({
      ...formData,
      headers: [...formData.headers, { id: crypto.randomUUID(), key: '', value: '' }]
    });
  };

  const updateHeader = (id: string, key: string, value: string) => {
    setFormData({
      ...formData,
      headers: formData.headers.map(h => h.id === id ? { ...h, key, value } : h)
    });
  };

  const removeHeader = (id: string) => {
    setFormData({
      ...formData,
      headers: formData.headers.filter(h => h.id !== id)
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Session Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="name">Chat Session Name</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle size={12} className="text-muted-foreground"/></TooltipTrigger>
                  <TooltipContent>Display name for this session in the sidebar</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="url">Chat Session URL</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle size={12} className="text-muted-foreground"/></TooltipTrigger>
                  <TooltipContent>The endpoint URL of your chatbot server (HTTP or WS)</TooltipContent>
                </Tooltip>
              </div>
              <Input
                id="url"
                placeholder="https://api.example.com/chat"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-1">
                <Label htmlFor="protocol">Protocol</Label>
                <Tooltip>
                  <TooltipTrigger><HelpCircle size={12} className="text-muted-foreground"/></TooltipTrigger>
                  <TooltipContent>Choose between standard HTTP requests or persistent WebSockets</TooltipContent>
                </Tooltip>
              </div>
              <Select
                value={formData.protocol}
                onValueChange={(val: 'http' | 'websocket') => setFormData({ ...formData, protocol: val })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select protocol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="websocket">WebSocket</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.protocol === 'http' && (
              <div className="space-y-2">
                <Label htmlFor="method">Method</Label>
                <Select
                  value={formData.method}
                  onValueChange={(val: 'GET' | 'POST') => setFormData({ ...formData, method: val })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Request</span>
        <Separator className="flex-1" />
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-semibold uppercase">Headers</CardTitle>
            <Tooltip>
                <TooltipTrigger><HelpCircle size={12} className="text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>Custom HTTP headers to send with each request</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {formData.headers.map((header) => (
            <div key={header.id} className="flex gap-2">
              <Input
                placeholder="Key"
                value={header.key}
                onChange={(e) => updateHeader(header.id, e.target.value, header.value)}
                className="w-1/3"
                disabled={['Authorization', 'Accept', 'Accept-Encoding', 'Connection'].includes(header.key) && header.id.length < 5}
              />
              <Input
                placeholder="Value"
                value={header.value}
                onChange={(e) => updateHeader(header.id, header.key, e.target.value)}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => removeHeader(header.id)}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addHeader} className="mt-2">
            <Plus size={14} className="mr-2" /> Add New Header
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-1">
            <CardTitle className="text-sm font-semibold uppercase">Cookies</CardTitle>
            <Tooltip>
                <TooltipTrigger><HelpCircle size={12} className="text-muted-foreground"/></TooltipTrigger>
                <TooltipContent>Manually specify cookies to be sent in the &apos;Cookie&apos; header</TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {formData.cookies?.map((cookie) => (
            <div key={cookie.id} className="flex gap-2">
              <Input
                placeholder="Cookie Name"
                value={cookie.key}
                onChange={(e) => setFormData({
                    ...formData,
                    cookies: formData.cookies.map(c => c.id === cookie.id ? { ...c, key: e.target.value } : c)
                })}
                className="w-1/3"
              />
              <Input
                placeholder="Value"
                value={cookie.value}
                onChange={(e) => setFormData({
                    ...formData,
                    cookies: formData.cookies.map(c => c.id === cookie.id ? { ...c, value: e.target.value } : c)
                })}
                className="flex-1"
              />
              <Button variant="ghost" size="icon" onClick={() => setFormData({
                  ...formData,
                  cookies: formData.cookies.filter(c => c.id !== cookie.id)
              })}>
                <Trash2 size={16} />
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={() => setFormData({
              ...formData,
              cookies: [...(formData.cookies || []), { id: crypto.randomUUID(), key: '', value: '' }]
          })} className="mt-2">
            <Plus size={14} className="mr-2" /> Add New Cookie
          </Button>
        </CardContent>
      </Card>

      <BodyBuilder
        title="Body"
        node={formData.requestBody}
        onChange={(node) => setFormData({ ...formData, requestBody: node as BodyNode })}
      />

      <div className="flex items-center gap-4">
        <Separator className="flex-1" />
        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Response</span>
        <Separator className="flex-1" />
      </div>

      <BodyBuilder
        title="Response Mapping"
        node={formData.responseBodyMapping}
        onChange={(node) => setFormData({ ...formData, responseBodyMapping: node as BodyNode })}
        isResponse
      />

      <div className="flex items-center space-x-2">
        <Checkbox
          id="markdown"
          checked={formData.isMarkdown}
          onCheckedChange={(checked) => setFormData({ ...formData, isMarkdown: !!checked })}
        />
        <Label htmlFor="markdown" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          Response is in markdown format?
        </Label>
      </div>

      <div className="flex gap-4 pt-4">
        <Button onClick={handleSave} className="flex-1">Save Settings</Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="gap-2">
              <Trash2 size={16} />
              Delete Session
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the chat session &quot;{formData.name}&quot; and all its history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => { deleteSession(sessionId); onDelete(); }}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
