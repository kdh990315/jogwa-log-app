import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import type {
  CatchLogWaterType,
  CatchLogDetailItem,
  CatchLogListItem,
  CreatedCatchLog,
  CreateCatchLogImageInput,
  CreateCatchLogInput,
  EditableCatchLog,
  EditableCatchLogImage,
  UpdatedCatchLog,
  UpdateCatchLogImageInput,
  UpdateCatchLogInput,
  WaterType,
} from "@/types/catch-log";

const CATCH_IMAGES_BUCKET = "catch-images";
const CATCH_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS = 60 * 60;

interface CatchLogInsertRow {
  address: string | null;
  address_source: string | null;
  air_temp_c: number | null;
  captured_at_source: string | null;
  count: number;
  current_speed_kn: number | null;
  fishing_index_forecast_id: number | null;
  fishing_index_grade: string | null;
  fishing_index_score: number | null;
  fishing_location_id: number | null;
  fishing_date: string;
  humidity_percent: number | null;
  latitude: number | null;
  location_source: string | null;
  location_type_id: 1 | 2;
  longitude: number | null;
  memo: string | null;
  point_name: string | null;
  precipitation_amount_mm: number | null;
  precipitation_probability_percent: number | null;
  region_name: string | null;
  size_cm: number | null;
  species_id: number | null;
  species_name: string;
  species_source: string | null;
  tide: string | null;
  user_id: string;
  water_temp_c: number | null;
  wave_height_m: number | null;
  weather: string | null;
  weather_forecast_id: number | null;
  weather_location_id: number | null;
  weather_source: string | null;
  wind_direction_deg: number | null;
  wind_speed_ms: number | null;
}

type CatchLogUpdateMetadataKey =
  | "address"
  | "address_source"
  | "captured_at_source"
  | "current_speed_kn"
  | "fishing_index_forecast_id"
  | "fishing_index_grade"
  | "fishing_index_score"
  | "fishing_location_id"
  | "humidity_percent"
  | "location_source"
  | "precipitation_amount_mm"
  | "precipitation_probability_percent"
  | "region_name"
  | "species_source"
  | "weather_forecast_id"
  | "weather_location_id"
  | "weather_source"
  | "wind_direction_deg";

type CatchLogUpdateRow = Omit<
  CatchLogInsertRow,
  "user_id" | CatchLogUpdateMetadataKey
>;

interface CreatedCatchLogRow {
  id: number;
}

interface CatchImageInsertRow {
  catch_log_id: number;
  file_size_bytes: number | null;
  height_px: number | null;
  mime_type: string | null;
  sort_order: number;
  storage_path: string;
  user_id: string;
  width_px: number | null;
}

interface UploadedCatchImage {
  fileSizeBytes: number | null;
  heightPx: number | null;
  isExistingObject: boolean;
  mimeType: string;
  sortOrder: number;
  storagePath: string;
  widthPx: number | null;
}

interface CatchLogRow {
  air_temp_c: number | null;
  count: number;
  fishing_date: string;
  id: number;
  latitude: number | null;
  location_type_id: 1 | 2;
  longitude: number | null;
  memo: string | null;
  point_name: string | null;
  size_cm: number | null;
  species_id: number | null;
  species_name: string;
  tide: string | null;
  water_temp_c: number | null;
  wave_height_m: number | null;
  weather: string | null;
  wind_speed_ms: number | null;
}

interface CatchLogListLikeRow {
  count: number;
  fishing_date: string;
  id: number;
  latitude?: number | null;
  location_type_id: 1 | 2;
  longitude?: number | null;
  point_name: string | null;
  size_cm: number | null;
  species_id: number | null;
  species_name: string;
  tide?: string | null;
}

interface CatchImageRow {
  storage_path: string;
}

interface CatchImageMetadataRow extends CatchImageRow {
  catch_log_id: number;
  file_size_bytes: number | null;
  height_px: number | null;
  mime_type: string | null;
  sort_order: number;
  user_id: string;
  width_px: number | null;
}

interface CatchLogUpdateSnapshot {
  catchLog: CatchLogRow;
  images: CatchImageMetadataRow[];
}

interface ExistingCatchImageOrder {
  sortOrder: number;
  storagePath: string;
}

