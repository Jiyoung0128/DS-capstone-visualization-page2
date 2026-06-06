import { formatWon } from "./seatmap.js";
import { formatPct } from "./colors.js";
import { resolveAppUrl } from "./paths.js";

let manifest = null;
let selectedDate = null;
let selectedSlug = null;

const el = {
  calTitle: document.getElementById("cal-title"),
  calGrid: document.getElementById("cal-grid"),
  calPrev: document.getElementById("cal-prev"),
  calNext: document.getElementById("cal-next"),
  roundList: document.getElementById("round-list"),
  loadError: document.getElementById("load-error"),
  comparePanel: document.getElementById("compare-panel"),
  compareTitle: document.getElementById("compare-title"),
  baselineSeatmap: document.getElementById("baseline-seatmap"),
  baselineFigureHint: document.getElementById("baseline-figure-hint"),
  kpiPanel: document.getElementById("kpi-panel"),
  kpiTable: document.getElementById("kpi-table"),
  optSeatmap: document.getElementById("opt-seatmap"),
  optFigureHint: document.getElementById("opt-figure-hint"),
  salePredPanel: document.getElementById("sale-pred-panel"),
  salePredTitle: document.getElementById("sale-pred-title"),
  salePredBaseline: document.getElementById("sale-pred-baseline"),
  salePredBaselineHint: document.getElementById("sale-pred-baseline-hint"),
  salePredProposed: document.getElementById("sale-pred-proposed"),
  salePredProposedHint: document.getElementById("sale-pred-proposed-hint"),
  salePredActual: document.getElementById("sale-pred-actual"),
  salePredActualHint: document.getElementById("sale-pred-actual-hint"),
  placeholder: document.getElementById("opt-placeholder"),
};

function showPanel(node) {
  if (node) node.classList.remove("is-collapsed");
}

function hidePanel(node) {
  if (node) node.classList.add("is-collapsed");
}

function showError(msg) {
  if (!el.loadError) return;
  el.loadError.textContent = msg;
  el.loadError.hidden = false;
}

function clearError() {
  if (!el.loadError) return;
  el.loadError.hidden = true;
  el.loadError.textContent = "";
}

function normalizeSummary(data) {
  if (!data || typeof data !== "object") return null;
  if (data.baseline && data.per_seat_optimized) return data;
  if (data.summary?.baseline) return data.summary;
  return null;
}

let viewYear, viewMonth;

async function loadManifest() {
  const res = await fetch(resolveAppUrl("data/manifest.json"));
  if (!res.ok) throw new Error("manifest 로드 실패 — build_web_data.py 실행");
  manifest = await res.json();
  const dates = manifest.rounds.map((r) => r.date).sort();
  const first = dates[0] || "2026-05-05";
  const [y, m] = first.split("-").map(Number);
  viewYear = y;
  viewMonth = m - 1;
  renderCalendar();
}

function roundsByDate(date) {
  return manifest.rounds.filter((r) => r.date === date);
}

function datesWithShows() {
  return new Set(manifest.rounds.map((r) => r.date));
}

function renderCalendar() {
  const showDates = datesWithShows();
  el.calTitle.textContent = `${viewYear}년 ${viewMonth + 1}월`;
  el.calGrid.innerHTML = "";

  ["일", "월", "화", "수", "목", "금", "토"].forEach((d) => {
    const h = document.createElement("div");
    h.className = "cal-dow";
    h.textContent = d;
    el.calGrid.appendChild(h);
  });

  const first = new Date(viewYear, viewMonth, 1);
  const start = first.getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  for (let i = 0; i < start; i++) {
    const blank = document.createElement("div");
    blank.className = "cal-day cal-day--empty";
    el.calGrid.appendChild(blank);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "cal-day";
    btn.textContent = String(d);
    const hasShow = showDates.has(dateStr);
    if (hasShow) btn.classList.add("cal-day--show");
    if (selectedDate === dateStr) btn.classList.add("cal-day--selected");
    if (!hasShow) btn.disabled = true;
    btn.addEventListener("click", () => selectDate(dateStr));
    el.calGrid.appendChild(btn);
  }
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  selectedSlug = null;
  renderCalendar();
  renderRoundButtons();
  clearOptimization();
}

function renderRoundButtons() {
  el.roundList.innerHTML = "";
  if (!selectedDate) {
    el.roundList.innerHTML = "<p class='hint'>날짜를 선택하세요</p>";
    return;
  }
  const rounds = roundsByDate(selectedDate);
  if (!rounds.length) {
    el.roundList.innerHTML = "<p class='hint'>공연이 없습니다</p>";
    return;
  }
  rounds.forEach((r) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "round-btn";
    if (r.slug === selectedSlug) btn.classList.add("round-btn--active");
    btn.textContent = r.time;
    if (!r.has_results) btn.classList.add("round-btn--pending");
    btn.title = r.has_results
      ? "기존·제안 좌석도 있음"
      : "시뮬 미실행";
    btn.addEventListener("click", () => {
      selectRound(r).catch((err) => {
        console.error(err);
        showError(`회차 로드 오류: ${err.message}`);
      });
    });
    el.roundList.appendChild(btn);
  });
}

