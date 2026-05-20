import "jsr:@supabase/functions-js/edge-runtime.d.ts";

import { createClient } from "npm:@supabase/supabase-js@2";

const KAKAO_LOCAL_BASE_URL = "https://dapi.kakao.com/v2/local";
const CATCH_DRAFT_INTERNAL_FUNCTION_TIMEOUT_MS = 45_000;
const EARTH_RADIUS_KM = 6_371;
const FISHING_INDEX_FISHING_TYPE = "갯바위";
const SEOUL_TIME_ZONE = "Asia/Seoul";
const WEATHER_FORECAST_CANDIDATE_LIMIT = 30;
const WEATHER_LOCATION_SEARCH_DELTAS = [0.15, 0.5, 1.2, 2.5] as const;

const corsHeaders = {
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Origin": "*",
};

type WaterType = "saltwater" | "freshwater";
type CapturedAtSource = "photo_exif" | "device_time" | "manual" | "none";
type LocationSource =
  | "photo_exif"
  | "current_gps"
  | "map"
  | "manual"
  | "none";
type AddressSource = "kakao_local" | "none";
type WeatherSource = "stored_weather" | "none";
type SpeciesSource = "gemini" | "none";

interface CreatePhotoCatchDraftRequest {
  capturedAt: string | null;
  capturedAtSource: CapturedAtSource;
  imagePath: string;
  latitude: number | null;
  locationSource: LocationSource;
  longitude: number | null;
  waterType: WaterType;
}

interface KakaoLocationDraft {
  address: string | null;
  pointName: string | null;
  regionName: string | null;
  source: AddressSource;
}

interface WeatherLocationRow {
  id: number;
  kma_nx: number;
  kma_ny: number;
  latitude: number;
  longitude: number;
  name: string;
  region_name: string;
}

interface WeatherForecastRow {
  air_temp_c: number | null;
  forecast_date: string;
  forecast_time: string;
  humidity_percent: number | null;
  id: number;
  kma_nx: number;
  kma_ny: number;
  precipitation_amount_mm: number | null;
  precipitation_probability_percent: number | null;
  weather_condition: string | null;
  wind_direction_deg: number | null;
  wind_speed_ms: number | null;
}

interface WeatherDraft {
  airTempC: number | null;
  humidityPercent: number | null;
  precipitationAmountMm: number | null;
  precipitationProbabilityPercent: number | null;
  source: WeatherSource;
  weather: string | null;
  weatherForecastId: number | null;
  weatherLocationId: number | null;
  windDirectionDeg: number | null;
  windSpeedMs: number | null;
}

interface WeatherForecastMatch {
  forecast: WeatherForecastRow | null;
  weatherLocation: WeatherLocationRow | null;
}

interface FishingLocationRow {
  id: number;
  latitude: number;
  longitude: number;
  name: string;
}

interface FishingIndexForecastRow {
  air_temp_max_c: number | null;
  air_temp_min_c: number | null;
  current_speed_max_kn: number | null;
  current_speed_min_kn: number | null;
  fishing_index_grade: string | null;
  fishing_index_score: number | null;
  forecast_date: string;
  forecast_time: string;
  id: number;
  target_species_name: string;
  tide: string | null;
  water_temp_max_c: number | null;
  water_temp_min_c: number | null;
  wave_height_max_m: number | null;
  wave_height_min_m: number | null;
  wind_speed_max_ms: number | null;
  wind_speed_min_ms: number | null;
}

interface FishingIndexDraft {
  airTempC: number | null;
  currentSpeedKn: number | null;
  fishingIndexForecastId: number | null;
  fishingIndexGrade: string | null;
  fishingIndexScore: number | null;
  fishingLocationId: number | null;
  pointName: string | null;
  tide: string | null;
  waterTempC: number | null;
  waveHeightM: number | null;
  windSpeedMs: number | null;
}

interface SpeciesCandidate {
  confidence: number;
  reason: string;
  speciesId: number | null;
  speciesName: string;
}

interface SpeciesDraft {
  predictionId: number | null;
  source: SpeciesSource;
  speciesCandidates: SpeciesCandidate[];
}

interface DetectFishSpeciesResponse {
  candidates?: unknown;
  predictionId?: unknown;
}

interface KakaoCoord2AddressResponse {
  documents?: KakaoAddressDocument[];
  meta?: {
    total_count?: number;
  };
}

interface KakaoAddressDocument {
  address?: {
    address_name?: string;
    region_1depth_name?: string;
    region_2depth_name?: string;
    region_3depth_name?: string;
  } | null;
  road_address?: {
    address_name?: string;
    region_1depth_name?: string;
    region_2depth_name?: string;
    region_3depth_name?: string;
  } | null;
}