interface NewCatchImagePhoto {
  index: number;
  photo: CreateCatchLogImageInput;
}

interface CatchLogImageChangeSet {
  newPhotos: NewCatchImagePhoto[];
  removedImagePaths: string[];
  retainedImages: ExistingCatchImageOrder[];
}

export async function createCatchLog(
  input: CreateCatchLogInput,
): Promise<CreatedCatchLog> {
  ensureSupabaseAuthConfig();

  const userId = await getCurrentUserId();
  const catchLog = await insertCatchLog(userId, input);
  const uploadedImages: UploadedCatchImage[] = [];

  try {
    for (const [index, photo] of input.photos.entries()) {
      uploadedImages.push(
        await uploadCatchImage({
          catchLogId: catchLog.id,
          index,
          photo,
          userId,
        }),
      );
    }

    if (uploadedImages.length > 0) {
      await insertCatchImages({
        catchLogId: catchLog.id,
        images: uploadedImages,
        userId,
      });
    }

    await linkAiSpeciesPredictionToCatchLog({
      catchLogId: catchLog.id,
      predictionId: input.aiPredictionId ?? null,
      selectedSpeciesId: input.speciesId ?? null,
    });

    return {
      id: catchLog.id,
      imagePaths: uploadedImages.map((image) => image.storagePath),
    };
  } catch (error) {
    await cleanupFailedCreate(catchLog.id, uploadedImages).catch(() => {
      // Keep the original create/upload error visible to the caller.
    });
    throw error;
  }
}

export function getCatchLogList(): Promise<CatchLogListItem[]> {
  return fetchCatchLogListItems(
    "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, tide, point_name, latitude, longitude",
  );
}

export function getHomeCatchLogs(): Promise<CatchLogListItem[]> {
  return fetchCatchLogListItems(
    "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, tide, point_name",
  );
}

export function getMapCatchLogs(): Promise<CatchLogListItem[]> {
  return fetchCatchLogListItems(
    "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, point_name, latitude, longitude",
  );
}

export function getSpeciesDexCatchLogs(): Promise<CatchLogListItem[]> {
  return fetchCatchLogListItems(
    "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, point_name",
  );
}

async function fetchCatchLogListItems(selectColumns: string) {
  ensureSupabaseAuthConfig();

  const { data, error } = await supabase
    .from("catch_logs")
    .select(selectColumns)
    .order("fishing_date", { ascending: false })
    .order("created_at", { ascending: false })
    .returns<CatchLogListLikeRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapCatchLogListItem);
}

export async function getCatchLog(
  catchLogId: number,
): Promise<CatchLogDetailItem> {
  ensureSupabaseAuthConfig();

  const { data: catchLog, error } = await supabase
    .from("catch_logs")
    .select(
      "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, tide, point_name, memo, weather, latitude, longitude, air_temp_c, water_temp_c, wind_speed_ms, wave_height_m",
    )
    .eq("id", catchLogId)
    .returns<CatchLogRow[]>()
    .single();

  if (error) {
    throw error;
  }

  const { data: images, error: imageError } = await supabase
    .from("catch_images")
    .select("storage_path")
    .eq("catch_log_id", catchLogId)
    .order("sort_order", { ascending: true })
    .returns<CatchImageRow[]>();

  if (imageError) {
    throw imageError;
  }

  return mapCatchLogDetailItem(
    catchLog,
    await getSignedCatchImageUrls((images ?? []).map((image) => image.storage_path)),
  );
}

export async function getEditableCatchLog(
  catchLogId: number,
): Promise<EditableCatchLog> {
  ensureSupabaseAuthConfig();

  const { data: catchLog, error } = await supabase
    .from("catch_logs")
    .select(
      "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, tide, point_name, memo, weather, latitude, longitude, air_temp_c, water_temp_c, wind_speed_ms, wave_height_m",
    )
    .eq("id", catchLogId)
    .returns<CatchLogRow[]>()
    .single();

  if (error) {
    throw error;
  }

  const { data: images, error: imageError } = await supabase
    .from("catch_images")
    .select("storage_path")
    .eq("catch_log_id", catchLogId)
    .order("sort_order", { ascending: true })
    .returns<CatchImageRow[]>();

  if (imageError) {
    throw imageError;
  }

  return mapEditableCatchLog(
    catchLog,
    await getSignedCatchImages(images ?? []),
  );
}

