import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { ModelSelector } from "./model-selector";

interface ChatHeaderProps {
  modelId: string;
  onModelChange?: (modelId: string) => void;
  onReset: () => void;
  isLoading: boolean;
  isMobile?: boolean;
  customModelId?: string;
  customModels?: Array<{ id: string; name: string }>;
  onToggleSteps?: () => void; // deprecated
  stepsOpen?: boolean; // deprecated
  minSimilarity?: number;
  onMinSimilarityChange?: (value: number) => void;
}

export function ChatHeader({
  modelId,
  onModelChange,
  onReset,
  isLoading,
  isMobile = false,
  onToggleSteps,
  stepsOpen,
  minSimilarity,
  onMinSimilarityChange,
}: ChatHeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background px-4 py-2">
      <div
        className={`flex items-center gap-2 ${
          isMobile ? "flex-col items-start" : "flex-row"
        }`}
      >
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 bg-transparent"
            onClick={onReset}
            disabled={isLoading}
          >
            <Plus className="h-4 w-4" />
          </Button>

          {/* Model selector section */}
          <div
            className={`flex ${
              isMobile ? "flex-col items-start" : "items-center"
            } gap-2`}
          >
            <p className="text-lg">AI Model: </p>
            <ModelSelector
              selectedModelId={modelId}
              onModelChange={onModelChange}
            />
            <div className="flex items-center gap-2 ml-2">
              <span className="text-sm text-muted-foreground">
                Min similarity
              </span>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="0.99"
                value={typeof minSimilarity === "number" ? minSimilarity : 0.3}
                onChange={(e) =>
                  onMinSimilarityChange?.(Number(e.target.value))
                }
                className="h-8 w-24"
              />
            </div>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2" />
      <div className="flex items-center gap-2 pr-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSteps}
          className="bg-transparent"
          title="Toggle process steps"
        >
          {stepsOpen ? (
            <>
              <ToggleRight className="h-4 w-4 mr-1" />
              Hide steps
            </>
          ) : (
            <>
              <ToggleLeft className="h-4 w-4 mr-1" />
              Show steps
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
