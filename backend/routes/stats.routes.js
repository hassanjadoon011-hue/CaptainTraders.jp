const router = require("express").Router();
const Car = require("../models/Car");
const Message = require("../models/Message");
const { protect } = require("../middleware/auth");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

router.get("/", protect, async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    // Old sold cars may not have soldAt yet, so fall back to updatedAt
    const withSoldDate = { $addFields: { soldDate: { $ifNull: ["$soldAt", "$updatedAt"] } } };

    const [carStats, messageTotal, messageUnread] = await Promise.all([
      Car.aggregate([
        {
          $facet: {
            totals: [
              {
                $group: {
                  _id: { $cond: [{ $eq: ["$status", "sold"] }, "sold", "available"] },
                  count: { $sum: 1 },
                  value: { $sum: "$price" },
                },
              },
            ],
            monthly: [
              { $match: { status: "sold" } },
              withSoldDate,
              { $match: { soldDate: { $gte: sixMonthsAgo } } },
              {
                $group: {
                  _id: { y: { $year: "$soldDate" }, m: { $month: "$soldDate" } },
                  count: { $sum: 1 },
                  revenue: { $sum: "$price" },
                },
              },
            ],
            recent: [
              { $match: { status: "sold" } },
              withSoldDate,
              { $sort: { soldDate: -1 } },
              { $limit: 5 },
              {
                $project: {
                  make: 1,
                  model: 1,
                  year: 1,
                  price: 1,
                  soldDate: 1,
                  image: { $arrayElemAt: ["$images", 0] },
                },
              },
            ],
          },
        },
      ]),
      Message.countDocuments(),
      Message.countDocuments({ isRead: { $ne: true } }),
    ]);

    const facet = carStats[0] || { totals: [], monthly: [], recent: [] };
    const find = (key) => facet.totals.find((t) => t._id === key) || { count: 0, value: 0 };
    const available = find("available");
    const sold = find("sold");

    // Last 6 months, with zeros for months that had no sales
    const monthly = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const hit = facet.monthly.find(
        (m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1
      );
      monthly.push({
        label: MONTHS[d.getMonth()],
        revenue: hit ? hit.revenue : 0,
        count: hit ? hit.count : 0,
      });
    }

    res.json({
      success: true,
      data: {
        cars: {
          total: available.count + sold.count,
          available: available.count,
          sold: sold.count,
        },
        revenue: {
          total: sold.value,
          thisMonth: monthly[monthly.length - 1].revenue,
          soldThisMonth: monthly[monthly.length - 1].count,
          inventoryValue: available.value,
        },
        monthly,
        recentSales: facet.recent,
        messages: { total: messageTotal, unread: messageUnread },
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;