function bindSeatmapImage(img, url, hintEl, missingMsg) {
  if (!img) return;
  img.removeAttribute("hidden");
  img.style.display = "block";
  if (hintEl) {
    hintEl.hidden = true;
    hintEl.textContent = "";
  }
  img.onerror = () => {
    img.style.display = "none";
    if (hintEl) {
      hintEl.hidden = false;
      hintEl.textContent = missingMsg;
    }
  };
  img.onload = () => {
    img.style.display = "block";
    if (hintEl) hintEl.hidden = true;
  };
  img.src = `${resolveAppUrl(url)}?t=${Date.now()}`;
}

async function selectRound(round) {
  clearError();
  selectedSlug = round.slug;
  renderRoundButtons();

  if (!round.has_results) {
    clearOptimization();
    if (el.placeholder) {
      el.placeholder.textContent =
        "이 회차의 시뮬 결과가 없습니다. step5 run_price_grid_round.py --all 을 실행하세요.";
      showPanel(el.placeholder);
    }
    return;
  }

  hidePanel(el.placeholder);
  showPanel(el.comparePanel);
  showPanel(el.kpiPanel);

  const sumRes = await fetch(resolveAppUrl(`data/rounds/${round.slug}.json`));
  if (!sumRes.ok) {
    throw new Error(`API ${sumRes.status} — manifest/시뮬 데이터 확인`);
  }
  const raw = await sumRes.json();
  const summary = normalizeSummary(raw);
  if (!summary) {
    throw new Error("KPI 데이터 형식 오류");
  }

  if (el.compareTitle) {
    el.compareTitle.textContent = `${round.date} ${round.time} — 좌석 배치 비교`;
  }

  const baselineUrl =
    round.baseline_figure_url ||
    `assets/rounds/${round.slug}/seat_map_theater_price_baseline.png`;
  const proposedUrl =
    round.figure_url ||
    `assets/rounds/${round.slug}/seat_map_theater_price_proposed.png`;

  if (round.has_baseline_figure) {
    bindSeatmapImage(
      el.baselineSeatmap,
      baselineUrl,
      el.baselineFigureHint,
      "기존 좌석도를 불러오지 못했습니다. build_web_data.py 를 다시 실행하세요."
    );
  } else if (manifest.class_plot) {
    bindSeatmapImage(
      el.baselineSeatmap,
      manifest.class_plot,
      el.baselineFigureHint,
      "기존 등급 배치도를 불러오지 못했습니다."
    );
  } else if (el.baselineFigureHint) {
    if (el.baselineSeatmap) el.baselineSeatmap.style.display = "none";
    el.baselineFigureHint.hidden = false;
    el.baselineFigureHint.textContent =
      "회차별 관측가 좌석도가 없습니다.";
  }

  if (round.has_figure) {
    bindSeatmapImage(
      el.optSeatmap,
      proposedUrl,
      el.optFigureHint,
      "제안 좌석도를 불러오지 못했습니다."
    );
  } else if (el.optFigureHint) {
    if (el.optSeatmap) {
      el.optSeatmap.style.display = "none";
      el.optSeatmap.removeAttribute("src");
    }
    el.optFigureHint.hidden = false;
    el.optFigureHint.textContent =
      "제안 좌석도 PNG가 없습니다.";
  }

  renderKpiTable(summary);
  renderSalePredictionMaps(round);
}

function renderSalePredictionMaps(round) {
  if (!el.salePredPanel) return;

  const items = [
    {
      has: round.has_sale_pred_baseline,
      url:
        round.sale_pred_baseline_url ||
        `assets/rounds/${round.slug}/seat_map_prob_baseline.png`,
      img: el.salePredBaseline,
      hint: el.salePredBaselineHint,
      missing: "관측가 판매확률 히트맵이 없습니다.",
    },
    {
      has: round.has_sale_pred_proposed,
      url:
        round.sale_pred_proposed_url ||
        `assets/rounds/${round.slug}/seat_map_prob_proposed.png`,
      img: el.salePredProposed,
      hint: el.salePredProposedHint,
      missing: "제안가 판매확률 히트맵이 없습니다.",
    },
    {
      has: round.has_sale_pred_actual,
      url:
        round.sale_pred_actual_url ||
        `assets/rounds/${round.slug}/seat_map_actual_sold.png`,
      img: el.salePredActual,
      hint: el.salePredActualHint,
      missing: "실제 판매 히트맵이 없습니다.",
    },
  ];

  const any = items.some((item) => item.has);
  if (!any) {
    hidePanel(el.salePredPanel);
    return;
  }

  showPanel(el.salePredPanel);
  if (el.salePredTitle) {
    el.salePredTitle.textContent = `${round.date} ${round.time} — 판매 확률 예측 (극장 좌석도)`;
  }

  for (const item of items) {
    if (item.has) {
      bindSeatmapImage(item.img, item.url, item.hint, item.missing);
    } else if (item.hint) {
      if (item.img) {
        item.img.style.display = "none";
        item.img.removeAttribute("src");
      }
      item.hint.hidden = false;
      item.hint.textContent = item.missing;
    }
  }
}

