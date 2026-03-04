const keys = ["apiBaseUrl", "apiToken", "teamId", "memberHandle"];

chrome.storage.sync.get(keys).then((config) => {
  setText("apiBaseUrlRow", `API: ${config.apiBaseUrl || "-"}`);
  setText("teamIdRow", `Team: ${config.teamId || "-"}`);
  setText("memberHandleRow", `Handle: ${config.memberHandle || "-"}`);
  setText("tokenRow", `Token: ${config.apiToken ? "설정됨" : "미설정"}`);
});

function setText(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}
