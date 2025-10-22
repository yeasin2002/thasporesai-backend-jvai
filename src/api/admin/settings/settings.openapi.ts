import { openAPITags } from "@/common/constants";
import { registry } from "@/lib/openapi";

// registry.register("settings", settingsSchema);
registry.registerPath({
  method: "post",
  path: openAPITags.admin.setting_management.basepath,
  description: "",
  summary: "",
  tags: [openAPITags.admin.setting_management.name],
  responses: {
    200: {
      description: "settings retrieved successfully",
      // content: {"application/json": {schema: settingsResponseSchema,},},
    },
  },
});

// TODO: Add your openAPI specification here
//  Full Example
// registry.registerPath({
//   method: "get",
//   path: openAPITags.admin.setting_management.basepath,
//   description: "",
//   summary: "",
//   tags: [openAPITags.admin.setting_management.name],
//   responses: {
//     200: {
//       description: "settings retrieved successfully",
//       content: {
//         "application/json": {
//           schema: settingsResponseSchema,
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
