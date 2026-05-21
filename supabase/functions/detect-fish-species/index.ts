import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_MODEL = "gemini-3.1-flash-lite-preview";
const GEMINI_MEDIA_RESOLUTION = "MEDIA_RESOLUTION_MEDIUM";
const CATCH_IMAGES_BUCKET = "catch-images";
const GEMINI_MAX_ATTEMPTS = 3;
const GEMINI_RETRY_BASE_DELAY_MS = 1_200;

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};

interface DetectFishSpeciesRequest {
  imagePath?: unknown;
  waterType?: unknown;
}

interface FishSpeciesRow {
  id: number;
  location_type: 1 | 2;
  name: string;
}

interface AiSpeciesReferenceRow {
  id: number;
  identification_notes: string[] | null;
  location_type: 1 | 2;
  name: string;
}

interface AiSpeciesCandidate {
  confidence: number;
  reason: string;
  speciesId: number | null;
  speciesName: string;
}

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
  usageMetadata?: {
    candidatesTokenCount?: number;
    promptTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface GeminiJsonPayload {
  candidates?: unknown;
}

interface GeminiErrorPayload {
  error?: {
    code?: number;
    details?: unknown;
    message?: string;
    status?: string;
  };
}

class PublicHttpError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor({
    code,
    details,
    message,
    status,
  }: {
    code: string;
    details?: unknown;
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed." }, 405);
  }

  try {
    const geminiApiKey = Deno.env.get("GEMINI_API_KEY");

    if (!geminiApiKey) {
      return jsonResponse({ message: "GEMINI_API_KEY is not configured." }, 500);
    }

    const authorization = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: {
            Authorization: authorization,
          },
        },
      },
    );

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ message: "Login is required." }, 401);
    }

    const body = (await req.json()) as DetectFishSpeciesRequest;
    const imagePath = normalizeImagePath(body.imagePath);
    const waterType = normalizeWaterType(body.waterType);

    if (!imagePath) {
      return jsonResponse({ message: "imagePath is required." }, 400);
    }

    if (!isOwnImagePath(imagePath, user.id)) {
      return jsonResponse({ message: "Invalid imagePath." }, 403);
    }

    const [image, speciesList, aiSpeciesReferences] = await Promise.all([
      downloadImage(supabase, imagePath),
      getFishSpeciesList(supabase, waterType),
      getAiSpeciesReferenceList(supabase, waterType),
    ]);

    const geminiResponse = await callGemini({
      apiKey: geminiApiKey,
      image,
      prompt: buildPrompt({
        aiSpeciesReferences,
        speciesList,
        waterType,
      }),
    });
    const candidates = parseCandidates(
      geminiResponse,
      speciesList,
      aiSpeciesReferences,
    );

    const { data: prediction, error: predictionError } = await supabase
      .from("ai_species_predictions")
      .insert({
        candidates,
        image_storage_path: imagePath,
        model: GEMINI_MODEL,
        usage_metadata: geminiResponse.usageMetadata ?? null,
        user_id: user.id,
        water_type: waterType,
      })
      .select("id")
      .single();

    if (predictionError) {
      throw predictionError;
    }

    return jsonResponse({
      candidates,
      imagePath,
      model: GEMINI_MODEL,
      predictionId: prediction?.id ?? null,
      usage: normalizeUsage(geminiResponse.usageMetadata),
    });
  } catch (error) {
    console.error("detect-fish-species failed", normalizeErrorForLog(error));

    if (error instanceof PublicHttpError) {
      return jsonResponse(
        {
          code: error.code,
          message: error.message,
        },
        error.status,
      );
    }

    return jsonResponse(
      {
        code: "AI_SPECIES_DETECTION_FAILED",
        message: "AI 어종 분석 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      500,
    );
  }
});

