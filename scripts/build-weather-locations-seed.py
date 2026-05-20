#!/usr/bin/env python3
import hashlib
import json
import math
import re
import sys
import xml.etree.ElementTree as ET
import zipfile
from pathlib import Path

SOURCE = "local_admin_coordinate_xlsx"
SOURCE_VERSION = "행정구역별_위경도_좌표.xlsx"
INPUT_DEFAULT = Path("행정구역별_위경도_좌표.xlsx")
OUTPUT_DEFAULT = Path(
    "supabase/migrations/20260518114000_seed_weather_locations_from_admin_coordinates.sql"
)

NS = {
    "a": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "r": "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
}


def main():
    input_path = Path(sys.argv[1]) if len(sys.argv) > 1 else INPUT_DEFAULT
    output_path = Path(sys.argv[2]) if len(sys.argv) > 2 else OUTPUT_DEFAULT

    rows = list(parse_weather_location_rows(input_path))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(build_seed_sql(rows), encoding="utf-8")

    active_grids = {(row["kma_nx"], row["kma_ny"]) for row in rows if row["is_active"]}
    print(
        json.dumps(
            {
                "activeGridCount": len(active_grids),
                "activeLocationCount": sum(1 for row in rows if row["is_active"]),
                "output": str(output_path),
                "rowCount": len(rows),
            },
            ensure_ascii=False,
            sort_keys=True,
        )
    )


def parse_weather_location_rows(input_path):
    with zipfile.ZipFile(input_path) as archive:
        shared_strings = read_shared_strings(archive)
        sheets = read_sheets(archive)

        for sheet_name, sheet_path in sheets:
            root = ET.fromstring(archive.read(sheet_path))
            xml_rows = root.findall(".//a:sheetData/a:row", NS)

            for xml_row in xml_rows[1:]:
                values = read_row_values(xml_row, shared_strings)
                parsed = parse_location_row(sheet_name, values)

                if parsed is None:
                    continue

                yield parsed


def read_shared_strings(archive):
    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    strings = []

    for item in root.findall("a:si", NS):
        strings.append("".join(text.text or "" for text in item.findall(".//a:t", NS)))

    return strings


def read_sheets(archive):
    workbook = ET.fromstring(archive.read("xl/workbook.xml"))
    rels = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relmap = {rel.attrib["Id"]: rel.attrib["Target"] for rel in rels}
    sheets = []

    for sheet in workbook.findall(".//a:sheet", NS):
        rid = sheet.attrib[
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        ]
        sheets.append((sheet.attrib["name"], f"xl/{relmap[rid]}"))

    return sheets


def read_row_values(xml_row, shared_strings):
    values = [""] * 7

    for cell in xml_row.findall("a:c", NS):
        index = cell_index(cell.attrib["r"])

        if index >= len(values):
            continue

        values[index] = read_cell_value(cell, shared_strings).strip()

    return values


def read_cell_value(cell, shared_strings):
    value = cell.find("a:v", NS)

    if value is None:
        inline = cell.find("a:is/a:t", NS)
        return inline.text if inline is not None else ""

    raw_value = value.text or ""

    if cell.attrib.get("t") == "s":
        return shared_strings[int(raw_value)]

    return raw_value


def cell_index(cell_ref):
    match = re.match(r"([A-Z]+)", cell_ref)

    if match is None:
        return 0

    index = 0

    for char in match.group(1):
        index = index * 26 + ord(char) - 64

    return index - 1


def parse_location_row(sheet_name, values):
    sido_name, column_b, column_c, column_d, column_e, latitude, longitude = values

    if not sido_name:
        return None

    try:
        latitude_value = float(latitude)
        longitude_value = float(longitude)
    except ValueError:
        return None

    location_level = None
    sigungu_name = None
    eup_myeon_dong_name = None
    ri_name = None

    if not column_b and not column_c and not column_d and not column_e:
        return None

    if column_b and not column_c and not column_d and not column_e:
        if sheet_name == "세종특별자치시":
            location_level = "eup_myeon_dong"
            eup_myeon_dong_name = column_b
        else:
            location_level = "sigungu"
            sigungu_name = column_b
    elif column_b and column_c and not column_d and not column_e:
        location_level = "eup_myeon_dong"
        sigungu_name = column_b
        eup_myeon_dong_name = column_c
    elif column_b and column_c.endswith("구") and column_d and not column_e:
        location_level = "eup_myeon_dong"
        sigungu_name = f"{column_b} {column_c}"
        eup_myeon_dong_name = column_d
    else:
        return None

    name = eup_myeon_dong_name if location_level == "eup_myeon_dong" else sigungu_name
    region_name = " ".join(
        part
        for part in [sido_name, sigungu_name, eup_myeon_dong_name, ri_name]
        if part
    )
    kma_nx, kma_ny = convert_to_kma_grid(latitude_value, longitude_value)

    return {
        "eup_myeon_dong_name": eup_myeon_dong_name,
        "external_location_id": build_external_location_id(
            location_level,
            region_name,
            latitude_value,
            longitude_value,
        ),
        "is_active": should_collect_location(sido_name, location_level),
        "kma_nx": kma_nx,
        "kma_ny": kma_ny,
        "latitude": latitude_value,
        "location_level": location_level,
        "longitude": longitude_value,
        "metadata": {
            "collectionPolicy": "all_sigungu_and_non_seoul_eup_myeon_dong",
            "sourceFile": SOURCE_VERSION,
        },
        "name": name,
        "region_name": region_name,
        "ri_name": ri_name,
        "sido_name": sido_name,
        "sigungu_name": sigungu_name,
    }


