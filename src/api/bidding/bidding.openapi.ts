
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("bidding", biddingSchema);
registry.registerPath({
  method: "post",
  path: "/api/bidding", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["bidding"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "bidding retrieved successfully",
      // content: {"application/json": {schema: biddingResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/bidding", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["bidding"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "bidding retrieved successfully",
//       content: {
//         "application/json": {
//           schema: biddingResponseSchema,
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


