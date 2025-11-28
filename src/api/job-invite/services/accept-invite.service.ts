import { NotificationService } from "@/common/service";
import { db } from "@/db";
import { sendError, sendSuccess } from "@/helpers";
import type { RequestHandler } from "express";

/**
 * Contractor accepts a job invite
 * PATCH /api/job-invite/:inviteId/accept
 */
export const acceptInvite: RequestHandler = async (req, res) => {
  try {
    const inviteId = req.params.inviteId;
    const contractorId = req.user?.userId;

    if (!contractorId) {
      return sendError(res, 401, "Unauthorized");
    }

    // Find invite
    const invite = await db.inviteApplication
      .findById(inviteId)
      .populate("job")
      .populate("customer", "full_name email");

    if (!invite) {
      return sendError(res, 404, "Invite not found");
    }

    // Verify contractor is the invited one
    if (invite.contractor.toString() !== contractorId) {
      return sendError(
        res,
        403,
        "You are not authorized to accept this invite"
      );
    }

    // Check if invite is still pending (invited or engaged status)
    if (invite.status !== "invited" && invite.status !== "engaged") {
      return sendError(res, 400, "This invite has already been processed");
    }

    // Check if job is still open
    const job = invite.job as any;
    if (job.status !== "open") {
      return sendError(res, 400, "This job is no longer available");
    }

    // Update invite status to engaged (accepted)
    invite.status = "engaged";
    await invite.save();

    // Create or get existing conversation
    const customerId = invite.customer._id || invite.customer;

    let conversation = await db.conversation.findOne({
      participants: { $all: [customerId, contractorId] },
    });

    if (!conversation) {
      conversation = await db.conversation.create({
        participants: [customerId, contractorId],
        lastMessage: {
          text: "Invite accepted",
          senderId: contractorId,
          timestamp: new Date(),
        },
        unreadCount: new Map([[customerId.toString(), 1]]),
        jobId: job._id,
      });
    }

    // Get contractor details for notification
    const contractor = await db.user.findById(contractorId);

    // Send notification to customer
    await NotificationService.sendToUser({
      userId: customerId.toString(),
      title: "Invite Accepted",
      body: `${
        contractor?.full_name || "A contractor"
      } has accepted your invite for "${job.title}"`,
      type: "job_invite_accept",
      data: {
        jobId: job._id.toString(),
        inviteId: inviteId,
        contractorId: contractorId,
        contractorName: contractor?.full_name || "",
        conversationId: conversation?._id?.toString() || "",
      },
    });

    // Populate invite details for response
    await invite.populate([
      { path: "job", select: "title description budget location category" },
      { path: "contractor", select: "full_name email profile_img" },
    ]);

    return sendSuccess(res, 200, "Invite accepted successfully", {
      invite,
      conversationId: conversation?._id?.toString() || "",
    });
  } catch (error) {
    console.error("Accept invite error:", error);
    return sendError(res, 500, "Failed to accept invite", error);
  }
};
