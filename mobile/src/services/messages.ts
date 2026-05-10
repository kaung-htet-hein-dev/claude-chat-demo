import { API_BASE_URL } from "../constants/api";

export type StreamHandle = {
  cancel: () => void;
  done: Promise<void>;
};

export type StreamCallbacks = {
  onChunk: (text: string) => void;
  onError?: (message: string) => void;
  onDone?: () => void;
};

// streamMessage opens an XHR to the SSE endpoint and forwards text deltas.
// We use XHR because React Native's fetch does not expose a streaming body reader.
export function streamMessage(
  chatId: string,
  content: string,
  callbacks: StreamCallbacks,
): StreamHandle {
  const xhr = new XMLHttpRequest();
  let cursor = 0;
  let buffer = "";
  let cancelled = false;
  let resolveDone: () => void;
  const done = new Promise<void>((resolve) => {
    resolveDone = resolve;
  });

  const flushEvents = () => {
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      handleEvent(rawEvent);
      boundary = buffer.indexOf("\n\n");
    }
  };

  const handleEvent = (raw: string) => {
    let event = "message";
    const dataLines: string[] = [];
    for (const line of raw.split("\n")) {
      if (line.startsWith("event:")) {
        event = line.slice(6).trim();
      } else if (line.startsWith("data:")) {
        dataLines.push(line.slice(5).replace(/^ /, ""));
      }
    }
    if (dataLines.length === 0) return;
    const data = dataLines.join("\n");

    if (event === "error") {
      callbacks.onError?.(data || "stream error");
      return;
    }
    if (event === "done") {
      callbacks.onDone?.();
      return;
    }
    callbacks.onChunk(data);
  };

  xhr.open("POST", `${API_BASE_URL}/chats/${chatId}/messages/stream`);
  xhr.setRequestHeader("Content-Type", "application/json");
  xhr.setRequestHeader("Accept", "text/event-stream");

  xhr.onreadystatechange = () => {
    if (cancelled) return;
    if (xhr.readyState >= 3) {
      const next = xhr.responseText.slice(cursor);
      cursor = xhr.responseText.length;
      if (next.length > 0) {
        buffer += next;
        flushEvents();
      }
    }
    if (xhr.readyState === 4) {
      if (xhr.status >= 400) {
        callbacks.onError?.(`HTTP ${xhr.status}`);
      }
      resolveDone();
    }
  };

  xhr.onerror = () => {
    if (cancelled) return;
    callbacks.onError?.("network error");
    resolveDone();
  };

  xhr.send(JSON.stringify({ content }));

  return {
    cancel: () => {
      cancelled = true;
      try {
        xhr.abort();
      } catch {
        // ignore
      }
      resolveDone();
    },
    done,
  };
}
