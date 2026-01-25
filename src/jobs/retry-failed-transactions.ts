import { db } from "@/db";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

/**
 * Retry failed transactions with exponential backoff
 * This job should be run periodically (e.g., every hour) via cron
 *
 * Usage:
 * - Add to cron: `0 * * * * node dist/jobs/retry-failed-transactions.js`
 * - Or call manually: `bun run src/jobs/retry-failed-transactions.ts`
 * - Or schedule in app: `setInterval(retryFailedTransactions, 60 * 60 * 1000)`
 */

const RETRY_DELAY_MINUTES = [5, 30, 120]; // 5 min, 30 min, 2 hours

/**
 * Calculate next retry time based on retry count (exponential backoff)
 */
function calculateNextRetryTime(retryCount: number): Date {
  const delayMinutes = RETRY_DELAY_MINUTES[retryCount] || 120;
  return new Date(Date.now() + delayMinutes * 60 * 1000);
}

/**
 * Check if a Stripe error is retryable
 */
function isStripeErrorRetryable(stripeError: string): boolean {
  // Non-retryable card errors (user needs to fix payment method)
  const nonRetryableCardErrors = [
    "card_declined",
    "insufficient_funds",
    "invalid_card",
    "expired_card",
    "incorrect_cvc",
    "incorrect_number",
    "invalid_expiry_month",
    "invalid_expiry_year",
    "card_not_supported",
    "processing_error",
  ];

  try {
    const errorData = JSON.parse(stripeError);
    if (nonRetryableCardErrors.includes(errorData.code)) {
      console.log(`⏭️ Skipping non-retryable card error: ${errorData.code}`);
      return false;
    }
  } catch (e) {
    // If we can't parse the error, assume it's retryable
  }

  return true;
}

/**
 * Check if a transaction is retryable
 */
function isRetryable(transaction: any): boolean {
  const maxRetries = transaction.maxRetries || 3;

  // Don't retry if max attempts reached
  if ((transaction.retryCount || 0) >= maxRetries) {
    console.log(
      `⏭️ Max retry attempts (${maxRetries}) reached for transaction ${transaction._id}`
    );
    return false;
  }

  // Check if Stripe error is retryable
  if (
    transaction.stripeError &&
    !isStripeErrorRetryable(transaction.stripeError)
  ) {
    return false;
  }

  // Check if enough time has passed (nextRetryAt)
  if (transaction.nextRetryAt && new Date() < transaction.nextRetryAt) {
    console.log(
      `⏰ Too soon to retry transaction ${transaction._id}. Next retry at ${transaction.nextRetryAt.toISOString()}`
    );
    return false;
  }

  return true;
}

/**
 * Retry a failed deposit transaction
 */
async function retryDeposit(transaction: any): Promise<boolean> {
  console.log(`🔄 Retrying deposit transaction ${transaction._id}`);

  try {
    // Get the original Payment Intent
    const paymentIntent = await stripe.paymentIntents.retrieve(
      transaction.stripePaymentIntentId
    );

    // If payment intent is already succeeded, update our record
    if (paymentIntent.status === "succeeded") {
      console.log(
        `✅ Payment Intent ${paymentIntent.id} already succeeded, updating transaction`
      );

      transaction.status = "completed";
      transaction.stripeStatus = paymentIntent.status;
      transaction.completedAt = new Date();
      await transaction.save();

      // Update wallet
      const wallet = await db.wallet.findOne({ user: transaction.from });
      if (wallet) {
        wallet.balance += transaction.amount;
        wallet.pendingDeposits = Math.max(
          0,
          (wallet.pendingDeposits || 0) - transaction.amount
        );
        await wallet.save();
      }

      return true;
    }

    // If payment intent is still pending or requires action, leave it
    if (
      paymentIntent.status === "processing" ||
      paymentIntent.status === "requires_action" ||
      paymentIntent.status === "requires_payment_method"
    ) {
      console.log(
        `⏳ Payment Intent ${paymentIntent.id} is ${paymentIntent.status}, skipping retry`
      );
      return false;
    }

    // If payment intent failed, we can't automatically retry (user needs to provide new payment method)
    console.log(
      `❌ Payment Intent ${paymentIntent.id} failed permanently, cannot retry automatically`
    );
    return false;
  } catch (error) {
    console.error(`❌ Error retrying deposit:`, error);
    return false;
  }
}

/**
 * Retry a failed withdrawal transaction
 */
