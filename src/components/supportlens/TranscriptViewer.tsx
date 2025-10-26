import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TranscriptViewerProps {
  text: string;
}

export const TranscriptViewer = ({ text }: TranscriptViewerProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm.trim()) return text;

    const regex = new RegExp(`(${searchTerm})`, "gi");
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-warning/30 text-foreground rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transcript..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
          aria-label="Search transcript"
        />
      </div>

      <ScrollArea className="h-[400px] rounded-xl border bg-card p-6">
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {highlightText(text, searchTerm)}
        </p>
      </ScrollArea>
    </div>
  );
};
