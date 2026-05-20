import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const FISHING_INDEX_API_URL =
  "https://apis.data.go.kr/1192136/fcstFishingv2/GetFcstFishingApiServicev2";
const FISHING_INDEX_SOURCE = "data-go-kr-fcst-fishing-v2";
const FISHING_TYPE = "갯바위";
const LOCATION_TYPE_SALTWATER = 2;
const NUM_OF_ROWS = 300;
const MAX_PAGES = 100;
const UNKNOWN_TARGET_SPECIES_NAME = "미분류";

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-sync-secret",
  "Access-Control-Allow-Origin": "*",
};

interface FishingIndexApiResponse {
  header?: {
    resultCode?: string;
    resultMsg?: string;
  };
  body?: {
    totalCount?: number | string;
    items?: {
      item?: FishingIndexApiItem[] | FishingIndexApiItem;
    };
  };
}

interface FishingIndexApiItem extends Record<string, unknown> {
  totalIndex?: unknown;
  lastScr?: unknown;
  seafsPstnNm?: unknown;
  lat?: unknown;
  lot?: unknown;
  predcYmd?: unknown;
  predcNoonSeCd?: unknown;
  tdlvHrScr?: unknown;
  minWvhgt?: unknown;
  maxWvhgt?: unknown;
  minWtem?: unknown;
  maxWtem?: unknown;
  minArtmp?: unknown;
  maxArtmp?: unknown;
  minCrsp?: unknown;
  maxCrsp?: unknown;
  minWspd?: unknown;
  maxWspd?: unknown;
  tdlvHrCn?: unknown;
}

interface NormalizedFishingIndexItem {
  externalForecastId: string;
  externalLocationId: string;
  forecastDate: string;
  forecastTime: string;
  item: FishingIndexApiItem;
  latitude: number;
  locationName: string;
  longitude: number;
  targetSpeciesName: string;
}

interface LocationRow {
  external_location_id: string;
  id: number;
}

interface ForecastRow {
  air_temp_max_c: number | null;
  air_temp_min_c: number | null;
  current_speed_max_kn: number | null;
  current_speed_min_kn: number | null;
  external_forecast_id: string;
  fetched_at: string;
  fishing_index_grade: string | null;
  fishing_index_score: number | null;
  fishing_type: string;
  forecast_date: string;
  forecast_time: string;
  location_id: number;
  raw_payload: Record<string, unknown>;
  source: string;
  target_species_name: string;
  tide: string | null;
  water_temp_max_c: number | null;
  water_temp_min_c: number | null;
  wave_height_max_m: number | null;
  wave_height_min_m: number | null;
  wind_speed_max_ms: number | null;
  wind_speed_min_ms: number | null;
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

    const serviceKey = getPublicDataPortalServiceKey();
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!serviceKey) {
      return jsonResponse(
        { message: "PUBLIC_DATA_PORTAL_SERVICE_KEY is not configured." },
        500,
      );
    }

    if (!supabaseServiceRoleKey) {
      return jsonResponse(
        { message: "SUPABASE_SERVICE_ROLE_KEY is not configured." },
        500,
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const rawItems = await fetchFishingIndexItems(serviceKey);
    const normalizedItems = normalizeFishingIndexItems(rawItems);
    const locations = await upsertLocations(supabase, normalizedItems);
    const rawForecastRows = buildForecastRows(normalizedItems, locations);
    const forecastRows = dedupeForecastRows(rawForecastRows);

    if (forecastRows.length > 0) {
      const { error } = await supabase
        .from("fishing_index_forecasts")
        .upsert(forecastRows, {
          onConflict:
            "source,location_id,fishing_type,target_species_name,forecast_date,forecast_time",
        });

      if (error) {
        throw error;
      }
    }

    return jsonResponse({
      fishingType: FISHING_TYPE,
      duplicateForecastCount: rawForecastRows.length - forecastRows.length,
      forecastCount: forecastRows.length,
      locationCount: locations.size,
      rawItemCount: rawItems.length,
      skippedItemCount: rawItems.length - normalizedItems.length,
    });
  } catch (error) {
    console.error("sync-fishing-index failed", normalizeErrorForLog(error));

    return jsonResponse(
      {
        code: "FISHING_INDEX_SYNC_FAILED",
        message: "바다낚시지수 동기화 중 오류가 발생했습니다.",
      },
      500,
    );
  }
});

