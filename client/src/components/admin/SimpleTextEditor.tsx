import React from 'react';
import { Textarea } from '@/components/ui/textarea';

interface SimpleTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  rows?: number;
}

export function SimpleTextEditor({ 
  content, 
  onChange, 
  editable = true,
  placeholder = "Type here...",
  className = "",
  rows = 6
}: SimpleTextEditorProps) {
  return (
    <Textarea
      value={content}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={!editable}
      className={className}
    />
  );
}

// Also export as RichTextEditor for backward compatibility
export const RichTextEditor = SimpleTextEditor;