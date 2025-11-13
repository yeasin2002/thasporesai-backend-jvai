import { registry } from "@/lib/openapi";
import { mediaTypeFormat, openAPITags } from "@/common/constants";

// registry.register("wallet", walletSchema);
registry.registerPath({
	method: "post",
	path: "/api/wallet", // use openAPITags basepath - Example: openAPITags.category.basepath
	description: "",
	summary: "",
	tags: ["wallet"], // use openAPITags name - Example: openAPITags.category.name
	responses: {
		200: {
			description: "wallet retrieved successfully",
			// content: {"application/json": {schema: walletResponseSchema,},},
		},
	},
});

// TODO: Add your openAPI specification here
//  Full Example
// registry.registerPath({
//   method: "get",
//   path: "/api/wallet", // use openAPITags basepath - Example: openAPITags.category.basepath
//   description: "",
//   summary: "",
//   tags: ["wallet"], // use openAPITags name - Example: openAPITags.category.name
//   responses: {
//     200: {
//       description: "wallet retrieved successfully",
//       content: {
//         "application/json": {
//           schema: walletResponseSchema,
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
