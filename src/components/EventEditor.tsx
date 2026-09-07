import { eventLabel, type LogEvent } from "@/domain/events";
import { restEndedByFeed } from "@/domain/state";
import { actions, useStore } from "@/store/store";
import { showToast, undoToast } from "@/store/toast";
import { EditSheet } from "./EditSheet";

/** EditSheet wired to the store. Renders nothing when the id is gone. */
export function EventEditor({ eventId, now, onClose }: { eventId: string; now: number; onClose: () => void }) {
  const { events } = useStore();
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
        showToast({ message: "Sleep joined back together" });
      }}
      onDelete={() => {
        const removed = actions.delete(event.id);
        onClose();
        if (removed) undoToast(`${eventLabel(removed as LogEvent)} deleted`, () => actions.restore(removed));
      }}
      onClose={onClose}
    />
  );
}
