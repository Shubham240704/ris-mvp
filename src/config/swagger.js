const swaggerDocument = {
    openapi: "3.0.3",

    info: {
        title: "Radiology Information System API",
        version: "1.0.0",
        description: `
RIS MVP backend API documentation.

Includes authentication and patient management.
All patient endpoints require authentication.

Use synthetic data only.
    `,
    },

    servers: [
        {
            url: "http://localhost:5000",
            description: "Local development server",
        },
    ],

    tags: [
        { name: "General", description: "API health and information" },
        { name: "Authentication", description: "Login and identity" },
        { name: "Patients", description: "Patient record management" },
        {
            name: "Appointments",
            description: "Radiology appointment scheduling and management",
        },
        {
            name: "Radiology Orders",
            description: "Create, retrieve, and track radiology examination orders",
        },
        {
            name: "Radiology Reports",
            description: "Create, retrieve, review, and finalize radiology reports",
        },
        {
            name: "Staff Management",
            description: "Administrator-controlled staff invitations and onboarding",
        },
    ],

    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "Enter the access token returned by login.",
            },
        },

        schemas: {
            ApiError: {
                type: "object",
                properties: {
                    success: { type: "boolean", example: false },
                    message: { type: "string" },
                },
            },

            PatientInput: {
                type: "object",
                required: ["firstName", "lastName", "dateOfBirth"],
                properties: {
                    firstName: { type: "string", example: "Nisha" },
                    lastName: { type: "string", example: "SwaggerDemo" },
                    dateOfBirth: {
                        type: "string",
                        format: "date",
                        example: "1999-01-18",
                    },
                    sex: {
                        type: "string",
                        enum: ["MALE", "FEMALE", "OTHER"],
                    },
                    phone: { type: "string", example: "9999999999" },
                    email: {
                        type: "string",
                        format: "email",
                        example: "nisha.demo@example.com",
                    },
                    address: {
                        type: "string",
                        example: "Synthetic demo record",
                    },
                },
            },

            Patient: {
                type: "object",
                properties: {
                    id: { type: "string", format: "uuid" },
                    patientNumber: { type: "string", example: "PAT-EXAMPLE" },
                    firstName: { type: "string" },
                    lastName: { type: "string" },
                    dateOfBirth: { type: "string", format: "date-time" },
                    sex: { type: "string", nullable: true },
                    phone: { type: "string", nullable: true },
                    email: { type: "string", nullable: true },
                    address: { type: "string", nullable: true },
                },
            },
            AppointmentInput: {
                type: "object",
                required: [
                    "patientId",
                    "scheduledAt",
                    "modality",
                    "procedure"
                ],
                properties: {
                    patientId: {
                        type: "string",
                        format: "uuid",
                        example: "19ecfc9a-40ed-4083-b8f8-2165f5886395"
                    },
                    scheduledAt: {
                        type: "string",
                        format: "date-time",
                        example: "2026-10-30T10:30:00+05:30"
                    },
                    modality: {
                        type: "string",
                        enum: [
                            "XRAY",
                            "CT",
                            "MRI",
                            "ULTRASOUND",
                            "MAMMOGRAPHY",
                            "PET_CT",
                            "OTHER"
                        ],
                        example: "MRI"
                    },
                    procedure: {
                        type: "string",
                        example: "MRI Brain"
                    },
                    location: {
                        type: "string",
                        example: "Radiology Room 1"
                    },
                    notes: {
                        type: "string",
                        example: "Synthetic demonstration appointment"
                    }
                }
            },

            AppointmentStatusUpdate: {
                type: "object",
                required: ["status"],
                properties: {
                    status: {
                        type: "string",
                        enum: [
                            "SCHEDULED",
                            "CONFIRMED",
                            "CHECKED_IN",
                            "COMPLETED",
                            "CANCELLED",
                            "NO_SHOW"
                        ],
                        example: "CONFIRMED"
                    }
                }
            },
            RadiologyOrderInput: {
                type: "object",
                required: ["patientId", "modality", "procedure"],
                properties: {
                    patientId: {
                        type: "string",
                        format: "uuid",
                        example: "19ecfc9a-40ed-4083-b8f8-2165f5886395"
                    },
                    appointmentId: {
                        type: "string",
                        format: "uuid",
                        description: "Optional ID of an existing appointment"
                    },
                    modality: {
                        type: "string",
                        enum: [
                            "XRAY",
                            "CT",
                            "MRI",
                            "ULTRASOUND",
                            "MAMMOGRAPHY",
                            "PET_CT",
                            "OTHER"
                        ],
                        example: "MRI"
                    },
                    procedure: {
                        type: "string",
                        example: "MRI Brain"
                    },
                    clinicalNote: {
                        type: "string",
                        example: "Synthetic demonstration note"
                    },
                    priority: {
                        type: "string",
                        enum: ["ROUTINE", "URGENT", "STAT"],
                        default: "ROUTINE",
                        example: "ROUTINE"
                    }
                }
            },

            OrderStatusUpdate: {
                type: "object",
                required: ["status"],
                properties: {
                    status: {
                        type: "string",
                        enum: [
                            "ORDERED",
                            "SCHEDULED",
                            "IN_PROGRESS",
                            "COMPLETED",
                            "CANCELLED"
                        ],
                        example: "SCHEDULED"
                    }
                }
            },
            OrderStatusOverride: {
                type: "object",
                required: ["status", "reason"],
                properties: {
                    status: {
                        type: "string",
                        enum: [
                            "ORDERED",
                            "SCHEDULED",
                            "IN_PROGRESS",
                            "COMPLETED",
                            "CANCELLED"
                        ],
                        example: "COMPLETED"
                    },
                    reason: {
                        type: "string",
                        minLength: 10,
                        maxLength: 1000,
                        example: "Examination completed but the status update was missed."
                    }
                }
            },

            RadiologyReportCreate: {
                type: "object",
                required: ["orderId"],
                properties: {
                    orderId: {
                        type: "string",
                        format: "uuid",
                        description: "ID of a completed radiology order",
                    },
                    findings: {
                        type: "string",
                        maxLength: 10000,
                        example: "Synthetic demonstration findings",
                    },
                    impression: {
                        type: "string",
                        maxLength: 5000,
                        example: "Synthetic demonstration impression",
                    },
                },
            },

            RadiologyReportUpdate: {
                type: "object",
                minProperties: 1,
                properties: {
                    findings: {
                        type: "string",
                        maxLength: 10000,
                    },
                    impression: {
                        type: "string",
                        maxLength: 5000,
                    },
                },
            },
            StaffInvitationCreate: {
                type: "object",
                required: ["name", "email", "role"],
                properties: {
                    name: {
                        type: "string",
                        minLength: 2,
                        maxLength: 120,
                        example: "Demo Radiologist",
                    },
                    email: {
                        type: "string",
                        format: "email",
                        example: "radiologist@example.com",
                    },
                    role: {
                        type: "string",
                        enum: [
                            "RECEPTIONIST",
                            "RADIOLOGIST",
                            "TECHNICIAN",
                            "PHARMACIST",
                        ],
                        example: "RADIOLOGIST",
                    },
                },
            },

            AcceptInvitationInput: {
                type: "object",
                required: ["token", "password"],
                properties: {
                    token: {
                        type: "string",
                        minLength: 64,
                        maxLength: 64,
                        example: "ReplaceWithYour64CharacterInvitationToken",
                    },
                    password: {
                        type: "string",
                        minLength: 12,
                        maxLength: 200,
                        format: "password",
                    },
                },
            },
        },
    },

    paths: {
        "/": {
            get: {
                tags: ["General"],
                summary: "Get API information",
                responses: {
                    200: { description: "API information returned" },
                },
            },
        },

        "/api/health": {
            get: {
                tags: ["General"],
                summary: "Check API and database health",
                responses: {
                    200: {
                        description: "API and database are available",
                    },
                    503: {
                        description: "Database is unavailable",
                    },
                },
            },
        },

        "/api/auth/login": {
            post: {
                tags: ["Authentication"],
                summary: "Log in",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                required: ["email", "password"],
                                properties: {
                                    email: {
                                        type: "string",
                                        format: "email",
                                        example: "admin@ris.com",
                                    },
                                    password: {
                                        type: "string",
                                        format: "password",
                                        example: "EnterYourLocalPassword",
                                    },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: {
                        description: "Login successful; access token returned",
                    },
                    400: { description: "Invalid request data" },
                    401: { description: "Invalid credentials" },
                    429: { description: "Too many login attempts" },
                },
            },
        },

        "/api/auth/me": {
            get: {
                tags: ["Authentication"],
                summary: "Get current authenticated user",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Current user returned" },
                    401: { description: "Authentication required or invalid" },
                },
            },
        },

        "/api/patients": {
            get: {
                tags: ["Patients"],
                summary: "List and search patients",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
                    },
                    {
                        name: "search",
                        in: "query",
                        schema: { type: "string" },
                        description: "Search by name or patient number",
                    },
                ],
                responses: {
                    200: { description: "Patient list and pagination returned" },
                    401: { description: "Authentication required" },
                },
            },

            post: {
                tags: ["Patients"],
                summary: "Register a patient",
                description: "Roles allowed by the current API: ADMIN and RECEPTIONIST.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: { $ref: "#/components/schemas/PatientInput" },
                        },
                    },
                },
                responses: {
                    201: {
                        description: "Patient created with generated identifiers",
                    },
                    400: { description: "Invalid patient data" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    409: { description: "Potential duplicate patient detected" },
                },
            },
        },

        "/api/patients/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],

            get: {
                tags: ["Patients"],
                summary: "Get patient details",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Patient details returned" },
                    401: { description: "Authentication required" },
                    404: { description: "Patient not found" },
                },
            },

            patch: {
                tags: ["Patients"],
                summary: "Update patient details",
                description: "Roles allowed by the current API: ADMIN and RECEPTIONIST.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                minProperties: 1,
                                properties: {
                                    firstName: { type: "string" },
                                    lastName: { type: "string" },
                                    dateOfBirth: { type: "string", format: "date" },
                                    sex: {
                                        type: "string",
                                        enum: ["MALE", "FEMALE", "OTHER"],
                                    },
                                    phone: { type: "string" },
                                    email: { type: "string", format: "email" },
                                    address: { type: "string" },
                                },
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Patient updated" },
                    400: { description: "Invalid patient data" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Patient not found" },
                    409: { description: "Potential duplicate detected" },
                },
            },
        },
        "/api/appointments": {
            get: {
                tags: ["Appointments"],
                summary: "List and filter appointments",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 }
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        }
                    },
                    {
                        name: "patientId",
                        in: "query",
                        schema: { type: "string", format: "uuid" }
                    },
                    {
                        name: "modality",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "XRAY", "CT", "MRI", "ULTRASOUND",
                                "MAMMOGRAPHY", "PET_CT", "OTHER"
                            ]
                        }
                    },
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "SCHEDULED", "CONFIRMED", "CHECKED_IN",
                                "COMPLETED", "CANCELLED", "NO_SHOW"
                            ]
                        }
                    },
                    {
                        name: "from",
                        in: "query",
                        schema: { type: "string", format: "date-time" }
                    },
                    {
                        name: "to",
                        in: "query",
                        schema: { type: "string", format: "date-time" }
                    }
                ],
                responses: {
                    200: { description: "Appointments and pagination returned" },
                    400: { description: "Invalid filters" },
                    401: { description: "Authentication required" }
                }
            },

            post: {
                tags: ["Appointments"],
                summary: "Schedule an appointment",
                security: [{ bearerAuth: [] }],
                description: "Requires ADMIN or RECEPTIONIST role.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AppointmentInput"
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "Appointment created" },
                    400: { description: "Invalid appointment data" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Patient not found" }
                }
            }
        },

        "/api/appointments/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" }
                }
            ],

            get: {
                tags: ["Appointments"],
                summary: "Get appointment details",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Appointment returned" },
                    401: { description: "Authentication required" },
                    404: { description: "Appointment not found" }
                }
            },

            patch: {
                tags: ["Appointments"],
                summary: "Update or reschedule an appointment",
                security: [{ bearerAuth: [] }],
                description: "Requires ADMIN or RECEPTIONIST role.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                type: "object",
                                minProperties: 1,
                                properties: {
                                    scheduledAt: {
                                        type: "string",
                                        format: "date-time"
                                    },
                                    modality: {
                                        type: "string",
                                        enum: [
                                            "XRAY", "CT", "MRI", "ULTRASOUND",
                                            "MAMMOGRAPHY", "PET_CT", "OTHER"
                                        ]
                                    },
                                    procedure: { type: "string" },
                                    location: { type: "string" },
                                    notes: { type: "string" }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Appointment updated" },
                    400: { description: "Invalid appointment data" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Appointment not found" },
                    409: { description: "Appointment is closed or cannot be updated" }
                }
            }
        },

        "/api/appointments/{id}/status": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" }
                }
            ],

            patch: {
                tags: ["Appointments"],
                summary: "Change appointment status",
                security: [{ bearerAuth: [] }],
                description: "Requires ADMIN, RECEPTIONIST, or TECHNICIAN role.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AppointmentStatusUpdate"
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Appointment status changed" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Appointment not found" },
                    409: { description: "Invalid status transition" }
                }
            }
        },
        "/api/radiology-orders": {
            get: {
                tags: ["Radiology Orders"],
                summary: "List and filter radiology orders",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 }
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: {
                            type: "integer",
                            minimum: 1,
                            maximum: 100,
                            default: 20
                        }
                    },
                    {
                        name: "patientId",
                        in: "query",
                        schema: { type: "string", format: "uuid" }
                    },
                    {
                        name: "appointmentId",
                        in: "query",
                        schema: { type: "string", format: "uuid" }
                    },
                    {
                        name: "modality",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "XRAY", "CT", "MRI", "ULTRASOUND",
                                "MAMMOGRAPHY", "PET_CT", "OTHER"
                            ]
                        }
                    },
                    {
                        name: "priority",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["ROUTINE", "URGENT", "STAT"]
                        }
                    },
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: [
                                "ORDERED", "SCHEDULED", "IN_PROGRESS",
                                "COMPLETED", "CANCELLED"
                            ]
                        }
                    }
                ],
                responses: {
                    200: { description: "Orders and pagination returned" },
                    400: { description: "Invalid query parameters" },
                    401: { description: "Authentication required" }
                }
            },

            post: {
                tags: ["Radiology Orders"],
                summary: "Create a radiology order",
                description: "Requires ADMIN or RECEPTIONIST role.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RadiologyOrderInput"
                            }
                        }
                    }
                },
                responses: {
                    201: { description: "Radiology order created" },
                    400: { description: "Invalid input or mismatched patient and appointment" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Patient or appointment not found" },
                    409: { description: "Appointment is closed" }
                }
            }
        },

        "/api/radiology-orders/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" }
                }
            ],

            get: {
                tags: ["Radiology Orders"],
                summary: "Retrieve a radiology order",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Order details returned" },
                    401: { description: "Authentication required" },
                    404: { description: "Order not found" }
                }
            }
        },

        "/api/radiology-orders/{id}/status": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" }
                }
            ],

            patch: {
                tags: ["Radiology Orders"],
                summary: "Change radiology order status",
                description: "Requires ADMIN or TECHNICIAN role.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/OrderStatusUpdate"
                            }
                        }
                    }
                },
                responses: {
                    200: { description: "Order status updated" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Order not found" },
                    409: { description: "Invalid status transition" }
                }
            }
        },
        "/api/radiology-orders/{id}/status/override": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: {
                        type: "string",
                        format: "uuid"
                    },
                    description: "Internal radiology order ID"
                }
            ],
            patch: {
                tags: ["Radiology Orders"],
                summary: "Override radiology order status",
                description:
                    "ADMIN only. Requires a reason and records an audit event. " +
                    "Only explicitly permitted correction transitions are allowed.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/OrderStatusOverride"
                            }
                        }
                    }
                },
                responses: {
                    200: {
                        description: "Order status corrected and audit event recorded"
                    },
                    400: {
                        description: "Invalid request or missing/invalid reason"
                    },
                    401: {
                        description: "Authentication required"
                    },
                    403: {
                        description: "Administrator permission required"
                    },
                    404: {
                        description: "Radiology order not found"
                    },
                    409: {
                        description: "Correction transition not permitted or conflicting update"
                    }
                }
            }
        },

        "/api/radiology-reports": {
            get: {
                tags: ["Radiology Reports"],
                summary: "List and filter radiology reports",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
                    },
                    {
                        name: "orderId",
                        in: "query",
                        schema: { type: "string", format: "uuid" },
                    },
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["DRAFT", "REVIEWED", "FINALIZED"],
                        },
                    },
                ],
                responses: {
                    200: { description: "Reports and pagination returned" },
                    400: { description: "Invalid query parameters" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                },
            },

            post: {
                tags: ["Radiology Reports"],
                summary: "Create a draft radiology report",
                description: "Requires RADIOLOGIST role. The associated radiology order must be completed.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RadiologyReportCreate",
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Draft report created" },
                    400: { description: "Invalid report data" },
                    401: { description: "Authentication required" },
                    403: { description: "Radiologist permission required" },
                    404: { description: "Radiology order not found" },
                    409: { description: "Order is not completed or report already exists" },
                },
            },
        },

        "/api/radiology-reports/{id}": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],

            get: {
                tags: ["Radiology Reports"],
                summary: "Retrieve a radiology report",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Report returned" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions" },
                    404: { description: "Report not found" },
                },
            },

            patch: {
                tags: ["Radiology Reports"],
                summary: "Update a draft radiology report",
                description: "Requires RADIOLOGIST role. Only the report author can edit their draft.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/RadiologyReportUpdate",
                            },
                        },
                    },
                },
                responses: {
                    200: { description: "Report updated" },
                    400: { description: "Invalid report data" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permissions or ownership" },
                    404: { description: "Report not found" },
                    409: { description: "Report cannot be edited or concurrent update detected" },
                },
            },
        },

        "/api/radiology-reports/{id}/review": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],

            patch: {
                tags: ["Radiology Reports"],
                summary: "Review a draft radiology report",
                description: "Requires a RADIOLOGIST other than the report author. Findings and impression must be completed.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Report reviewed" },
                    401: { description: "Authentication required" },
                    403: { description: "Insufficient permission or self-review attempted" },
                    404: { description: "Report not found" },
                    409: { description: "Report cannot be reviewed" },
                },
            },
        },

        "/api/radiology-reports/{id}/finalize": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],

            patch: {
                tags: ["Radiology Reports"],
                summary: "Finalize a reviewed radiology report",
                description: "Requires RADIOLOGIST role. Only reviewed reports can be finalized.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Report finalized" },
                    401: { description: "Authentication required" },
                    403: { description: "Radiologist permission required" },
                    404: { description: "Report not found" },
                    409: { description: "Report is not in reviewed status" },
                },
            },
        },

        "/api/staff/invitations": {
            get: {
                tags: ["Staff Management"],
                summary: "List staff invitations",
                description: "ADMIN only. Supports pagination and filtering.",
                security: [{ bearerAuth: [] }],
                parameters: [
                    {
                        name: "page",
                        in: "query",
                        schema: { type: "integer", minimum: 1, default: 1 },
                    },
                    {
                        name: "limit",
                        in: "query",
                        schema: { type: "integer", minimum: 1, maximum: 100, default: 20 },
                    },
                    {
                        name: "status",
                        in: "query",
                        schema: {
                            type: "string",
                            enum: ["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"],
                        },
                    },
                    {
                        name: "email",
                        in: "query",
                        schema: { type: "string", format: "email" },
                    },
                ],
                responses: {
                    200: { description: "Invitation list returned" },
                    401: { description: "Authentication required" },
                    403: { description: "Administrator permission required" },
                },
            },

            post: {
                tags: ["Staff Management"],
                summary: "Create staff invitation",
                description: "ADMIN only. Returns a shareable invitation URL once.",
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/StaffInvitationCreate",
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Invitation created with shareable URL" },
                    400: { description: "Invalid invitation data" },
                    401: { description: "Authentication required" },
                    403: { description: "Administrator permission required" },
                    409: { description: "Existing staff account or active invitation" },
                },
            },
        },

        "/api/staff/invitations/{id}/revoke": {
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    schema: { type: "string", format: "uuid" },
                },
            ],
            patch: {
                tags: ["Staff Management"],
                summary: "Revoke pending invitation",
                description: "ADMIN only. Revoked invitation tokens cannot be accepted.",
                security: [{ bearerAuth: [] }],
                responses: {
                    200: { description: "Invitation revoked" },
                    401: { description: "Authentication required" },
                    403: { description: "Administrator permission required" },
                    404: { description: "Invitation not found" },
                    409: { description: "Invitation is no longer pending" },
                },
            },
        },

        "/api/auth/accept-invitation": {
            post: {
                tags: ["Authentication"],
                summary: "Accept staff invitation",
                description: "Public endpoint. A valid, unused invitation token is required.",
                requestBody: {
                    required: true,
                    content: {
                        "application/json": {
                            schema: {
                                $ref: "#/components/schemas/AcceptInvitationInput",
                            },
                        },
                    },
                },
                responses: {
                    201: { description: "Staff account activated" },
                    400: { description: "Invalid invitation token or input" },
                    409: { description: "Invitation already used or revoked" },
                    410: { description: "Invitation expired" },
                    429: { description: "Too many acceptance attempts" },
                },
            },
        },

    },
};

module.exports = swaggerDocument;