function renderKpiTable(summary) {
  const base = summary.baseline;
  const opt = summary.per_seat_optimized;
  if (!el.kpiTable) return;

  const occDeltaPp = ((opt.occupancy_rate - base.occupancy_rate) * 100).toFixed(2);
  const revDeltaPct = base.expected_revenue
    ? (((opt.expected_revenue / base.expected_revenue) - 1) * 100).toFixed(2)
    : "—";
  const baseSold = Math.round(base.expected_sold);
  const optSold = Number(opt.expected_sold);
  const soldDelta = (optSold - baseSold).toFixed(1);

  el.kpiTable.innerHTML = "";

  const thead = document.createElement("thead");
  thead.innerHTML = `
    <tr>
      <th>지표</th>
      <th>기존 (관측가)</th>
      <th>제안 (최적)</th>
      <th>기존 대비 증감</th>
    </tr>`;
  el.kpiTable.appendChild(thead);

  const tbody = document.createElement("tbody");
  const rows = [
    ["판매 좌석 수", `${baseSold}`, `${optSold.toFixed(1)}`, soldDelta, Number(soldDelta) >= 0],
    ["좌석 점유율", formatPct(base.occupancy_rate), formatPct(opt.occupancy_rate), `${occDeltaPp}%p`, Number(occDeltaPp) >= 0],
    ["기대 매출", formatWon(base.expected_revenue), formatWon(opt.expected_revenue), revDeltaPct === "—" ? "—" : `${Number(revDeltaPct) >= 0 ? "+" : ""}${revDeltaPct}%`, Number(revDeltaPct) >= 0 || revDeltaPct === "—"],
  ];

  for (const [label, a, b, delta, positive] of rows) {
    const tr = document.createElement("tr");
    const deltaCls = delta === "—" ? "" : positive ? "pos" : "neg";
    const deltaPrefix =
      delta === "—" || String(delta).startsWith("+") || String(delta).startsWith("-")
        ? ""
        : Number(delta) >= 0
          ? "+"
          : "";
    tr.innerHTML = `
      <td>${label}</td>
      <td>${a}</td>
      <td>${b}</td>
      <td class="${deltaCls}">${deltaPrefix}${delta}</td>`;
    tbody.appendChild(tr);
  }
  el.kpiTable.appendChild(tbody);

}

function clearOptimization() {
  hidePanel(el.comparePanel);
  hidePanel(el.kpiPanel);
  hidePanel(el.salePredPanel);
  if (el.placeholder) {
    showPanel(el.placeholder);
    el.placeholder.textContent =
      "날짜와 회차를 선택하면 기존·제안 좌석 배치를 나란히 볼 수 있습니다.";
  }
  if (el.baselineSeatmap) {
    el.baselineSeatmap.style.display = "none";
    el.baselineSeatmap.removeAttribute("src");
  }
  if (el.baselineFigureHint) el.baselineFigureHint.hidden = true;
  if (el.optSeatmap) {
    el.optSeatmap.style.display = "none";
    el.optSeatmap.removeAttribute("src");
  }
  if (el.optFigureHint) el.optFigureHint.hidden = true;
  for (const [img, hint] of [
    [el.salePredBaseline, el.salePredBaselineHint],
    [el.salePredProposed, el.salePredProposedHint],
    [el.salePredActual, el.salePredActualHint],
  ]) {
    if (img) {
      img.style.display = "none";
      img.removeAttribute("src");
    }
    if (hint) hint.hidden = true;
  }
  if (el.kpiTable) el.kpiTable.innerHTML = "";
}

el.calPrev.addEventListener("click", () => {
  viewMonth -= 1;
  if (viewMonth < 0) {
    viewMonth = 11;
    viewYear -= 1;
  }
  renderCalendar();
});
el.calNext.addEventListener("click", () => {
  viewMonth += 1;
  if (viewMonth > 11) {
    viewMonth = 0;
    viewYear += 1;
  }
  renderCalendar();
});

loadManifest().catch((err) => {
  showError(err.message);
});
