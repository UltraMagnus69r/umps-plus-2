#!/usr/bin/env bash
# Launch Cursor agent worker for PipMint/UMPS and open the IDE into the project.
set -euo pipefail

UMPS_DIR="/home/g/Desktop/UMPS"
AGENT_CMD=(agent worker start)

error_message() {
  local msg="$1"
  echo "ERROR: $msg" >&2
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="PipMint Agent" --text="$msg" 2>/dev/null || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "PipMint Agent" "$msg" 2>/dev/null || true
  fi
}

find_cursor() {
  if command -v cursor >/dev/null 2>&1; then
    command -v cursor
    return 0
  fi
  local candidate
  for candidate in \
    "$HOME/.local/bin/cursor" \
    /usr/bin/cursor \
    /usr/local/bin/cursor \
    "$HOME/Applications/"*[Cc]ursor*.AppImage \
    /opt/cursor/cursor \
    /opt/Cursor/cursor
  do
    if [[ -x "$candidate" ]]; then
      printf '%s\n' "$candidate"
      return 0
    fi
  done
  return 1
}

open_worker_terminal() {
  local title="PipMint Agent Worker"
  # Keep the shell open after the worker exits so errors remain visible.
  local inner="cd $(printf '%q' "$UMPS_DIR") && ${AGENT_CMD[*]}; echo; echo 'Worker exited. Press Enter to close.'; read -r"

  if command -v gnome-terminal >/dev/null 2>&1; then
    gnome-terminal --title="$title" --working-directory="$UMPS_DIR" -- bash -lc "$inner" &
    return 0
  fi
  if command -v kgx >/dev/null 2>&1; then
    kgx --working-directory="$UMPS_DIR" -- bash -lc "$inner" &
    return 0
  fi
  if command -v xfce4-terminal >/dev/null 2>&1; then
    xfce4-terminal --title="$title" --working-directory="$UMPS_DIR" -e "bash -lc $(printf '%q' "$inner")" &
    return 0
  fi
  if command -v konsole >/dev/null 2>&1; then
    konsole --new-tab -p tabtitle="$title" --workdir "$UMPS_DIR" -e bash -lc "$inner" &
    return 0
  fi
  if command -v xterm >/dev/null 2>&1; then
    xterm -T "$title" -e bash -lc "cd $(printf '%q' "$UMPS_DIR") && ${AGENT_CMD[*]}; echo; echo 'Worker exited. Press Enter to close.'; read -r" &
    return 0
  fi

  error_message "No supported terminal found (tried gnome-terminal, kgx, xfce4-terminal, konsole, xterm)."
  return 1
}

if [[ ! -d "$UMPS_DIR" ]]; then
  error_message "UMPS project directory not found: $UMPS_DIR"
  exit 1
fi

cd "$UMPS_DIR"

if ! command -v agent >/dev/null 2>&1 && [[ ! -x "$HOME/.local/bin/agent" ]]; then
  error_message "Cursor agent CLI not found. Install it, or ensure ~/.local/bin/agent is on PATH."
  exit 1
fi

# Prefer PATH, fall back to common install location.
if ! command -v agent >/dev/null 2>&1; then
  export PATH="$HOME/.local/bin:$PATH"
fi

CURSOR_BIN=""
if ! CURSOR_BIN="$(find_cursor)"; then
  error_message "Cursor IDE not found. Install Cursor, or place the binary at ~/.local/bin/cursor (or a Cursor AppImage under ~/Applications)."
  exit 1
fi

open_worker_terminal || exit 1

# Open Cursor into the UMPS project (non-blocking).
nohup "$CURSOR_BIN" "$UMPS_DIR" >/dev/null 2>&1 &
disown || true

exit 0
