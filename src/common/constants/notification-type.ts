export type NotificationListsType =
	| "job_posted"
	| "job_application"
	| "job_invite" // Customer invites contractor
	| "job_request" // Contractor requests job from customer
	| "sent_offer" // Customer sends offer to contractor
	| "accept_offer" // Contractor accepts offer
	| "job_completed"
	| "review_submitted"
	| "general";

export const notificationTypeList: NotificationListsType[] = [
	"job_posted",
	"job_application",
	"job_invite",
	"job_request",
	"sent_offer",
	"accept_offer",
	"job_completed",
	"review_submitted",
	"general",
];
