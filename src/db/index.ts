import { Category } from "./models/category.model";
import { Conversation } from "./models/conversation.model";
import { JobApplicationRequest } from "./models/job-application-request.model";
import { Job } from "./models/job.model";
import { Location } from "./models/location.model";
import { Message } from "./models/message.model";
import { Review } from "./models/review.model";
import { User } from "./models/user.model";

export const db = {
  user: User,
  category: Category,
  job: Job,
  review: Review,
  location: Location,
  jobApplicationRequest: JobApplicationRequest,
  conversation: Conversation,
  message: Message,
};
