import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendBadRequest, sendCreated, sendInternalError } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Customer marks job as complete
 * Creates a CompletionRequest with status "pending" for admin approval
 */
export const completeJob: RequestHandler = async (req, res) => {
  try {
    const { id: jobId } = req.params;
    const customerId = req?.user?.id;

    // 1. Validate job exists and belongs to customer
    const job = await db.job.findOne({
      _id: jobId,
      customerId,
    });

    if (!job) {
      return sendBadRequest(res, "Job not found or you are not the owner");
    }

    // 2. Validate job is in progress
    if (job.status !== "in_progress") {
      return sendBadRequest(
        res,
        `Job must be in progress to mark as complete. Current status: ${job.status}`
      );
    }

    // 3. Get accepted offer
    const offer = await db.offer.findOne({
      job: jobId,
      status: "accepted",
    });

    if (!offer) {
      return sendBadRequest(res, "No accepted offer found for this job");
    }

    // 4. Validate contractor is assigned
    if (!job.contractorId) {
      return sendBadRequest(res, "No contractor assigned to this job");
    }

    // 5. Check if completion request already exists
    const existingRequest = await db.completionRequest.findOne({
      job: jobId,
    });

    if (existingRequest) {
      return sendBadRequest(
        res,
        `Completion request already exists with status: ${existingRequest.status}`
      );
    }

    // 6. Create completion request
    const completionRequest = await db.completionRequest.create({
      job: jobId,
      offer: offer._id,
      customer: customerId,
      contractor: job.contractorId,
      status: "pending",
    });

    // 7. Send notification to admin (optional - can be implemented later)
    // await NotificationService.sendToRole({
    //   role: "admin",
    //   title: "New Completion Request",
    //   body: `Job completion request from customer`,
    //   type: "general",
    //   data: {
    //     requestId: completionRequest._id.toString(),
    //     jobId: jobId.toString(),
    //   },
    // });

    return sendCreated(res, "Completion request created successfully", {
      requestId: completionRequest._id,
      jobId: jobId.toString(),
      status: "pending",
    });
  } catch (error) {
    console.error("Error creating completion request:", error);
    return sendInternalError(res, "Failed to create completion request", error);
  }
};
