import { useInstall } from "@/store/install";
import { CheckIcon, ShareIcon } from "./icons";

/** How to get the app onto the home screen, per platform. */
export function InstallSection() {
  const state = useInstall();
  const box = "rounded-2xl border border-border bg-secondary/40 p-3 text-sm text-foreground";
  if (state.kind === "installed") {
    return (
      <p className={`${box} flex items-center gap-2`}>
        <CheckIcon className="size-5 text-primary" /> Installed on this device. Works offline.
      </p>
    );
  }
  if (state.kind === "prompt") {
    return (
      <button type="button" onClick={() => state.install()} className="surface-warm flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-bold active:scale-95">
        Install TinyLog
      </button>
    );
  }
  if (state.kind === "ios-safari") {
    return (
      <div className={box}>
        <p className="mb-2 text-muted-foreground">iPhones don't offer an install button. In Safari:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Tap <ShareIcon className="inline size-4 align-text-bottom" /> <b>Share</b> at the bottom of the screen
          </li>
          <li>
            Scroll the list and tap <b>More</b> (⋯) if you don't see it
          </li>
          <li>
            Choose <b>Add to Home Screen</b>, then <b>Add</b>
          </li>
        </ol>
      </div>
    );
  }
  if (state.kind === "ios-other") {
    return (
      <div className={box}>
        <p className="mb-2 text-muted-foreground">On an iPhone the app installs best from Safari:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Open this address in <b>Safari</b></li>
          <li>
            Tap <ShareIcon className="inline size-4 align-text-bottom" /> <b>Share</b>, then <b>More</b> (⋯) if needed
          </li>
          <li>
            Choose <b>Add to Home Screen</b>, then <b>Add</b>
          </li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Chrome on iPhone also has "Add to Home Screen" in its ⋯ menu, but it opens in Chrome rather than as an app.</p>
      </div>
    );
  }
  if (state.kind === "android-manual") {
    return (
      <div className={box}>
        <p className="mb-2 text-muted-foreground">In this browser:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Open the <b>⋮</b> menu
          </li>
          <li>
            Choose <b>Install</b> or <b>Add to Home screen</b>
          </li>
        </ol>
        <p className="mt-2 text-xs text-muted-foreground">Chrome on Android installs it as a full app with one tap.</p>
      </div>
    );
  }
  if (state.kind === "mac-safari") {
    return (
      <div className={box}>
        <p className="mb-2 text-muted-foreground">In Safari on a Mac:</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>
            Open the <b>File</b> menu
          </li>
          <li>
            Choose <b>Add to Dock</b>
          </li>
        </ol>
      </div>
    );
  }
  if (state.kind === "unsupported") {
    return (
      <p className={`${box} text-muted-foreground`}>
        Firefox can't install web apps on this device. Open this address in <b className="text-foreground">Chrome</b> or <b className="text-foreground">Edge</b> to install it, or keep using it here in a tab.
      </p>
    );
  }
  return (
    <p className={`${box} text-muted-foreground`}>
      Look for <b className="text-foreground">Install app</b> in your browser's menu, or the install icon in the address bar.
    </p>
  );
}
