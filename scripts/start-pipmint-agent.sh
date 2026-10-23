#!/usr/bin/env bash
# PipMint / UMPS+2 ONLY — start agent worker, update repo, Vite, open Cursor + default browser.
#
# Does NOT touch FilmCraft, speededitor-filmcraft, or any other directory.
# Does NOT open a sticky terminal window (Terminal=false from the .desktop).
#
# Double-click order:
#   1. Start UMPS Cursor agent worker (background; AlreadyRunning = OK)
#   2. git pull --ff-only (safe; never hard-reset a dirty tree)
#   3. npm install if needed, then Vite on 127.0.0.1:5173
#   4. Verify HTTP 200 on Vite
#   5. Open http://localhost:5173/ in the default browser (xdg-open)
#   6. Open Cursor into the UMPS checkout
#
# Override with env:
#   UMPS_DIR=/path/to/UMPS
#   PIPMINT_WORKER_NAME=bazzite
#   PIPMINT_SKIP_GIT=1  PIPMINT_SKIP_NPM=1  PIPMINT_SKIP_VITE=1
#   PIPMINT_SKIP_BROWSER=1  PIPMINT_SKIP_CURSOR=1
set -euo pipefail

# Desktop launchers often have a thin PATH. Prefer Homebrew Node over Cursor’s bundled node.
export PATH="/home/linuxbrew/.linuxbrew/bin:${HOME}/.local/bin:/usr/local/bin:/usr/bin:${PATH:-/usr/bin}"

SCRIPT_PATH="$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || realpath "${BASH_SOURCE[0]}" 2>/dev/null || echo "${BASH_SOURCE[0]}")"
SCRIPT_DIR="$(cd "$(dirname "$SCRIPT_PATH")" && pwd)"

resolve_umps_dir() {
  local candidate
  if [[ -n "${UMPS_DIR:-}" && -d "$UMPS_DIR" ]]; then
    readlink -f "$UMPS_DIR"
    return 0
  fi
  # Script lives in <repo>/scripts — prefer that checkout.
  candidate="$(cd "$SCRIPT_DIR/.." && pwd)"
  if [[ -f "$candidate/package.json" ]] && grep -q '"name"[[:space:]]*:[[:space:]]*"pipmint"' "$candidate/package.json" 2>/dev/null; then
    printf '%s\n' "$candidate"
    return 0
  fi
  for candidate in \
    "${HOME}/Projects/UMPS" \
    "/var/home/UltraMagnus69r/Projects/UMPS" \
    "/home/g/Desktop/UMPS" \
    "${HOME}/Desktop/UMPS"
  do
    if [[ -d "$candidate" && -f "$candidate/package.json" ]]; then
      readlink -f "$candidate"
      return 0
    fi
  done
  return 1
}

UMPS_DIR="$(resolve_umps_dir)" || {
  echo "ERROR: UMPS project directory not found" >&2
  exit 1
}

STATE_DIR="${XDG_STATE_HOME:-$HOME/.local/state}/pipmint"
LOG_FILE="$STATE_DIR/agent-worker.log"
PID_FILE="$STATE_DIR/agent-worker.pid"
VITE_LOG="$STATE_DIR/vite-dev.log"
VITE_PID_FILE="$STATE_DIR/vite-dev.pid"
LAUNCH_LOG="$STATE_DIR/launcher.log"
AGENT_BIN_DEFAULT="${HOME}/.local/bin/agent"
VITE_HOST="127.0.0.1"
VITE_PORT="5173"
VITE_URL="http://${VITE_HOST}:${VITE_PORT}/"
BROWSER_URL="http://localhost:${VITE_PORT}/"

