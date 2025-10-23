import { registry } from "@/lib/openapi";
import { openAPITags } from "@/shared/constants";

// registry.register("job", jobSchema);
registry.registerPath({
  method: "post",
  path: openAPITags.admin.job_management.basepath,
  description: "",
  summary: "",
  tags: [openAPITags.admin.job_management.name],
  responses: {
    200: {
      description: "job retrieved successfully",
      // content: {"application/json": {schema: jobResponseSchema,},},
    },
  },
});

// TODO: Add your openAPI specification here
//  Full Example
// registry.registerPath({
//   method: "get",
//   path: openAPITags.admin.job_management.basepath,
//   description: "",
//   summary: "",
//   tags: [openAPITags.admin.job_management.name],
//   responses: {
//     200: {
//       description: "job retrieved successfully",
//       content: {
//         "application/json": {
//           schema: jobResponseSchema,
//         },
//       },
//     },
//     500: {
//       description: "Internal server error",
//       content: {
//         "application/json": {
//           schema: ErrorResponseSchema,
//         },
//       },
//     },
//   },
// });
