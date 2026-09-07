import { CloseIcon } from "./icons";
import { InstallSection } from "./InstallSection";
import { Sheet } from "./Sheet";

export function InstallSheet({ onClose }: { onClose: () => void }) {
  return (
    <Sheet label="Install" onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-bold leading-tight text-foreground">Install TinyLog</p>
          <p className="text-xs text-muted-foreground">full screen, works offline, opens from the home screen</p>
        </div>
        <button type="button" aria-label="Close" onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>
      <InstallSection />
    </Sheet>
  );
}
