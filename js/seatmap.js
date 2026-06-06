import { colorForPrice, FACE_BG, formatWon, WHEELCHAIR_FILL } from "./colors.js";

export function drawSeatMap(canvas, seats, priceColors, title) {
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  ctx.scale(dpr, dpr);
  ctx.fillStyle = FACE_BG;
  ctx.fillRect(0, 0, w, h);

  if (!seats?.length) {
    ctx.fillStyle = "#5c6b7a";
    ctx.font = "14px Malgun Gothic, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("좌석 데이터 없음", w / 2, h / 2);
    return;
  }

  const xs = seats.map((s) => s.x);
  const ys = seats.map((s) => s.y);
  const pad = 28;
  const xMin = Math.min(...xs) - pad;
  const xMax = Math.max(...xs) + pad;
  const yMin = Math.min(...ys) - pad;
  const yMax = Math.max(...ys) + pad;

  const sx = (x) => pad + ((x - xMin) / (xMax - xMin)) * (w - 2 * pad);
  const sy = (y) => pad + ((y - yMin) / (yMax - yMin)) * (h - 2 * pad - 36);

  const radius = Math.max(4, Math.min(7, (w - 2 * pad) / 120));

  ctx.fillStyle = "#2f66b3";
  ctx.font = "bold 12px Malgun Gothic, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("STAGE", w / 2, h - 12);

  if (title) {
    ctx.font = "bold 13px Malgun Gothic, sans-serif";
    ctx.fillText(title, w / 2, 16);
  }

  for (const seat of seats) {
    const x = sx(seat.x);
    const y = sy(seat.y);
    const fill = seat.wheelchair
      ? WHEELCHAIR_FILL
      : colorForPrice(seat.price, priceColors);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 0.8;
    ctx.stroke();
    if (!seat.wheelchair && seat.seat_no != null && seat.seat_no !== "") {
      ctx.fillStyle = "#1a1a1a";
      ctx.font = `bold ${radius > 5 ? 6 : 5}px Malgun Gothic, sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const label =
        typeof seat.seat_no === "number"
          ? String(seat.seat_no)
          : String(seat.seat_no);
      ctx.fillText(label, x, y);
    }
  }

  return { prices: [...new Set(seats.filter((s) => s.price).map((s) => s.price))].sort((a, b) => b - a) };
}

export function renderLegend(container, prices, priceColors) {
  container.innerHTML = "";
  for (const p of prices) {
    const chip = document.createElement("span");
    chip.className = "legend-chip";
    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = colorForPrice(p, priceColors);
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(`${p / 10000}만원`));
    container.appendChild(chip);
  }
}

export { formatWon };