interface KakaoCoord2RegionCodeResponse {
  documents?: KakaoRegionDocument[];
  meta?: {
    total_count?: number;
  };
}

interface KakaoRegionDocument {
  address_name?: string;
  region_1depth_name?: string;
  region_2depth_name?: string;
  region_3depth_name?: string;
  region_4depth_name?: string;
  region_type?: "B" | "H" | string;
}

class PublicHttpError extends Error {
  code: string;
  status: number;

  constructor({
    code,
    message,
    status,
  }: {
    code: string;
    message: string;
    status: number;
  }) {
    super(message);
    this.code = code;
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

    const request = parseCreatePhotoCatchDraftRequest(await readJson(req));

    if (!isOwnImagePath(request.imagePath, user.id)) {
      return jsonResponse({ message: "Invalid imagePath." }, 403);
    }

    const [kakaoLocationResult, weatherDraftResult, speciesDraftResult] =
      await Promise.allSettled([
        enrichLocationFromKakao({
          latitude: request.latitude ?? null,
          longitude: request.longitude ?? null,
        }),
        enrichWeatherFromStoredForecasts(supabase, request),
        detectSpeciesFromImage({
          authorization,
          imagePath: request.imagePath,
          waterType: request.waterType,
        }),
      ]);
    const kakaoLocation = getSettledValue(
      kakaoLocationResult,
      {
        address: null,
        pointName: null,
        regionName: null,
        source: "none" as const,
      },
      "Kakao Local enrichment failed",
    );
    const weatherDraft = getSettledValue(
      weatherDraftResult,
      createEmptyWeatherDraft(),
      "Stored weather enrichment failed",
    );
    const speciesDraft = getSettledValue(
      speciesDraftResult,
      createEmptySpeciesDraft(),
      "Gemini species enrichment failed",
    );
    const fishingIndexDraft =
      request.waterType === "saltwater"
        ? await enrichFishingIndexFromStoredForecasts({
            capturedAt: request.capturedAt,
            latitude: request.latitude ?? null,
            longitude: request.longitude ?? null,
            speciesCandidates: speciesDraft.speciesCandidates,
            supabase,
          }).catch((error) => {
            console.warn(
              "Fishing index enrichment failed",
              normalizeErrorForLog(error),
            );
            return createEmptyFishingIndexDraft();
          })
        : createEmptyFishingIndexDraft();

    return jsonResponse({
      address: kakaoLocation.address,
      airTempC: fishingIndexDraft.airTempC ?? weatherDraft.airTempC,
      capturedAt: request.capturedAt ?? null,
      currentSpeedKn: fishingIndexDraft.currentSpeedKn,
      fishingIndexForecastId: fishingIndexDraft.fishingIndexForecastId,
      fishingIndexGrade: fishingIndexDraft.fishingIndexGrade,
      fishingIndexScore: fishingIndexDraft.fishingIndexScore,
      fishingLocationId: fishingIndexDraft.fishingLocationId,
      humidityPercent: weatherDraft.humidityPercent,
      imagePath: request.imagePath,
      latitude: request.latitude ?? null,
      longitude: request.longitude ?? null,
      pointName: kakaoLocation.pointName ?? fishingIndexDraft.pointName,
      precipitationAmountMm: weatherDraft.precipitationAmountMm,
      precipitationProbabilityPercent:
        weatherDraft.precipitationProbabilityPercent,
      predictionId: speciesDraft.predictionId,
      regionName: kakaoLocation.regionName,
      sources: {
        address: kakaoLocation.source,
        capturedAt: request.capturedAtSource,
        location: request.locationSource,
        species: speciesDraft.source,
        weather: weatherDraft.source,
      },
      speciesCandidates: speciesDraft.speciesCandidates,
      tide: fishingIndexDraft.tide,
      waterTempC: fishingIndexDraft.waterTempC,
      waveHeightM: fishingIndexDraft.waveHeightM,
      weather: weatherDraft.weather,
      weatherForecastId: weatherDraft.weatherForecastId,
      weatherLocationId: weatherDraft.weatherLocationId,
      windDirectionDeg: weatherDraft.windDirectionDeg,
      windSpeedMs: fishingIndexDraft.windSpeedMs ?? weatherDraft.windSpeedMs,
    });
  } catch (error) {
    console.error(
      "create-photo-catch-draft failed",
      normalizeErrorForLog(error),
    );

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
        code: "PHOTO_CATCH_DRAFT_FAILED",
        message:
          "사진 조과 초안 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.",
      },
      500,
    );
  }
});

