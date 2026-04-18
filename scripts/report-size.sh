#!/usr/bin/env bash
set -euo pipefail

ARDUINO_CLI="${1:?usage: report-size.sh <arduino-cli> <fqbn> <sketch-dir> <elf>}"
FQBN="${2:?usage: report-size.sh <arduino-cli> <fqbn> <sketch-dir> <elf>}"
SKETCH_DIR="${3:?usage: report-size.sh <arduino-cli> <fqbn> <sketch-dir> <elf>}"
ELF="${4:?usage: report-size.sh <arduino-cli> <fqbn> <sketch-dir> <elf>}"

if [[ ! -f "$ELF" ]]; then
  echo "Missing ELF file: $ELF. Run 'make build' first." >&2
  exit 1
fi

PROPERTIES_FILE="$(mktemp)"
trap 'rm -f "$PROPERTIES_FILE"' EXIT

"$ARDUINO_CLI" compile --fqbn "$FQBN" --show-properties "$SKETCH_DIR" > "$PROPERTIES_FILE"

AVR_GCC_PATH="$(awk -F= '/^runtime.tools.avr-gcc.path=/{print $2; exit}' "$PROPERTIES_FILE")"
MCU="$(awk -F= '/^build.mcu=/{print $2; exit}' "$PROPERTIES_FILE")"

if [[ -z "$AVR_GCC_PATH" || -z "$MCU" ]]; then
  echo "Could not determine avr-gcc toolchain path or MCU from arduino-cli properties." >&2
  exit 1
fi

AVR_SIZE="$AVR_GCC_PATH/bin/avr-size"

if [[ ! -x "$AVR_SIZE" ]]; then
  echo "Missing avr-size binary: $AVR_SIZE" >&2
  exit 1
fi

echo "Firmware size report for $ELF"
echo
"$AVR_SIZE" -C --mcu="$MCU" "$ELF"
echo
echo "Section breakdown:"
"$AVR_SIZE" -A "$ELF"
