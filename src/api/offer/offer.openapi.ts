
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("offer", offerSchema);
registry.registerPath({
  method: "post",
  path: "/api/offer", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["offer"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "offer retrieved successfully",
      // content: {"application/json": {schema: offerResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/offer", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["offer"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "offer retrieved successfully",
//       content: {
//         "application/json": {
//           schema: offerResponseSchema,
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


