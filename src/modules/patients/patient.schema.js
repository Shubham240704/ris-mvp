const { z } = require("zod");

const patientFields = {
    firstName: z.string().trim().min(1).max(100),
    lastName: z.string().trim().min(1).max(100),
    dateOfBirth: z.coerce.date(),
    sex: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    phone: z.string().trim().max(30).optional(),
    email: z.string().trim().email().max(254).optional(),
    address: z.string().trim().max(500).optional(),
};

function rejectFutureBirthDate(data, ctx) {
    if (data.dateOfBirth && data.dateOfBirth > new Date()) {
        ctx.addIssue({
            code: "custom",
            path: ["dateOfBirth"],
            message: "Date of birth cannot be in the future",
        });
    }
}

const createPatientSchema = z
    .object(patientFields)
    .superRefine(rejectFutureBirthDate);

const updatePatientSchema = z
    .object(patientFields)
    .partial()
    .refine(
        (data) => Object.keys(data).length > 0,
        "At least one field must be supplied"
    )
    .superRefine(rejectFutureBirthDate);

const listPatientsSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    search: z.string().trim().max(100).optional(),
});

module.exports = {
    createPatientSchema,
    updatePatientSchema,
    listPatientsSchema,
};
