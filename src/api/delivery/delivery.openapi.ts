import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("delivery", deliverySchema);
registry.registerPath({
  method: "post",
  path: "/api/delivery", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["delivery"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "delivery retrieved successfully",
      // content: {"application/json": {schema: deliveryResponseSchema,},},
    },
  },
});

// TODO: Add your openAPI specification here
//  Full Example
// registry.registerPath({
//   method: "get",
//   path: "/api/delivery", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["delivery"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "delivery retrieved successfully",
//       content: {
//         "application/json": {
//           schema: deliveryResponseSchema,
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
