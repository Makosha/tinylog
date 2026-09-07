import { useState } from "react";
import { Field } from "@/components/Field";
import { HeartIcon } from "@/components/icons";
import { feedbackConfigured, sendFeedback } from "@/feedback";
import { fill, useT } from "@/i18n/index";
import { useStore } from "@/store/store";
import { showToast } from "@/store/toast";
import { startupInfo } from "@/store/startup";

const VERSION = __APP_VERSION__;

export function About() {
  const { t, lang } = useT();
  const { prefs } = useStore();
  const [message, setMessage] = useState("");
  const [contact, setContact] = useState("");
  const [busy, setBusy] = useState(false);
  const input = "w-full rounded-2xl border border-border bg-secondary/60 px-3 text-base text-foreground outline-none focus:border-primary";

  const send = async () => {
    if (!message.trim()) return;
    setBusy(true);
    const context = `v${VERSION} · ${lang} · ${navigator.userAgent.slice(0, 120)}`;
    const ok = await sendFeedback(message.trim(), contact.trim(), context);
    setBusy(false);
    showToast({ message: ok ? t.about.sent : t.about.sendFailed });
    if (ok) {
      setMessage("");
      setContact("");
    }
  };

  return (
    <main className="safe-top mx-auto min-h-dvh w-full max-w-md px-4 pb-24">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold tracking-tight text-foreground">{t.about.title}</h1>
        <p className="text-sm text-muted-foreground">{t.app.tagline}</p>
      </header>

      <section className="mb-6 rounded-3xl border border-primary/30 bg-primary/10 p-5">
        <span className="icon-tile mb-3 size-12 text-primary">
          <HeartIcon className="size-7" />
        </span>
        <p className="font-display text-2xl font-bold leading-tight text-foreground">{prefs.babyName ? fill(t.about.congratsName, { name: prefs.babyName }) : t.about.congrats}</p>
        <p className="mt-2 text-base text-foreground/90">{t.about.warm}</p>
      </section>

      <section className="card-soft mb-6 p-4">
        <p className="mb-2 font-display text-lg font-bold text-foreground">{t.about.whatTitle}</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          {[t.about.what1, t.about.what2, t.about.what3, t.about.what4].map((line, i) => (
            <li key={i} className="flex gap-2">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 border-t border-border pt-3 text-sm font-semibold text-foreground">{t.about.madeBy}</p>
      </section>

      <section className="card-soft mb-6 p-4">
        <p className="mb-1 font-display text-lg font-bold text-foreground">{t.about.feedbackTitle}</p>
        <p className="mb-3 text-sm text-muted-foreground">{t.about.feedbackBody}</p>
        {feedbackConfigured() ? (
          <>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder={t.about.feedbackPlaceholder} className={`${input} py-2.5`} />
            <Field label={t.about.contactLabel}>
              <input type="text" value={contact} onChange={(e) => setContact(e.target.value)} placeholder={t.about.contactPlaceholder} className={`${input} h-12`} />
            </Field>
            <button type="button" disabled={busy || !message.trim()} onClick={send} className="surface-warm flex h-12 w-full items-center justify-center rounded-2xl text-sm font-bold active:scale-[0.98] disabled:opacity-50">
              {busy ? t.about.sending : t.about.send}
            </button>
          </>
        ) : (
          <p className="rounded-2xl border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">{t.about.notConfigured}</p>
        )}
      </section>

      <section className="mb-4 space-y-3 text-sm text-muted-foreground">
        <div>
          <p className="font-bold text-foreground">{t.about.privacyTitle}</p>
          <p>{t.about.privacyBody}</p>
        </div>
        <div>
          <p className="font-bold text-foreground">{t.about.whoTitle}</p>
          <p>{t.about.whoBody}</p>
        </div>
        <p className="text-xs">
          {fill(t.about.version, { v: VERSION })} · {fill(t.about.startup, { t: startupInfo().seconds.toFixed(1), c: startupInfo().cached ? t.about.yes : t.about.notYet })}
        </p>
      </section>
    </main>
  );
}
