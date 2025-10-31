
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("experience", experienceSchema);
registry.registerPath({
  method: "post",
  path: "/api/users/experience", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["experience"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "experience retrieved successfully",
      // content: {"application/json": {schema: experienceResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/users/experience", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["experience"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "experience retrieved successfully",
//       content: {
//         "application/json": {
//           schema: experienceResponseSchema,
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