async function enrichLocationFromKakao({
  latitude,
  longitude,
}: {
  latitude: number | null;
  longitude: number | null;
}): Promise<KakaoLocationDraft> {
  const emptyLocation = {
    address: null,
    pointName: null,
    regionName: null,
    source: "none" as const,
  };

  if (latitude === null || longitude === null) {
    return emptyLocation;
  }

  const kakaoRestApiKey =
    Deno.env.get("KAKAO_REST_API_KEY") ??
    Deno.env.get("KAKAO_LOCAL_REST_API_KEY");

  if (!kakaoRestApiKey) {
    console.warn("Kakao Local skipped because KAKAO_REST_API_KEY is missing.");
    return emptyLocation;
  }

  const [addressResult, regionResult] = await Promise.allSettled([
    fetchKakaoCoord2Address({ kakaoRestApiKey, latitude, longitude }),
    fetchKakaoCoord2RegionCode({ kakaoRestApiKey, latitude, longitude }),
  ]);
  const addressPayload =
    addressResult.status === "fulfilled" ? addressResult.value : null;
  const regionPayload =
    regionResult.status === "fulfilled" ? regionResult.value : null;

  if (addressResult.status === "rejected") {
    console.warn(
      "Kakao coord2address failed",
      normalizeErrorForLog(addressResult.reason),
    );
  }

  if (regionResult.status === "rejected") {
    console.warn(
      "Kakao coord2regioncode failed",
      normalizeErrorForLog(regionResult.reason),
    );
  }

  const address = getBestKakaoAddress(addressPayload);
  const regionName = getBestKakaoRegionName(regionPayload);

  if (!address && !regionName) {
    return emptyLocation;
  }

  return {
    address,
    pointName: null,
    regionName,
    source: "kakao_local",
  };
}

async function enrichWeatherFromStoredForecasts(
  supabase: ReturnType<typeof createClient>,
  request: CreatePhotoCatchDraftRequest,
): Promise<WeatherDraft> {
  const emptyDraft = createEmptyWeatherDraft();

  if (request.latitude === null || request.longitude === null) {
    return emptyDraft;
  }

  const targetDateTime = getSeoulDateTime(request.capturedAt);
  const weatherMatch = await findNearestWeatherForecastMatch({
    latitude: request.latitude,
    longitude: request.longitude,
    supabase,
    targetDateTime,
  });
  const weatherLocation = weatherMatch.weatherLocation;

  if (!weatherLocation) {
    return emptyDraft;
  }

  const forecast = weatherMatch.forecast;

  if (!forecast) {
    return {
      ...emptyDraft,
      weatherLocationId: weatherLocation.id,
    };
  }

  return {
    airTempC: forecast.air_temp_c,
    humidityPercent: forecast.humidity_percent,
    precipitationAmountMm: forecast.precipitation_amount_mm,
    precipitationProbabilityPercent:
      forecast.precipitation_probability_percent,
    source: "stored_weather",
    weather: forecast.weather_condition,
    weatherForecastId: forecast.id,
    weatherLocationId: weatherLocation.id,
    windDirectionDeg: forecast.wind_direction_deg,
    windSpeedMs: forecast.wind_speed_ms,
  };
}

