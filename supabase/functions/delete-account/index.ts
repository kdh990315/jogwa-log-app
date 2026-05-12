import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const CATCH_IMAGES_BUCKET = "catch-images";
const STORAGE_REMOVE_LIMIT = 1000;

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};

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
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseServiceRoleKey) {
      return jsonResponse(
        { message: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
        500,
      );
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authorization,
        },
      },
    });

    const {
      data: { user },
      error: userError,
    } = await userSupabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ message: "Login is required." }, 401);
    }

    const adminSupabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const storagePaths = await listStorageObjectPaths(
      adminSupabase,
      ["users", user.id].join("/"),
    );

    await removeStorageObjects(adminSupabase, storagePaths);

    const { error: deleteUserError } =
      await adminSupabase.auth.admin.deleteUser(user.id);

    if (deleteUserError) {
      throw deleteUserError;
    }

    return jsonResponse({ deleted: true });
  } catch (error) {
    console.error("delete-account failed", normalizeErrorForLog(error));

    return jsonResponse(
      {
        code: "ACCOUNT_DELETE_FAILED",
        message: "회원 탈퇴 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      500,
    );
  }
});

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
