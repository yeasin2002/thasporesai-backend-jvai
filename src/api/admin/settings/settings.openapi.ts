
import { registry } from "@/lib/openapi";

// registry.register("settings", settingsSchema);
registry.registerPath({
  method: "post",
  path: "/api/admin/settings",
  description: "",
  summary: "",
  tags: ["settings"],
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
//   path: "/api/admin/settings",
//   description: "",
//   summary: "",
//   tags: ["settings"],
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


