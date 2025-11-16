
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("job-invite", job-inviteSchema);
registry.registerPath({
  method: "post",
  path: "/api/job-invite", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["job-invite"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "job-invite retrieved successfully",
      // content: {"application/json": {schema: job-inviteResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/job-invite", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["job-invite"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "job-invite retrieved successfully",
//       content: {
//         "application/json": {
//           schema: job-inviteResponseSchema,
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


