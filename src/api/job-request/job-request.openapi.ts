
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("job-request", job-requestSchema);
registry.registerPath({
  method: "post",
  path: "/api/job-request", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["job-request"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "job-request retrieved successfully",
      // content: {"application/json": {schema: job-requestResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/job-request", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["job-request"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "job-request retrieved successfully",
//       content: {
//         "application/json": {
//           schema: job-requestResponseSchema,
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


