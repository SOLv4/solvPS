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
  await chrome.storage.sync.set(payload);
  const status = document.getElementById("status");
  if (status) {
    status.textContent = "저장됨";
    setTimeout(() => {
      status.textContent = "";
    }, 1200);
  }
}

document.getElementById("saveBtn").addEventListener("click", save);
restore();