export async function updateCatchLog({
  catchLogId,
  input,
}: {
  catchLogId: number;
  input: UpdateCatchLogInput;
}): Promise<UpdatedCatchLog> {
  ensureSupabaseAuthConfig();

  const userId = await getCurrentUserId();
  const snapshot = await getCatchLogUpdateSnapshot(catchLogId);
  const imageChangeSet = buildCatchLogImageChangeSet({
    currentImages: snapshot.images,
    photos: input.photos,
  });
  const uploadedImages: UploadedCatchImage[] = [];

  try {
    for (const { index, photo } of imageChangeSet.newPhotos) {
      uploadedImages.push(
        await uploadCatchImage({
          catchLogId,
          index,
          photo,
          userId,
        }),
      );
    }
  } catch (error) {
    await removeCatchImageObjects(
      uploadedImages.map((image) => image.storagePath),
    );
    throw error;
  }

  try {
    await applyCatchLogUpdate({
      catchLogId,
      imageChangeSet,
      input,
      uploadedImages,
      userId,
    });

    await removeCatchImageObjects(imageChangeSet.removedImagePaths);

    return { id: catchLogId };
  } catch (error) {
    await rollbackCatchLogUpdate({
      catchLogId,
      snapshot,
      uploadedImages,
    });
    throw error;
  }
}

async function applyCatchLogUpdate({
  catchLogId,
  imageChangeSet,
  input,
  uploadedImages,
  userId,
}: {
  catchLogId: number;
  imageChangeSet: CatchLogImageChangeSet;
  input: UpdateCatchLogInput;
  uploadedImages: UploadedCatchImage[];
  userId: string;
}) {
  if (uploadedImages.length > 0) {
    await insertCatchImages({
      catchLogId,
      images: uploadedImages,
      userId,
    });
  }

  for (const image of imageChangeSet.retainedImages) {
    await updateCatchImageSortOrder({
      catchLogId,
      sortOrder: image.sortOrder,
      storagePath: image.storagePath,
    });
  }

  if (imageChangeSet.removedImagePaths.length > 0) {
    await deleteCatchImageRows(catchLogId, imageChangeSet.removedImagePaths);
  }

  await updateCatchLogRow(catchLogId, input);
  await linkAiSpeciesPredictionToCatchLog({
    catchLogId,
    predictionId: input.aiPredictionId ?? null,
    selectedSpeciesId: input.speciesId ?? null,
  });
}

async function rollbackCatchLogUpdate({
  catchLogId,
  snapshot,
  uploadedImages,
}: {
  catchLogId: number;
  snapshot: CatchLogUpdateSnapshot;
  uploadedImages: UploadedCatchImage[];
}) {
  await Promise.allSettled([
    restoreCatchLogRow(catchLogId, snapshot.catchLog),
    restoreCatchImageRows(snapshot.images, uploadedImages),
    removeCatchImageObjects(uploadedImages.map((image) => image.storagePath)),
  ]);
}

async function restoreCatchImageRows(
  snapshotImages: CatchImageMetadataRow[],
  uploadedImages: UploadedCatchImage[],
) {
  const uploadedImagePaths = uploadedImages.map((image) => image.storagePath);

  if (uploadedImagePaths.length > 0) {
    await deleteCatchImageRowsByStoragePaths(uploadedImagePaths);
  }

  if (snapshotImages.length === 0) {
    return;
  }

  const restoreRows: CatchImageInsertRow[] = snapshotImages.map((image) => ({
    catch_log_id: image.catch_log_id,
    file_size_bytes: image.file_size_bytes,
    height_px: image.height_px,
    mime_type: image.mime_type,
    sort_order: image.sort_order,
    storage_path: image.storage_path,
    user_id: image.user_id,
    width_px: image.width_px,
  }));

  const { error } = await supabase
    .from("catch_images")
    .upsert(restoreRows, { onConflict: "storage_path" });

  if (error) {
    throw error;
  }
}

