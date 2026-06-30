import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

let currentUserPromise: Promise<User | null> | null = null;

function wait(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function isAuthLockError(error: unknown) {
  if (!error || typeof error !== "object") return false;

  const maybeError = error as {
    name?: string;
    message?: string;
    details?: string;
    hint?: string;
  };

  const text = `${maybeError.name || ""} ${maybeError.message || ""} ${
    maybeError.details || ""
  } ${maybeError.hint || ""}`.toLowerCase();

  return (
    text.includes("lock") ||
    text.includes("aborterror") ||
    text.includes("lock broken") ||
    text.includes("navigatorlock") ||
    text.includes("steal")
  );
}

async function readCurrentUserOnce() {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  return data.user ?? null;
}

export async function getCurrentUserSafe() {
  if (currentUserPromise) {
    return currentUserPromise;
  }

  currentUserPromise = (async () => {
    try {
      return await readCurrentUserOnce();
    } catch (error) {
      if (!isAuthLockError(error)) {
        throw error;
      }

      await wait(600);

      try {
        return await readCurrentUserOnce();
      } catch (retryError) {
        if (!isAuthLockError(retryError)) {
          throw retryError;
        }

        await wait(1000);
        return await readCurrentUserOnce();
      }
    } finally {
      window.setTimeout(() => {
        currentUserPromise = null;
      }, 100);
    }
  })();

  return currentUserPromise;
}