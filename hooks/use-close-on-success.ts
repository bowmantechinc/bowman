"use client";

import { useState } from "react";
import type { ActionState } from "@/lib/actions/types";

/**
 * Closes a dialog when a useActionState result flips to success — without a
 * useEffect. Adjusts state during render (React's documented pattern for
 * deriving state from a changed value) instead of after commit, so it
 * satisfies react-hooks/set-state-in-effect and avoids the extra render pass.
 */
export function useCloseOnSuccess(
  state: ActionState,
  setOpen: (open: boolean) => void,
  shouldClose: (state: ActionState) => boolean = (s) => !!s.ok
) {
  const [prevState, setPrevState] = useState(state);
  if (state !== prevState) {
    setPrevState(state);
    if (shouldClose(state)) setOpen(false);
  }
}
