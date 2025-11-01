import { X } from "lucide-react";

interface ExamplesModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "voice" | "action";
  onSelect: (value: string) => void;
}

const VOICE_EXAMPLES = [
  "Deep male voice",
  "High-pitched female voice",
  "Excited puppy voice",
  "Calm and gentle voice",
  "Grumpy old dog voice",
  "Energetic and playful voice",
  "Wise and mature voice",
  "Squeaky and enthusiastic voice",
  "Smooth and confident voice",
  "Shy and timid voice",
  "Booming and authoritative voice",
  "Sweet and loving voice",
  "Sarcastic and witty voice",
  "Cheerful and bubbly voice",
  "Raspy and tough voice",
];

const ACTION_EXAMPLES = [
  "wags tail excitedly",
  "tilts head curiously",
  "sits up attentively",
  "jumps up and down",
  "looks directly at the camera",
  "turns head side to side",
  "gives a playful bark",
  "licks the air",
  "spins in a circle",
  "raises one paw",
  "runs toward the camera",
  "lies down and relaxes",
  "perks up ears",
  "does a play bow",
  "catches a treat",
];

export default function ExamplesModal({ isOpen, onClose, type, onSelect }: ExamplesModalProps) {
  if (!isOpen) return null;

  const examples = type === "voice" ? VOICE_EXAMPLES : ACTION_EXAMPLES;
  const title = type === "voice" ? "Voice Style Examples" : "Action Examples";
  const description = type === "voice"
    ? "Click any example to use it, or use it as inspiration for your own custom voice style."
    : "Click any example to use it, or use it as inspiration for your own custom action.";

  const handleSelect = (example: string) => {
    onSelect(example);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-background border border-border rounded-lg shadow-lg w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="text-xl font-bold text-foreground">{title}</h2>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Examples Grid */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => handleSelect(example)}
                className="text-left px-4 py-3 rounded-lg border border-border bg-card hover:bg-accent hover:border-primary transition-all duration-200 text-sm font-medium text-foreground"
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/30">
          <p className="text-xs text-muted-foreground text-center">
            You can also type your own custom {type === "voice" ? "voice style" : "action"} in the input field
          </p>
        </div>
      </div>
    </div>
  );
}
