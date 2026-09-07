import { useT } from "@/i18n/index";
import { CloseIcon } from "./icons";
import { InstallSection } from "./InstallSection";
import { Sheet } from "./Sheet";

export function InstallSheet({ onClose }: { onClose: () => void }) {
  const { t } = useT();
  return (
    <Sheet label={t.home.installTitle} onClose={onClose}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-display text-xl font-bold leading-tight text-foreground">{t.home.installTitle}</p>
          <p className="text-xs text-muted-foreground">{t.home.installSub}</p>
        </div>
        <button type="button" aria-label={t.capture.close} onClick={onClose} className="flex size-11 items-center justify-center rounded-2xl border border-border bg-secondary/60 text-foreground active:scale-95">
          <CloseIcon className="size-5" />
        </button>
      </div>
      <InstallSection />
    </Sheet>
  );
}
