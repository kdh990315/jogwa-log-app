import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const KMA_VILAGE_FORECAST_API_URL =
  "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst";
const WEATHER_FORECAST_SOURCE = "data-go-kr-kma-vilage-fcst-2.0";
const NUM_OF_ROWS = 1000;
const DEFAULT_BUCKET_COUNT = 8;
const DEFAULT_CONCURRENCY = 6;
const MAX_CONCURRENCY = 10;
const OLD_FORECAST_RETENTION_DAYS = 14;

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
  "Access-Control-Allow-Origin": "*",
};

interface SyncWeatherForecastRequest {
  bucketCount?: unknown;
  bucketIndex?: unknown;
  concurrency?: unknown;
  debugGridLimit?: unknown;
}

interface WeatherLocationRow {
  id: number;
  is_active: boolean;
  kma_nx: number;
  kma_ny: number;
}

interface WeatherGrid {
  kmaNx: number;
  kmaNy: number;
}

interface KmaForecastResponse {
  response?: {
    body?: {
      items?: {
        item?: KmaForecastItem[] | KmaForecastItem;
      };
      totalCount?: number | string;
    };
    header?: {
      resultCode?: string;
      resultMsg?: string;
    };
  };
}

interface KmaForecastItem extends Record<string, unknown> {
  baseDate?: unknown;
  baseTime?: unknown;
  category?: unknown;
  fcstDate?: unknown;
  fcstTime?: unknown;
  fcstValue?: unknown;
  nx?: unknown;
  ny?: unknown;
}

interface WeatherForecastRow {
  air_temp_c: number | null;
  external_forecast_id: string;
  fetched_at: string;
  forecast_date: string;
  forecast_time: string;
  humidity_percent: number | null;
  kma_nx: number;
  kma_ny: number;
  precipitation_amount_mm: number | null;
  precipitation_probability_percent: number | null;
  raw_payload: Record<string, unknown>;
  source: string;
  weather_condition: string | null;
  wind_direction_deg: number | null;
  wind_direction_text: string | null;
  wind_speed_ms: number | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ message: "Method not allowed." }, 405);
  }

  try {
    assertSyncSecret(req);

    const serviceKey = getKmaServiceKey();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceKey) {
      return jsonResponse(
        { message: "KMA_SERVICE_KEY is not configured." },
        500,
      );
    }

    if (!supabaseServiceRoleKey) {
      return jsonResponse(
        { message: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
        500,
      );
    }

    const input = normalizeRequest(await readJson(req));
    const base = getLatestKmaBaseDateTime(new Date());
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
    const grids = limitGrids(
      filterBucket(
        await getActiveWeatherGrids(supabase),
        input.bucketIndex,
        input.bucketCount,
      ),
      input.debugGridLimit,
    );
    const settledResults = await mapWithConcurrency(
      grids,
      input.concurrency,
      async (grid) => {
        const items = await fetchKmaForecastItems({
          baseDate: base.baseDate,
          baseTime: base.baseTime,
          serviceKey,
          grid,
        });

        return buildForecastRows({
          baseDate: base.baseDate,
          baseTime: base.baseTime,
          grid,
          items,
        });
      },
    );
    const forecastRows = settledResults.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    );
    const failedGridCount = settledResults.filter(
      (result) => result.status === "rejected",
    ).length;
    const failureSamples = settledResults.flatMap((result) => {
      if (result.status !== "rejected") {
        return [];
      }

      return [normalizeErrorForLog(result.reason)];
    }).slice(0, 3);

    if (forecastRows.length > 0) {
      await upsertForecastRows(supabase, forecastRows);
    }

    await deleteOldForecastRows(supabase);

    return jsonResponse({
      baseDate: base.baseDate,
      baseTime: base.baseTime,
      bucketCount: input.bucketCount,
      bucketIndex: input.bucketIndex,
      debugGridLimit: input.debugGridLimit,
      failedGridCount,
      failureSamples,
      forecastCount: forecastRows.length,
      gridCount: grids.length,
      source: WEATHER_FORECAST_SOURCE,
    });
  } catch (error) {
    console.error("sync-weather-forecast failed", normalizeErrorForLog(error));

    return jsonResponse(
      {
        code: "WEATHER_FORECAST_SYNC_FAILED",
        diagnostic: normalizeErrorForLog(error),
        message: "날씨 예보 동기화 중 오류가 발생했습니다.",
      },
      500,
    );
  }
});