function buildCatchLogImageChangeSet({
  currentImages,
  photos,
}: {
  currentImages: CatchImageMetadataRow[];
  photos: UpdateCatchLogImageInput[];
}): CatchLogImageChangeSet {
  const currentImagePathSet = new Set(
    currentImages.map((image) => image.storage_path),
  );
  const retainedImagePathSet = new Set<string>();
  const retainedImages: ExistingCatchImageOrder[] = [];
  const newPhotos: NewCatchImagePhoto[] = [];

  for (const [index, photo] of photos.entries()) {
    if (!isExistingCatchImageInput(photo)) {
      newPhotos.push({ index, photo });
      continue;
    }

    if (!currentImagePathSet.has(photo.storagePath)) {
      throw new Error("수정할 조과 이미지 정보를 찾지 못했습니다.");
    }

    if (retainedImagePathSet.has(photo.storagePath)) {
      throw new Error("같은 조과 이미지가 중복으로 포함되어 있습니다.");
    }

    retainedImagePathSet.add(photo.storagePath);
    retainedImages.push({
      sortOrder: index,
      storagePath: photo.storagePath,
    });
  }

  return {
    newPhotos,
    removedImagePaths: currentImages
      .map((image) => image.storage_path)
      .filter((path) => !retainedImagePathSet.has(path)),
    retainedImages,
  };
}

async function updateCatchLogRow(
  catchLogId: number,
  input: UpdateCatchLogInput,
) {
  const { data, error } = await supabase
    .from("catch_logs")
    .update(buildCatchLogUpdateRow(input))
    .eq("id", catchLogId)
    .select("id")
    .returns<CreatedCatchLogRow[]>();

  if (error) {
    throw error;
  }

  if ((data ?? []).length === 0) {
    throw new Error("수정할 조과 기록을 찾지 못했습니다.");
  }
}

async function restoreCatchLogRow(catchLogId: number, snapshot: CatchLogRow) {
  const { error } = await supabase
    .from("catch_logs")
    .update(buildCatchLogRestoreRow(snapshot))
    .eq("id", catchLogId);

  if (error) {
    throw error;
  }
}

function buildCatchLogRestoreRow(snapshot: CatchLogRow): CatchLogUpdateRow {
  return {
    air_temp_c: snapshot.air_temp_c,
    count: snapshot.count,
    fishing_date: snapshot.fishing_date,
    latitude: snapshot.latitude,
    location_type_id: snapshot.location_type_id,
    longitude: snapshot.longitude,
    memo: snapshot.memo,
    point_name: snapshot.point_name,
    size_cm: snapshot.size_cm,
    species_id: snapshot.species_id,
    species_name: snapshot.species_name,
    tide: snapshot.tide,
    water_temp_c: snapshot.water_temp_c,
    wave_height_m: snapshot.wave_height_m,
    weather: snapshot.weather,
    wind_speed_ms: snapshot.wind_speed_ms,
  };
}

async function getCatchLogUpdateSnapshot(
  catchLogId: number,
): Promise<CatchLogUpdateSnapshot> {
  const { data: catchLog, error } = await supabase
    .from("catch_logs")
    .select(
      "id, fishing_date, location_type_id, species_id, species_name, count, size_cm, tide, point_name, memo, weather, latitude, longitude, air_temp_c, water_temp_c, wind_speed_ms, wave_height_m",
    )
    .eq("id", catchLogId)
    .returns<CatchLogRow[]>()
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!catchLog) {
    throw new Error("수정할 조과 기록을 찾지 못했습니다.");
  }

  const { data: images, error: imageError } = await supabase
    .from("catch_images")
    .select(
      "catch_log_id, user_id, storage_path, sort_order, mime_type, width_px, height_px, file_size_bytes",
    )
    .eq("catch_log_id", catchLogId)
    .order("sort_order", { ascending: true })
    .returns<CatchImageMetadataRow[]>();

  if (imageError) {
    throw imageError;
  }

  return {
    catchLog,
    images: images ?? [],
  };
}

export async function deleteCatchLog(catchLogId: number): Promise<void> {
  ensureSupabaseAuthConfig();

  const imagePaths = await getCatchImageStoragePaths(catchLogId);
  const { data, error } = await supabase
    .from("catch_logs")
    .delete()
    .eq("id", catchLogId)
    .select("id")
    .returns<CreatedCatchLogRow[]>();

  if (error) {
    throw error;
  }

  if ((data ?? []).length === 0) {
    throw new Error("삭제할 조과 기록을 찾지 못했습니다.");
  }

  if (imagePaths.length > 0) {
    await removeCatchImageObjects(imagePaths);
  }
}

