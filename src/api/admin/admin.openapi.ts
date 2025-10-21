
import { registry } from "@/lib/openapi";

// registry.register("admin", adminSchema);
registry.registerPath({
  method: "post",
  path: "/api/admin",
  description: "",
  summary: "",
  tags: ["admin"],
  responses: {
    200: {
      description: "admin retrieved successfully",
      // content: {"application/json": {schema: adminResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/admin",
//   description: "",
//   summary: "",
//   tags: ["admin"],
//   responses: {
//     200: {
//       description: "admin retrieved successfully",
//       content: {
//         "application/json": {
//           schema: adminResponseSchema,
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


