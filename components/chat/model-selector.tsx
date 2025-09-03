import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

interface ModelSelectorProps {
  selectedModelId: string;
  onModelChange?: (modelId: string) => void;
}

const models = [
  { id: "gpt-5", name: "GPT-5" },
  { id: "gpt-5-mini", name: "GPT-5 Mini" },
  { id: "gpt-4.1", name: "GPT-4.1" },
];

export function ModelSelector({
  selectedModelId,
  onModelChange,
}: ModelSelectorProps) {
  const selectedModel =
    models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="justify-between min-w-[140px] bg-transparent"
          id="model-selector-trigger"
        >
          {selectedModel.name}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {models.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => onModelChange?.(model.id)}
            className={selectedModelId === model.id ? "bg-accent" : ""}
          >
            {model.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