function buildCatchLogUpdateRow(input: UpdateCatchLogInput): CatchLogUpdateRow {
  return {
    air_temp_c: input.airTempC ?? null,
    count: input.count,
    fishing_date: input.fishingDate,
    latitude: input.latitude ?? null,
    location_type_id: getLocationTypeId(input.waterType),
    longitude: input.longitude ?? null,
    memo: input.memo ?? null,
    point_name: input.locationName ?? null,
    size_cm: input.sizeCm ?? null,
    species_id: input.speciesId ?? null,
    species_name: input.speciesName,
    tide: input.tide ?? null,
    water_temp_c: input.waterTempC ?? null,
    wave_height_m: input.waveHeightM ?? null,
    weather: input.weather ?? null,
    wind_speed_ms: input.windSpeedMs ?? null,
  };
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
    throw new Error("로그인 후 조과를 등록할 수 있습니다.");
  }

  return user.id;
}

async function insertCatchLog(
  userId: string,
  input: CreateCatchLogInput,
): Promise<CreatedCatchLogRow> {
  const insertRow: CatchLogInsertRow = {
    address: input.address ?? null,
    address_source: input.addressSource ?? null,
    air_temp_c: input.airTempC ?? null,
    captured_at_source: input.capturedAtSource ?? null,
    count: input.count,
    current_speed_kn: input.currentSpeedKn ?? null,
    fishing_index_forecast_id: input.fishingIndexForecastId ?? null,
    fishing_index_grade: input.fishingIndexGrade ?? null,
    fishing_index_score: input.fishingIndexScore ?? null,
    fishing_location_id: input.fishingLocationId ?? null,
    fishing_date: input.fishingDate,
    humidity_percent: input.humidityPercent ?? null,
    latitude: input.latitude ?? null,
    location_source: input.locationSource ?? null,
    location_type_id: getLocationTypeId(input.waterType),
    longitude: input.longitude ?? null,
    memo: input.memo ?? null,
    point_name: input.locationName ?? null,
    precipitation_amount_mm: input.precipitationAmountMm ?? null,
    precipitation_probability_percent:
      input.precipitationProbabilityPercent ?? null,
    region_name: input.regionName ?? null,
    size_cm: input.sizeCm ?? null,
    species_id: input.speciesId ?? null,
    species_name: input.speciesName,
    species_source: input.speciesSource ?? null,
    tide: input.tide ?? null,
    user_id: userId,
    water_temp_c: input.waterTempC ?? null,
    wave_height_m: input.waveHeightM ?? null,
    weather: input.weather ?? null,
    weather_forecast_id: input.weatherForecastId ?? null,
    weather_location_id: input.weatherLocationId ?? null,
    weather_source: input.weatherSource ?? null,
    wind_direction_deg: input.windDirectionDeg ?? null,
    wind_speed_ms: input.windSpeedMs ?? null,
  };

  const { data, error } = await supabase
    .from("catch_logs")
    .insert(insertRow)
    .select("id")
    .returns<CreatedCatchLogRow[]>()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function uploadCatchImage({
  catchLogId,
  index,
  photo,
  userId,
}: {
  catchLogId: number;
  index: number;
  photo: CreateCatchLogImageInput;
  userId: string;
}): Promise<UploadedCatchImage> {
  const mimeType = normalizeImageMimeType(photo.mimeType, photo.localUri);

  if (photo.storagePath) {
    if (!isOwnCatchImagePath(photo.storagePath, userId)) {
      throw new Error("조과 이미지 경로가 올바르지 않습니다.");
    }

    return {
      fileSizeBytes: photo.fileSizeBytes ?? null,
      heightPx: photo.heightPx ?? null,
      isExistingObject: true,
      mimeType,
      sortOrder: index,
      storagePath: photo.storagePath,
      widthPx: photo.widthPx ?? null,
    };
  }

  const storagePath = buildCatchImageStoragePath({
    catchLogId,
    index,
    localUri: photo.localUri,
    mimeType,
    userId,
  });
  const fileBody = await fetch(photo.localUri).then((response) => {
    if (!response.ok) {
      throw new Error("조과 이미지를 읽지 못했습니다.");
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

  return {
    fileSizeBytes: photo.fileSizeBytes ?? fileBody.byteLength,
    heightPx: photo.heightPx ?? null,
    isExistingObject: false,
    mimeType,
    sortOrder: index,
    storagePath,
    widthPx: photo.widthPx ?? null,
  };
}

async function insertCatchImages({
  catchLogId,
  images,
  userId,
}: {
  catchLogId: number;
  images: UploadedCatchImage[];
  userId: string;
}) {
  const insertRows: CatchImageInsertRow[] = images.map((image) => ({
    catch_log_id: catchLogId,
    file_size_bytes: image.fileSizeBytes,
    height_px: image.heightPx,
    mime_type: image.mimeType,
    sort_order: image.sortOrder,
    storage_path: image.storagePath,
    user_id: userId,
    width_px: image.widthPx,
  }));

  const { error } = await supabase.from("catch_images").insert(insertRows);

  if (error) {
    throw error;
  }
}

async function cleanupFailedCreate(
  catchLogId: number,
  uploadedImages: UploadedCatchImage[],
) {
  const uploadedPaths = uploadedImages.flatMap((image) =>
    image.isExistingObject ? [] : [image.storagePath],
  );
  const cleanupTasks: Promise<unknown>[] = [
    Promise.resolve(supabase.from("catch_logs").delete().eq("id", catchLogId)),
  ];

  if (uploadedPaths.length > 0) {
    cleanupTasks.push(
      Promise.resolve(
        supabase.storage.from(CATCH_IMAGES_BUCKET).remove(uploadedPaths),
      ),
    );
  }

  await Promise.allSettled(cleanupTasks);
}

async function getCatchImageStoragePaths(catchLogId: number) {
  const { data, error } = await supabase
    .from("catch_images")
    .select("storage_path")
    .eq("catch_log_id", catchLogId)
    .returns<CatchImageRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map((image) => image.storage_path);
}

async function updateCatchImageSortOrder({
  catchLogId,
  sortOrder,
  storagePath,
}: {
  catchLogId: number;
  sortOrder: number;
  storagePath: string;
}) {
  const { error } = await supabase
    .from("catch_images")
    .update({ sort_order: sortOrder })
    .eq("catch_log_id", catchLogId)
    .eq("storage_path", storagePath);

  if (error) {
    throw error;
  }
}

async function deleteCatchImageRows(catchLogId: number, storagePaths: string[]) {
  const { error } = await supabase
    .from("catch_images")
    .delete()
    .eq("catch_log_id", catchLogId)
    .in("storage_path", storagePaths);

  if (error) {
    throw error;
  }
}

async function deleteCatchImageRowsByStoragePaths(storagePaths: string[]) {
  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabase
    .from("catch_images")
    .delete()
    .in("storage_path", storagePaths);

  if (error) {
    throw error;
  }
}

async function linkAiSpeciesPredictionToCatchLog({
  catchLogId,
  predictionId,
  selectedSpeciesId,
}: {
  catchLogId: number;
  predictionId: number | null;
  selectedSpeciesId: number | null;
}) {
  if (!isPositiveInteger(predictionId)) {
    return;
  }

  const { data, error } = await supabase
    .from("ai_species_predictions")
    .update({
      catch_log_id: catchLogId,
      selected_species_id: selectedSpeciesId,
    })
    .eq("id", predictionId)
    .select("id")
    .returns<CreatedCatchLogRow[]>();

  if (error) {
    throw error;
  }

  if ((data ?? []).length === 0) {
    throw new Error("AI 판별 결과를 조과 기록과 연결하지 못했습니다.");
  }
}

async function removeCatchImageObjects(storagePaths: string[]) {
  if (storagePaths.length === 0) {
    return;
  }

  const { error } = await supabase.storage
    .from(CATCH_IMAGES_BUCKET)
    .remove(storagePaths);

  if (error) {
    // Keep the primary DB flow successful and leave private storage cleanup
    // for a retry/admin sweep.
    return;
  }
}

function isPositiveInteger(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isInteger(value) && value > 0;
}

function isOwnCatchImagePath(storagePath: string, userId: string) {
  return storagePath.startsWith(`users/${userId}/`);
}

function getLocationTypeId(waterType: CatchLogWaterType): 1 | 2 {
  return waterType === "freshwater" ? 1 : 2;
}

function buildCatchImageStoragePath({
  catchLogId,
  index,
  localUri,
  mimeType,
  userId,
}: {
  catchLogId: number;
  index: number;
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
    "catch-logs",
    String(catchLogId),
    `${timestamp}-${index}-${uniquePart}.${extension}`,
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

function isExistingCatchImageInput(
  photo: UpdateCatchLogImageInput,
): photo is { storagePath: string } {
  return (
    "storagePath" in photo &&
    typeof photo.storagePath === "string" &&
    photo.storagePath.trim().length > 0
  );
}

async function getSignedCatchImageUrls(storagePaths: string[]) {
  if (storagePaths.length === 0) {
    return [];
  }

  const { data, error } = await supabase.storage
    .from(CATCH_IMAGES_BUCKET)
    .createSignedUrls(
      storagePaths,
      CATCH_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS,
    );

  if (error) {
    throw error;
  }

  return (data ?? []).flatMap((item) => {
    if (!item.signedUrl) {
      return [];
    }

    return [item.signedUrl];
  });
}

async function getSignedCatchImages(
  images: CatchImageRow[],
): Promise<EditableCatchLogImage[]> {
  if (images.length === 0) {
    return [];
  }

  const { data, error } = await supabase.storage
    .from(CATCH_IMAGES_BUCKET)
    .createSignedUrls(
      images.map((image) => image.storage_path),
      CATCH_IMAGE_SIGNED_URL_EXPIRES_IN_SECONDS,
    );

  if (error) {
    throw error;
  }

  return images.flatMap((image, index) => {
    const signedUrl = data?.[index]?.signedUrl;

    if (!signedUrl) {
      return [];
    }

    return [
      {
        storagePath: image.storage_path,
        uri: signedUrl,
      },
    ];
  });
}

function mapCatchLogListItem(row: CatchLogListLikeRow): CatchLogListItem {
  const waterType = mapLocationTypeId(row.location_type_id);

  return {
    count: row.count,
    fishingDate: row.fishing_date,
    id: row.id,
    latitude: row.latitude ?? null,
    longitude: row.longitude ?? null,
    pointName: row.point_name,
    sizeCm: row.size_cm,
    speciesId: row.species_id,
    speciesName: row.species_name,
    tide: row.tide ?? null,
    type: waterType,
  };
}

function mapCatchLogDetailItem(
  row: CatchLogRow,
  imageUrls: string[],
): CatchLogDetailItem {
  const waterType = mapLocationTypeId(row.location_type_id);
  const isKkwang = row.count <= 0;

  return {
    airTempC: row.air_temp_c,
    count: row.count,
    fishingDate: row.fishing_date,
    id: row.id,
    images: imageUrls,
    isKkwang,
    latitude: row.latitude,
    longitude: row.longitude,
    memo: row.memo,
    pointName: row.point_name,
    sizeCm: row.size_cm,
    speciesName: row.species_name,
    tide: row.tide,
    type: waterType,
    waterTempC: row.water_temp_c,
    waveHeightM: row.wave_height_m,
    weather: row.weather,
    windSpeedMs: row.wind_speed_ms,
  };
}

function mapEditableCatchLog(
  row: CatchLogRow,
  images: EditableCatchLogImage[],
): EditableCatchLog {
  return {
    airTempC: row.air_temp_c,
    count: row.count,
    fishingDate: row.fishing_date,
    id: row.id,
    images,
    latitude: row.latitude,
    locationName: row.point_name,
    longitude: row.longitude,
    memo: row.memo,
    sizeCm: row.size_cm,
    speciesId: row.species_id,
    speciesName: row.species_name,
    tide: row.tide,
    waterType: row.location_type_id === 1 ? "freshwater" : "saltwater",
    waterTempC: row.water_temp_c,
    waveHeightM: row.wave_height_m,
    weather: row.weather,
    windSpeedMs: row.wind_speed_ms,
  };
}

function mapLocationTypeId(locationTypeId: 1 | 2): WaterType {
  return locationTypeId === 1 ? "fresh" : "salt";
}