# Worker display name: Bazzite checkout → bazzite; else hostname (laptop-safe).
resolve_worker_name() {
  if [[ -n "${PIPMINT_WORKER_NAME:-}" ]]; then
    printf '%s\n' "$PIPMINT_WORKER_NAME"
    return 0
  fi
  case "$UMPS_DIR" in
    */Projects/UMPS|/var/home/*/Projects/UMPS)
      printf 'bazzite\n'
      return 0
      ;;
  esac
  if [[ -d /var/home/UltraMagnus69r && "$UMPS_DIR" == *UltraMagnus69r* ]]; then
    printf 'bazzite\n'
    return 0
  fi
  hostname -s 2>/dev/null || hostname
}

WORKER_NAME="$(resolve_worker_name)"

mkdir -p "$STATE_DIR"
exec >>"$LAUNCH_LOG" 2>&1
echo "===== $(date -Iseconds) PipMint launcher start UMPS_DIR=$UMPS_DIR worker=$WORKER_NAME ====="

error_message() {
  local msg="$1"
  echo "ERROR: $msg" >&2
  if command -v zenity >/dev/null 2>&1; then
    zenity --error --title="PipMint" --text="$msg" 2>/dev/null || true
  elif command -v notify-send >/dev/null 2>&1; then
    notify-send "PipMint" "$msg" 2>/dev/null || true
  fi
}

info_message() {
  local msg="$1"
  echo "$msg"
  if command -v notify-send >/dev/null 2>&1; then
    notify-send "PipMint" "$msg" 2>/dev/null || true
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
  if [[ -x "$AGENT_BIN_DEFAULT" ]]; then
    printf '%s\n' "$AGENT_BIN_DEFAULT"
    return 0
  fi
  if command -v agent >/dev/null 2>&1; then
    command -v agent
    return 0
  fi
  return 1
}

find_edge() {
  local candidate
  for candidate in microsoft-edge-stable microsoft-edge edge; do
    if command -v "$candidate" >/dev/null 2>&1; then
      printf '%s\n' "$(command -v "$candidate")"
      return 0
    fi
  done
  if command -v flatpak >/dev/null 2>&1 && flatpak info com.microsoft.Edge >/dev/null 2>&1; then
    printf 'flatpak:com.microsoft.Edge\n'
    return 0
  fi
  return 1
}

# Prefer the session default browser (xdg-open). Edge only if xdg-open is missing.
open_default_browser() {
  local url="$1"
  if command -v xdg-open >/dev/null 2>&1; then
    echo "Opening default browser via xdg-open: $url"
    nohup xdg-open "$url" >/dev/null 2>&1 &
    disown || true
    return 0
  fi

  local edge
  if edge="$(find_edge)"; then
    echo "xdg-open missing; falling back to Edge: $url"
    if [[ "$edge" == flatpak:com.microsoft.Edge ]]; then
      nohup flatpak run --branch=stable --arch=x86_64 --command=/app/bin/edge com.microsoft.Edge --new-window "$url" >/dev/null 2>&1 &
    else
      nohup "$edge" --new-window "$url" >/dev/null 2>&1 &
    fi
    disown || true
    return 0
  fi

  error_message "No browser opener found (xdg-open / Edge) for $url"
  return 1
}

worker_pid_alive() {
  local pid="$1"
  [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null
}

# True if this pid is a My Machines `agent worker … start` whose workspace is UMPS
# (not FilmCraft, not a Cursor IDE private-worker wrapper, not a shell wrapper).
is_umps_agent_worker() {
  local pid="$1"
  local cmdline cwd exe base
  cmdline="$(tr '\0' ' ' <"/proc/$pid/cmdline" 2>/dev/null || true)"
  [[ -n "$cmdline" ]] || return 1

  [[ "$cmdline" == *worker-api-socket* ]] && return 1
  [[ "$cmdline" == *cursor-agent-worker* ]] && return 1
  [[ "$cmdline" == *private_worker* ]] && return 1

  [[ "$cmdline" == *[Ff]ilm[Cc]raft* ]] && return 1
  [[ "$cmdline" == *speededitor-filmcraft* ]] && return 1

  [[ "$cmdline" == *worker* && "$cmdline" == *start* ]] || return 1
  [[ "$cmdline" == *'/agent '* || "$cmdline" == *'/cursor-agent '* || "$cmdline" == *'/agent' || "$cmdline" == *cursor-agent* ]] || return 1

  exe="$(readlink -f "/proc/$pid/exe" 2>/dev/null || true)"
  base="$(basename "$exe")"
  case "$base" in
    agent|cursor-agent|node|nodejs) ;;
    *) return 1 ;;
  esac

  cwd="$(readlink -f "/proc/$pid/cwd" 2>/dev/null || true)"
  if [[ "$cwd" == "$UMPS_DIR" ]]; then
    return 0
  fi
  [[ "$cmdline" == *"--worker-dir ${UMPS_DIR}"* || "$cmdline" == *"--worker-dir=${UMPS_DIR}"* ]]
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
  for pid in $(pgrep -u "$(id -u)" -f 'worker' 2>/dev/null || true); do
    if is_umps_agent_worker "$pid"; then
      printf '%s\n' "$pid"
      return 0
    fi
  done
  return 1
}

log_shows_already_running() {
  [[ -f "$LOG_FILE" ]] || return 1
  tail -n 40 "$LOG_FILE" 2>/dev/null | grep -qE 'WorkerDaemonAlreadyRunningError|already running for this data dir'
}

log_shows_worker_running() {
  [[ -f "$LOG_FILE" ]] || return 1
  tail -n 40 "$LOG_FILE" 2>/dev/null | grep -q 'Worker is now running'
}

start_worker_background() {
  local agent_bin="$1"
  {
    echo "===== $(date -Iseconds) starting UMPS agent worker from $UMPS_DIR name=$WORKER_NAME ====="
  } >>"$LOG_FILE"

  (
    cd "$UMPS_DIR" || exit 1
    # Match interactive form used on this machine: worker start --name …
    exec setsid -f "$agent_bin" worker start --name "$WORKER_NAME" >>"$LOG_FILE" 2>&1
  ) &

  local pid="" i
  for ((i = 0; i < 24; i++)); do
    pid="$(find_existing_worker_pid || true)"
    if [[ -n "$pid" ]]; then
      break
    fi
    if log_shows_worker_running || log_shows_already_running; then
      pid="$(find_existing_worker_pid || true)"
      if [[ -n "$pid" ]]; then
        break
      fi
    fi
    sleep 0.25
  done

  if [[ -z "$pid" ]]; then
    pid="$(find_existing_worker_pid || true)"
  fi

  if [[ -n "$pid" ]] && worker_pid_alive "$pid"; then
    printf '%s\n' "$pid" >"$PID_FILE"
    if log_shows_already_running; then
      info_message "UMPS agent worker already running (pid $pid)."
    else
      info_message "PipMint/UMPS agent worker started (pid $pid)."
    fi
    return 0
  fi

  if log_shows_already_running || log_shows_worker_running; then
    info_message "UMPS agent worker is up (see $LOG_FILE)."
    return 0
  fi

  error_message "Failed to start UMPS agent worker. Check $LOG_FILE"
  return 1
}

# True when Vite answers HTTP 200 (required before opening the browser).
vite_http_200() {
  local code
  code="$(curl -s -o /dev/null -w '%{http_code}' --connect-timeout 1 --max-time 2 "$VITE_URL" 2>/dev/null || echo 000)"
  [[ "$code" == "200" ]]
}

port_in_use() {
  local port="$1"
  if command -v ss >/dev/null 2>&1; then
    ss -ltn "sport = :$port" 2>/dev/null | grep -q LISTEN
  else
    curl -sf -o /dev/null --connect-timeout 1 "http://127.0.0.1:$port/" 2>/dev/null
  fi
}

start_vite_background() {
  if vite_http_200; then
    echo "Vite already serving HTTP 200 on ${VITE_HOST}:${VITE_PORT}; reusing."
    return 0
  fi

  if port_in_use "$VITE_PORT" && ! vite_http_200; then
    echo "Port $VITE_PORT is in use but not yet returning 200; waiting…"
  else
    echo "===== $(date -Iseconds) starting Vite ${VITE_HOST}:${VITE_PORT} =====" >>"$VITE_LOG"
    (
      cd "$UMPS_DIR" || exit 1
      # Ensure Homebrew npm/node (PATH already set above).
      exec setsid -f npm run dev -- --host "$VITE_HOST" --port "$VITE_PORT" >>"$VITE_LOG" 2>&1
    ) &
    echo $! >"$VITE_PID_FILE" || true
  fi

  local i
  for ((i = 0; i < 60; i++)); do
    if vite_http_200; then
      echo "Vite is up with HTTP 200 at $VITE_URL"
      return 0
    fi
    sleep 0.5
  done

  error_message "Vite did not return HTTP 200 on $VITE_URL — see $VITE_LOG"
  return 1
}

# Sets GIT_PULL_TOUCHED_DEPS=1 when package.json / package-lock.json moved forward.
safe_git_update() {
  GIT_PULL_TOUCHED_DEPS=0
  if [[ "${PIPMINT_SKIP_GIT:-}" == "1" ]]; then
    echo "Skipping git update (PIPMINT_SKIP_GIT=1)."
    return 0
  fi
  if ! command -v git >/dev/null 2>&1; then
    echo "git not found; continuing with existing tree."
    return 0
  fi
  if [[ ! -d "$UMPS_DIR/.git" ]]; then
    echo "Not a git checkout; skipping pull."
    return 0
  fi

  cd "$UMPS_DIR"
  local branch before after upstream pull_ok=0
  branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo main)"
  before="$(git rev-parse HEAD 2>/dev/null || echo unknown)"

  if ! git fetch origin 2>&1; then
    echo "WARN: git fetch failed; continuing with existing tree."
    return 0
  fi

  # Prefer configured upstream; else origin/<branch> when that remote ref exists.
  if upstream="$(git rev-parse --abbrev-ref '@{u}' 2>/dev/null)"; then
    echo "git pull --ff-only (upstream $upstream)"
    if git pull --ff-only 2>&1; then
      pull_ok=1
    fi
  elif git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
    echo "git pull --ff-only origin $branch"
    if git pull --ff-only origin "$branch" 2>&1; then
      pull_ok=1
    fi
  else
    echo "WARN: no remote tracking ref for branch '$branch'; skipping pull (no reset)."
    return 0
  fi

  if [[ "$pull_ok" == "1" ]]; then
    after="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
    echo "git pull --ff-only succeeded ($before → $after)."
    if [[ "$before" != "$after" ]]; then
      if git diff --name-only "$before" "$after" 2>/dev/null | grep -qE '^(package\.json|package-lock\.json)$'; then
        GIT_PULL_TOUCHED_DEPS=1
        echo "Dependency manifests changed after pull; npm install will run."
      fi
    fi
    return 0
  fi

  echo "WARN: git pull --ff-only blocked (dirty tree, divergence, or no ff). Continuing with existing tree — no reset."
  if ! git diff --quiet || ! git diff --cached --quiet; then
    echo "WARN: working tree has local changes; leaving them untouched."
  fi
  return 0
}

need_npm_install() {
  if [[ "${PIPMINT_SKIP_NPM:-}" == "1" ]]; then
    return 1
  fi
  if [[ ! -d "$UMPS_DIR/node_modules" ]]; then
    echo "node_modules missing — npm install needed."
    return 0
  fi
  if [[ "${GIT_PULL_TOUCHED_DEPS:-0}" == "1" ]]; then
    return 0
  fi
  # npm writes this after a successful install; missing = incomplete tree.
  if [[ ! -f "$UMPS_DIR/node_modules/.package-lock.json" && -f "$UMPS_DIR/package-lock.json" ]]; then
    echo "node_modules/.package-lock.json missing — npm install needed."
    return 0
  fi
  return 1
}

run_npm_install() {
  if ! command -v npm >/dev/null 2>&1; then
    error_message "npm not found (expected Homebrew at /home/linuxbrew/.linuxbrew/bin)."
    return 1
  fi
  echo "Using node=$(command -v node) ($(node -v 2>/dev/null || true)) npm=$(command -v npm)"
  cd "$UMPS_DIR"
  echo "===== $(date -Iseconds) npm install =====" >>"$LAUNCH_LOG"
  npm install 2>&1
}

# --- UMPS only from here ---

cd "$UMPS_DIR"

if [[ ! -f "$UMPS_DIR/package.json" ]]; then
  error_message "Not a PipMint/UMPS tree (missing package.json): $UMPS_DIR"
  exit 1
fi

AGENT_BIN=""
if ! AGENT_BIN="$(find_agent)"; then
  error_message "Cursor agent CLI not found. Install it, or ensure ~/.local/bin/agent is on PATH."
  exit 1
fi

CURSOR_BIN=""
if ! CURSOR_BIN="$(find_cursor)"; then
  error_message "Cursor IDE not found. Install Cursor, or place the binary at ~/.local/bin/cursor."
  exit 1
fi

# 1) Agent worker first (AlreadyRunning = OK)
EXISTING_PID=""
if EXISTING_PID="$(find_existing_worker_pid)"; then
  info_message "UMPS agent worker already running (pid $EXISTING_PID)."
  printf '%s\n' "$EXISTING_PID" >"$PID_FILE"
else
  start_worker_background "$AGENT_BIN" || exit 1
fi

# 2) Safe git pull
safe_git_update

# 3) npm install only when needed, then Vite
if need_npm_install; then
  run_npm_install || exit 1
else
  echo "Skipping npm install (deps already present / unchanged)."
fi

if [[ "${PIPMINT_SKIP_VITE:-}" != "1" ]]; then
  start_vite_background || exit 1
else
  echo "Skipping Vite (PIPMINT_SKIP_VITE=1)."
fi

# 4) Require HTTP 200 before browser / Cursor convenience opens
if [[ "${PIPMINT_SKIP_VITE:-}" != "1" ]]; then
  if ! vite_http_200; then
    local_i=0
    for ((local_i = 0; local_i < 20; local_i++)); do
      vite_http_200 && break
      sleep 0.25
    done
  fi
  if ! vite_http_200; then
    error_message "Vite is not returning HTTP 200 at $VITE_URL — not opening browser."
    exit 1
  fi
  echo "Verified HTTP 200 at $VITE_URL"
fi

# 5) Default browser → localhost:5173
if [[ "${PIPMINT_SKIP_BROWSER:-}" != "1" ]]; then
  open_default_browser "$BROWSER_URL" || true
fi

# 6) Cursor into this checkout
if [[ "${PIPMINT_SKIP_CURSOR:-}" != "1" ]]; then
  nohup "$CURSOR_BIN" "$UMPS_DIR" >/dev/null 2>&1 &
  disown || true
fi

echo "===== $(date -Iseconds) PipMint launcher done ====="
exit 0
