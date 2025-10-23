
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("common", commonSchema);
registry.registerPath({
  method: "post",
  path: "/api/common", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["common"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "common retrieved successfully",
      // content: {"application/json": {schema: commonResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/common", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["common"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "common retrieved successfully",
//       content: {
//         "application/json": {
//           schema: commonResponseSchema,
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


