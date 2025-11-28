export type NotificationListsType =
  | "job_posted"
  | "job_application"

  // invite
  | "job_invite" // Customer invites contractor
  | "job_invite_accept" // Contractor accepts customer's invite
  | "job_invite_reject" // Contractor reject customer's invite
  | "job_invite_cancel" // Contractor reject customer's invite

  // offer
  | "job_request" // Contractor requests job from customer

  // offer
  | "sent_offer" // Customer sends offer to contractor
  | "accept_offer" // Contractor accepts offer
  | "offer_reject" // Customer rejects offer
  | "job_completed"

  // job completion
  | "review_submitted"
  | "general";

export const notificationTypeList: NotificationListsType[] = [
  "job_posted",
  "job_application",
  "job_invite",
  "job_invite_accept",
  "job_request",
  "sent_offer",
  "accept_offer",
  "job_completed",
  "review_submitted",
  "offer_reject",
  "general",
];
