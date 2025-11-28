export type AuthenticatedUser = {
  id: string;
  userId: string;
  email: string;
  role: "customer" | "contractor" | "admin";
};
