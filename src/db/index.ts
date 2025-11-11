import { Category } from "./models/category.model";
import { Certification } from "./models/certification.model";
import { Conversation } from "./models/conversation.model";

import { Experience } from "./models/experience.model";
import { FcmToken } from "./models/fcm-token.model";
import { JobApplicationRequest } from "./models/job-application-request.model";
import { Job } from "./models/job.model";
import { Location } from "./models/location.model";
import { Message } from "./models/message.model";
import { Notification } from "./models/notification.model";
import { Review } from "./models/review.model";
import { User } from "./models/user.model";
import { WorkSample } from "./models/work-samples.model";

export const db = {
	user: User,
	category: Category,
	job: Job,
	review: Review,
	location: Location,
	jobApplicationRequest: JobApplicationRequest,
	notification: Notification,
	fcmToken: FcmToken,
	conversation: Conversation,
	message: Message,
	experience: Experience,
	workSample: WorkSample,
	certification: Certification,
};
