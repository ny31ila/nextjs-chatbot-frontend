'use client';

import { BodyNode, KVItem, ArrayItem, ObjectItem } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Key, List, Package, HelpCircle, Circle, CircleDot } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface BodyBuilderProps {
  nodes: BodyNode[];
  onChange: (nodes: BodyNode[]) => void;
  title: string;
  isResponse?: boolean;
}

export function BodyBuilder({ nodes, onChange, title, isResponse }: BodyBuilderProps) {
  const addNode = (type: 'kv' | 'array' | 'object', parentNodes: BodyNode[], setParentNodes: (n: BodyNode[]) => void) => {
    const newNode: BodyNode =
      type === 'kv' ? { id: crypto.randomUUID(), type: 'kv', key: '', value: '', isMessageSource: false } :
      type === 'array' ? { id: crypto.randomUUID(), type: 'array', items: [] } :
      { id: crypto.randomUUID(), type: 'object', items: [] };

    setParentNodes([...parentNodes, newNode]);
  };

  const removeNode = (id: string, parentNodes: BodyNode[], setParentNodes: (n: BodyNode[]) => void) => {
    setParentNodes(parentNodes.filter(n => n.id !== id));
  };

  const updateNode = (id: string, updates: Partial<BodyNode>, parentNodes: BodyNode[], setParentNodes: (n: BodyNode[]) => void) => {
    setParentNodes(parentNodes.map(n => n.id === id ? { ...n, ...updates } as BodyNode : n));
  };

  const setMessageSource = (id: string, parentNodes: BodyNode[], setParentNodes: (n: BodyNode[]) => void) => {
    // Deeply reset all other isMessageSource to false
    const resetSource = (nodes: BodyNode[]): BodyNode[] => {
      return nodes.map(n => {
        if (n.type === 'kv') return { ...n, isMessageSource: n.id === id };
        if (n.type === 'array') return { ...n, items: resetSource(n.items) };
        if (n.type === 'object') return { ...n, items: n.items.map(item => ({ ...item, value: resetSource([item.value])[0] })) };
        return n;
      });
    };

    // We actually need to reset it globally for the whole body, not just local parentNodes
    // So this function should probably be called on the root nodes
    if (parentNodes === nodes) {
        onChange(resetSource(nodes));
    } else {
        // If not root, we need a way to reach root.
        // For simplicity, let's just make it a global reset in the main component.
    }
  };

  const renderNode = (node: BodyNode, currentNodes: BodyNode[], setCurrentNodes: (n: BodyNode[]) => void) => {
    switch (node.type) {
      case 'kv':
        return (
          <div key={node.id} className="flex gap-2 items-center mb-2">
            <button
                onClick={() => {
                    // Global reset for message source
                    const resetSource = (ns: BodyNode[]): BodyNode[] => ns.map(n => {
                        if (n.type === 'kv') return { ...n, isMessageSource: n.id === node.id };
                        if (n.type === 'array') return { ...n, items: resetSource(n.items) };
                        if (n.type === 'object') return { ...n, items: n.items.map(i => ({ ...i, value: resetSource([i.value])[0] })) };
                        return n;
                    });
                    onChange(resetSource(nodes));
                }}
                className="shrink-0"
            >
                {node.isMessageSource ? <CircleDot size={16} className="text-primary" /> : <Circle size={16} />}
            </button>
            <Input
              placeholder="Key"
              value={node.key}
              onChange={(e) => updateNode(node.id, { key: e.target.value }, currentNodes, setCurrentNodes)}
              className="w-1/3 h-8 text-xs"
            />
            <Input
              placeholder={node.isMessageSource ? (isResponse ? "Mapped to Response" : "Mapped to Message") : "Value"}
              value={node.value}
              disabled={node.isMessageSource}
              onChange={(e) => updateNode(node.id, { value: e.target.value }, currentNodes, setCurrentNodes)}
              className="flex-1 h-8 text-xs"
            />
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeNode(node.id, currentNodes, setCurrentNodes)}>
              <Trash2 size={14} />
            </Button>
          </div>
        );
      case 'array':
        return (
          <div key={node.id} className="border-l-2 pl-4 mb-4 mt-2 py-2">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold flex items-center gap-1"><List size={12}/> Array</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeNode(node.id, currentNodes, setCurrentNodes)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {renderNodes(node.items, (newItems) => updateNode(node.id, { items: newItems }, currentNodes, setCurrentNodes))}
          </div>
        );
      case 'object':
        return (
          <div key={node.id} className="border-l-2 pl-4 mb-4 mt-2 py-2">
             <div className="flex justify-between items-center mb-2">
              <span className="text-xs font-semibold flex items-center gap-1"><Package size={12}/> Object</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeNode(node.id, currentNodes, setCurrentNodes)}>
                <Trash2 size={12} />
              </Button>
            </div>
            {renderObjectItems(node.items, (newItems) => updateNode(node.id, { items: newItems }, currentNodes, setCurrentNodes))}
          </div>
        );
    }
  };

  const renderNodes = (currentNodes: BodyNode[], setCurrentNodes: (n: BodyNode[]) => void) => (
    <div className="space-y-1">
      {currentNodes.map(node => renderNode(node, currentNodes, setCurrentNodes))}
      <div className="flex gap-2 mt-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => addNode('kv', currentNodes, setCurrentNodes)} className="h-7 text-[10px] gap-1">
              <Key size={10} /> KV
            </Button>
          </TooltipTrigger>
          <TooltipContent>Key-Value</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => addNode('array', currentNodes, setCurrentNodes)} className="h-7 text-[10px] gap-1">
              <List size={10} /> Array
            </Button>
          </TooltipTrigger>
          <TooltipContent>Array (List)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => addNode('object', currentNodes, setCurrentNodes)} className="h-7 text-[10px] gap-1">
              <Package size={10} /> Object
            </Button>
          </TooltipTrigger>
          <TooltipContent>Object</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  const renderObjectItems = (items: { key: string; value: BodyNode }[], setParentItems: (items: { key: string; value: BodyNode }[]) => void) => (
      <div className="space-y-1">
          {items.map((item, idx) => (
              <div key={idx} className="flex flex-col gap-1 mb-2 border p-2 rounded bg-black/5">
                  <div className="flex gap-2 items-center">
                    <Input
                        placeholder="Key Name"
                        value={item.key}
                        onChange={(e) => setParentItems(items.map((it, i) => i === idx ? { ...it, key: e.target.value } : it))}
                        className="h-7 text-xs w-1/3"
                    />
                    <div className="flex-1"></div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setParentItems(items.filter((_, i) => i !== idx))}>
                        <Trash2 size={12} />
                    </Button>
                  </div>
                  <div className="pl-4 border-l">
                    {renderNode(item.value, [item.value], (nodes) => setParentItems(items.map((it, i) => i === idx ? { ...it, value: nodes[0] } : it)))}
                  </div>
              </div>
          ))}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" size="sm" onClick={() => {
                const newNode: BodyNode = { id: crypto.randomUUID(), type: 'kv', key: '', value: '', isMessageSource: false };
                setParentItems([...items, { key: '', value: newNode }]);
            }} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Property
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
                const newNode: BodyNode = { id: crypto.randomUUID(), type: 'array', items: [] };
                setParentItems([...items, { key: '', value: newNode }]);
            }} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Array Property
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
                const newNode: BodyNode = { id: crypto.randomUUID(), type: 'object', items: [] };
                setParentItems([...items, { key: '', value: newNode }]);
            }} className="h-7 text-[10px] gap-1">
                <Plus size={10} /> Add Object Property
            </Button>
          </div>
      </div>
  )

  return (
    <div className="space-y-4 border p-4 rounded-lg">
      <div className="flex items-center gap-2">
        <h3 className="font-semibold">{title}</h3>
        <Tooltip>
          <TooltipTrigger>
            <HelpCircle size={14} className="text-muted-foreground" />
          </TooltipTrigger>
          <TooltipContent className="max-w-xs">
            {isResponse
              ? "Define the expected response structure and select which key contains the bot's message text using the radio button."
              : "Build your request body. Use the radio button to select which key-value pair will contain the user's message text."}
          </TooltipContent>
        </Tooltip>
      </div>
      {renderNodes(nodes, onChange)}
    </div>
  );
}