async function downloadImage(
  supabase: ReturnType<typeof createClient>,
  imagePath: string,
) {
  const { data, error } = await supabase.storage
    .from(CATCH_IMAGES_BUCKET)
    .download(imagePath);

  if (error || !data) {
    throw error ?? new Error("Image download failed.");
  }

  const arrayBuffer = await data.arrayBuffer();

  return {
    base64: arrayBufferToBase64(arrayBuffer),
    mimeType: data.type || inferMimeType(imagePath),
  };
}

async function getFishSpeciesList(
  supabase: ReturnType<typeof createClient>,
  waterType: "saltwater" | "freshwater" | null,
) {
  let query = supabase
    .from("fish_species")
    .select("id, location_type, name")
    .order("location_type", { ascending: true })
    .order("id", { ascending: true });

  if (waterType === "freshwater") {
    query = query.eq("location_type", 1);
  }

  if (waterType === "saltwater") {
    query = query.eq("location_type", 2);
  }

  const { data, error } = await query.returns<FishSpeciesRow[]>();

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error("Fish species list is empty.");
  }

  return data;
}

async function getAiSpeciesReferenceList(
  supabase: ReturnType<typeof createClient>,
  waterType: "saltwater" | "freshwater" | null,
) {
  let query = supabase
    .from("ai_species_references")
    .select("id, location_type, name, identification_notes")
    .eq("is_active", true)
    .order("location_type", { ascending: true })
    .order("id", { ascending: true });

  if (waterType === "freshwater") {
    query = query.eq("location_type", 1);
  }

  if (waterType === "saltwater") {
    query = query.eq("location_type", 2);
  }

  const { data, error } = await query.returns<AiSpeciesReferenceRow[]>();

  if (error) {
    console.warn("Failed to load AI species references.", {
      message: error.message,
    });

    return [];
  }

  return data ?? [];
}

async function callGemini({
  apiKey,
  image,
  prompt,
}: {
  apiKey: string;
  image: { base64: string; mimeType: string };
  prompt: string;
}) {
  let lastError: PublicHttpError | null = null;

  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt += 1) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inline_data: {
                    data: image.base64,
                    mime_type: image.mimeType,
                  },
                },
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            mediaResolution: GEMINI_MEDIA_RESOLUTION,
            responseJsonSchema: {
              properties: {
                candidates: {
                  items: {
                    properties: {
                      confidence: {
                        maximum: 100,
                        minimum: 0,
                        type: "number",
                      },
                      reason: {
                        type: "string",
                      },
                      speciesId: {
                        type: "integer",
                      },
                      speciesName: {
                        type: "string",
                      },
                    },
                    required: [
                      "speciesId",
                      "speciesName",
                      "confidence",
                      "reason",
                    ],
                    type: "object",
                  },
                  maxItems: 3,
                  minItems: 1,
                  type: "array",
                },
              },
              required: ["candidates"],
              type: "object",
            },
            responseMimeType: "application/json",
          },
        }),
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        method: "POST",
      },
    );

    const json = await readResponseJson(response);

    if (response.ok) {
      return json as GeminiResponse;
    }

    lastError = createGeminiError(response.status, json);

    if (!shouldRetryGeminiError(lastError) || attempt === GEMINI_MAX_ATTEMPTS) {
      throw lastError;
    }

    console.warn("Retrying Gemini request", {
      attempt,
      code: lastError.code,
      status: lastError.status,
    });

    await delay(GEMINI_RETRY_BASE_DELAY_MS * attempt);
  }

  throw (
    lastError ??
    new PublicHttpError({
      code: "GEMINI_REQUEST_FAILED",
      message: "AI 분석 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      status: 502,
    })
  );
}

async function readResponseJson(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}

