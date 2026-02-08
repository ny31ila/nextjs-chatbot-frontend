'use client';

import { useState } from 'react';
import { useChatStore } from '@/store/use-chat-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { HelpCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface AppSettingsProps {
  onSave: () => void;
}

export function AppSettings({ onSave }: AppSettingsProps) {
  const { settings, updateSettings } = useChatStore();
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor);
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor);

  const handleSave = () => {
    updateSettings({ primaryColor, secondaryColor });
    onSave();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Appearance Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="primaryColor">Primary Color (Background)</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                This color will be used as the main background of the application.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-4 items-center">
            <Input
              id="primaryColor"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="w-12 h-12 p-1 rounded-md cursor-pointer"
            />
            <Input
              type="text"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="flex-1 font-mono"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="secondaryColor">Secondary Color (Text/Icons/Borders)</Label>
            <Tooltip>
              <TooltipTrigger>
                <HelpCircle size={14} className="text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                This color will be used for all text, icons, borders, and accent elements.
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="flex gap-4 items-center">
            <Input
              id="secondaryColor"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="w-12 h-12 p-1 rounded-md cursor-pointer"
            />
            <Input
              type="text"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="flex-1 font-mono"
            />
          </div>
        </div>

        <div className="mt-8 p-6 border rounded-lg space-y-4">
          <h3 className="font-semibold text-lg">Preview</h3>
          <div
            className="p-4 rounded-md border"
            style={{ backgroundColor: primaryColor, color: secondaryColor, borderColor: secondaryColor }}
          >
            <p>This is how your chat messages and UI will look.</p>
            <Button
              className="mt-2"
              style={{ backgroundColor: secondaryColor, color: primaryColor }}
            >
              Example Button
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSave} className="w-full">Save Appearance Settings</Button>
      </CardFooter>
    </Card>
  );
}