async function retryWithdrawal(transaction: any): Promise<boolean> {
  console.log(`🔄 Retrying withdrawal transaction ${transaction._id}`);

  try {
    // Get user
    const user = await db.user.findById(transaction.from);
    if (!user || !user.stripeAccountId) {
      console.log(`❌ User or Stripe account not found for transaction`);
      return false;
    }

    // Check if original transfer exists
    if (transaction.stripeTransferId) {
      try {
        const transfer = await stripe.transfers.retrieve(
          transaction.stripeTransferId
        );

        // If transfer succeeded, update our record
        if (transfer.amount_reversed === 0) {
          console.log(
            `✅ Transfer ${transfer.id} already succeeded, updating transaction`
          );

          transaction.status = "completed";
          transaction.stripeStatus = "paid";
          transaction.completedAt = new Date();
          await transaction.save();

          return true;
        }

        // If transfer was reversed, we need to create a new one
        console.log(
          `🔄 Transfer ${transfer.id} was reversed, creating new one`
        );
      } catch (error) {
        // Transfer not found, create a new one
        console.log(`🔄 Transfer not found, creating new one`);
      }
    }

    // Create new transfer with new idempotency key
    const newIdempotencyKey = `${transaction.idempotencyKey}-retry-${transaction.retryCount || 0}`;

    const wallet = await db.wallet.findOne({ user: transaction.from });
    if (!wallet) {
      console.log(`❌ Wallet not found for transaction`);
      return false;
    }

    // Check if wallet still has sufficient balance
    if (wallet.balance < transaction.amount) {
      console.log(
        `❌ Insufficient balance for retry. Required: ${transaction.amount}, Available: ${wallet.balance}`
      );
      return false;
    }

    // Create new transfer
    const transfer = await stripe.transfers.create(
      {
        amount: Math.round(transaction.amount * 100),
        currency: "usd",
        destination: user.stripeAccountId,
        metadata: {
          userId: user._id.toString(),
          walletId: String(wallet._id),
          type: "withdrawal",
          originalTransactionId: transaction._id.toString(),
          retryAttempt: (transaction.retryCount || 0) + 1,
        },
      },
      {
        idempotencyKey: newIdempotencyKey,
      }
    );

    console.log(`✅ New transfer created: ${transfer.id}`);

    // Update transaction
    transaction.stripeTransferId = transfer.id;
    transaction.stripeStatus = "pending";
    transaction.status = "pending";
    transaction.failureReason = undefined;
    transaction.stripeError = undefined;
    await transaction.save();

    return true;
  } catch (error) {
    console.error(`❌ Error retrying withdrawal:`, error);

    if (error instanceof Stripe.errors.StripeError) {
      transaction.stripeError = JSON.stringify({
        code: error.code,
        message: error.message,
      });
      await transaction.save();
    }

    return false;
  }
}

/**
 * Main retry function
 */
export async function retryFailedTransactions() {
  console.log("🔄 Starting failed transaction retry job...");

  try {
    // Find failed transactions that are ready for retry
    const failedTransactions = await db.transaction.find({
      status: "failed",
      $or: [
        // Transactions that haven't been retried yet
        { retryCount: { $exists: false } },
        // Transactions that haven't exceeded max retries and are ready for retry
        {
          $and: [
            { retryCount: { $lt: 3 } }, // Default max retries
            {
              $or: [
                { nextRetryAt: { $exists: false } },
                { nextRetryAt: { $lte: new Date() } },
              ],
            },
          ],
        },
      ],
    });

    console.log(`📊 Found ${failedTransactions.length} failed transactions`);

    let retriedCount = 0;
    let successCount = 0;
    let skippedCount = 0;

    for (const transaction of failedTransactions) {
      // Check if retryable
      if (!isRetryable(transaction)) {
        skippedCount++;
        continue;
      }

      retriedCount++;

      // Update retry metadata BEFORE attempting retry
      const currentRetryCount = (transaction.retryCount || 0) + 1;
      transaction.retryCount = currentRetryCount;
      transaction.lastRetryAt = new Date();
      transaction.nextRetryAt = calculateNextRetryTime(currentRetryCount);

      // Retry based on transaction type
      let success = false;

      try {
        if (transaction.type === "deposit") {
          success = await retryDeposit(transaction);
        } else if (transaction.type === "withdrawal") {
          success = await retryWithdrawal(transaction);
        } else {
          console.log(
            `⏭️ Transaction type ${transaction.type} is not retryable`
          );
          await transaction.save();
          continue;
        }

        if (success) {
          successCount++;
          console.log(
            `✅ Successfully retried transaction ${transaction._id} (attempt ${currentRetryCount})`
          );
        } else {
          console.log(
            `❌ Retry failed for transaction ${transaction._id} (attempt ${currentRetryCount})`
          );
          await transaction.save();
        }
      } catch (error) {
        console.error(
          `❌ Error retrying transaction ${transaction._id}:`,
          error
        );
        await transaction.save();
      }

      // Add delay between retries to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(
      `✅ Retry job completed. Total: ${failedTransactions.length}, Retried: ${retriedCount}, Succeeded: ${successCount}, Skipped: ${skippedCount}`
    );

    return {
      total: failedTransactions.length,
      retried: retriedCount,
      succeeded: successCount,
      skipped: skippedCount,
    };
  } catch (error) {
    console.error("❌ Error in retry job:", error);
    throw error;
  }
}

// If running directly (not imported)
if (import.meta.url === `file://${process.argv[1]}`) {
  retryFailedTransactions()
    .then(() => {
      console.log("✅ Retry job finished");
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Retry job failed:", error);
      process.exit(1);
    });
}
