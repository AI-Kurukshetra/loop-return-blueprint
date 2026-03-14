export type DraftReturnItem = {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  condition: "unopened" | "opened" | "damaged" | "defective";
};

export type ReturnDraft = {
  email?: string;
  items: DraftReturnItem[];
  reason?: string;
  notes?: string;
};

const KEY = "loop_return_draft_v1";

export function loadDraft(): ReturnDraft {
  if (typeof window === "undefined") {
    return { items: [] };
  }

  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) {
      return { items: [] };
    }

    const parsed = JSON.parse(raw) as ReturnDraft;
    return {
      email: parsed.email,
      reason: parsed.reason,
      notes: parsed.notes,
      items: Array.isArray(parsed.items) ? parsed.items : [],
    };
  } catch {
    return { items: [] };
  }
}

export function saveDraft(next: ReturnDraft) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function clearDraft() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(KEY);
}
