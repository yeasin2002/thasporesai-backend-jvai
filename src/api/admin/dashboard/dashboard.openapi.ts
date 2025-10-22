
import { registry } from "@/lib/openapi";

// registry.register("dashboard", dashboardSchema);
registry.registerPath({
  method: "post",
  path: "/api/admin/dashboard",
  description: "",
  summary: "",
  tags: ["dashboard"],
  responses: {
    200: {
      description: "dashboard retrieved successfully",
      // content: {"application/json": {schema: dashboardResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/admin/dashboard",
//   description: "",
//   summary: "",
//   tags: ["dashboard"],
//   responses: {
//     200: {
//       description: "dashboard retrieved successfully",
//       content: {
//         "application/json": {
//           schema: dashboardResponseSchema,
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


