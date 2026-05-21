import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const CATCH_IMAGES_BUCKET = "catch-images";
const PURGE_BATCH_LIMIT = 50;
const STORAGE_REMOVE_LIMIT = 1000;

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-purge-secret",
  "Access-Control-Allow-Origin": "*",
};

interface PendingDeletionProfile {
  id: string;
  scheduled_hard_delete_at: string;
}

interface PurgeFailure {
  message: string;
  userId: string;
}

interface StorageListItem {
  id?: string | null;
  name: string;
  metadata?: Record<string, unknown> | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed." }, 405);
  }

  try {
    const purgeSecret = Deno.env.get("ACCOUNT_DELETE_PURGE_SECRET");
    const requestSecret = req.headers.get("x-purge-secret");

    if (!purgeSecret || requestSecret !== purgeSecret) {
      return jsonResponse({ message: "Unauthorized." }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseServiceRoleKey) {
      return jsonResponse(
        { message: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
        500,
      );
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: profiles, error: profilesError } = await adminSupabase
      .from("profiles")
      .select("id, scheduled_hard_delete_at")
      .eq("status", "pending_deletion")
      .lte("scheduled_hard_delete_at", new Date().toISOString())
      .order("scheduled_hard_delete_at", { ascending: true })
      .limit(PURGE_BATCH_LIMIT);

    if (profilesError) {
      throw profilesError;
    }

    const failures: PurgeFailure[] = [];
    let deletedCount = 0;

    for (const profile of (profiles ?? []) as PendingDeletionProfile[]) {
      try {
        await purgeAccount(adminSupabase, profile.id);
        deletedCount += 1;
      } catch (error) {
        failures.push({
          message: getErrorMessage(error),
          userId: profile.id,
        });
      }
    }

    return jsonResponse({
      deletedCount,
      failedCount: failures.length,
      failures,
      scannedCount: profiles?.length ?? 0,
    });
  } catch (error) {
    console.error("purge-deleted-accounts failed", normalizeErrorForLog(error));

    return jsonResponse(
      {
        code: "ACCOUNT_PURGE_FAILED",
        message: "Account purge failed.",
      },
      500,
    );
  }
});

async function purgeAccount(
  supabase: ReturnType<typeof createClient>,
  userId: string,
) {
  const storagePaths = await listStorageObjectPaths(
    supabase,
    ["users", userId].join("/"),
  );

  await removeStorageObjects(supabase, storagePaths);

  const { error: deleteUserError } =
    await supabase.auth.admin.deleteUser(userId, false);

  if (deleteUserError) {
    throw deleteUserError;
  }
}

async function listStorageObjectPaths(
  supabase: ReturnType<typeof createClient>,
  prefix: string,
) {
  const paths: string[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await supabase.storage
      .from(CATCH_IMAGES_BUCKET)
      .list(prefix, {
        limit: STORAGE_REMOVE_LIMIT,
        offset,
        sortBy: { column: "name", order: "asc" },
      });

    if (error) {
      throw error;
    }

    const items = (data ?? []) as StorageListItem[];

    for (const item of items) {
      const itemPath = [prefix, item.name].join("/");

      if (isStorageFolder(item)) {
        paths.push(...(await listStorageObjectPaths(supabase, itemPath)));
        continue;
      }

      paths.push(itemPath);
    }

    if (items.length < STORAGE_REMOVE_LIMIT) {
      break;
    }

    offset += STORAGE_REMOVE_LIMIT;
  }

  return paths;
}

function isStorageFolder(item: StorageListItem) {
  return item.id === null || item.metadata === null;
}

async function removeStorageObjects(
  supabase: ReturnType<typeof createClient>,
  paths: string[],
) {
  for (let index = 0; index < paths.length; index += STORAGE_REMOVE_LIMIT) {
    const chunk = paths.slice(index, index + STORAGE_REMOVE_LIMIT);

    if (chunk.length === 0) {
      continue;
    }

    const { error } = await supabase.storage
      .from(CATCH_IMAGES_BUCKET)
      .remove(chunk);

    if (error) {
      throw error;
    }
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown error.";
}

function normalizeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return error;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}
