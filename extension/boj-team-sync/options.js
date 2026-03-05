const fields = ["apiBaseUrl", "apiToken", "teamId", "memberHandle"];

async function restore() {
  const config = await chrome.storage.sync.get(fields);
  for (const key of fields) {
    const el = document.getElementById(key);
    if (el) el.value = config[key] || "";
  }
}

async function save() {
  const payload = {};
  for (const key of fields) {
    const el = document.getElementById(key);
    payload[key] = (el?.value || "").trim();
  }

  const originPattern = getOriginPattern(payload.apiBaseUrl);
  if (!originPattern) {
    setStatus("API Base URL 형식이 올바르지 않습니다.");
    return;
  }
  if (!/^\d+$/.test(payload.teamId || "")) {
    setStatus("Team ID는 숫자만 입력하세요.");
    return;
  }

  try {
    const hasPermission = await chrome.permissions.contains({ origins: [originPattern] });
    if (!hasPermission) {
      const granted = await chrome.permissions.request({ origins: [originPattern] });
      if (!granted) {
        setStatus("해당 API 도메인 권한이 필요합니다.");
        return;
      }
    }
  } catch (_err) {
    setStatus("도메인 권한 확인에 실패했습니다.");
    return;
  }

  await chrome.storage.sync.set(payload);
  setStatus("저장됨");
}

function getOriginPattern(apiBaseUrl) {
  try {
    const url = new URL(apiBaseUrl);
    if (!/^https?:$/.test(url.protocol)) return "";
    return `${url.origin}/*`;
  } catch (_err) {
    return "";
  }
}

function setStatus(message) {
  const status = document.getElementById("status");
  if (!status) return;
  status.textContent = message;
  setTimeout(() => {
    status.textContent = "";
  }, 1600);
}

document.getElementById("saveBtn").addEventListener("click", save);
restore();
