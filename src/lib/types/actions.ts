export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type FormActionState<T = void> = ActionResult<T> | undefined;
