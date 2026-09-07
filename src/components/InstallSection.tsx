import { useInstall } from "@/store/install";
import { useT } from "@/i18n/index";
import { CheckIcon, ShareIcon } from "./icons";

/** How to get the app onto the home screen, per platform. */
export function InstallSection() {
  const state = useInstall();
  const { t } = useT();
  const box = "rounded-2xl border border-border bg-secondary/40 p-3 text-sm text-foreground";
  const steps = (intro: string, items: React.ReactNode[], note?: string) => (
    <div className={box}>
      <p className="mb-2 text-muted-foreground">{intro}</p>
      <ol className="list-decimal space-y-1 pl-5">
        {items.map((it, i) => (
          <li key={i}>{it}</li>
        ))}
      </ol>
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  );
  const share = <ShareIcon className="inline size-4 align-text-bottom" />;
  switch (state.kind) {
    case "installed":
      return (
        <p className={`${box} flex items-center gap-2`}>
          <CheckIcon className="size-5 text-primary" /> {t.install.installed}
        </p>
      );
    case "prompt":
      return (
        <button type="button" onClick={() => state.install()} className="surface-warm flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold active:scale-95">
          {t.install.install}
        </button>
      );
    case "ios-safari":
      return steps(t.install.iosIntro, [<>{share} {t.install.iosStep1}</>, t.install.iosStep2, t.install.iosStep3]);
    case "ios-other":
      return steps(t.install.iosOtherIntro, [t.install.iosOtherStep1, <>{share} {t.install.iosOtherStep2}</>, t.install.iosStep3], t.install.iosOtherNote);
    case "android-manual":
      return steps(t.install.androidIntro, [t.install.androidStep1, t.install.androidStep2], t.install.androidNote);
    case "mac-safari":
      return steps(t.install.macIntro, [t.install.macStep1, t.install.macStep2]);
    case "unsupported":
      return <p className={`${box} text-muted-foreground`}>{t.install.unsupported}</p>;
    default:
      return <p className={`${box} text-muted-foreground`}>{t.install.generic}</p>;
  }
}
