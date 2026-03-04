const CONFIG_KEYS = ["apiBaseUrl", "apiToken", "teamId", "memberHandle"];

function getConfig() {
  return chrome.storage.sync.get(CONFIG_KEYS);
}

async function uploadSubmission(payload) {
  const config = await getConfig();
  const missing = CONFIG_KEYS.filter((k) => !config[k]);
  if (missing.length > 0) {
    throw new Error(`Missing extension config: ${missing.join(", ")}`);
  }

  const endpoint = `${config.apiBaseUrl.replace(/\/$/, "")}/api/integrations/boj/submissions`;
  const body = {
    ...payload,
    teamId: config.teamId,
    memberHandle: config.memberHandle
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${config.apiToken}`
    },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  return res.json().catch(() => ({}));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "UPLOAD_ACCEPTED_SUBMISSION") {
    return false;
  }

  uploadSubmission(message.payload)
    .then((data) => sendResponse({ ok: true, data }))
    .catch((err) => sendResponse({ ok: false, error: String(err) }));

  return true;
});
