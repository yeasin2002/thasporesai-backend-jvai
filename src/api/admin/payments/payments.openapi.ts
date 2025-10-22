import { openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";

// registry.register("payments", paymentsSchema);
registry.registerPath({
  method: "post",
  path: openAPITags.admin.payment_management.basepath,
  description: "",
  summary: "",
  tags: [openAPITags.admin.payment_management.name],
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
//   path: openAPITags.admin.payment_management.basepath,
//   description: "",
//   summary: "",
//   tags: [openAPITags.admin.payment_management.name],
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