async function enrichFishingIndexFromStoredForecasts({
  capturedAt,
  latitude,
  longitude,
  speciesCandidates,
  supabase,
}: {
  capturedAt: string | null;
  latitude: number | null;
  longitude: number | null;
  speciesCandidates: SpeciesCandidate[];
  supabase: ReturnType<typeof createClient>;
}): Promise<FishingIndexDraft> {
  const emptyDraft = createEmptyFishingIndexDraft();

  if (latitude === null || longitude === null) {
    return emptyDraft;
  }

  const fishingLocation = await findNearestFishingLocation({
    latitude,
    longitude,
    supabase,
  });

  if (!fishingLocation) {
    return emptyDraft;
  }

  const targetDateTime = getSeoulDateTime(capturedAt);
  const { data, error } = await supabase
    .from("fishing_index_forecasts")
    .select(
      "id, forecast_date, forecast_time, target_species_name, tide, water_temp_min_c, water_temp_max_c, air_temp_min_c, air_temp_max_c, current_speed_min_kn, current_speed_max_kn, wind_speed_min_ms, wind_speed_max_ms, wave_height_min_m, wave_height_max_m, fishing_index_score, fishing_index_grade",
    )
    .eq("location_id", fishingLocation.id)
    .eq("fishing_type", FISHING_INDEX_FISHING_TYPE)
    .gte("forecast_date", addDays(targetDateTime.date, -1))
    .lte("forecast_date", addDays(targetDateTime.date, 1))
    .order("forecast_date", { ascending: true })
    .order("forecast_time", { ascending: true })
    .limit(120)
    .returns<FishingIndexForecastRow[]>();

  if (error) {
    throw error;
  }

  const forecast = findBestFishingIndexForecast({
    forecasts: data ?? [],
    speciesCandidates,
    targetTimestampMs: targetDateTime.timestampMs,
  });

  if (!forecast) {
    return {
      ...emptyDraft,
      fishingLocationId: fishingLocation.id,
      pointName: fishingLocation.name,
    };
  }

  return {
    airTempC: averageNullable(
      forecast.air_temp_min_c,
      forecast.air_temp_max_c,
    ),
    currentSpeedKn: averageNullable(
      forecast.current_speed_min_kn,
      forecast.current_speed_max_kn,
    ),
    fishingIndexForecastId: forecast.id,
    fishingIndexGrade: forecast.fishing_index_grade,
    fishingIndexScore: forecast.fishing_index_score,
    fishingLocationId: fishingLocation.id,
    pointName: fishingLocation.name,
    tide: forecast.tide,
    waterTempC: averageNullable(
      forecast.water_temp_min_c,
      forecast.water_temp_max_c,
    ),
    waveHeightM: averageNullable(
      forecast.wave_height_min_m,
      forecast.wave_height_max_m,
    ),
    windSpeedMs: averageNullable(
      forecast.wind_speed_min_ms,
      forecast.wind_speed_max_ms,
    ),
  };
}