function getPublicDataPortalServiceKey() {
  return (
    Deno.env.get("PUBLIC_DATA_PORTAL_SERVICE_KEY")?.trim() ??
    Deno.env.get("FISHING_INDEX_SERVICE_KEY")?.trim()
  );
}

function assertSyncSecret(req: Request) {
  const expectedSecret = Deno.env.get("SYNC_FISHING_INDEX_SECRET")?.trim();

  if (!expectedSecret) {
    throw new Error("SYNC_FISHING_INDEX_SECRET is not configured.");
  }

  const actualSecret = req.headers.get("x-sync-secret")?.trim();

  if (actualSecret !== expectedSecret) {
    throw new Error("Invalid sync secret.");
  }
}

async function fetchFishingIndexItems(serviceKey: string) {
  const items: FishingIndexApiItem[] = [];
  let totalCount: number | null = null;

  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo += 1) {
    const response = await fetch(buildFishingIndexUrl(serviceKey, pageNo), {
      headers: {
        accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Fishing index API failed with ${response.status}.`);
    }

    const payload = (await response.json()) as FishingIndexApiResponse;
    const resultCode = payload.header?.resultCode;

    if (resultCode && !["00", "0000", "200"].includes(resultCode)) {
      if (resultCode === "03") {
        break;
      }

      throw new Error(
        `Fishing index API returned ${resultCode}: ${
          payload.header?.resultMsg ?? "Unknown error"
        }`,
      );
    }

    const pageItems = normalizeApiItemArray(payload.body?.items?.item);
    items.push(...pageItems);
    totalCount = toNumber(payload.body?.totalCount) ?? totalCount;

    if (pageItems.length < NUM_OF_ROWS) {
      break;
    }

    if (totalCount !== null && items.length >= totalCount) {
      break;
    }
  }

  return items;
}

function buildFishingIndexUrl(serviceKey: string, pageNo: number) {
  const url = new URL(FISHING_INDEX_API_URL);

  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set("type", "json");
  url.searchParams.set("gubun", FISHING_TYPE);
  url.searchParams.set("pageNo", pageNo.toString());
  url.searchParams.set("numOfRows", NUM_OF_ROWS.toString());

  return url;
}

function normalizeApiItemArray(
  item: FishingIndexApiItem[] | FishingIndexApiItem | undefined,
) {
  if (!item) {
    return [];
  }

  return Array.isArray(item) ? item : [item];
}

function normalizeFishingIndexItems(items: FishingIndexApiItem[]) {
  return items.flatMap((item) => {
    const locationName = toTrimmedString(item.seafsPstnNm);
    const latitude = toNumber(item.lat);
    const longitude = toNumber(item.lot);
    const forecastDate = parseForecastDate(item.predcYmd);
    const forecastTime = parseForecastTime(item.predcNoonSeCd);
    const targetSpeciesName =
      toTrimmedString(item.seafsTgfshNm) ?? UNKNOWN_TARGET_SPECIES_NAME;

    if (!locationName || latitude === null || longitude === null) {
      return [];
    }

    if (!forecastDate || !forecastTime) {
      return [];
    }

    const externalLocationId = buildExternalLocationId({
      latitude,
      locationName,
      longitude,
    });

    return [
      {
        externalForecastId: [
          externalLocationId,
          FISHING_TYPE,
          targetSpeciesName,
          forecastDate,
          forecastTime,
        ].join(":"),
        externalLocationId,
        forecastDate,
        forecastTime,
        item,
        latitude,
        locationName,
        longitude,
        targetSpeciesName,
      },
    ];
  });
}

function buildExternalLocationId({
  latitude,
  locationName,
  longitude,
}: {
  latitude: number;
  locationName: string;
  longitude: number;
}) {
  return [
    normalizeLocationName(locationName),
    latitude.toFixed(5),
    longitude.toFixed(5),
  ].join(":");
}

async function upsertLocations(
  supabase: ReturnType<typeof createClient>,
  items: NormalizedFishingIndexItem[],
) {
  const uniqueLocationRows = Array.from(
    new Map(
      items.map((item) => [
        item.externalLocationId,
        {
          external_location_id: item.externalLocationId,
          latitude: item.latitude,
          location_type_id: LOCATION_TYPE_SALTWATER,
          longitude: item.longitude,
          metadata: {
            fishingType: FISHING_TYPE,
            providerPlaceName: item.locationName,
          },
          name: item.locationName,
          source: FISHING_INDEX_SOURCE,
        },
      ]),
    ).values(),
  );

  if (uniqueLocationRows.length === 0) {
    return new Map<string, number>();
  }

  const { data, error } = await supabase
    .from("fishing_locations")
    .upsert(uniqueLocationRows, {
      onConflict: "source,external_location_id",
    })
    .select("id, external_location_id")
    .returns<LocationRow[]>();

  if (error) {
    throw error;
  }

  return new Map(
    (data ?? []).map((location) => [
      location.external_location_id,
      location.id,
    ]),
  );
}

function buildForecastRows(
  items: NormalizedFishingIndexItem[],
  locations: Map<string, number>,
) {
  return items.flatMap((item) => {
    const locationId = locations.get(item.externalLocationId);

    if (!locationId) {
      return [];
    }

    const fishingIndexGrade = toTrimmedString(item.item.totalIndex);
    const fishingIndexScore = toNumber(item.item.lastScr);

    if (fishingIndexGrade === null && fishingIndexScore === null) {
      return [];
    }

    return [
      {
        air_temp_max_c: toNumber(item.item.maxArtmp),
        air_temp_min_c: toNumber(item.item.minArtmp),
        current_speed_max_kn: toNumber(item.item.maxCrsp),
        current_speed_min_kn: toNumber(item.item.minCrsp),
        external_forecast_id: item.externalForecastId,
        fetched_at: new Date().toISOString(),
        fishing_index_grade: fishingIndexGrade,
        fishing_index_score: fishingIndexScore,
        fishing_type: FISHING_TYPE,
        forecast_date: item.forecastDate,
        forecast_time: item.forecastTime,
        location_id: locationId,
        raw_payload: item.item,
        source: FISHING_INDEX_SOURCE,
        target_species_name: item.targetSpeciesName,
        tide: toTrimmedString(item.item.tdlvHrCn),
        water_temp_max_c: toNumber(item.item.maxWtem),
        water_temp_min_c: toNumber(item.item.minWtem),
        wave_height_max_m: toNumber(item.item.maxWvhgt),
        wave_height_min_m: toNumber(item.item.minWvhgt),
        wind_speed_max_ms: toNumber(item.item.maxWspd),
        wind_speed_min_ms: toNumber(item.item.minWspd),
      },
    ];
  }) satisfies ForecastRow[];
}

function dedupeForecastRows(rows: ForecastRow[]) {
  const uniqueRows = new Map<string, ForecastRow>();

  for (const row of rows) {
    const key = [
      row.source,
      row.location_id,
      row.fishing_type,
      row.target_species_name,
      row.forecast_date,
      row.forecast_time,
    ].join(":");
    const existingRow = uniqueRows.get(key);

    if (!existingRow) {
      uniqueRows.set(key, row);
      continue;
    }

    uniqueRows.set(key, {
      ...row,
      raw_payload: {
        ...row.raw_payload,
        duplicateItems: collectDuplicatePayloads(
          existingRow.raw_payload,
          row.raw_payload,
        ),
      },
    });
  }

  return Array.from(uniqueRows.values());
}

function collectDuplicatePayloads(
  existingPayload: Record<string, unknown>,
  nextPayload: Record<string, unknown>,
) {
  const existingDuplicateItems = Array.isArray(existingPayload.duplicateItems)
    ? existingPayload.duplicateItems
    : [existingPayload];

  return [...existingDuplicateItems, nextPayload];
}

function parseForecastDate(value: unknown) {
  const text = toTrimmedString(value);

  if (!text) {
    return null;
  }

  const compactMatch = /^(\d{4})(\d{2})(\d{2})$/.exec(text);

  if (compactMatch) {
    return [compactMatch[1], compactMatch[2], compactMatch[3]].join("-");
  }

  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);

  return isoMatch ? text : null;
}

function parseForecastTime(value: unknown) {
  const text = toTrimmedString(value)?.toLowerCase();

  if (!text) {
    return "12:00:00";
  }

  if (["오전", "am", "a", "1", "01", "morning"].includes(text)) {
    return "06:00:00";
  }

  if (["오후", "pm", "p", "2", "02", "afternoon"].includes(text)) {
    return "18:00:00";
  }

  return "12:00:00";
}

function normalizeLocationName(value: string) {
  return value.replace(/\s+/g, "");
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
