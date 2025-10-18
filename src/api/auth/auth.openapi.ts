
import { registry } from "@/lib/openapi";

// registry.register("auth", authSchema);
registry.registerPath({
  method: "post",
  path: "/api/auth",
  description: "",
  summary: "",
  tags: ["auth"],
  responses: {
    200: {
      description: "auth retrieved successfully",
      // content: {"application/json": {schema: authResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/auth",
//   description: "",
//   summary: "",
//   tags: ["auth"],
//   responses: {
//     200: {
//       description: "auth retrieved successfully",
//       content: {
//         "application/json": {
//           schema: authResponseSchema,
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


