const INTERNAL_ERROR_PATTERNS = [
  /supabase/i,
  /postgrest/i,
  /postgres/i,
  /jwt/i,
  /rls/i,
  /row level security/i,
  /relation .* does not exist/i,
  /column .* does not exist/i,
  /duplicate key/i,
  /violates/i,
  /invalid input syntax/i,
  /api/i,
  /auth/i,
  /bucket/i,
  /callback/i,
  /database/i,
  /redirect/i,
  /sdk/i,
  /schema/i,
  /storage/i,
  /table/i,
  /url/i,
  /edge function/i,
  /환경 변수/,
  /세션 정보를 받아오지/,
  /응답이 올바르지/,
  /failed to fetch/i,
  /network request failed/i,
];

export function getUserErrorMessage(error: unknown, fallbackMessage: string) {
  if (!(error instanceof Error)) {
    return fallbackMessage;
  }

  const message = error.message.trim();

  if (
    message.length === 0 ||
    !hasKoreanText(message) ||
    isInternalErrorMessage(message)
  ) {
    return fallbackMessage;
  }

  return message;
}

function isInternalErrorMessage(message: string) {
  return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(message));
}

function hasKoreanText(message: string) {
  return /[가-힣]/.test(message);
}
