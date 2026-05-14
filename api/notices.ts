import { Platform } from "react-native";

import { ensureSupabaseAuthConfig, supabase } from "@/api/supabase";
import type { Notice } from "@/types/notice";

interface NoticeMetadata {
  legacy_id?: unknown;
  status_label?: unknown;
}

interface NoticeRow {
  body: string;
  created_at: string;
  id: string;
  is_published: boolean;
  metadata: NoticeMetadata;
  published_at: string | null;
  title: string;
}

const NOTICE_COLUMNS = [
  "id",
  "title",
  "body",
  "is_published",
  "published_at",
  "created_at",
  "metadata",
].join(", ");

export async function getNotices(): Promise<Notice[]> {
  ensureSupabaseAuthConfig();

  const now = getPostgrestTimestamp(new Date());
  const { data, error } = await supabase
    .from("notices")
    .select(NOTICE_COLUMNS)
    .eq("is_published", true)
    .in("target_platform", getTargetPlatforms())
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`)
    .order("pinned", { ascending: false })
    .order("priority", { ascending: false })
    .order("published_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .returns<NoticeRow[]>();

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapNotice);
}

export async function getNotice(noticeId: string): Promise<Notice | null> {
  ensureSupabaseAuthConfig();

  const now = getPostgrestTimestamp(new Date());
  let query = supabase
    .from("notices")
    .select(NOTICE_COLUMNS)
    .eq("is_published", true)
    .in("target_platform", getTargetPlatforms())
    .or(`starts_at.is.null,starts_at.lte.${now}`)
    .or(`ends_at.is.null,ends_at.gt.${now}`);

  query = isUuid(noticeId)
    ? query.eq("id", noticeId)
    : query.eq("metadata->>legacy_id", noticeId);

  const { data, error } = await query.limit(1).returns<NoticeRow[]>();

  if (error) {
    throw error;
  }

  return data?.[0] ? mapNotice(data[0]) : null;
}

function mapNotice(row: NoticeRow): Notice {
  return {
    body: splitNoticeBody(row.body),
    id: row.id,
    publishedAt: formatPublishedAt(row.published_at ?? row.created_at),
    statusLabel:
      typeof row.metadata.status_label === "string"
        ? row.metadata.status_label
        : row.is_published
          ? "게시중"
          : "비공개",
    title: row.title,
  };
}

function splitNoticeBody(body: string) {
  return body
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0);
}

function formatPublishedAt(value: string) {
  const datePart = value.match(/^\d{4}-\d{2}-\d{2}/)?.[0];

  if (!datePart) {
    return value;
  }

  return datePart.replaceAll("-", ".");
}

function getTargetPlatforms() {
  if (Platform.OS === "ios" || Platform.OS === "android") {
    return ["all", Platform.OS];
  }

  return ["all"];
}

function getPostgrestTimestamp(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}