function getKmaServiceKey() {
  return (
    Deno.env.get("KMA_SERVICE_KEY")?.trim() ??
    Deno.env.get("PUBLIC_DATA_PORTAL_SERVICE_KEY")?.trim() ??
    Deno.env.get("FISHING_INDEX_SERVICE_KEY")?.trim()
  );
}

function assertSyncSecret(req: Request) {
  const expectedSecret =
    Deno.env.get("SYNC_WEATHER_FORECAST_SECRET")?.trim() ??
    Deno.env.get("SYNC_FISHING_INDEX_SECRET")?.trim();

  if (!expectedSecret) {
    throw new Error("SYNC_WEATHER_FORECAST_SECRET is not configured.");
  }

  const actualSecret = req.headers.get("x-sync-secret")?.trim();

  if (actualSecret !== expectedSecret) {
    throw new Error("Invalid sync secret.");
  }
}

async function readJson(req: Request) {
  try {
    return (await req.json()) as unknown;
  } catch {
    return {};
  }
}

function normalizeRequest(body: unknown) {
  const record =
    body && typeof body === "object" ? (body as SyncWeatherForecastRequest) : {};
  const bucketCount = normalizeInteger(
    record.bucketCount,
    DEFAULT_BUCKET_COUNT,
    1,
    32,
  );
  const bucketIndex = normalizeInteger(record.bucketIndex, 0, 0, bucketCount - 1);
  const concurrency = normalizeInteger(
    record.concurrency,
    DEFAULT_CONCURRENCY,
    1,
    MAX_CONCURRENCY,
  );
  const debugGridLimit = normalizeOptionalInteger(record.debugGridLimit, 1, 10);

  return {
    bucketCount,
    bucketIndex,
    concurrency,
    debugGridLimit,
  };
}

function normalizeInteger(
  value: unknown,
  fallback: number,
  min: number,
  max: number,
) {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return fallback;
  }

  if (value < min || value > max) {
    return fallback;
  }

  return value;
}

function normalizeOptionalInteger(value: unknown, min: number, max: number) {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "number" || !Number.isInteger(value)) {
    return undefined;
  }

  if (value < min || value > max) {
    return undefined;
  }

  return value;
}

async function getActiveWeatherGrids(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from("weather_locations")
    .select("id, is_active, kma_nx, kma_ny")
    .eq("is_active", true)
    .returns<WeatherLocationRow[]>();

  if (error) {
    throw error;
  }

  const uniqueGrids = new Map<string, WeatherGrid>();

  for (const location of data ?? []) {
    const kmaNx = location.kma_nx;
    const kmaNy = location.kma_ny;

    if (!Number.isInteger(kmaNx) || !Number.isInteger(kmaNy)) {
      continue;
    }

    uniqueGrids.set(`${kmaNx}:${kmaNy}`, { kmaNx, kmaNy });
  }

  return Array.from(uniqueGrids.values()).sort((a, b) => {
    if (a.kmaNx !== b.kmaNx) {
      return a.kmaNx - b.kmaNx;
    }

    return a.kmaNy - b.kmaNy;
  });
}

function filterBucket(
  grids: WeatherGrid[],
  bucketIndex: number,
  bucketCount: number,
) {
  return grids.filter((grid) => {
    return hashGrid(grid) % bucketCount === bucketIndex;
  });
}

function limitGrids(grids: WeatherGrid[], limit: number | undefined) {
  return typeof limit === "number" ? grids.slice(0, limit) : grids;
}

function hashGrid({ kmaNx, kmaNy }: WeatherGrid) {
  return Math.abs(kmaNx * 1_000_003 + kmaNy * 97);
}

