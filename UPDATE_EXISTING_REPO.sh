#!/usr/bin/env bash
set -euo pipefail
source_root="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd -P)"
target="${1:-$HOME/Documents/Urban_Haven_v2.0.0/urban-haven}"
if [[ ! -e "$target/.git" ]]; then
  printf 'No Git repository found at: %s\nPass your existing repository folder as the first argument.\n' "$target" >&2
  exit 1
fi
target="$(cd -- "$target" && pwd -P)"
if [[ "$target" == "$source_root" ]]; then
  printf 'Run this helper from the newly extracted update, pointing to your existing repository.\n' >&2
  exit 1
fi
if [[ -n "$(git -C "$target" status --porcelain)" ]]; then
  printf 'Your existing repository has uncommitted changes. Commit or save them before applying this update. No files were copied.\n' >&2
  exit 1
fi
if [[ ! -f "$source_root/UPDATE_FILES.txt" ]]; then
  printf 'The update file list is missing. Extract the complete ZIP again.\n' >&2
  exit 1
fi
# Validate the entire list before copying anything.
while IFS= read -r file || [[ -n "$file" ]]; do
  [[ -z "$file" ]] && continue
  case "$file" in
    /*|..|../*|*/../*|*/..|.git|.git/*|node_modules/*|dist/*)
      printf 'Unsafe update entry: %s\n' "$file" >&2; exit 1 ;;
  esac
  [[ -f "$source_root/$file" ]] || { printf 'Missing update file: %s\n' "$file" >&2; exit 1; }
done < "$source_root/UPDATE_FILES.txt"
while IFS= read -r file || [[ -n "$file" ]]; do
  [[ -z "$file" ]] && continue
  mkdir -p -- "$target/$(dirname -- "$file")"
  cp -- "$source_root/$file" "$target/$file"
done < "$source_root/UPDATE_FILES.txt"
printf 'Urban Haven 2.2.0 source copied to: %s\nGit history was preserved. Nothing has been committed or pushed.\n\n' "$target"
printf 'Open that folder in Terminal, then run:\n\ngit add .\ngit commit -m "Simplify Urban Haven checklist and food tools"\ngit push origin main\n'
