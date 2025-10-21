import { Category } from "./models/category.model";
import { Job } from "./models/job.model";
import { Review } from "./models/review.model";
import { User } from "./models/user.model";

export const db = {
  user: User,
  category: Category,
  job: Job,
  review: Review,
};
