import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};

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

    const { data: profile, error: profileError } = await adminSupabase
      .from("profiles")
      .select("status, scheduled_hard_delete_at")
      .eq("id", user.id)
      .single();

    if (profileError) {
      throw profileError;
    }

    if (profile.status !== "pending_deletion") {
      return jsonResponse({ restored: true });
    }

    if (
      profile.scheduled_hard_delete_at &&
      new Date(profile.scheduled_hard_delete_at).getTime() <= Date.now()
    ) {
      return jsonResponse(
        {
          code: "RESTORE_WINDOW_EXPIRED",
          message:
            "계정 복구 가능 기간이 지났습니다. 계정 삭제가 곧 완료됩니다.",
        },
        409,
      );
    }

    const { error: restoreError } = await adminSupabase
      .from("profiles")
      .update({
        deletion_requested_at: null,
        scheduled_hard_delete_at: null,
        status: "active",
      })
      .eq("id", user.id);

    if (restoreError) {
      throw restoreError;
    }

    return jsonResponse({ restored: true });
  } catch (error) {
    console.error("restore-account failed", normalizeErrorForLog(error));

    return jsonResponse(
      {
        code: "ACCOUNT_RESTORE_FAILED",
        message: "계정 복구 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      500,
    );
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
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