function createGeminiError(status: number, payload: unknown) {
  const geminiError = getGeminiErrorPayload(payload);
  const geminiStatus = geminiError?.status;

  if (status === 429 || geminiStatus === "RESOURCE_EXHAUSTED") {
    return new PublicHttpError({
      code: "GEMINI_QUOTA_EXCEEDED",
      details: payload,
      message: "AI 분석 요청 한도를 초과했습니다. 잠시 후 다시 시도해 주세요.",
      status: 429,
    });
  }

  if (status === 503 || status === 504 || geminiStatus === "UNAVAILABLE") {
    return new PublicHttpError({
      code: "GEMINI_UNAVAILABLE",
      details: payload,
      message: "AI 분석 서버가 일시적으로 응답하지 않습니다. 잠시 후 다시 시도해 주세요.",
      status: 503,
    });
  }

  if (status === 400 || geminiStatus === "INVALID_ARGUMENT") {
    return new PublicHttpError({
      code: "GEMINI_INVALID_REQUEST",
      details: payload,
      message: "AI 분석 요청 형식이 올바르지 않습니다.",
      status: 400,
    });
  }

  return new PublicHttpError({
    code: "GEMINI_REQUEST_FAILED",
    details: payload,
    message: "AI 분석 요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
    status: 502,
  });
}

function shouldRetryGeminiError(error: PublicHttpError) {
  return error.code === "GEMINI_UNAVAILABLE";
}

function delay(milliseconds: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, milliseconds);
  });
}

function getGeminiErrorPayload(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const error = (payload as GeminiErrorPayload).error;

  if (!error || typeof error !== "object") {
    return null;
  }

  return error;
}

function normalizeErrorForLog(error: unknown) {
  if (error instanceof PublicHttpError) {
    return {
      code: error.code,
      details: error.details,
      message: error.message,
      status: error.status,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };
  }

  return error;
}

function buildPrompt({
  aiSpeciesReferences,
  speciesList,
  waterType,
}: {
  aiSpeciesReferences: AiSpeciesReferenceRow[];
  speciesList: FishSpeciesRow[];
  waterType: "saltwater" | "freshwater" | null;
}) {
  const dictionarySpecies = speciesList
    .map((item) => {
      const locationType =
        item.location_type === 1 ? "freshwater" : "saltwater";

      return `${item.id}. ${item.name} (${locationType})`;
    })
    .join("\n");
  const referenceSpecies = aiSpeciesReferences
    .map((item) => {
      const locationType =
        item.location_type === 1 ? "freshwater" : "saltwater";

      return `0. ${item.name} (${locationType}, classification-only reference)`;
    })
    .join("\n");
  const waterTypeRule = waterType
    ? `Only classify within ${waterType} species.`
    : "The image can contain either saltwater or freshwater species.";
  const identificationNotes = buildIdentificationNotes(
    aiSpeciesReferences,
    speciesList,
  );

  return [
    "You are a fish species classifier for a Korean fishing log app.",
    "Classify the fish in the image using the dictionary species and classification-only reference species below.",
    waterTypeRule,
    "Return up to 3 candidates. If uncertain, use a lower confidence.",
    "Do not invent species outside the lists below.",
    "If the candidate is a dictionary species, return its listed speciesId.",
    "If the candidate is a classification-only reference species, return speciesId 0 and the exact speciesName.",
    "If no species is clear, return the closest listed species with low confidence.",
    "Write reason in Korean, concise and based on visible image features.",
    identificationNotes
      ? ["", "Species-specific identification notes:", identificationNotes].join("\n")
      : "",
    "",
    "Dictionary species:",
    dictionarySpecies,
    referenceSpecies ? ["", "Classification-only reference species:", referenceSpecies].join("\n") : "",
  ]
    .filter((line) => line.length > 0)
    .join("\n");
}

