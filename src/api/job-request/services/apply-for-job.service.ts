import { NotificationService } from "@/common/service/notification.service";
import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Contractor applies for a job
 * POST /api/job-request/apply/:jobId
 */
export const applyForJob: RequestHandler = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const contractorId = req.user?.userId;
    // const { message } = req.body;

    if (!contractorId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Check if job exists
    const job = await db.job.findById(jobId);
    if (!job) {
      return sendError(res, 404, "Job not found");
    }

    // Check if job is still open
    if (job.status !== "open") {
      return sendError(
        res,
        400,
        "This job is no longer accepting applications"
      );
    }

    // Check if contractor is trying to apply to their own job
    if (job.customerId.toString() === contractorId) {
      return sendError(res, 400, "You cannot apply to your own job");
    }

    // Get contractor details for notification (needed early for engagement case)
    const contractor = await db.user.findById(contractorId);
    if (!contractor) {
      return sendError(res, 404, "Contractor not found");
    }

    // Check if already applied or invited
    const existingApplication = await db.inviteApplication.findOne({
      job: jobId,
      contractor: contractorId,
    });

    if (existingApplication) {
      // If customer already invited, update to engaged status
      if (
        existingApplication.status === "invited" &&
        existingApplication.sender === "customer"
      ) {
        existingApplication.status = "engaged";
        existingApplication.sender = "contractor"; // Contractor is now engaging
        await existingApplication.save();

        await existingApplication.populate(
          "contractor",
          "full_name email profile_img"
        );

        // Send notification to customer about engagement
        await NotificationService.sendToUser({
          userId: job.customerId.toString(),
          title: "Contractor Accepted Invitation",
          body: `${contractor.full_name} has accepted your invitation for "${job.title}"`,
          type: "job_application",
          data: {
            jobId: jobId,
            applicationId: String(existingApplication._id),
            contractorId: contractorId,
            contractorName: contractor.full_name,
          },
        });

        return sendSuccess(
          res,
          200,
          "Application submitted successfully (engagement updated)",
          existingApplication
        );
      }

      // If already requested, engaged, offered, or assigned, return error
      if (
        existingApplication.status === "requested" ||
        existingApplication.status === "engaged" ||
        existingApplication.status === "offered" ||
        existingApplication.status === "assigned"
      ) {
        return sendError(res, 400, "You have already applied to this job");
      }

      // If cancelled, allow reapplication by updating status
      if (existingApplication.status === "cancelled") {
        existingApplication.status = "requested";
        existingApplication.sender = "contractor";
        await existingApplication.save();

        await existingApplication.populate(
          "contractor",
          "full_name email profile_img"
        );

        // Send notification to customer
        await NotificationService.sendToUser({
          userId: job.customerId.toString(),
          title: "New Job Application",
          body: `${contractor.full_name} has applied to your job "${job.title}"`,
          type: "job_application",
          data: {
            jobId: jobId,
            applicationId: String(existingApplication._id),
            contractorId: contractorId,
            contractorName: contractor.full_name,
          },
        });

        return sendSuccess(
          res,
          200,
          "Application resubmitted successfully",
          existingApplication
        );
      }
    }

    // Create application
    const application = await db.inviteApplication.create({
      job: jobId,
      customer: job.customerId,
      contractor: contractorId,
      status: "requested",
      sender: "contractor",
    });

    // Populate contractor details
    await application.populate("contractor", "full_name email profile_img");

    // Send notification to job owner (customer)
    await NotificationService.sendToUser({
      userId: job.customerId.toString(),
      title: "New Job Application",
      body: `${contractor.full_name} has applied to your job "${job.title}"`,
      type: "job_application",
      data: {
        jobId: jobId,
        applicationId: String(application._id),
        contractorId: contractorId,
        contractorName: contractor.full_name,
      },
    });

    return sendSuccess(
      res,
      201,
      "Application submitted successfully",
      application
    );
  } catch (error) {
    console.error("Job application error:", error);
    return sendError(res, 500, "Failed to submit application");
  }
};
