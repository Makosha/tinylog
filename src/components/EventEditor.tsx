import { restEndedByFeed } from "@/domain/state";
import { actions, useStore } from "@/store/store";
import { showToast, undoToast } from "@/store/toast";
import { fill, useT } from "@/i18n/index";
import { labelOf } from "@/i18n/labels";
import { EditSheet } from "./EditSheet";

/** EditSheet wired to the store. Renders nothing when the id is gone. */
export function EventEditor({ eventId, now, onClose }: { eventId: string; now: number; onClose: () => void }) {
  const { events } = useStore();
  const { t } = useT();
  const event = events.find((e) => e.id === eventId);
  if (!event) return null;
  return (
    <EditSheet
      event={event}
      now={now}
      canStayAsleep={event.kind === "feed" && !!restEndedByFeed(events, event.id)}
      onPatch={(p) => actions.update(event.id, p)}
      onWakeNow={() => actions.wake()}
      onStayAsleep={() => {
        actions.mergeAroundFeed(event.id);
        onClose();
        showToast({ message: t.capture.joined });
      }}
      onDelete={() => {
        const removed = actions.delete(event.id);
        onClose();
        if (removed) undoToast(fill(t.capture.deleted, { k: labelOf(t, removed) }), () => actions.restore(removed), t.capture.undo);
      }}
      onClose={onClose}
    />
  );
}
