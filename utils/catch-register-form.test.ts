import type { EditableCatchLog } from "@/types/catch-log";
import type { FishSpecies } from "@/types/fish-species";
import {
  DEFAULT_CATCH_FORM_VALUES,
  buildCatchFormValues,
  buildCreateCatchLogInput,
  buildUpdateCatchLogInput,
  sanitizeDecimalInput,
  sanitizeIntegerInput,
  type CatchFormValues,
} from "@/utils/catch-register-form";

const fishSpeciesList: FishSpecies[] = [
  {
    id: 10,
    locationTypeId: 2,
    name: "광어",
    waterType: "saltwater",
  },
  {
    id: 20,
    locationTypeId: 1,
    name: "붕어",
    waterType: "freshwater",
  },
];

function createFormValues(
  overrides: Partial<CatchFormValues> = {},
): CatchFormValues {
  return {
    ...DEFAULT_CATCH_FORM_VALUES,
    count: "3",
    fishingDate: "2026.05.13",
    latitude: 35.1,
    longitude: 129.1,
    pointName: " 방파제 ",
    speciesName: " 광어 ",
    tide: " 7물 ",
    waterType: "saltwater",
    weather: " 맑음 ",
    ...overrides,
  };
}

describe("조과 등록 폼 변환", () => {
  it("숫자 입력값에서 허용되지 않는 문자가 제거되는지 확인", () => {
    expect(sanitizeIntegerInput("1마리2cm")).toBe("12");
    expect(sanitizeDecimalInput("1a2.3.4cm")).toBe("12.34");
  });

  it("생성 입력값이 저장용 값으로 정리되는지 확인", () => {
    const input = buildCreateCatchLogInput(
      createFormValues({
        airTempC: "-1.5",
        memo: "  메모  ",
        photos: [
          {
            fileSizeBytes: 100,
            heightPx: 200,
            id: "local-photo",
            mimeType: "image/jpeg",
            uri: "file:///catch.jpg",
            widthPx: 300,
          },
        ],
        sizeCm: "42.5",
        waterTempC: "13.2",
        waveHeightM: "0.4",
        windSpeedMs: "3.1",
      }),
      fishSpeciesList,
      { aiPredictionId: 7 },
    );

    expect(input).toMatchObject({
      aiPredictionId: 7,
      airTempC: -1.5,
      count: 3,
      fishingDate: "2026-05-13",
      latitude: 35.1,
      locationName: "방파제",
      longitude: 129.1,
      memo: "메모",
      sizeCm: 42.5,
      speciesId: 10,
      speciesName: "광어",
      tide: "7물",
      waterType: "saltwater",
      waterTempC: 13.2,
      waveHeightM: 0.4,
      weather: "맑음",
      windSpeedMs: 3.1,
    });
    expect(input.photos).toEqual([
      {
        fileSizeBytes: 100,
        heightPx: 200,
        localUri: "file:///catch.jpg",
        mimeType: "image/jpeg",
        storagePath: null,
        widthPx: 300,
      },
    ]);
  });

  it("AI 추천 어종이 목록에 없어도 이름이 같으면 추천 어종 ID를 사용하는지 확인", () => {
    const input = buildCreateCatchLogInput(
      createFormValues({
        speciesName: "미등록어종",
      }),
      fishSpeciesList,
      {
        prefillSpeciesId: 99,
        prefillSpeciesName: "미등록어종",
      },
    );

    expect(input.speciesId).toBe(99);
  });

  it("수정 입력값에서 기존 이미지와 신규 이미지가 구분되는지 확인", () => {
    const input = buildUpdateCatchLogInput(
      createFormValues({
        photos: [
          {
            id: "existing-photo",
            storagePath: "catch-images/1.jpg",
            uri: "https://example.com/1.jpg",
          },
          {
            id: "new-photo",
            uri: "file:///new.jpg",
          },
        ],
      }),
      fishSpeciesList,
    );

    expect(input.photos).toEqual([
      { storagePath: "catch-images/1.jpg" },
      {
        fileSizeBytes: null,
        heightPx: null,
        localUri: "file:///new.jpg",
        mimeType: null,
        widthPx: null,
      },
    ]);
  });

  it("수정용 조과 데이터가 폼 기본값으로 변환되는지 확인", () => {
    const editableCatchLog: EditableCatchLog = {
      airTempC: null,
      count: 2,
      fishingDate: "2026-05-13",
      id: 1,
      images: [
        {
          storagePath: "catch-images/1.jpg",
          uri: "https://example.com/1.jpg",
        },
      ],
      latitude: null,
      locationName: null,
      longitude: null,
      memo: null,
      sizeCm: null,
      speciesId: 10,
      speciesName: "광어",
      tide: null,
      waterType: "saltwater",
      waterTempC: null,
      waveHeightM: null,
      weather: null,
      windSpeedMs: null,
    };

    expect(buildCatchFormValues(editableCatchLog)).toEqual({
      ...DEFAULT_CATCH_FORM_VALUES,
      count: "2",
      fishingDate: "2026.05.13",
      photos: [
        {
          id: "catch-images/1.jpg",
          storagePath: "catch-images/1.jpg",
          uri: "https://example.com/1.jpg",
        },
      ],
      speciesName: "광어",
      waterType: "saltwater",
    });
  });
});
