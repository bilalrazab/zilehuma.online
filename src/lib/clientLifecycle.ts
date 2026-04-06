import { isClientProfileComplete } from "@/lib/clientProfile";

export type ClientLifecycleRecord = Partial<{
  id: string;
  user_id: string | null;
  status: string | null;
  full_name: string | null;
  phone: string | null;
  gender: string | null;
  date_of_birth: string | null;
  address: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  notes: string | null;
}>;

const toProfileShape = (client?: ClientLifecycleRecord | null) => ({
  full_name: client?.full_name || "",
  phone: client?.phone || "",
  gender: client?.gender || "",
  date_of_birth: client?.date_of_birth || "",
  address: client?.address || "",
  emergency_contact: client?.emergency_contact || "",
  emergency_phone: client?.emergency_phone || "",
  notes: client?.notes || "",
});

export const isClientAwaitingActivation = (client?: ClientLifecycleRecord | null) => {
  return !client?.user_id || client.status === "pending_activation";
};

export const isClientProfilePending = (client?: ClientLifecycleRecord | null) => {
  if (!client?.user_id) return false;
  if (client.status === "pending_profile") return true;
  return !isClientProfileComplete(toProfileShape(client));
};

export const shouldAppearInClientList = (client?: ClientLifecycleRecord | null) => {
  return Boolean(client?.user_id) && client?.status !== "pending_activation";
};

export const shouldRouteToOnboarding = (client?: ClientLifecycleRecord | null) => {
  return isClientAwaitingActivation(client) || isClientProfilePending(client);
};