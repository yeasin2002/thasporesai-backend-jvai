export const openAPITags = {
  authentication: { name: "Authentication", basepath: "/api/auth" },
  user: { name: "user", basepath: "/api/user" },
  job: { name: "job", basepath: "/api/job" },
  category: { name: "category", basepath: "/api/category" },
  location: { name: "location", basepath: "/api/location" },
  payment: { name: "payment", basepath: "/api/payment" },
  setting: { name: "setting", basepath: "/api/setting" },
  admin: {
    user_management: {
      name: "admin - user management",
      basepath: "/api/admin/user",
    },
    job_management: {
      name: "admin - job management",
      basepath: "/api/admin/job",
    },
    category_management: {
      name: "admin - category management",
      basepath: "/api/admin/category",
    },
    payment_management: {
      name: "admin - payment management",
      basepath: "/api/admin/payment",
    },
    setting_management: {
      name: "admin - setting management",
      basepath: "/api/admin/setting",
    },
  },
};
