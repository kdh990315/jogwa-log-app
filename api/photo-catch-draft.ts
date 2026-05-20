import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import type {
  CreatePhotoCatchDraftRequest,
  PhotoCatchDraftResponse,
} from "@/types/photo-catch-draft";

const CATCH_IMAGES_BUCKET = "catch-images";

export interface UploadPhotoCatchDraftImageInput {
  fileSizeBytes?: number | null;
  localUri: string;
  mimeType?: string | null;
}

interface PhotoCatchDraftFunctionErrorResponse {
  code?: unknown;
  message?: unknown;
}

export async function uploadPhotoCatchDraftImage(
  input: UploadPhotoCatchDraftImageInput,
): Promise<string> {
  ensureSupabaseAuthConfig();

  const userId = await getCurrentUserId();
  const mimeType = normalizeImageMimeType(input.mimeType, input.localUri);
  const storagePath = buildPhotoCatchDraftImageStoragePath({
    localUri: input.localUri,
    mimeType,
    userId,
  });
  const fileBody = await fetch(input.localUri).then((response) => {
    if (!response.ok) {
      throw new Error("사진 조과 초안용 이미지를 읽지 못했습니다.");
    }

    return response.arrayBuffer();
  });

  const { error } = await supabase.storage
    .from(CATCH_IMAGES_BUCKET)
    .upload(storagePath, fileBody, {
      contentType: mimeType,
      upsert: false,
    });

  if (error) {
    throw error;
  }

  return storagePath;
}

export async function createPhotoCatchDraft(
  input: CreatePhotoCatchDraftRequest,
): Promise<PhotoCatchDraftResponse> {
  ensureSupabaseAuthConfig();

  const { data, error } =
    await supabase.functions.invoke<PhotoCatchDraftResponse>(
      "create-photo-catch-draft",
      {
        body: input,
      },
    );

  if (error) {
    await throwCreatePhotoCatchDraftFunctionError(error);
  }

  return normalizePhotoCatchDraftResponse(data);
}

async function throwCreatePhotoCatchDraftFunctionError(
  error: unknown,
): Promise<never> {
  const context = getFunctionErrorContext(error);

  if (context) {
    const response = context.clone();
    let body: PhotoCatchDraftFunctionErrorResponse | null = null;

    try {
      body = (await response.json()) as PhotoCatchDraftFunctionErrorResponse;
    } catch {
      body = null;
    }

    if (typeof body?.message === "string" && body.message.trim().length > 0) {
      throw new Error(body.message.trim());
    }
  }

  if (error instanceof Error) {
    throw error;
  }

  throw new Error(
    "사진 조과 초안 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
  );
}

function getFunctionErrorContext(error: unknown) {
  if (!error || typeof error !== "object") {
    return null;
  }

  const context = (error as { context?: unknown }).context;

  if (typeof Response !== "undefined" && context instanceof Response) {
    return context;
  }

  return null;
}

function normalizePhotoCatchDraftResponse(
  data: PhotoCatchDraftResponse | null,
): PhotoCatchDraftResponse {
  if (!data || typeof data.imagePath !== "string") {
    throw new Error("사진 조과 초안 응답이 올바르지 않습니다.");
  }

  if (!Array.isArray(data.speciesCandidates)) {
    throw new Error("사진 조과 초안 응답이 올바르지 않습니다.");
  }

  return data;
}

async function getCurrentUserId() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("로그인 후 사진으로 등록할 수 있습니다.");
  }

  return user.id;
}

function buildPhotoCatchDraftImageStoragePath({
  localUri,
  mimeType,
  userId,
}: {
  localUri: string;
  mimeType: string;
  userId: string;
}) {
  const extension = getImageExtension(localUri, mimeType);
  const timestamp = Date.now();
  const uniquePart = Math.round(Math.random() * 1_000_000_000);

  return [
    "users",
    userId,
    "photo-catch-drafts",
    `${timestamp}-${uniquePart}.${extension}`,
  ].join("/");
}

function normalizeImageMimeType(mimeType: string | null | undefined, uri: string) {
  if (isAllowedImageMimeType(mimeType)) {
    return mimeType;
  }

  const extension = getUriExtension(uri);

  if (extension === "png") {
    return "image/png";
  }

  if (extension === "webp") {
    return "image/webp";
  }

  if (extension === "heic") {
    return "image/heic";
  }

  if (extension === "heif") {
    return "image/heif";
  }

  return "image/jpeg";
}

function getImageExtension(uri: string, mimeType: string) {
  const extension = getUriExtension(uri);

  if (["jpeg", "jpg", "png", "webp", "heic", "heif"].includes(extension)) {
    return extension === "jpg" ? "jpeg" : extension;
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  if (mimeType === "image/heic") {
    return "heic";
  }

  if (mimeType === "image/heif") {
    return "heif";
  }

  return "jpeg";
}

function getUriExtension(uri: string) {
  const pathWithoutQuery = uri.split("?")[0] ?? "";
  const extension = pathWithoutQuery.split(".").pop()?.toLowerCase() ?? "";

  return extension;
}

function isAllowedImageMimeType(
  mimeType: string | null | undefined,
): mimeType is string {
  return Boolean(
    mimeType &&
      ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(
        mimeType,
      ),
  );
}
