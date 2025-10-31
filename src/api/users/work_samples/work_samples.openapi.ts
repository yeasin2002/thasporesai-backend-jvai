
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("work_samples", work_samplesSchema);
registry.registerPath({
  method: "post",
  path: "/api/users/work_samples", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["work_samples"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "work_samples retrieved successfully",
      // content: {"application/json": {schema: work_samplesResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/users/work_samples", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["work_samples"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "work_samples retrieved successfully",
//       content: {
//         "application/json": {
//           schema: work_samplesResponseSchema,
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