function buildIdentificationNotes(
  aiSpeciesReferences: AiSpeciesReferenceRow[],
  speciesList: FishSpeciesRow[],
) {
  const allowedNames = new Set(speciesList.map((item) => item.name));
  const notes: string[] = [];

  for (const reference of aiSpeciesReferences) {
    if (!Array.isArray(reference.identification_notes)) {
      continue;
    }

    const referenceNotes = reference.identification_notes
      .map((note) => note.trim())
      .filter((note) => note.length > 0);

    if (referenceNotes.length === 0) {
      continue;
    }

    notes.push(`- ${reference.name}: ${referenceNotes.join(" ")}`);
  }

  if (
    aiSpeciesReferences.some((item) => item.name === "강도다리") &&
    allowedNames.has("도다리")
  ) {
    notes.push(
      [
        "- 강도다리 and 도다리 are distinct species; do not treat them as synonyms.",
        "- If the dorsal and anal fins show repeated, regular stripe bands, prefer 강도다리.",
        "- If those regular fin stripe bands are not visible, keep 도다리 as a separate candidate with appropriate confidence.",
        "- Mention the visible fin stripe pattern in the Korean reason when choosing between 강도다리 and 도다리.",
      ].join("\n"),
    );
  }

  return notes.join("\n");
}

function parseCandidates(
  response: GeminiResponse,
  speciesList: FishSpeciesRow[],
  aiSpeciesReferences: AiSpeciesReferenceRow[],
): AiSpeciesCandidate[] {
  const text = response.candidates?.[0]?.content?.parts
    ?.map((part) => part.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = JSON.parse(text) as GeminiJsonPayload;

  if (!Array.isArray(parsed.candidates)) {
    throw new Error("Gemini response has no candidates.");
  }

  const allowedById = new Map(speciesList.map((item) => [item.id, item]));
  const allowedByName = new Map(speciesList.map((item) => [item.name, item]));
  const referenceByName = new Map(
    aiSpeciesReferences.map((item) => [item.name, item]),
  );

  return parsed.candidates.flatMap((candidate): AiSpeciesCandidate[] => {
    if (!candidate || typeof candidate !== "object") {
      return [];
    }

    const value = candidate as Record<string, unknown>;
    const speciesId =
      typeof value.speciesId === "number" && Number.isInteger(value.speciesId)
        ? value.speciesId
        : null;
    const speciesName =
      typeof value.speciesName === "string" ? value.speciesName.trim() : "";
    const matchedSpecies =
      (speciesId ? allowedById.get(speciesId) : undefined) ??
      allowedByName.get(speciesName);
    const matchedReference = referenceByName.get(speciesName);

    if (!matchedSpecies && !matchedReference) {
      return [];
    }

    if (matchedReference && !matchedSpecies) {
      return [
        {
          confidence: clampConfidence(value.confidence),
          reason:
            typeof value.reason === "string" && value.reason.trim().length > 0
              ? value.reason.trim()
              : "사진에서 확인되는 특징을 기준으로 판별했습니다.",
          speciesId: null,
          speciesName: matchedReference.name,
        },
      ];
    }

    return [
      {
        confidence: clampConfidence(value.confidence),
        reason:
          typeof value.reason === "string" && value.reason.trim().length > 0
            ? value.reason.trim()
            : "사진에서 확인되는 특징을 기준으로 판별했습니다.",
        speciesId: matchedSpecies.id,
        speciesName: matchedSpecies.name,
      },
    ];
  });
}

function normalizeUsage(usage: GeminiResponse["usageMetadata"] | undefined) {
  if (!usage) {
    return undefined;
  }

  return {
    candidatesTokenCount: usage.candidatesTokenCount,
    promptTokenCount: usage.promptTokenCount,
    totalTokenCount: usage.totalTokenCount,
  };
}

function normalizeImagePath(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeWaterType(value: unknown) {
  if (value === "saltwater" || value === "freshwater") {
    return value;
  }

  return null;
}

function isOwnImagePath(imagePath: string, userId: string) {
  return imagePath.startsWith(`users/${userId}/`);
}

function arrayBufferToBase64(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chunkSize = 0x8000;
  let binary = "";

  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }

  return btoa(binary);
}

function inferMimeType(imagePath: string) {
  const extension = imagePath.split("?")[0]?.split(".").pop()?.toLowerCase();

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

function clampConfidence(value: unknown) {
  const confidence = typeof value === "number" ? value : Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(confidence)));
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
