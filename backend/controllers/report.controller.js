const reports = require("../services/report.service");
const { oneOf, fail } = require("../utils/validate");

const DAY = 86400000;

// ?from=YYYY-MM-DD&to=YYYY-MM-DD are Tokyo calendar days (00:00–23:59 JST).
// Default: the last 12 months up to now.
const tokyoDay = (v, endOfDay) => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = new Date(`${v}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}+09:00`);
  return isNaN(d) ? null : d;
};
const range = (q, defaultDays = 365) => {
  if ((q.from && !tokyoDay(q.from)) || (q.to && !tokyoDay(q.to))) return null;
  const to = q.to ? tokyoDay(q.to, true) : new Date();
  const from = q.from ? tokyoDay(q.from) : new Date(to.getTime() - defaultDays * DAY);
  return from <= to ? { from, to } : null;
};

const wrap = (fn) => async (req, res, next) => {
  try {
    const data = await fn(req.query || {});
    if (data?.error) return fail(res, data.error);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  profitAndLoss: wrap((q) => {
    const r = range(q);
    if (!r) return { error: "Choose a valid date range (start before end)." };
    const group = oneOf(q.group, ["day", "month", "year"]) || "month";
    if (group === "day" && r.to - r.from > 366 * DAY) return { error: "Daily reports cover at most one year." };
    return reports.profitAndLoss({ ...r, group });
  }),
  vehicles: wrap((q) => reports.vehicleProfit({ status: oneOf(q.status, ["sold", "available", "all"]) || "sold" })),
  countries: wrap((q) => {
    const r = range(q);
    return r ? reports.countries(r) : { error: "Choose a valid date range (start before end)." };
  }),
  inventory: wrap(() => reports.inventory()),
  receivables: wrap((q) => reports.receivables({ days: Math.min(365, Math.max(1, Number(q.days) || 30)) })),
};
