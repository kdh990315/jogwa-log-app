import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import type {
  MyProfile,
  ProfileSignupProvider,
  ProfileStatus,
  UpdateMyProfileInput,
} from "@/types/profile";

interface ProfileRow {
  avatar_url: string | null;
  created_at: string | null;
  id: string;
  nickname: string | null;
  signup_provider: ProfileSignupProvider;
  status: ProfileStatus;
  updated_at: string | null;
}

export async function getMyProfile(): Promise<MyProfile> {
  ensureSupabaseAuthConfig();

  const user = await getCurrentUser();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, nickname, avatar_url, signup_provider, status, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle<ProfileRow>();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new Error("프로필 정보를 찾지 못했습니다. 다시 로그인해 주세요.");
  }

  return mapMyProfile(data, user.email ?? null);
}

export async function updateMyProfile(
  input: UpdateMyProfileInput,
): Promise<MyProfile> {
  ensureSupabaseAuthConfig();

  const user = await getCurrentUser();
  const normalizedNickname = normalizeNickname(input.nickname);
  const { data, error } = await supabase
    .from("profiles")
    .update({
      nickname: normalizedNickname,
    })
    .eq("id", user.id)
    .select("id, nickname, avatar_url, signup_provider, status, created_at, updated_at")
    .single<ProfileRow>();

  if (error) {
    throw error;
  }

  return mapMyProfile(data, user.email ?? null);
}

async function getCurrentUser() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("로그인 후 내 정보를 수정할 수 있습니다.");
  }

  return user;
}

function normalizeNickname(value: string | null) {
  const trimmed = value?.trim() ?? "";

  return trimmed.length > 0 ? trimmed : null;
}

function mapMyProfile(row: ProfileRow, email: string | null): MyProfile {
  return {
    avatarUrl: row.avatar_url,
    createdAt: row.created_at,
    email,
    id: row.id,
    nickname: row.nickname,
    signupProvider: row.signup_provider,
    status: row.status,
    updatedAt: row.updated_at,
  };
}
