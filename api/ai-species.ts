import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import {
  AI_SPECIES_MODEL,
  type DetectFishSpeciesInput,
  type DetectFishSpeciesResult,
} from "@/types/ai-species";

const CATCH_IMAGES_BUCKET = "catch-images";

interface DetectFishSpeciesFunctionResponse {
  candidates?: DetectFishSpeciesResult["candidates"];
  imagePath?: string;
  model?: string;
  predictionId?: number | null;
  usage?: DetectFishSpeciesResult["usage"];
}

interface DetectFishSpeciesFunctionErrorResponse {
  code?: unknown;
  message?: unknown;
}

export async function detectFishSpecies(
  input: DetectFishSpeciesInput,
): Promise<DetectFishSpeciesResult> {
  ensureSupabaseAuthConfig();

  const imagePath = await uploadAiSpeciesImage(input.image);
  let hasFunctionResponse = false;

  try {
    const { data, error } =
      await supabase.functions.invoke<DetectFishSpeciesFunctionResponse>(
        "detect-fish-species",
        {
          body: {
            imagePath,
            waterType: input.waterType,
          },
        },
      );

    if (error) {
      await throwDetectFishSpeciesFunctionError(error);
    }

    hasFunctionResponse = true;
    return normalizeDetectFishSpeciesResponse(data, imagePath);
  } catch (error) {
    if (!hasFunctionResponse) {
      await removeAiSpeciesImageObject(imagePath).catch(() => {
        // Keep the original AI detection error visible to the caller.
      });
    }

    throw error;
  }
}

async function throwDetectFishSpeciesFunctionError(error: unknown): Promise<never> {
  const context = getFunctionErrorContext(error);

  if (context) {
    const response = context.clone();
    let body: DetectFishSpeciesFunctionErrorResponse | null = null;

    try {
      body = (await response.json()) as DetectFishSpeciesFunctionErrorResponse;
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

  throw new Error("AI 어종 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.");
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

async function uploadAiSpeciesImage(input: DetectFishSpeciesInput["image"]) {
  const userId = await getCurrentUserId();
  const mimeType = normalizeImageMimeType(input.mimeType, input.localUri);
  const storagePath = buildAiSpeciesImageStoragePath({
    localUri: input.localUri,
    mimeType,
    userId,
  });
  const fileBody = await fetch(input.localUri).then((response) => {
    if (!response.ok) {
      throw new Error("AI 분석용 이미지를 읽지 못했습니다.");
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

async function removeAiSpeciesImageObject(storagePath: string) {
  const { error } = await supabase.storage
    .from(CATCH_IMAGES_BUCKET)
    .remove([storagePath]);

  if (error) {
    throw error;
  }
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
    throw new Error("로그인 후 AI 어종 분석을 사용할 수 있습니다.");
  }

  return user.id;
}

function normalizeDetectFishSpeciesResponse(
  data: DetectFishSpeciesFunctionResponse | null,
  fallbackImagePath: string,
): DetectFishSpeciesResult {
  if (!data || !Array.isArray(data.candidates)) {
    throw new Error("AI 어종 분석 응답이 올바르지 않습니다.");
  }

  return {
    candidates: data.candidates,
    imagePath: data.imagePath ?? fallbackImagePath,
    model: AI_SPECIES_MODEL,
    predictionId: data.predictionId ?? null,
    usage: data.usage,
  };
}

function buildAiSpeciesImageStoragePath({
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
    "ai-species",
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
  const cleanUri = uri.split("?")[0] ?? uri;
  const lastPathSegment = cleanUri.split("/").pop() ?? "";
  const extension = lastPathSegment.split(".").pop() ?? "";

  return extension.toLowerCase();
}

function isAllowedImageMimeType(
  mimeType: string | null | undefined,
): mimeType is string {
  return (
    mimeType === "image/jpeg" ||
    mimeType === "image/png" ||
    mimeType === "image/webp" ||
    mimeType === "image/heic" ||
    mimeType === "image/heif"
  );
}
