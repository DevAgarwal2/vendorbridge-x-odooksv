import { z } from "zod";

const trim = (s: unknown) => (typeof s === "string" ? s.trim() : s);

const requiredString = (label: string, min = 1, max = 255) =>
  z.preprocess(
    trim,
    z
      .string({ error: `${label} is required` })
      .min(min, `${label} must be at least ${min} characters`)
      .max(max, `${label} must be at most ${max} characters`)
  );

const optionalString = (max = 500) =>
  z.preprocess(
    trim,
    z
      .string()
      .max(max, `Must be at most ${max} characters`)
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v : null))
  );

const emailSchema = z.preprocess(
  trim,
  z
    .string({ error: "Email is required" })
    .min(1, "Email is required")
    .max(255, "Email too long")
    .email("Invalid email address")
);

const phoneSchema = z.preprocess(
  trim,
  z
    .string()
    .regex(/^[+\-\s\d()]{7,20}$/, "Invalid phone number")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v : null))
);

const gstSchema = z.preprocess(
  trim,
  z
    .string()
    .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, "Invalid GSTIN format (e.g. 22AAAAA0000A1Z5)")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v && v.length > 0 ? v.toUpperCase() : null))
);

const positiveInt = (label: string, max = 1_000_000) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .int(`${label} must be a whole number`)
    .min(1, `${label} must be at least 1`)
    .max(max, `${label} is too large`);

const nonNegativeNumber = (label: string, max = 1e12) =>
  z.coerce
    .number({ error: `${label} must be a number` })
    .min(0, `${label} must be 0 or more`)
    .max(max, `${label} is too large`)
    .finite();

const dateInFuture = (label = "Date") =>
  z.preprocess(
    (v) => (typeof v === "string" && v.length > 0 ? new Date(v) : v),
    z
      .date({ error: `${label} is required` })
      .refine((d) => d.getTime() > Date.now() - 60_000, `${label} must be in the future`)
  );

const id = z.coerce.number().int().positive();

export const registerSchema = z.object({
  firstName: requiredString("First name", 1, 100),
  lastName: requiredString("Last name", 1, 100),
  email: emailSchema,
  password: z
    .string({ error: "Password is required" })
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password too long"),
  phone: phoneSchema,
  country: optionalString(80),
  role: z
    .enum(["procurement_officer", "manager", "admin", "vendor"])
    .default("procurement_officer"),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const vendorCreateSchema = z.object({
  name: requiredString("Vendor name", 2, 200),
  category: requiredString("Category", 1, 100),
  gstNumber: gstSchema,
  contactNumber: phoneSchema,
  email: z.preprocess(
    trim,
    z
      .string()
      .email("Invalid email")
      .max(255, "Email too long")
      .optional()
      .or(z.literal(""))
      .transform((v) => (v && v.length > 0 ? v.toLowerCase() : null))
  ),
  address: optionalString(500),
  status: z.enum(["active", "pending", "blocked"]).default("active"),
  rating: nonNegativeNumber("Rating", 5).default(0),
});

export const rfqItemSchema = z.object({
  itemName: requiredString("Item name", 1, 200),
  quantity: positiveInt("Quantity", 1_000_000),
  unit: requiredString("Unit", 1, 30).default("NOS"),
});

export const rfqCreateSchema = z.object({
  title: requiredString("Title", 3, 200),
  category: requiredString("Category", 1, 100),
  description: optionalString(2000),
  deadline: dateInFuture("Deadline"),
  items: z
    .array(rfqItemSchema)
    .min(1, "Add at least one line item")
    .max(100, "Too many line items"),
  vendorIds: z
    .array(id)
    .min(1, "Assign at least one vendor")
    .max(50, "Too many vendors"),
});

export const quotationItemSchema = z.object({
  itemName: requiredString("Item name", 1, 200),
  quantity: positiveInt("Quantity", 1_000_000),
  unitPrice: nonNegativeNumber("Unit price", 1e9),
  total: nonNegativeNumber("Total", 1e9),
});

export const quotationCreateSchema = z.object({
  rfqId: id,
  vendorId: id,
  gstPercent: nonNegativeNumber("GST %", 100).default(18),
  deliveryDays: positiveInt("Delivery days", 365),
  paymentTerms: requiredString("Payment terms", 1, 200),
  notes: optionalString(1000),
  items: z
    .array(quotationItemSchema)
    .min(1, "Add at least one line item")
    .max(100, "Too many line items"),
});

export const idSchema = z.object({ id });

export type RegisterInput = z.infer<typeof registerSchema>;
export type VendorCreateInput = z.infer<typeof vendorCreateSchema>;
export type RfqCreateInput = z.infer<typeof rfqCreateSchema>;
export type QuotationCreateInput = z.infer<typeof quotationCreateSchema>;

export function formatZodError(error: z.ZodError): string {
  const first = error.issues[0];
  if (!first) return "Invalid input";
  const path = first.path.length > 0 ? `${first.path.join(".")}: ` : "";
  return `${path}${first.message}`;
}
