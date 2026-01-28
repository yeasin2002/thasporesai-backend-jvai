import { Category } from "./models/category.model";
import { Certification } from "./models/certification.model";
import { CompletionRequest } from "./models/completion-request.model";
import { Conversation } from "./models/conversation.model";
import { Experience } from "./models/experience.model";
import { FcmToken } from "./models/fcm-token.model";
import { JobInviteApplication } from "./models/invite-application-job.model";
import { Job } from "./models/job.model";
import { Location } from "./models/location.model";
import { Message } from "./models/message.model";
import { Notification } from "./models/notification.model";
import { Offer } from "./models/offer.model";
import { Review } from "./models/review.model";
import { Transaction } from "./models/transaction.model";
import { User } from "./models/user.model";
import { Wallet } from "./models/wallet.model";
import { WorkSample } from "./models/work-samples.model";

export const db = {
  // Payment system models
  offer: Offer,
  wallet: Wallet,
  transaction: Transaction,
  completionRequest: CompletionRequest,
  user: User,
  category: Category,
  job: Job,
  review: Review,
  location: Location,
  notification: Notification,
  fcmToken: FcmToken,
  conversation: Conversation,
  message: Message,
  experience: Experience,
  workSample: WorkSample,
  certification: Certification,
  inviteApplication: JobInviteApplication,
};
