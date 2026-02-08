'use client';

import { BodyNode, PrimitiveNode, ArrayNode, ObjectNode, Property } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Key, List, Package, HelpCircle, Circle, CircleDot, Type } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface BodyBuilderProps {
  node: BodyNode;
  onChange: (node: BodyNode) => void;
  title: string;
  isResponse?: boolean;
}

export function BodyBuilder({ node, onChange, title, isResponse }: BodyBuilderProps) {

  // Global function to set message source
  const setMessageSource = (targetId: string) => {
    const resetSource = (n: BodyNode): BodyNode => {
      if (n.type === 'primitive') {
        return { ...n, isMessageSource: n.id === targetId };
      }
      if (n.type === 'array') {
        return { ...n, items: n.items.map(resetSource) };
      }
      if (n.type === 'object') {
        return { ...n, properties: n.properties.map(p => ({ ...p, value: resetSource(p.value) })) };
      }
      return n;
    };
    onChange(resetSource(node));
  };

  return (
    <div className="space-y-4 border p-4 rounded-lg bg-background">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold text-sm uppercase tracking-wider">{title}</h3>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle size={14} className="text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {isResponse
              ? "Define the expected response structure and select which key contains the bot's message text using the radio button."
              : "Build your request body. Use the radio button to select which value will contain the user's message text."}
          </TooltipContent>
        </Tooltip>
      </div>

      <div className="pl-2 border-l-2">
        <ValueNode
          node={node}
          onChange={onChange}
          onSetMessageSource={setMessageSource}
          isResponse={isResponse}
        />
      </div>
    </div>
  );
}

interface NodeProps {
  node: BodyNode;
  onChange: (node: BodyNode) => void;
  onSetMessageSource: (id: string) => void;
  isResponse?: boolean;
}

function ValueNode({ node, onChange, onSetMessageSource, isResponse }: NodeProps) {
  switch (node.type) {
    case 'primitive':
      return (
        <div className="flex gap-2 items-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSetMessageSource(node.id)}
                className="shrink-0 transition-colors"
              >
                {node.isMessageSource ? <CircleDot size={16} className="text-primary" /> : <Circle size={16} className="opacity-50 hover:opacity-100" />}
              </button>
            </TooltipTrigger>
            <TooltipContent>{isResponse ? "Map to bot response" : "Map to user message"}</TooltipContent>
          </Tooltip>
          <Input
            placeholder={node.isMessageSource ? (isResponse ? "Response content goes here" : "Message content goes here") : "Value"}
            value={node.value}
            disabled={node.isMessageSource}
            onChange={(e) => onChange({ ...node, value: e.target.value })}
            className="h-8 text-xs font-mono"
          />
        </div>
      );

    case 'array':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
            <List size={12} /> Array
          </div>
          <div className="space-y-2 pl-4 border-l">
            {node.items.map((item, idx) => (
              <div key={item.id} className="flex gap-2 items-start">
                <div className="flex-1">
                  <ValueNode
                    node={item}
                    onChange={(newNode) => {
                      const newItems = [...node.items];
                      newItems[idx] = newNode;
                      onChange({ ...node, items: newItems });
                    }}
                    onSetMessageSource={onSetMessageSource}
                    isResponse={isResponse}
                  />
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => onChange({ ...node, items: node.items.filter(i => i.id !== item.id) })}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => onChange({ ...node, items: [...node.items, createDefaultNode('primitive')] })} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Value
              </Button>
              <Button variant="outline" size="sm" onClick={() => onChange({ ...node, items: [...node.items, createDefaultNode('array')] })} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Array
              </Button>
              <Button variant="outline" size="sm" onClick={() => onChange({ ...node, items: [...node.items, createDefaultNode('object')] })} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Object
              </Button>
            </div>
          </div>
        </div>
      );

    case 'object':
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
            <Package size={12} /> Object
          </div>
          <div className="space-y-4 pl-4 border-l">
            {node.properties.map((prop, idx) => (
              <div key={prop.id} className="space-y-1">
                <div className="flex gap-2 items-center">
                  <Input
                    placeholder="Key"
                    value={prop.key}
                    onChange={(e) => {
                      const newProps = [...node.properties];
                      newProps[idx] = { ...prop, key: e.target.value };
                      onChange({ ...node, properties: newProps });
                    }}
                    className="h-8 text-xs font-bold w-1/3"
                  />
                  <div className="flex-1"></div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => onChange({ ...node, properties: node.properties.filter(p => p.id !== prop.id) })}
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
                <div className="pl-4 border-l-2 border-dashed">
                  <ValueNode
                    node={prop.value}
                    onChange={(newValue) => {
                      const newProps = [...node.properties];
                      newProps[idx] = { ...prop, value: newValue };
                      onChange({ ...node, properties: newProps });
                    }}
                    onSetMessageSource={onSetMessageSource}
                    isResponse={isResponse}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => onChange({ ...node, properties: [...node.properties, createDefaultProperty('primitive')] })} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Property
              </Button>
              <Button variant="outline" size="sm" onClick={() => onChange({ ...node, properties: [...node.properties, createDefaultProperty('array')] })} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Array Property
              </Button>
              <Button variant="outline" size="sm" onClick={() => onChange({ ...node, properties: [...node.properties, createDefaultProperty('object')] })} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Object Property
              </Button>
            </div>
          </div>
        </div>
      );
  }
}

function createDefaultNode(type: BodyNode['type']): BodyNode {
  const id = crypto.randomUUID();
  switch (type) {
    case 'primitive': return { id, type: 'primitive', value: '', isMessageSource: false };
    case 'array': return { id, type: 'array', items: [] };
    case 'object': return { id, type: 'object', properties: [] };
  }
}

function createDefaultProperty(valueType: BodyNode['type']): Property {
  return {
    id: crypto.randomUUID(),
    key: '',
    value: createDefaultNode(valueType)
  };
}
