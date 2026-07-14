export interface ActionState {
  error?: string;
  ok?: boolean;
  message?: string;
}

export const INITIAL_ACTION_STATE: ActionState = {};
