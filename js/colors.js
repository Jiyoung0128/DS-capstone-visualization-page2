/** step5 policy_sim/price_palette.py — grid 1만~20만 고정 20색 (보간 없음) */
export const PRICE_PALETTE = {
  10000: "#3F51B5",
  20000: "#2196F3",
  30000: "#00ACC1",
  40000: "#00897B",
  50000: "#43A047",
  60000: "#7CB342",
  70000: "#C0CA33",
  80000: "#FDD835",
  90000: "#FFB300",
  100000: "#FB8C00",
  110000: "#F4511E",
  120000: "#E53935",
  130000: "#D81B60",
  140000: "#8E24AA",
  150000: "#5E35B1",
  160000: "#3949AB",
  170000: "#1E88E5",
  180000: "#FF6F00",
  190000: "#FF3D00",
  200000: "#C62828",
};

export const PRICE_FILL = PRICE_PALETTE;

export const WHEELCHAIR_FILL = "#d1c4e9";
export const UNPRICED_FILL = "#e8eef3";
export const FACE_BG = "#f4f8fc";

function snapGridPrice(price) {
  const p = Math.max(10000, Math.min(200000, Number(price)));
  const idx = Math.round((p - 10000) / 10000);
  return 10000 + idx * 10000;
}

export function colorForPrice(price, priceColors = {}) {
  if (price == null) return WHEELCHAIR_FILL;
  const snapped = snapGridPrice(price);
  if (priceColors[String(snapped)]) return priceColors[String(snapped)];
  if (PRICE_PALETTE[snapped]) return PRICE_PALETTE[snapped];
  return UNPRICED_FILL;
}

export function formatWon(n) {
  return new Intl.NumberFormat("ko-KR").format(Math.round(n)) + "원";
}

export function formatPct(rate) {
  return (rate * 100).toFixed(2) + "%";
}
