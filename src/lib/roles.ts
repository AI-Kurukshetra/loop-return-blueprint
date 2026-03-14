export type AppRole = "admin" | "seller" | "client";

export function normalizeRole(role?: string | null): AppRole {
  if (role === "admin") {
    return "admin";
  }
  if (role === "client") {
    return "client";
  }
  // Backward compatibility for existing roles.
  if (role === "owner" || role === "member" || role === "seller") {
    return "seller";
  }
  return "seller";
}
