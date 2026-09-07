import { useEffect } from "react";
import { TabBar } from "@/components/TabBar";
import { Toast } from "@/components/Toast";
import { About } from "@/screens/About";
import { Growth } from "@/screens/Growth";
import { History } from "@/screens/History";
import { Home } from "@/screens/Home";
import { Welcome } from "@/screens/Welcome";
import { useRoute } from "@/store/route";
import { useStore } from "@/store/store";
import { applyTheme, onSystemThemeChange } from "@/store/theme";
import { useToast } from "@/store/toast";
import { useReminderScheduler } from "@/store/notify";
import { markRendered } from "@/store/startup";
import { LOCALE } from "@/i18n/index";

export default function App() {
  const route = useRoute();
  const { prefs, hydrated } = useStore();
  const toast = useToast();
  useReminderScheduler();

  useEffect(() => {
    applyTheme(prefs.theme);
    return onSystemThemeChange(() => applyTheme(prefs.theme));
  }, [prefs.theme]);

  useEffect(() => {
    document.documentElement.lang = LOCALE[prefs.lang ?? "en"];
  }, [prefs.lang]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [route]);

  useEffect(() => {
    if (hydrated) markRendered();
  }, [hydrated]);

  if (!hydrated) return null;
  if (!prefs.welcomeDone) {
    return (
      <>
        <Welcome />
        <Toast toast={toast} />
      </>
    );
  }

  return (
    <>
      {route === "today" ? <Home /> : route === "history" ? <History /> : route === "growth" ? <Growth /> : <About />}
      <TabBar route={route} />
      <Toast toast={toast} />
    </>
  );
}
