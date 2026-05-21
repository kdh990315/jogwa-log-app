export const UPLOAD_IMAGE_MAX_LONG_EDGE_PX = 2048;
export const UPLOAD_IMAGE_JPEG_QUALITY = 0.82;
export const UPLOAD_IMAGE_MIME_TYPE = "image/jpeg";

interface CompressLocalImageForUploadInput {
  heightPx?: number | null;
  uri: string;
  widthPx?: number | null;
}

export interface CompressedLocalImage {
  heightPx: number;
  mimeType: typeof UPLOAD_IMAGE_MIME_TYPE;
  uri: string;
  widthPx: number;
}

export async function compressLocalImageForUpload({
  heightPx,
  uri,
  widthPx,
}: CompressLocalImageForUploadInput): Promise<CompressedLocalImage> {
  const { ImageManipulator, SaveFormat } = await loadImageManipulator();
  const resize = getResizeTarget({ heightPx, widthPx });
  let context = ImageManipulator.manipulate(uri);

  if (resize) {
    context = context.resize(resize);
  }

  const image = await context.renderAsync();
  const result = await image.saveAsync({
    compress: UPLOAD_IMAGE_JPEG_QUALITY,
    format: SaveFormat.JPEG,
  });

  return {
    heightPx: result.height,
    mimeType: UPLOAD_IMAGE_MIME_TYPE,
    uri: result.uri,
    widthPx: result.width,
  };
}

async function loadImageManipulator() {
  try {
    const imageManipulator = await import("expo-image-manipulator");

    if (
      !imageManipulator.ImageManipulator ||
      typeof imageManipulator.ImageManipulator.manipulate !== "function"
    ) {
      throw new Error("ExpoImageManipulator native module is unavailable.");
    }

    return imageManipulator;
  } catch (error) {
    throw new Error(
      "이미지 압축 모듈을 불러오지 못했습니다. 개발 빌드를 다시 설치한 뒤 시도해 주세요.",
      { cause: error },
    );
  }
}

function getResizeTarget({
  heightPx,
  widthPx,
}: {
  heightPx?: number | null;
  widthPx?: number | null;
}) {
  if (!widthPx || !heightPx) {
    return null;
  }

  if (
    widthPx <= UPLOAD_IMAGE_MAX_LONG_EDGE_PX &&
    heightPx <= UPLOAD_IMAGE_MAX_LONG_EDGE_PX
  ) {
    return null;
  }

  if (widthPx >= heightPx) {
    return {
      height: null,
      width: UPLOAD_IMAGE_MAX_LONG_EDGE_PX,
    };
  }

  return {
    height: UPLOAD_IMAGE_MAX_LONG_EDGE_PX,
    width: null,
  };
}