async function fetchKmaForecastItems({
  baseDate,
  baseTime,
  grid,
  serviceKey,
}: {
  baseDate: string;
  baseTime: string;
  grid: WeatherGrid;
  serviceKey: string;
}) {
  const response = await fetch(
    buildKmaForecastUrl({ baseDate, baseTime, grid, serviceKey }),
    {
      headers: {
        accept: "application/json",
      },
    },
  );

  if (!response.ok) {
    throw new Error(`KMA forecast API failed with ${response.status}.`);
  }

  const payload = (await response.json()) as KmaForecastResponse;
  const resultCode = payload.response?.header?.resultCode;

  if (resultCode && !["00", "0000", "200"].includes(resultCode)) {
    throw new Error(
      `KMA forecast API returned ${resultCode}: ${
        payload.response?.header?.resultMsg ?? "Unknown error"
      }`,
    );
  }

  return normalizeApiItemArray(payload.response?.body?.items?.item);
}

function buildKmaForecastUrl({
  baseDate,
  baseTime,
  grid,
  serviceKey,
}: {
  baseDate: string;
  baseTime: string;
  grid: WeatherGrid;
  serviceKey: string;
}) {
  const url = new URL(KMA_VILAGE_FORECAST_API_URL);

  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("pageNo", "1");
  url.searchParams.set("numOfRows", NUM_OF_ROWS.toString());
  url.searchParams.set("dataType", "JSON");
  url.searchParams.set("base_date", baseDate);
  url.searchParams.set("base_time", baseTime);
  url.searchParams.set("nx", grid.kmaNx.toString());
  url.searchParams.set("ny", grid.kmaNy.toString());

  return url;
}

function normalizeApiItemArray(
  item: KmaForecastItem[] | KmaForecastItem | undefined,
) {
  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

function buildForecastRows({
  baseDate,
  baseTime,
  grid,
  items,
}: {
  baseDate: string;
  baseTime: string;
  grid: WeatherGrid;
  items: KmaForecastItem[];
}) {
  const forecastGroups = new Map<string, Record<string, KmaForecastItem>>();

  for (const item of items) {
    const category = toTrimmedString(item.category);
    const forecastDate = parseCompactDate(item.fcstDate);
    const forecastTime = parseCompactTime(item.fcstTime);

    if (!category || !forecastDate || !forecastTime) {
      continue;
    }

    const key = [forecastDate, forecastTime].join("|");
    const group = forecastGroups.get(key) ?? {};
    group[category] = item;
    forecastGroups.set(key, group);
  }

  return Array.from(forecastGroups.entries()).map(([key, group]) => {
    const [forecastDate, forecastTime] = key.split("|");
    const skyCode = toTrimmedString(group.SKY?.fcstValue);
    const precipitationCode = toTrimmedString(group.PTY?.fcstValue);
    const windDirectionDeg = normalizeWindDirectionDegrees(
      toNumber(group.VEC?.fcstValue),
    );

    return {
      air_temp_c: toNumber(group.TMP?.fcstValue),
      external_forecast_id: [
        baseDate,
        baseTime,
        grid.kmaNx,
        grid.kmaNy,
        forecastDate,
        forecastTime,
      ].join(":"),
      fetched_at: new Date().toISOString(),
      forecast_date: forecastDate,
      forecast_time: forecastTime,
      humidity_percent: toNumber(group.REH?.fcstValue),
      kma_nx: grid.kmaNx,
      kma_ny: grid.kmaNy,
      precipitation_amount_mm: parsePrecipitationAmount(group.PCP?.fcstValue),
      precipitation_probability_percent: toNumber(group.POP?.fcstValue),
      raw_payload: {
        baseDate,
        baseTime,
        categories: group,
      },
      source: WEATHER_FORECAST_SOURCE,
      weather_condition: describeWeatherCondition(skyCode, precipitationCode),
      wind_direction_deg: windDirectionDeg,
      wind_direction_text: describeWindDirection(windDirectionDeg),
      wind_speed_ms: toNumber(group.WSD?.fcstValue),
    };
  }) satisfies WeatherForecastRow[];
}

async function upsertForecastRows(
  supabase: ReturnType<typeof createClient>,
  rows: WeatherForecastRow[],
) {
  const chunkSize = 1000;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase.from("weather_forecasts").upsert(chunk, {
      onConflict: "source,kma_nx,kma_ny,forecast_date,forecast_time",
    });

    if (error) {
      throw error;
    }
  }
}

