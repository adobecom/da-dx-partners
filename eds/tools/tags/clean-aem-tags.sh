#!/usr/bin/env bash
#
# clean-aem-tags.sh
#
# Reads the full/raw AEM tag export (aem-tags-raw.json, gitignored, not
# committed) and strips unused properties, writing the result to
# aem-tags.json (the committed file actually imported by tag-data.js).
#
# Only what tag-data.js actually reads is kept: `jcr:primaryType` (used to
# detect cq:Tag nodes) and `jcr:title` (used as the display title), plus
# nested tag children.
#
# All other JCR/CQ metadata (created/modified dates, replication info,
# localized jcr:title.* translations, sling:resourceType, backlinks, tag
# color/image/url, jsComparisonType/jsExpectedOutput/jsTimeout/jsToEvaluate,
# jcr:description, jcr:mixinTypes, etc.) is not referenced anywhere in
# eds/tools/tags/*.js and is removed to reduce file size.
#
# Usage:
#   ./clean-aem-tags.sh [path-to-raw-json] [path-to-output-json]
#
# Defaults:
#   input:  aem-tags-raw.json (same directory as this script)
#   output: aem-tags.json (same directory as this script)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SOURCE_FILE="${1:-$SCRIPT_DIR/aem-tags-raw.json}"
TARGET_FILE="${2:-$SCRIPT_DIR/aem-tags.json}"

if [[ ! -f "$SOURCE_FILE" ]]; then
  echo "File not found: $SOURCE_FILE" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required but was not found on PATH. Install it (e.g. 'brew install jq') and re-run." >&2
  exit 1
fi

TMP_FILE="$(mktemp)"

BEFORE_SIZE=$(wc -c < "$SOURCE_FILE" | tr -d ' ')

jq '
  def clean:
    if type == "object" then
      with_entries(
        select(
          (.key == "jcr:primaryType") or
          (.key == "jcr:title") or
          ((.value | type) == "object" and (.value["jcr:primaryType"]? == "cq:Tag"))
        ) | .value |= clean
      )
    else . end;
  clean
' "$SOURCE_FILE" > "$TMP_FILE"

mv "$TMP_FILE" "$TARGET_FILE"

AFTER_SIZE=$(wc -c < "$TARGET_FILE" | tr -d ' ')

echo "Done."
echo "  Source: $SOURCE_FILE (${BEFORE_SIZE} bytes)"
echo "  Output: $TARGET_FILE (${AFTER_SIZE} bytes)"
