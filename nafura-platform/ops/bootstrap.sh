#!/bin/sh
# Nafura toolchain bootstrap (Linux, macOS): portable Node, then JDK and caches, outside the repository.
# No root, nothing installed on the system: see ops/README.md, section Outillage.
#   sh nafura-platform/ops/bootstrap.sh
set -eu

TOOLCHAIN="${NAFURA_TOOLCHAIN:-$HOME/.nafura}"
OPS="$(cd "$(dirname "$0")" && pwd)"
NODE_VERSION="$(sed -n 's/^node\.version=//p' "$OPS/../stack.versions.properties" | tr -d '\r')"
[ -n "$NODE_VERSION" ] || { echo "ERREUR : node.version introuvable dans stack.versions.properties." >&2; exit 1; }

case "$(uname -s)" in
  Linux) OS=linux ;;
  Darwin) OS=darwin ;;
  *) echo "ERREUR : système non pris en charge ($(uname -s)) ; sous Windows, bootstrap.cmd." >&2; exit 1 ;;
esac
case "$(uname -m)" in
  x86_64|amd64) ARCH=x64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) echo "ERREUR : architecture non prise en charge ($(uname -m))." >&2; exit 1 ;;
esac

NODE_NAME="node-v$NODE_VERSION-$OS-$ARCH"
NODE_DIR="$TOOLCHAIN/node/$NODE_NAME"
echo "Outillage Nafura dans $TOOLCHAIN"
mkdir -p "$TOOLCHAIN/downloads" "$TOOLCHAIN/node"

if [ ! -x "$NODE_DIR/bin/node" ]; then
  echo "  téléchargement de Node $NODE_VERSION"
  curl -fsSL --retry 3 -o "$TOOLCHAIN/downloads/$NODE_NAME.tar.gz" "https://nodejs.org/dist/v$NODE_VERSION/$NODE_NAME.tar.gz" \
    || { echo "ERREUR : téléchargement impossible. Proxy d'entreprise : définir HTTPS_PROXY." >&2; exit 1; }
  tar -xzf "$TOOLCHAIN/downloads/$NODE_NAME.tar.gz" -C "$TOOLCHAIN/node"
fi

# The rest (JDK, check of the Node archive's SHA-256, caches) is done by toolchain.mjs.
exec "$NODE_DIR/bin/node" "$OPS/product/toolchain.mjs" install
