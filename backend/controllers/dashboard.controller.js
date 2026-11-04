const Car = require("../models/Car");
const Order = require("../models/Order");
const Message = require("../models/Message");

const titleCase = (s) => String(s || "").replace(/\b\w/g, (c) => c.toUpperCase());

const summary = async (_req, res, next) => {
  try {
    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));

    const [
      carGroups, recommended, bestDeals, missingVolume,
      orderGroups, confirmed, monthly, countries,
      recentOrders, topViewed, unreadMessages,
    ] = await Promise.all([
      Car.aggregate([
        {
          $group: {
            _id: { $ifNull: ["$status", "available"] },
            n: { $sum: 1 },
            value: { $sum: { $ifNull: ["$price", 0] } },
            views: { $sum: { $ifNull: ["$views", 0] } },
          },
        },
      ]),
      Car.countDocuments({ status: { $ne: "sold" }, isRecommended: true }),
      Car.countDocuments({ status: { $ne: "sold" }, isBestDeal: true }),
      Car.countDocuments({
        status: { $ne: "sold" },
        $or: [{ m3: { $exists: false } }, { m3: null }, { m3: 0 }],
      }),
      Order.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Order.aggregate([
        { $match: { status: { $in: ["paid", "shipped", "completed"] } } },
        {
          $group: {
            _id: null,
            n: { $sum: 1 },
            value: { $sum: { $ifNull: ["$quote.total", { $ifNull: ["$carInfo.fobPrice", 0] }] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { createdAt: { $gte: start } } },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
            total: { $sum: 1 },
            orders: { $sum: { $cond: [{ $eq: ["$type", "order"] }, 1, 0] } },
          },
        },
      ]),
      Order.aggregate([
        { $match: { "customer.country": { $nin: [null, ""] } } },
        { $group: { _id: { $toLower: "$customer.country" }, n: { $sum: 1 } } },
        { $sort: { n: -1 } },
        { $limit: 5 },
      ]),
      Order.find()
        .sort("-createdAt")
        .limit(6)
        .select("orderNo type status isRead customer.name customer.country carInfo quote.total createdAt")
        .lean(),
      Car.find()
        .sort("-views")
        .limit(5)
        .select("make model year images views stockNo price status")
        .lean(),
      Message.countDocuments({ isRead: false }),
    ]);

    const cars = { available: 0, sold: 0, stockValue: 0, views: 0 };
    for (const g of carGroups) {
      cars.views += g.views;
      if (g._id === "sold") cars.sold = g.n;
      else {
        cars.available += g.n;
        cars.stockValue += g.value;
      }
    }

    const orders = { total: 0, byStatus: {} };
    for (const g of orderGroups) {
      orders.byStatus[g._id] = g.n;
      orders.total += g.n;
    }

    // Last 6 months, with empty months filled in
    const byMonth = new Map(monthly.map((m) => [m._id, m]));
    const months = [];
    for (let i = 0; i < 6; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
      const m = byMonth.get(key);
      months.push({
        key,
        label: d.toLocaleString("en", { month: "short", timeZone: "UTC" }),
        total: m?.total || 0,
        orders: m?.orders || 0,
      });
    }

    res.json({
      success: true,
      data: {
        cars: { ...cars, recommended, bestDeals, missingVolume },
        orders: {
          ...orders,
          confirmedCount: confirmed[0]?.n || 0,
          confirmedValue: confirmed[0]?.value || 0,
        },
        unreadMessages,
        months,
        topCountries: countries.map((c) => ({ country: titleCase(c._id), n: c.n })),
        recentOrders,
        topViewed,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { summary };