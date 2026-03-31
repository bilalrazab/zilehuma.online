import { z } from "zod";

export const CLIENT_PROFILE_REQUIRED_FIELDS = [
  "full_name",
  "phone",
  "gender",
  "date_of_birth",
  "address",
  "emergency_contact",
  "emergency_phone",
] as const;

export type ClientProfileField = (typeof CLIENT_PROFILE_REQUIRED_FIELDS)[number] | "notes";

export type ClientProfileFormValues = {
  full_name: string;
  phone: string;
  gender: string;
  date_of_birth: string;
  address: string;
  emergency_contact: string;
  emergency_phone: string;
  notes: string;
};

export const CLIENT_PROFILE_FIELD_LABELS: Record<ClientProfileField, string> = {
  full_name: "Full name",
  phone: "Phone",
  gender: "Gender",
  date_of_birth: "Date of birth",
  address: "Address",
  emergency_contact: "Emergency contact",
  emergency_phone: "Emergency phone",
  notes: "Notes",
};

const phoneRegex = /^[+]?[-()\d\s]{7,20}$/;

const dateOfBirthValidator = z
  .string({ required_error: "Date of birth is required" })
  .min(1, "Date of birth is required")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date <= today;
  }, "Date of birth must be today or earlier");

export const clientProfileSchema = z.object({
  full_name: z.string().trim().min(2, "Full name is required").max(100, "Full name is too long"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone is required")
    .max(20, "Phone is too long")
    .regex(phoneRegex, "Enter a valid phone number"),
  gender: z
    .string()
    .trim()
    .min(1, "Gender is required")
    .refine((value) => ["Male", "Female", "Other", "Prefer not to say"].includes(value), "Select a valid gender option"),
  date_of_birth: dateOfBirthValidator,
  address: z.string().trim().min(3, "Address is required").max(200, "Address is too long"),
  emergency_contact: z
    .string()
    .trim()
    .min(2, "Emergency contact is required")
    .max(100, "Emergency contact is too long"),
  emergency_phone: z
    .string()
    .trim()
    .min(7, "Emergency phone is required")
    .max(20, "Emergency phone is too long")
    .regex(phoneRegex, "Enter a valid emergency phone number"),
  notes: z.string().trim().max(2000, "Notes must be 2000 characters or fewer"),
});

export const normalizeClientProfileValues = <T extends Partial<ClientProfileFormValues>>(values: T): T => {
  return {
    ...values,
    full_name: values.full_name?.trim() as T["full_name"],
    phone: values.phone?.trim() as T["phone"],
    gender: values.gender?.trim() as T["gender"],
    date_of_birth: values.date_of_birth?.trim() as T["date_of_birth"],
    address: values.address?.trim() as T["address"],
    emergency_contact: values.emergency_contact?.trim() as T["emergency_contact"],
    emergency_phone: values.emergency_phone?.trim() as T["emergency_phone"],
    notes: values.notes?.trim() as T["notes"],
  };
};

export const validateClientProfileValues = (
  values: ClientProfileFormValues,
  onlyFields?: ClientProfileField[],
): Partial<Record<ClientProfileField, string>> => {
  const result = clientProfileSchema.safeParse(values);
  if (result.success) return {};

  const allowed = onlyFields ? new Set(onlyFields) : null;
  const errors: Partial<Record<ClientProfileField, string>> = {};

  for (const issue of result.error.issues) {
    const key = issue.path[0] as ClientProfileField | undefined;
    if (!key || (allowed && !allowed.has(key)) || errors[key]) continue;
    errors[key] = issue.message;
  }

  return errors;
};

export const getMissingClientProfileFields = (values: Partial<ClientProfileFormValues>): ClientProfileField[] => {
  const normalized = normalizeClientProfileValues(values);
  return CLIENT_PROFILE_REQUIRED_FIELDS.filter((field) => !normalized[field]);
};

export const isClientProfileComplete = (values: Partial<ClientProfileFormValues>) => {
  return getMissingClientProfileFields(values).length === 0;
};