def should_collect_location(sido_name, location_level):
    if location_level == "sigungu":
        return True

    if sido_name == "서울특별시":
        return False

    return True


def build_external_location_id(location_level, region_name, latitude, longitude):
    source_key = f"{location_level}|{region_name}|{latitude:.7f}|{longitude:.7f}"
    digest = hashlib.sha1(source_key.encode("utf-8")).hexdigest()[:16]

    return f"{location_level}:{digest}"


def convert_to_kma_grid(latitude, longitude):
    re = 6371.00877 / 5.0
    slat1 = math.radians(30.0)
    slat2 = math.radians(60.0)
    olon = math.radians(126.0)
    olat = math.radians(38.0)
    xo = 43
    yo = 136

    sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(
        math.pi * 0.25 + slat1 * 0.5
    )
    sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
    sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
    sf = (sf**sn) * math.cos(slat1) / sn
    ro = math.tan(math.pi * 0.25 + olat * 0.5)
    ro = re * sf / (ro**sn)

    ra = math.tan(math.pi * 0.25 + math.radians(latitude) * 0.5)
    ra = re * sf / (ra**sn)
    theta = math.radians(longitude) - olon

    if theta > math.pi:
        theta -= 2.0 * math.pi

    if theta < -math.pi:
        theta += 2.0 * math.pi

    theta *= sn

    return (
        math.floor(ra * math.sin(theta) + xo + 0.5),
        math.floor(ro - ra * math.cos(theta) + yo + 0.5),
    )


def build_seed_sql(rows):
    chunks = []
    chunk_size = 500

    for start in range(0, len(rows), chunk_size):
        chunks.append(build_insert_chunk(rows[start : start + chunk_size]))

    header = [
        "-- Generated by scripts/build-weather-locations-seed.py.",
        "-- Source file: 행정구역별_위경도_좌표.xlsx",
        "-- Policy: collect all sigungu rows and non-Seoul eup/myeon/dong rows.",
        "",
    ]

    return "\n".join(header + chunks) + "\n"


def build_insert_chunk(rows):
    values = ",\n".join(build_values(row) for row in rows)

    return f"""insert into public.weather_locations (
  name,
  location_level,
  region_name,
  sido_name,
  sigungu_name,
  eup_myeon_dong_name,
  ri_name,
  latitude,
  longitude,
  kma_nx,
  kma_ny,
  source,
  source_version,
  external_location_id,
  is_active,
  metadata
)
values
{values}
on conflict (source, external_location_id) do update
set
  name = excluded.name,
  location_level = excluded.location_level,
  region_name = excluded.region_name,
  sido_name = excluded.sido_name,
  sigungu_name = excluded.sigungu_name,
  eup_myeon_dong_name = excluded.eup_myeon_dong_name,
  ri_name = excluded.ri_name,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  kma_nx = excluded.kma_nx,
  kma_ny = excluded.kma_ny,
  source_version = excluded.source_version,
  is_active = excluded.is_active,
  metadata = excluded.metadata,
  updated_at = now();
"""


def build_values(row):
    return (
        "("
        + ", ".join(
            [
                sql_string(row["name"]),
                sql_string(row["location_level"]),
                sql_string(row["region_name"]),
                sql_string(row["sido_name"]),
                sql_string(row["sigungu_name"]),
                sql_string(row["eup_myeon_dong_name"]),
                sql_string(row["ri_name"]),
                format_float(row["latitude"]),
                format_float(row["longitude"]),
                str(row["kma_nx"]),
                str(row["kma_ny"]),
                sql_string(SOURCE),
                sql_string(SOURCE_VERSION),
                sql_string(row["external_location_id"]),
                "true" if row["is_active"] else "false",
                sql_json(row["metadata"]),
            ]
        )
        + ")"
    )


def format_float(value):
    return f"{value:.7f}".rstrip("0").rstrip(".")


def sql_string(value):
    if value is None:
        return "null"

    return "'" + str(value).replace("'", "''") + "'"


def sql_json(value):
    return sql_string(json.dumps(value, ensure_ascii=False, sort_keys=True)) + "::jsonb"


if __name__ == "__main__":
    main()
