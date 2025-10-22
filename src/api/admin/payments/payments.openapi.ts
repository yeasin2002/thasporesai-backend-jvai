
import { registry } from "@/lib/openapi";

// registry.register("payments", paymentsSchema);
registry.registerPath({
  method: "post",
  path: "/api/admin/payments",
  description: "",
  summary: "",
  tags: ["payments"],
  responses: {
    200: {
      description: "payments retrieved successfully",
      // content: {"application/json": {schema: paymentsResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/admin/payments",
//   description: "",
//   summary: "",
//   tags: ["payments"],
//   responses: {
//     200: {
//       description: "payments retrieved successfully",
//       content: {
//         "application/json": {
//           schema: paymentsResponseSchema,
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


