(function initBojTeamSync() {
  console.info("[BOJ Team Sync] content script loaded:", location.href);
  const PENDING_KEY = "bojTeamSyncPendingSubmission";
  const LAST_UPLOADED_KEY = "bojTeamSyncLastUploadedSubmissionId";
  const MAX_STATUS_POLL = 80;
  const POLL_INTERVAL_MS = 1200;

  const isSubmitPage = /^\/submit\/\d+/.test(location.pathname);
  const isStatusPage = location.pathname === "/status";

  if (isSubmitPage) {
    wireSubmitCapture();
  }

  if (isStatusPage) {
    startStatusPolling();
  }

  function isExtensionContextInvalidatedError(err) {
    return String(err || "").includes("Extension context invalidated");
  }

  async function safeStorageGet(keys) {
    try {
      return await chrome.storage.local.get(keys);
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        console.warn("[BOJ Team Sync] extension context invalidated. Reload this page once.");
        return null;
      }
      throw err;
    }
  }

  async function safeStorageSet(value) {
    try {
      await chrome.storage.local.set(value);
      return true;
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        console.warn("[BOJ Team Sync] extension context invalidated during storage.set");
        return false;
      }
      throw err;
    }
  }

  async function safeStorageRemove(key) {
    try {
      await chrome.storage.local.remove(key);
      return true;
    } catch (err) {
      if (isExtensionContextInvalidatedError(err)) {
        console.warn("[BOJ Team Sync] extension context invalidated during storage.remove");
        return false;
      }
      throw err;
    }
  }

  function wireSubmitCapture() {
    const form =
      document.querySelector("#submit_form") ||
      document.querySelector("form[action='/submit']");
    if (!form) return;

    const capturePendingSubmission = async () => {
      const sourceEl = document.querySelector("#source, textarea[name='source']");
      const langEl = document.querySelector("select[name='language']");
      if (!sourceEl || !langEl) {
        console.warn("[BOJ Team Sync] submit elements not found");
        return;
      }

      const code = sourceEl.value || "";
      if (!code.trim()) {
        console.warn("[BOJ Team Sync] source empty, skip");
        return;
      }

      const problemId = getProblemIdFromPath();
      const selectedOption = langEl.options[langEl.selectedIndex];
      const language = selectedOption ? selectedOption.textContent.trim() : String(langEl.value || "");

      const pending = {
        problemId,
        language,
        sourceCode: code,
        capturedAt: new Date().toISOString()
      };

      const ok = await safeStorageSet({ [PENDING_KEY]: pending });
      if (!ok) return;
      console.info("[BOJ Team Sync] pending submission cached:", {
        problemId,
        language,
        codeLength: code.length
      });
    };

    form.addEventListener("submit", capturePendingSubmission);
    const submitButton = document.querySelector("button[type='submit'], #submit_button");
    if (submitButton) {
      submitButton.addEventListener("click", () => {
        void capturePendingSubmission();
      });
    }
  }

  function startStatusPolling() {
    let count = 0;
    const timer = setInterval(async () => {
      count += 1;
      const done = await checkAcceptedAndUpload();
      if (done || count >= MAX_STATUS_POLL) {
        clearInterval(timer);
      }
    }, POLL_INTERVAL_MS);
    void checkAcceptedAndUpload();

    window.addEventListener("focus", () => {
      void checkAcceptedAndUpload();
    });
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        void checkAcceptedAndUpload();
      }
    });
  }

  async function checkAcceptedAndUpload() {
    const status = extractLatestStatusRow();
    if (!status) {
      console.info("[BOJ Team Sync] status row not found yet");
      return false;
    }

    const local = await safeStorageGet([PENDING_KEY, LAST_UPLOADED_KEY]);
    if (!local) return true;
    const pending = local[PENDING_KEY];
    const lastUploadedSubmissionId = local[LAST_UPLOADED_KEY];

    if (status.result !== "accepted") {
      console.info("[BOJ Team Sync] latest status is not accepted:", {
        result: status.result,
        resultText: status.resultText
      });
      return false;
    }
    if (lastUploadedSubmissionId && String(lastUploadedSubmissionId) === String(status.submissionId)) {
      console.info("[BOJ Team Sync] already uploaded submission:", status.submissionId);
      return true;
    }
    if (pending && String(pending.problemId) !== String(status.problemId)) {
      console.info("[BOJ Team Sync] latest problem mismatch", {
        pendingProblemId: pending.problemId,
        latestProblemId: status.problemId
      });
      return false;
    }

    let sourceCode = pending?.sourceCode || "";
    let language = pending?.language || status.language || "";
    if (!sourceCode) {
      console.info("[BOJ Team Sync] no pending submission. fallback to /source fetch:", status.submissionId);
      sourceCode = await fetchSourceCodeBySubmissionId(status.submissionId);
      if (!sourceCode) {
        console.warn("[BOJ Team Sync] source fetch failed for submission:", status.submissionId);
        return false;
      }
    }

    const payload = {
      sourcePlatform: "baekjoon",
      submissionId: status.submissionId,
      problemId: status.problemId,
      language,
      sourceCode,
      runtimeMs: status.runtimeMs,
      memoryKb: status.memoryKb,
      submittedAt: status.submittedAt,
      result: "accepted"
    };

    chrome.runtime.sendMessage({ type: "UPLOAD_ACCEPTED_SUBMISSION", payload }, async (response) => {
      if (chrome.runtime.lastError) {
        console.warn("[BOJ Team Sync]", chrome.runtime.lastError.message);
        return;
      }

      if (!response?.ok) {
        console.warn("[BOJ Team Sync] upload failed:", response?.error);
        return;
      }

      const setOk = await safeStorageSet({ [LAST_UPLOADED_KEY]: status.submissionId });
      const removeOk = await safeStorageRemove(PENDING_KEY);
      if (!setOk || !removeOk) return;
      console.info("[BOJ Team Sync] submission uploaded");
    });

    return true;
  }

  function getProblemIdFromPath() {
    const parts = location.pathname.split("/");
    return parts[2] || "";
  }

  function extractLatestStatusRow() {
    const table = document.querySelector("#status-table tbody") || document.querySelector("table tbody");
    if (!table) return null;

    const row = table.querySelector("tr");
    if (!row) return null;

    const cells = row.querySelectorAll("td");
    if (cells.length < 8) return null;

    const submissionId = text(cells[0]);
    const problemId = text(cells[2]);
    const resultCell = cells[3];
    const resultText = text(resultCell);
    const memoryText = text(cells[4]);
    const runtimeText = text(cells[5]);
    const languageText = text(cells[6]);
    const submittedAtText = text(cells[7]);

    return {
      submissionId,
      problemId,
      result: normalizeResult(resultText, resultCell),
      resultText,
      memoryKb: parseNumber(memoryText),
      runtimeMs: parseNumber(runtimeText),
      language: languageText,
      submittedAt: submittedAtText
    };
  }

  async function fetchSourceCodeBySubmissionId(submissionId) {
    try {
      const res = await fetch(`/source/${submissionId}`, { credentials: "include" });
      if (!res.ok) return "";
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const source =
        doc.querySelector("#source")?.textContent ||
        doc.querySelector("pre#source")?.textContent ||
        doc.querySelector("pre")?.textContent ||
        "";
      return source.trim();
    } catch (err) {
      console.warn("[BOJ Team Sync] fetchSource error:", String(err));
      return "";
    }
  }

  function normalizeResult(value, resultCell) {
    const normalized = String(value || "").replace(/\s+/g, "").toLowerCase();
    const className = String(resultCell?.className || "").toLowerCase();
    const inner = String(resultCell?.innerHTML || "").toLowerCase();

    if (
      normalized.includes("맞았습니다") ||
      normalized.includes("accepted") ||
      className.includes("result-ac") ||
      inner.includes("result-ac")
    ) {
      return "accepted";
    }

    if (
      normalized.includes("채점중") ||
      normalized.includes("채점준비중") ||
      normalized.includes("준비중") ||
      normalized.includes("%") ||
      normalized.includes("judging") ||
      className.includes("result-pending") ||
      className.includes("result-judging") ||
      normalized.includes("기다리는중") ||
      className.includes("result-wait")
    ) {
      return "pending";
    }

    return "other";
  }

  function parseNumber(value) {
    const digits = value.replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
  }

  function text(el) {
    return (el?.textContent || "").trim();
  }
})();
