export function canManageEventVisibility(role: string | null | undefined): boolean {
  if (!role) return false;
  return role === "MASTER_SECRETARY" || role === "ADMIN" || role === "DISTRICT";
}
