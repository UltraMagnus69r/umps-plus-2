#!/usr/bin/env bash
# PipMint / UMPS+2 ONLY — start Cursor My Machines agent worker + open Cursor.
#
# Hardcoded project: /home/g/Desktop/UMPS
# Does NOT touch FilmCraft, speededitor-filmcraft, or any other directory.
# Does NOT open a terminal window.
set -euo pipefail

# Absolute path only — never derive from $PWD / launcher cwd / other projects.
UMPS_DIR="/home/g/Desktop/UMPS"
STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/pipmint"
LOG_FILE="$STATE_DIR/agent-worker.log"
PID_FILE="$STATE_DIR/agent-worker.pid"

error_message() {
  local msg="$1"
  echo "ERROR: $msg" >&2
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="PipMint Agent" --text="$msg" 2>/dev/null || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "PipMint Agent" "$msg" 2>/dev/null || true
  fi
}

info_message() {
  local msg="$1"
  echo "$msg"
  if command -v notify-send >/dev/null 2>&1; then
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

find_agent() {
  if command -v agent >/dev/null 2>&1; then
    command -v agent
    return 0
  fi
  if [[ -x "$HOME/.local/bin/agent" ]]; then
    printf '%s\n' "$HOME/.local/bin/agent"
    return 0
  fi
  return 1
}

worker_pid_alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# True if this pid is a My Machines `agent worker start` whose cwd is UMPS_DIR
# (not FilmCraft, not a Cursor IDE private-worker wrapper, not a shell wrapper).
is_umps_agent_worker() {
  local pid="$1"
  local cmdline cwd exe base
  cmdline="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
  [[ -n "$cmdline" ]] || return 1
  # Skip IDE/cloud private-worker wrappers.
  [[ "$cmdline" == *worker-api-socket* ]] && return 1
  [[ "$cmdline" == *cursor-agent-worker* ]] && return 1
  # Never treat FilmCraft / other projects as our worker.
  [[ "$cmdline" == *[Ff]ilm[Cc]raft* ]] && return 1
  [[ "$cmdline" == *speededitor-filmcraft* ]] && return 1
  [[ "$cmdline" == *'worker start'* ]] || return 1
  exe="$(readlink -f "/proc/$pid/exe" 2>/dev/null || true)"
  base="$(basename "$exe")"
  case "$base" in
    agent|cursor-agent|node|nodejs) ;;
    *) return 1 ;;
  esac
  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
  [[ "$cwd" == "$UMPS_DIR" ]]
}

find_existing_worker_pid() {
  if [[ -f "$PID_FILE" ]]; then
    local pid
    pid="$(tr -d '[:space:]' <"$PID_FILE" || true)"
    if worker_pid_alive "$pid" && is_umps_agent_worker "$pid"; then
      printf '%s\n' "$pid"
      return 0
    fi
    rm -f "$PID_FILE"
  fi

  local pid
  for pid in $(pgrep -u "$(id -u)" -f 'worker start' 2>/dev/null || true); do
    if is_umps_agent_worker "$pid"; then
      printf '%s\n' "$pid"
      return 0
    fi
  done
  return 1
}

start_worker_background() {
  local agent_bin="$1"
  mkdir -p "$STATE_DIR"
  {
    echo "===== $(date -Iseconds) starting UMPS agent worker from $UMPS_DIR ====="
  } >>"$LOG_FILE"

  # Detach fully: no terminal, survive launcher exit.
  # --worker-dir pins the workspace to UMPS even if something else changes cwd.
  (
    cd "$UMPS_DIR" || exit 1
    exec setsid -f "$agent_bin" worker --worker-dir "$UMPS_DIR" start >>"$LOG_FILE" 2>&1
  ) &

  local pid="" i
  for ((i = 0; i < 20; i++)); do
    pid="$(find_existing_worker_pid || true)"
    if [[ -n "$pid" ]]; then
      break
    fi
    sleep 0.25
  done
  if [[ -n "$pid" ]] && worker_pid_alive "$pid"; then
    printf '%s\n' "$pid" >"$PID_FILE"
    info_message "PipMint/UMPS agent worker started (pid $pid). Log: $LOG_FILE"
    return 0
  fi

  error_message "Failed to start UMPS agent worker. Check $LOG_FILE"
  return 1
}

# --- UMPS only from here ---

if [[ ! -d "$UMPS_DIR" ]]; then
  error_message "UMPS project directory not found: $UMPS_DIR"
  exit 1
fi

cd "$UMPS_DIR"

AGENT_BIN=""
if ! AGENT_BIN="$(find_agent)"; then
  error_message "Cursor agent CLI not found. Install it, or ensure ~/.local/bin/agent is on PATH."
  exit 1
fi

CURSOR_BIN=""
if ! CURSOR_BIN="$(find_cursor)"; then
  error_message "Cursor IDE not found. Install Cursor, or place the binary at ~/.local/bin/cursor (or a Cursor AppImage under ~/Applications)."
  exit 1
fi

mkdir -p "$STATE_DIR"

EXISTING_PID=""
if EXISTING_PID="$(find_existing_worker_pid)"; then
  info_message "UMPS agent worker already running (pid $EXISTING_PID); not starting a second one."
  printf '%s\n' "$EXISTING_PID" >"$PID_FILE"
else
  start_worker_background "$AGENT_BIN" || exit 1
fi

# Open Cursor into UMPS only (never FilmCraft or another path).
nohup "$CURSOR_BIN" "$UMPS_DIR" >/dev/null 2>&1 &
disown || true

exit 0