async function deleteOldForecastRows(supabase: ReturnType<typeof createClient>) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - OLD_FORECAST_RETENTION_DAYS);

  const { error } = await supabase
    .from("weather_forecasts")
    .delete()
    .eq("source", WEATHER_FORECAST_SOURCE)
    .lt("forecast_date", formatDate(cutoffDate));

  if (error) {
    throw error;
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
) {
  const results: PromiseSettledResult<R>[] = [];
  let nextIndex = 0;

  async function runWorker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;

      try {
        results[currentIndex] = {
          status: "fulfilled",
          value: await worker(items[currentIndex]),
        };
      } catch (reason) {
        results[currentIndex] = {
          reason,
          status: "rejected",
        };
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () =>
      runWorker(),
    ),
  );

  return results;
}

function getLatestKmaBaseDateTime(now: Date) {
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const hour = kst.getUTCHours();
  const minute = kst.getUTCMinutes();
  const availableBaseHours = [2, 5, 8, 11, 14, 17, 20, 23];
  const currentMinutes = hour * 60 + minute;
  const availableHour = [...availableBaseHours]
    .reverse()
    .find((baseHour) => currentMinutes >= baseHour * 60 + 20);

  if (availableHour !== undefined) {
    return {
      baseDate: formatKmaBaseDate(kst),
      baseTime: `${availableHour.toString().padStart(2, "0")}00`,
    };
  }

  const yesterdayKst = new Date(kst.getTime() - 24 * 60 * 60 * 1000);

  return {
    baseDate: formatKmaBaseDate(yesterdayKst),
    baseTime: "2300",
  };
}

function parseCompactDate(value: unknown) {
  const text = toTrimmedString(value);
  const match = /^(\d{4})(\d{2})(\d{2})$/.exec(text ?? "");

  if (!match) {
    return null;
  }

  return [match[1], match[2], match[3]].join("-");
}

function parseCompactTime(value: unknown) {
  const text = toTrimmedString(value);
  const match = /^(\d{2})(\d{2})$/.exec(text ?? "");

  if (!match) {
    return null;
  }

  return [match[1], match[2], "00"].join(":");
}

function describeWeatherCondition(
  skyCode: string | null,
  precipitationCode: string | null,
) {
  if (precipitationCode && precipitationCode !== "0") {
    return (
      {
        "1": "비",
        "2": "비 또는 눈",
        "3": "눈",
        "4": "소나기",
      }[precipitationCode] ?? "강수"
    );
  }

  if (!skyCode) {
    return null;
  }

  return (
    {
      "1": "맑음",
      "3": "구름많음",
      "4": "흐림",
    }[skyCode] ?? null
  );
}

function parsePrecipitationAmount(value: unknown) {
  const text = toTrimmedString(value);

  if (!text || text === "강수없음") {
    return null;
  }

  if (text.includes("미만")) {
    return 0;
  }

  const match = /([\d.]+)/.exec(text);

  if (!match) {
    return null;
  }

  const parsedValue = Number(match[1]);

  return Number.isFinite(parsedValue) ? parsedValue : null;
}

function normalizeWindDirectionDegrees(degrees: number | null) {
  if (degrees === null || degrees < 0) {
    return null;
  }

  return degrees % 360;
}

function describeWindDirection(degrees: number | null) {
  if (degrees === null) {
    return null;
  }

  const directions = [
    "북",
    "북북동",
    "북동",
    "동북동",
    "동",
    "동남동",
    "남동",
    "남남동",
    "남",
    "남남서",
    "남서",
    "서남서",
    "서",
    "서북서",
    "북서",
    "북북서",
  ];
  const index = Math.round(degrees / 22.5) % directions.length;

  return directions[index];
}

function formatDate(date: Date) {
  return [
    date.getUTCFullYear(),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("-");
}

function formatKmaBaseDate(date: Date) {
  return [
    date.getUTCFullYear(),
    (date.getUTCMonth() + 1).toString().padStart(2, "0"),
    date.getUTCDate().toString().padStart(2, "0"),
  ].join("");
}

function toTrimmedString(value: unknown) {
  if (typeof value === "string") {
    const text = value.trim();
    return text.length > 0 ? text : null;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value.toString();
  }

  return null;
}

function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const normalizedValue = value.trim();

    if (normalizedValue.length === 0) {
      return null;
    }

    const parsedValue = Number(normalizedValue);
    return Number.isFinite(parsedValue) ? parsedValue : null;
  }

  return null;
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
