
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("review", reviewSchema);
registry.registerPath({
  method: "post",
  path: "/api/review", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["review"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "review retrieved successfully",
      // content: {"application/json": {schema: reviewResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/review", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["review"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "review retrieved successfully",
//       content: {
//         "application/json": {
//           schema: reviewResponseSchema,
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