async function detectSpeciesFromImage({
  authorization,
  imagePath,
  waterType,
}: {
  authorization: string;
  imagePath: string;
  waterType: WaterType;
}): Promise<SpeciesDraft> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
      "Gemini species enrichment skipped because Supabase function config is missing.",
    );
    return createEmptySpeciesDraft();
  }

  const abortController = new AbortController();
  const timeoutId = setTimeout(
    () => abortController.abort(),
    CATCH_DRAFT_INTERNAL_FUNCTION_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${supabaseUrl}/functions/v1/detect-fish-species`, {
      body: JSON.stringify({ imagePath, waterType }),
      headers: {
        apikey: supabaseAnonKey,
        Authorization: authorization,
        "Content-Type": "application/json",
      },
      method: "POST",
      signal: abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`detect-fish-species returned ${response.status}.`);
    }

    const payload = (await response.json()) as DetectFishSpeciesResponse;
    const speciesCandidates = normalizeSpeciesCandidates(payload.candidates);

    return {
      predictionId: normalizePositiveInteger(payload.predictionId),
      source: speciesCandidates.length > 0 ? "gemini" : "none",
      speciesCandidates,
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

async function findNearestWeatherForecastMatch({
  latitude,
  longitude,
  supabase,
  targetDateTime,
}: {
  latitude: number;
  longitude: number;
  supabase: ReturnType<typeof createClient>;
  targetDateTime: ReturnType<typeof getSeoulDateTime>;
}): Promise<WeatherForecastMatch> {
  let fallbackWeatherLocation: WeatherLocationRow | null = null;
  const checkedGridKeys = new Set<string>();

  for (const delta of WEATHER_LOCATION_SEARCH_DELTAS) {
    const { data, error } = await supabase
      .from("weather_locations")
      .select("id, name, region_name, latitude, longitude, kma_nx, kma_ny")
      .eq("is_active", true)
      .gte("latitude", latitude - delta)
      .lte("latitude", latitude + delta)
      .gte("longitude", longitude - delta)
      .lte("longitude", longitude + delta)
      .limit(200)
      .returns<WeatherLocationRow[]>();

    if (error) {
      throw error;
    }

    const sortedLocations = sortByDistance(data ?? [], latitude, longitude);
    const candidates = getUncheckedWeatherGridCandidates(
      sortedLocations,
      checkedGridKeys,
    );

    if (!fallbackWeatherLocation && sortedLocations[0]) {
      fallbackWeatherLocation = sortedLocations[0];
    }

    if (candidates.length === 0) {
      continue;
    }

    for (const weatherLocation of candidates) {
      checkedGridKeys.add(getWeatherGridKey(weatherLocation));
    }

    const forecasts = await getWeatherForecastRowsForLocations({
      supabase,
      targetDateTime,
      weatherLocations: candidates,
    });
    const forecastsByGrid = groupWeatherForecastRowsByGrid(forecasts);

    for (const weatherLocation of candidates) {
      const gridForecasts =
        forecastsByGrid.get(getWeatherGridKey(weatherLocation)) ?? [];
      const forecast = findNearestForecastSlot(
        gridForecasts,
        targetDateTime.timestampMs,
      );

      if (forecast) {
        return {
          forecast,
          weatherLocation,
        };
      }
    }
  }

  return {
    forecast: null,
    weatherLocation: fallbackWeatherLocation,
  };
}

async function getWeatherForecastRowsForLocations({
  supabase,
  targetDateTime,
  weatherLocations,
}: {
  supabase: ReturnType<typeof createClient>;
  targetDateTime: ReturnType<typeof getSeoulDateTime>;
  weatherLocations: WeatherLocationRow[];
}) {
  const gridFilters = weatherLocations
    .map((weatherLocation) => {
      return `and(kma_nx.eq.${weatherLocation.kma_nx},kma_ny.eq.${weatherLocation.kma_ny})`;
    })
    .join(",");

  if (gridFilters.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("weather_forecasts")
    .select(
      "id, forecast_date, forecast_time, kma_nx, kma_ny, weather_condition, air_temp_c, precipitation_probability_percent, precipitation_amount_mm, humidity_percent, wind_direction_deg, wind_speed_ms",
    )
    .or(gridFilters)
    .gte("forecast_date", addDays(targetDateTime.date, -1))
    .lte("forecast_date", addDays(targetDateTime.date, 1))
    .order("forecast_date", { ascending: true })
    .order("forecast_time", { ascending: true })
    .limit(weatherLocations.length * 80)
    .returns<WeatherForecastRow[]>();

  if (error) {
    throw error;
  }

  return data ?? [];
}

function groupWeatherForecastRowsByGrid(rows: WeatherForecastRow[]) {
  const rowsByGrid = new Map<string, WeatherForecastRow[]>();

  for (const row of rows) {
    const gridKey = getWeatherGridKey(row);
    const gridRows = rowsByGrid.get(gridKey) ?? [];
    gridRows.push(row);
    rowsByGrid.set(gridKey, gridRows);
  }

  return rowsByGrid;
}

function getUncheckedWeatherGridCandidates(
  sortedLocations: WeatherLocationRow[],
  checkedGridKeys: Set<string>,
) {
  const candidates: WeatherLocationRow[] = [];
  const candidateGridKeys = new Set(checkedGridKeys);

  for (const weatherLocation of sortedLocations) {
    const gridKey = getWeatherGridKey(weatherLocation);

    if (candidateGridKeys.has(gridKey)) {
      continue;
    }

    candidateGridKeys.add(gridKey);
    candidates.push(weatherLocation);

    if (candidates.length >= WEATHER_FORECAST_CANDIDATE_LIMIT) {
      break;
    }
  }

  return candidates;
}

function getWeatherGridKey(grid: { kma_nx: number; kma_ny: number }) {
  return `${grid.kma_nx}:${grid.kma_ny}`;
}

async function findNearestFishingLocation({
  latitude,
  longitude,
  supabase,
}: {
  latitude: number;
  longitude: number;
  supabase: ReturnType<typeof createClient>;
}) {
  for (const delta of [0.25, 0.75, 1.5]) {
    const { data, error } = await supabase
      .from("fishing_locations")
      .select("id, name, latitude, longitude")
      .eq("is_active", true)
      .eq("location_type_id", 2)
      .gte("latitude", latitude - delta)
      .lte("latitude", latitude + delta)
      .gte("longitude", longitude - delta)
      .lte("longitude", longitude + delta)
      .limit(200)
      .returns<FishingLocationRow[]>();

    if (error) {
      throw error;
    }

    const nearest = findNearestByDistance(data ?? [], latitude, longitude);

    if (nearest) {
      return nearest;
    }
  }

  return null;
}

function findNearestByDistance<
  Row extends { latitude: number; longitude: number },
>(rows: Row[], latitude: number, longitude: number) {
  let nearest: Row | null = null;
  let nearestDistanceKm = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    const distanceKm = haversineDistanceKm({
      fromLatitude: latitude,
      fromLongitude: longitude,
      toLatitude: row.latitude,
      toLongitude: row.longitude,
    });

    if (distanceKm < nearestDistanceKm) {
      nearest = row;
      nearestDistanceKm = distanceKm;
    }
  }

  return nearest;
}

function sortByDistance<Row extends { latitude: number; longitude: number }>(
  rows: Row[],
  latitude: number,
  longitude: number,
) {
  return [...rows].sort((left, right) => {
    const leftDistanceKm = haversineDistanceKm({
      fromLatitude: latitude,
      fromLongitude: longitude,
      toLatitude: left.latitude,
      toLongitude: left.longitude,
    });
    const rightDistanceKm = haversineDistanceKm({
      fromLatitude: latitude,
      fromLongitude: longitude,
      toLatitude: right.latitude,
      toLongitude: right.longitude,
    });

    return leftDistanceKm - rightDistanceKm;
  });
}

function findNearestForecastSlot<Row extends { forecast_date: string; forecast_time: string }>(
  rows: Row[],
  targetTimestampMs: number,
) {
  let nearest: Row | null = null;
  let nearestDiffMs = Number.POSITIVE_INFINITY;

  for (const row of rows) {
    const timestampMs = getForecastTimestampMs(row);
    const diffMs = Math.abs(timestampMs - targetTimestampMs);

    if (diffMs < nearestDiffMs) {
      nearest = row;
      nearestDiffMs = diffMs;
    }
  }

  return nearest;
}

function findBestFishingIndexForecast({
  forecasts,
  speciesCandidates,
  targetTimestampMs,
}: {
  forecasts: FishingIndexForecastRow[];
  speciesCandidates: SpeciesCandidate[];
  targetTimestampMs: number;
}) {
  const preferredSpeciesNames = new Set(
    speciesCandidates
      .filter((candidate) => candidate.confidence >= 0.2)
      .map((candidate) => normalizeComparableText(candidate.speciesName)),
  );
  let bestForecast: FishingIndexForecastRow | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const forecast of forecasts) {
    const speciesScore = getFishingIndexSpeciesScore({
      preferredSpeciesNames,
      targetSpeciesName: forecast.target_species_name,
    });
    const timeScore =
      Math.abs(getForecastTimestampMs(forecast) - targetTimestampMs) /
      (60 * 60 * 1000);
    const score = speciesScore * 1_000 + timeScore;

    if (score < bestScore) {
      bestForecast = forecast;
      bestScore = score;
    }
  }

  return bestForecast;
}

function getFishingIndexSpeciesScore({
  preferredSpeciesNames,
  targetSpeciesName,
}: {
  preferredSpeciesNames: Set<string>;
  targetSpeciesName: string;
}) {
  const normalizedTargetSpeciesName = normalizeComparableText(targetSpeciesName);

  if (
    preferredSpeciesNames.size > 0 &&
    preferredSpeciesNames.has(normalizedTargetSpeciesName)
  ) {
    return 0;
  }

  if (
    normalizedTargetSpeciesName === normalizeComparableText("기타어종") ||
    normalizedTargetSpeciesName === normalizeComparableText("미분류")
  ) {
    return 1;
  }

  return preferredSpeciesNames.size > 0 ? 2 : 0;
}

function getSeoulDateTime(value: string | null) {
  const date = value ? new Date(value) : new Date();
  const safeDate = Number.isFinite(date.getTime()) ? date : new Date();
  const formatter = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
    minute: "2-digit",
    month: "2-digit",
    second: "2-digit",
    timeZone: SEOUL_TIME_ZONE,
    year: "numeric",
  });
  const parts = Object.fromEntries(
    formatter.formatToParts(safeDate).map((part) => [part.type, part.value]),
  );
  const dateText = `${parts.year}-${parts.month}-${parts.day}`;
  const timeText = `${parts.hour}:${parts.minute}:${parts.second}`;

  return {
    date: dateText,
    time: timeText,
    timestampMs: safeDate.getTime(),
  };
}

function getForecastTimestampMs({
  forecast_date,
  forecast_time,
}: {
  forecast_date: string;
  forecast_time: string;
}) {
  return new Date(`${forecast_date}T${forecast_time}+09:00`).getTime();
}

function addDays(dateText: string, dayOffset: number) {
  const [year, month, day] = dateText.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + dayOffset));

  return date.toISOString().slice(0, 10);
}

function haversineDistanceKm({
  fromLatitude,
  fromLongitude,
  toLatitude,
  toLongitude,
}: {
  fromLatitude: number;
  fromLongitude: number;
  toLatitude: number;
  toLongitude: number;
}) {
  const latitudeDelta = toRadians(toLatitude - fromLatitude);
  const longitudeDelta = toRadians(toLongitude - fromLongitude);
  const fromLatitudeRadians = toRadians(fromLatitude);
  const toLatitudeRadians = toRadians(toLatitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitudeRadians) *
      Math.cos(toLatitudeRadians) *
      Math.sin(longitudeDelta / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

function averageNullable(first: number | null, second: number | null) {
  if (first !== null && second !== null) {
    return Number(((first + second) / 2).toFixed(2));
  }

  return first ?? second;
}

function normalizeSpeciesCandidates(value: unknown): SpeciesCandidate[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((candidate) => {
    if (!candidate || typeof candidate !== "object") {
      return [];
    }

    const record = candidate as Record<string, unknown>;
    const confidence =
      typeof record.confidence === "number" && Number.isFinite(record.confidence)
        ? record.confidence
        : null;
    const reason = normalizeNullableString(record.reason) ?? "";
    const speciesName = normalizeNullableString(record.speciesName);

    if (confidence === null || speciesName === null) {
      return [];
    }

    return [
      {
        confidence,
        reason,
        speciesId: normalizePositiveInteger(record.speciesId),
        speciesName,
      },
    ];
  });
}

function normalizePositiveInteger(value: unknown) {
  return typeof value === "number" && Number.isInteger(value) && value > 0
    ? value
    : null;
}

function normalizeComparableText(value: string) {
  return value.trim().replace(/\s+/g, "").toLowerCase();
}

function createEmptyWeatherDraft(): WeatherDraft {
  return {
    airTempC: null,
    humidityPercent: null,
    precipitationAmountMm: null,
    precipitationProbabilityPercent: null,
    source: "none",
    weather: null,
    weatherForecastId: null,
    weatherLocationId: null,
    windDirectionDeg: null,
    windSpeedMs: null,
  };
}

function createEmptyFishingIndexDraft(): FishingIndexDraft {
  return {
    airTempC: null,
    currentSpeedKn: null,
    fishingIndexForecastId: null,
    fishingIndexGrade: null,
    fishingIndexScore: null,
    fishingLocationId: null,
    pointName: null,
    tide: null,
    waterTempC: null,
    waveHeightM: null,
    windSpeedMs: null,
  };
}

function createEmptySpeciesDraft(): SpeciesDraft {
  return {
    predictionId: null,
    source: "none",
    speciesCandidates: [],
  };
}

function getSettledValue<T>(
  result: PromiseSettledResult<T>,
  fallback: T,
  warningMessage: string,
) {
  if (result.status === "fulfilled") {
    return result.value;
  }

  console.warn(warningMessage, normalizeErrorForLog(result.reason));
  return fallback;
}

async function fetchKakaoCoord2Address({
  kakaoRestApiKey,
  latitude,
  longitude,
}: {
  kakaoRestApiKey: string;
  latitude: number;
  longitude: number;
}) {
  const url = buildKakaoGeoUrl("coord2address", latitude, longitude);
  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${kakaoRestApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kakao coord2address returned ${response.status}.`);
  }

  return (await response.json()) as KakaoCoord2AddressResponse;
}

