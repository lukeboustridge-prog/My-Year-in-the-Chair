type EventVisibilityContext =
  | string
  | null
  | undefined
  | {
      role?: string | null;
      isSittingMaster?: boolean | null;
      currentCraftOffice?: string | null;
    };

function normaliseRole(role: string | null | undefined): string | null {
  if (!role) return null;
  const trimmed = role.trim();
  if (!trimmed) return null;
  return trimmed.replace(/[\s/-]+/g, "_").toUpperCase();
}

export function canManageEventVisibility(context: EventVisibilityContext): boolean {
  if (!context) return false;

  if (typeof context === "object") {
    const role = normaliseRole(context.role ?? null);
    if (role && canManageEventVisibility(role)) {
      return true;
    }

    if (context.isSittingMaster) {
      return true;
    }

    const office = context.currentCraftOffice?.trim().toLowerCase();
    if (office && office.includes("secretary")) {
      return true;
    }

    return false;
  }

  const role = normaliseRole(context);
  if (!role) return false;

  if (role === "MASTERSECRETARY") {
    return true;
  }

  return role === "MASTER_SECRETARY" || role === "ADMIN" || role === "DISTRICT";
}
