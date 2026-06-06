import { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/sendSuccess";
import { Transaction } from "../../models/transaction";

export async function getTransactions(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const decoded = req.user;
    const userId = decoded?.sub;

    const transactions = await Transaction.findAll({
      where: { userId },
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    sendSuccess(res, 200, "success", "FETCH_SUCCESS", transactions);
  } catch (error) {
    next(error);
  }
}
