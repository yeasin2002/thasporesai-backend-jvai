
import { registry } from "@/lib/openapi";

// registry.register("job", jobSchema);
registry.registerPath({
  method: "post",
  path: "/api/admin/job",
  description: "",
  summary: "",
  tags: ["job"],
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
//   path: "/api/admin/job",
//   description: "",
//   summary: "",
//   tags: ["job"],
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


