import mongoose from "mongoose";
import CustomerModel from "../model/CustomerModel.js";
import DealModel from "../model/DealModel.js";
import QuotationModel from "../model/QuotationModel.js";
import CustomerCareModel from "../model/CustomerCareModel.js";

// Helper function for workspace matching
const getWorkspaceMatch = (workspaceId) => ({
  $match: {
    workspace: new mongoose.Types.ObjectId(workspaceId),
  },
});

// customer analysis
export const getCustomerStatusDistribution = async (req, res) => {
  try {
    console.log("Workspace ID:", req.workspaceId);
    const distribution = await CustomerModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            status: "$status",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          status: "$_id.status",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerIndustryDistribution = async (req, res) => {
  try {
    const distribution = await CustomerModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            industry: "$industry",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          industry: "$_id.industry",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1, count: -1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCustomerSourceDistribution = async (req, res) => {
  try {
    const distribution = await CustomerModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $lookup: {
          from: "sources",
          localField: "sourceId",
          foreignField: "_id",
          as: "source",
        },
      },
      { $unwind: "$source" },
      {
        $group: {
          _id: {
            source: "$source.name",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          source: "$_id.source",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1, count: -1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getMonthlyIncomeDistribution = async (req, res) => {
  try {
    const distribution = await CustomerModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $addFields: {
          numericIncome: {
            $toDouble: {
              $replaceAll: {
                input: { $ifNull: ["$monthlyIncome", "0"] },
                find: ",",
                replacement: "",
              },
            },
          },
        },
      },
      {
        $group: {
          _id: {
            range: {
              $switch: {
                branches: [
                  { case: { $lte: ["$numericIncome", 5000] }, then: "0-5k" },
                  { case: { $lte: ["$numericIncome", 10000] }, then: "5k-10k" },
                  {
                    case: { $lte: ["$numericIncome", 15000] },
                    then: "10k-15k",
                  },
                  {
                    case: { $lte: ["$numericIncome", 20000] },
                    then: "15k-20k",
                  },
                  {
                    case: { $gt: ["$numericIncome", 20000] },
                    then: "Above 20k",
                  },
                ],
                default: "Not Specified",
              },
            },
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
          min: { $min: "$numericIncome" },
          max: { $max: "$numericIncome" },
          avg: { $avg: "$numericIncome" },
        },
      },
      {
        $project: {
          range: "$_id.range",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          statistics: {
            min: { $round: ["$min", 2] },
            max: { $round: ["$max", 2] },
            avg: { $round: ["$avg", 2] },
          },
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1, range: 1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// deal analysis
export const getDealStatusDistribution = async (req, res) => {
  try {
    const distribution = await DealModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            status: "$status",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
          totalValue: { $sum: "$value" },
        },
      },
      {
        $project: {
          status: "$_id.status",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          totalValue: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1, status: 1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDealValueAnalysis = async (req, res) => {
  try {
    const analysis = await QuotationModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalValue: { $sum: "$finalPrice" },
          averageValue: { $avg: "$finalPrice" },
          count: { $sum: 1 },
          minValue: { $min: "$finalPrice" },
          maxValue: { $max: "$finalPrice" },
          quotations: { $push: { id: "$_id", value: "$finalPrice" } },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          totalValue: { $round: ["$totalValue", 2] },
          averageValue: { $round: ["$averageValue", 2] },
          minValue: { $round: ["$minValue", 2] },
          maxValue: { $round: ["$maxValue", 2] },
          count: 1,
          quotations: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getProductPerformance = async (req, res) => {
  try {
    const deals = await DealModel.find({
      status: "Won",
      workspace: req.workspaceId,
    }).populate({
      path: "products.productId",
      select: "name category unit",
    });

    const performance = {};

    deals.forEach((deal) => {
      const month = deal.createdAt.getMonth() + 1;
      const year = deal.createdAt.getFullYear();
      const date = `${year}-${month.toString().padStart(2, "0")}`;

      deal.products.forEach((product) => {
        const key = `${product.productId._id}-${date}`;

        if (!performance[key]) {
          performance[key] = {
            productId: product.productId._id,
            productName: product.productId.name,
            category: product.productId.category,
            unit: product.productId.unit,
            month,
            year,
            date,
            totalQuantity: 0,
            totalValue: 0,
          };
        }

        performance[key].totalQuantity += product.quantity;
        performance[key].totalValue += product.price * product.quantity;
      });
    });

    const result = Object.values(performance).map((item) => ({
      ...item,
      totalValue: Number(item.totalValue.toFixed(2)),
    }));

    res.json({
      success: true,
      data: result.sort(
        (a, b) => a.date.localeCompare(b.date) || b.totalValue - a.totalValue
      ),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// customer care interaction

export const getInteractionTypeDistribution = async (req, res) => {
  try {
    const distribution = await CustomerCareModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            type: "$type",
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          type: "$_id.type",
          month: "$_id.month",
          year: "$_id.year",
          count: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      { $sort: { date: 1, count: -1 } },
    ]);

    res.json({
      success: true,
      data: distribution,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getInteractionTimeline = async (req, res) => {
  try {
    const timeline = await CustomerCareModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            month: { $month: "$date" },
            year: { $year: "$date" },
            type: "$type",
          },
          count: { $sum: 1 },
          uniqueCustomers: { $addToSet: "$customerId" },
        },
      },
      {
        $project: {
          month: "$_id.month",
          year: "$_id.year",
          type: "$_id.type",
          count: 1,
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
        },
      },
      {
        $group: {
          _id: "$date",
          interactions: {
            $push: {
              type: "$type",
              count: "$count",
              successRate: 0,
            },
          },
          totalInteractions: { $sum: "$count" },
          uniqueCustomers: { $addToSet: "$uniqueCustomers" },
        },
      },
      {
        $project: {
          _id: 1,
          date: "$_id",
          interactions: 1,
          totalInteractions: 1,
          uniqueCustomers: {
            $size: {
              $reduce: {
                input: "$uniqueCustomers",
                initialValue: [],
                in: { $setUnion: ["$$value", "$$this"] },
              },
            },
          },
          avgDuration: null,
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      data: timeline,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// sale performance

export const getQuotationAnalysis = async (req, res) => {
  try {
    const analysis = await QuotationModel.aggregate([
      getWorkspaceMatch(req.workspaceId),
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" },
          },
          totalQuotations: { $sum: 1 },
          totalOriginalValue: { $sum: "$totalPrice" },
          totalFinalValue: { $sum: "$finalPrice" },
          quotationsWithDiscount: {
            $sum: {
              $cond: [{ $gt: ["$discount.value", 0] }, 1, 0],
            },
          },
          avgDiscountPercentage: {
            $avg: {
              $cond: [
                { $eq: ["$discount.type", "percentage"] },
                "$discount.value",
                {
                  $multiply: [
                    {
                      $divide: [
                        { $subtract: ["$totalPrice", "$finalPrice"] },
                        "$totalPrice",
                      ],
                    },
                    100,
                  ],
                },
              ],
            },
          },
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: {
                $dateFromParts: {
                  year: "$_id.year",
                  month: "$_id.month",
                },
              },
            },
          },
          totalQuotations: 1,
          quotationsWithDiscount: 1,
          discountRate: {
            $cond: [
              { $eq: ["$totalQuotations", 0] },
              0,
              {
                $multiply: [
                  { $divide: ["$quotationsWithDiscount", "$totalQuotations"] },
                  100,
                ],
              },
            ],
          },
          avgDiscountPercentage: { $round: ["$avgDiscountPercentage", 2] },
          totalOriginalValue: { $round: ["$totalOriginalValue", 2] },
          totalFinalValue: { $round: ["$totalFinalValue", 2] },
          valueReduction: {
            $round: [
              {
                $multiply: [
                  {
                    $divide: [
                      {
                        $subtract: ["$totalOriginalValue", "$totalFinalValue"],
                      },
                      "$totalOriginalValue",
                    ],
                  },
                  100,
                ],
              },
              2,
            ],
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getDiscountAnalysis = async (req, res) => {
  try {
    const analysis = await QuotationModel.aggregate([
      {
        $match: {
          workspace: req.workspaceId,
        },
      },
      {
        $project: {
          date: {
            $dateToString: {
              format: "%Y-%m",
              date: "$createdAt",
            },
          },
          discountAmount: {
            $subtract: ["$totalPrice", "$finalPrice"],
          },
          discountPercentage: {
            $cond: [
              { $eq: ["$discount.type", "percentage"] },
              "$discount.value",
              {
                $multiply: [
                  {
                    $divide: [
                      { $subtract: ["$totalPrice", "$finalPrice"] },
                      "$totalPrice",
                    ],
                  },
                  100,
                ],
              },
            ],
          },
          isConverted: { $eq: ["$status", "Accepted"] },
          value: "$finalPrice",
          totalPrice: "$totalPrice",
          products: { $size: "$products" },
        },
      },
      {
        $group: {
          _id: "$date",
          deals: {
            $push: {
              discountPercentage: { $round: ["$discountPercentage", 2] },
              discountAmount: { $round: ["$discountAmount", 2] },
              isConverted: "$isConverted",
              value: { $round: ["$value", 2] },
              totalPrice: { $round: ["$totalPrice", 2] },
              products: "$products",
            },
          },
          avgDiscount: { $avg: "$discountPercentage" },
          maxDiscount: { $max: "$discountPercentage" },
          minDiscount: { $min: "$discountPercentage" },
          successfulDeals: {
            $sum: { $cond: ["$isConverted", 1, 0] },
          },
          totalDeals: { $sum: 1 },
          totalDiscountAmount: { $sum: "$discountAmount" },
        },
      },
      {
        $project: {
          date: "$_id",
          deals: 1,
          statistics: {
            avgDiscount: { $round: ["$avgDiscount", 2] },
            maxDiscount: { $round: ["$maxDiscount", 2] },
            minDiscount: { $round: ["$minDiscount", 2] },
            conversionRate: {
              $round: [
                {
                  $multiply: [
                    { $divide: ["$successfulDeals", "$totalDeals"] },
                    100,
                  ],
                },
                2,
              ],
            },
            totalDiscountAmount: { $round: ["$totalDiscountAmount", 2] },
          },
        },
      },
      { $sort: { date: 1 } },
    ]);

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