async function fetchKakaoCoord2RegionCode({
  kakaoRestApiKey,
  latitude,
  longitude,
}: {
  kakaoRestApiKey: string;
  latitude: number;
  longitude: number;
}) {
  const url = buildKakaoGeoUrl("coord2regioncode", latitude, longitude);
  const response = await fetch(url, {
    headers: {
      Authorization: `KakaoAK ${kakaoRestApiKey}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Kakao coord2regioncode returned ${response.status}.`);
  }

  return (await response.json()) as KakaoCoord2RegionCodeResponse;
}

function buildKakaoGeoUrl(
  endpoint: "coord2address" | "coord2regioncode",
  latitude: number,
  longitude: number,
) {
  const url = new URL(`${KAKAO_LOCAL_BASE_URL}/geo/${endpoint}.json`);
  url.searchParams.set("x", String(longitude));
  url.searchParams.set("y", String(latitude));
  url.searchParams.set("input_coord", "WGS84");

  return url;
}

function getBestKakaoAddress(payload: KakaoCoord2AddressResponse | null) {
  const document = payload?.documents?.[0];
  const roadAddress = normalizeNullableString(
    document?.road_address?.address_name,
  );
  const jibunAddress = normalizeNullableString(document?.address?.address_name);

  return roadAddress ?? jibunAddress;
}

function getBestKakaoRegionName(payload: KakaoCoord2RegionCodeResponse | null) {
  const documents = payload?.documents ?? [];
  const administrativeRegion =
    documents.find((document) => document.region_type === "H") ?? null;
  const legalRegion =
    documents.find((document) => document.region_type === "B") ?? null;
  const selectedRegion = administrativeRegion ?? legalRegion ?? documents[0];

  return normalizeNullableString(selectedRegion?.address_name);
}

async function readJson(req: Request) {
  try {
    return (await req.json()) as unknown;
  } catch {
    throw new PublicHttpError({
      code: "INVALID_JSON",
      message: "요청 본문이 올바른 JSON 형식이 아닙니다.",
      status: 400,
    });
  }
}

function parseCreatePhotoCatchDraftRequest(
  body: unknown,
): CreatePhotoCatchDraftRequest {
  if (!body || typeof body !== "object") {
    throw new PublicHttpError({
      code: "INVALID_REQUEST",
      message: "요청 본문이 올바르지 않습니다.",
      status: 400,
    });
  }

  const record = body as Record<string, unknown>;
  const imagePath = normalizeRequiredString(record.imagePath, "imagePath");
  const waterType = normalizeWaterType(record.waterType);
  const capturedAtSource = normalizeCapturedAtSource(record.capturedAtSource);
  const locationSource = normalizeLocationSource(record.locationSource);
  const capturedAt = normalizeOptionalCapturedAt(record.capturedAt);
  const latitude = normalizeOptionalLatitude(record.latitude);
  const longitude = normalizeOptionalLongitude(record.longitude);

  return {
    capturedAt,
    capturedAtSource,
    imagePath,
    latitude,
    locationSource,
    longitude,
    waterType,
  };
}

function normalizeRequiredString(value: unknown, fieldName: string) {
  if (typeof value !== "string") {
    throw new PublicHttpError({
      code: "INVALID_REQUEST",
      message: `${fieldName} 값이 올바르지 않습니다.`,
      status: 400,
    });
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new PublicHttpError({
      code: "INVALID_REQUEST",
      message: `${fieldName} 값이 비어 있습니다.`,
      status: 400,
    });
  }

  return trimmed;
}

function normalizeWaterType(value: unknown): WaterType {
  if (value === "saltwater" || value === "freshwater") {
    return value;
  }

  throw new PublicHttpError({
    code: "INVALID_WATER_TYPE",
    message: "waterType 값이 올바르지 않습니다.",
    status: 400,
  });
}

function normalizeCapturedAtSource(value: unknown): CapturedAtSource {
  if (
    value === "photo_exif" ||
    value === "device_time" ||
    value === "manual" ||
    value === "none"
  ) {
    return value;
  }

  throw new PublicHttpError({
    code: "INVALID_CAPTURED_AT_SOURCE",
    message: "capturedAtSource 값이 올바르지 않습니다.",
    status: 400,
  });
}

function normalizeLocationSource(value: unknown): LocationSource {
  if (
    value === "photo_exif" ||
    value === "current_gps" ||
    value === "map" ||
    value === "manual" ||
    value === "none"
  ) {
    return value;
  }

  throw new PublicHttpError({
    code: "INVALID_LOCATION_SOURCE",
    message: "locationSource 값이 올바르지 않습니다.",
    status: 400,
  });
}

function normalizeOptionalCapturedAt(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "string") {
    throw new PublicHttpError({
      code: "INVALID_CAPTURED_AT",
      message: "capturedAt 값이 올바르지 않습니다.",
      status: 400,
    });
  }

  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return null;
  }

  if (Number.isNaN(Date.parse(trimmed))) {
    throw new PublicHttpError({
      code: "INVALID_CAPTURED_AT",
      message: "capturedAt 값은 날짜/시간 문자열이어야 합니다.",
      status: 400,
    });
  }

  return trimmed;
}

function normalizeOptionalLatitude(value: unknown) {
  return normalizeOptionalCoordinate({
    fieldName: "latitude",
    max: 90,
    min: -90,
    value,
  });
}

function normalizeOptionalLongitude(value: unknown) {
  return normalizeOptionalCoordinate({
    fieldName: "longitude",
    max: 180,
    min: -180,
    value,
  });
}

function normalizeOptionalCoordinate({
  fieldName,
  max,
  min,
  value,
}: {
  fieldName: string;
  max: number;
  min: number;
  value: unknown;
}) {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new PublicHttpError({
      code: "INVALID_COORDINATE",
      message: `${fieldName} 값이 올바르지 않습니다.`,
      status: 400,
    });
  }

  if (value < min || value > max) {
    throw new PublicHttpError({
      code: "INVALID_COORDINATE",
      message: `${fieldName} 값이 허용 범위를 벗어났습니다.`,
      status: 400,
    });
  }

  return value;
}

function normalizeNullableString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function isOwnImagePath(imagePath: string, userId: string) {
  return imagePath.startsWith(`users/${userId}/`);
}

function normalizeErrorForLog(error: unknown) {
  if (error instanceof PublicHttpError) {
    return {
      code: error.code,
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

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
    status,
  });
}
