#!/usr/bin/env bash
set -euo pipefail

DESTINATION="${1:-.tools/arduino-cli/arduino-cli}"
VERSION="${ARDUINO_CLI_VERSION:-latest}"
OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Linux) PLATFORM_OS="Linux" ;;
  Darwin) PLATFORM_OS="macOS" ;;
  *)
    echo "Unsupported operating system: $OS" >&2
    exit 1
    ;;
esac

case "$ARCH" in
  x86_64|amd64) PLATFORM_ARCH="64bit" ;;
  arm64|aarch64) PLATFORM_ARCH="ARM64" ;;
  *)
    echo "Unsupported CPU architecture: $ARCH" >&2
    exit 1
    ;;
esac

if [[ "$VERSION" == "latest" ]]; then
  ARCHIVE_NAME="arduino-cli_latest_${PLATFORM_OS}_${PLATFORM_ARCH}.tar.gz"
else
  ARCHIVE_NAME="arduino-cli_${VERSION}_${PLATFORM_OS}_${PLATFORM_ARCH}.tar.gz"
fi

URL="https://downloads.arduino.cc/arduino-cli/${ARCHIVE_NAME}"
TARGET_DIR="$(dirname "$DESTINATION")"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

mkdir -p "$TARGET_DIR"
if [[ -x "$DESTINATION" ]]; then
  exit 0
fi

curl -fsSL "$URL" -o "$TMP_DIR/arduino-cli.tar.gz"
tar -xzf "$TMP_DIR/arduino-cli.tar.gz" -C "$TMP_DIR"
install -m 0755 "$TMP_DIR/arduino-cli" "$DESTINATION"
