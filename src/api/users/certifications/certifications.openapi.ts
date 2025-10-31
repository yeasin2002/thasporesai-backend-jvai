
import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("certifications", certificationsSchema);
registry.registerPath({
  method: "post",
  path: "/api/users/certifications", // use openAPITags basepath - Example: openAPITags.category.basepath
  description: "",
  summary: "",
  tags: ["certifications"], // use openAPITags name - Example: openAPITags.category.name
  responses: {
    200: {
      description: "certifications retrieved successfully",
      // content: {"application/json": {schema: certificationsResponseSchema,},},
    },
  },
});




// TODO: Add your openAPI specification here
//  Full Example 
// registry.registerPath({
//   method: "get",
//   path: "/api/users/certifications", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["certifications"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "certifications retrieved successfully",
//       content: {
//         "application/json": {
//           schema: certificationsResponseSchema,
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


