const fs = require('fs');
const path = require('path');
const { createRequire } = require('module');
const backendRequire = createRequire('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/index.js');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  ImageRun
} = backendRequire('docx');

// --- Standard Formal Color Palette (Human-made, No Blue Theme) ---
const COLOR_BLACK = "000000";       // Pure Black for titles, headings, and bold table headers
const COLOR_TEXT = "111827";        // Neutral dark body text
const COLOR_MUTED = "4B5563";       // Neutral gray for subtitles, headers/footers
const COLOR_TABLE_HEADER = "F3F4F6";// Standard light gray header background for normal tables
const COLOR_BORDER = "9CA3AF";      // Standard clean table grid border (thin neutral gray)
const COLOR_WHITE = "FFFFFF";

function createHeading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 280, after: 120 },
    keepWithNext: true,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 26, // 13pt
        color: COLOR_BLACK,
        font: "Arial"
      })
    ]
  });
}

function createHeading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 220, after: 80 },
    keepWithNext: true,
    children: [
      new TextRun({
        text,
        bold: true,
        size: 22, // 11pt
        color: COLOR_BLACK,
        font: "Arial"
      })
    ]
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: 40, after: 60, line: 260 },
    children: [
      new TextRun({
        text,
        size: 19, // 9.5pt
        color: COLOR_TEXT,
        font: "Arial",
        ...options
      })
    ]
  });
}

function createBullet(title, description) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 30, after: 40, line: 250 },
    children: [
      new TextRun({
        text: title + ": ",
        bold: true,
        size: 19,
        color: COLOR_BLACK,
        font: "Arial"
      }),
      new TextRun({
        text: description,
        size: 19,
        color: COLOR_TEXT,
        font: "Arial"
      })
    ]
  });
}

// Normal Word Table (Standard grid, subtle light gray header, thin borders, dark text)
function createStyledTable(headers, rowsData, colWidths = []) {
  const normalBorder = {
    top: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
    bottom: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
    left: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER },
    right: { style: BorderStyle.SINGLE, size: 2, color: COLOR_BORDER }
  };

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: colWidths[i] ? { size: colWidths[i], type: WidthType.PERCENTAGE } : undefined,
      shading: { fill: COLOR_TABLE_HEADER },
      margins: { top: 70, bottom: 70, left: 100, right: 100 },
      borders: normalBorder,
      children: [
        new Paragraph({
          children: [new TextRun({ text: h, bold: true, size: 18, color: COLOR_BLACK, font: "Arial" })]
        })
      ]
    }))
  });

  const bodyRows = rowsData.map((row) => new TableRow({
    children: row.map((cellText, cIdx) => new TableCell({
      width: colWidths[cIdx] ? { size: colWidths[cIdx], type: WidthType.PERCENTAGE } : undefined,
      shading: { fill: COLOR_WHITE },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      borders: normalBorder,
      children: [
        new Paragraph({
          children: [new TextRun({ text: cellText, size: 17, color: COLOR_TEXT, font: "Arial" })]
        })
      ]
    }))
  }));

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [headerRow, ...bodyRows]
  });
}

// Normal plain source code block: NO boxes, NO tables, NO borders, NO shading.
// Just a clean heading followed by the pasted code lines in Consolas.
function createCodeBlock(headingText, codeContent) {
  const normalized = codeContent.replace(/\t/g, '  ');
  const lines = normalized.split('\n');

  const codeParagraphs = lines.map(line => new Paragraph({
    spacing: { before: 0, after: 0, line: 220 }, // single, compact code line spacing
    children: [
      new TextRun({
        text: line.length === 0 ? " " : line,
        font: "Consolas",
        size: 17, // 8.5pt font
        color: COLOR_TEXT
      })
    ]
  }));

  return [
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 260, after: 80 },
      keepWithNext: true,
      children: [
        new TextRun({
          text: headingText,
          bold: true,
          size: 22, // 11pt
          color: COLOR_BLACK,
          font: "Arial"
        })
      ]
    }),
    ...codeParagraphs
  ];
}

async function buildSubmissionDoc() {
  const archImgPath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/cloud_architecture_diagram.png');
  const erdImgPath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/database_design_diagram.png');

  const hasArchImg = fs.existsSync(archImgPath);
  const hasErdImg = fs.existsSync(erdImgPath);

  // Read actual source files (including the edited frontend App.jsx)
  const serverJsPath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/index.js');
  const dbJsPath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/db.js');
  const requestsRoutePath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/routes/requests.js');
  const authRoutePath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/backend/routes/auth.js');
  const apiJsPath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/frontend/src/api.js');
  const appJsxPath = path.resolve('c:/Users/Nidharshen/Documents/LocalServiceSystem/frontend/src/App.jsx');

  const serverJsCode = fs.readFileSync(serverJsPath, 'utf-8');
  const dbJsCode = fs.readFileSync(dbJsPath, 'utf-8');
  const requestsRouteCode = fs.readFileSync(requestsRoutePath, 'utf-8');
  const authRouteCode = fs.readFileSync(authRoutePath, 'utf-8');
  const apiJsCode = fs.readFileSync(apiJsPath, 'utf-8');
  const appJsxCode = fs.readFileSync(appJsxPath, 'utf-8');

  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: "Arial",
            size: 19,
            color: COLOR_TEXT
          }
        }
      }
    },
    sections: [
      // =======================================================================
      // TITLE / COVER PAGE (Human-styled, standard formal black text)
      // =======================================================================
      {
        properties: {
          page: {
            margin: { top: 1800, bottom: 1800, left: 1440, right: 1440 }
          }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 160, after: 120 },
            children: [
              new TextRun({
                text: "COLLEGE CLOUD ARCHITECTURE PROJECT",
                bold: true,
                size: 26,
                color: COLOR_BLACK,
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 360 },
            children: [
              new TextRun({
                text: "Final Technical Project Report & Documentation",
                size: 20,
                color: COLOR_MUTED,
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 140 },
            children: [
              new TextRun({
                text: "Local Service Request Management System",
                bold: true,
                size: 36,
                color: COLOR_BLACK,
                font: "Arial"
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 500 },
            children: [
              new TextRun({
                text: "A Cloud-Native 3-Tier Web Application (React, Express, Supabase PostgreSQL)",
                size: 21,
                color: COLOR_TEXT,
                font: "Arial",
                italics: true
              })
            ]
          }),

          // Student Identification
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 400, after: 60 },
            children: [
              new TextRun({ text: "Submitted by:", size: 20, color: COLOR_MUTED, font: "Arial" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({ text: "Nidharshen V.", bold: true, size: 30, color: COLOR_BLACK, font: "Arial" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 60 },
            children: [
              new TextRun({ text: "Register Number: 100001", bold: true, size: 22, color: COLOR_BLACK, font: "Arial" })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 440 },
            children: [
              new TextRun({ text: "Department of Computer Science & Engineering | 2025–2026", size: 19, color: COLOR_MUTED, font: "Arial" })
            ]
          }),

          // Deployed Application URLs
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 240, after: 40 },
            children: [
              new TextRun({ text: "Live Application URL: ", bold: true, size: 19, color: COLOR_BLACK }),
              new TextRun({ text: "https://localservicesystem.vercel.app", size: 19, color: COLOR_TEXT })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({ text: "Backend API Endpoint: ", bold: true, size: 19, color: COLOR_BLACK }),
              new TextRun({ text: "https://localservicesystem.onrender.com", size: 19, color: COLOR_TEXT })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 40 },
            children: [
              new TextRun({ text: "Managed PostgreSQL Database: ", bold: true, size: 19, color: COLOR_BLACK }),
              new TextRun({ text: "Supabase Cloud (AWS Seoul ap-northeast-2:5432)", size: 19, color: COLOR_MUTED })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 0 },
            children: [
              new TextRun({ text: "GitHub Repository: ", bold: true, size: 19, color: COLOR_BLACK }),
              new TextRun({ text: "https://github.com/nithu2709/LocalServiceSystem", size: 19, color: COLOR_TEXT })
            ]
          })
        ]
      },

      // =======================================================================
      // MAIN CONTENT SECTION
      // =======================================================================
      {
        properties: {
          page: {
            margin: { top: 1080, bottom: 1080, left: 1150, right: 1150 }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { after: 100 },
                children: [
                  new TextRun({
                    text: "Cloud Architecture Submission  |  Nidharshen V. (100001)",
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Arial"
                  })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                spacing: { before: 100 },
                children: [
                  new TextRun({
                    text: "Local Service Request Management System    |    Page ",
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Arial"
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Arial"
                  }),
                  new TextRun({
                    text: " of ",
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Arial"
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    size: 15,
                    color: COLOR_MUTED,
                    font: "Arial"
                  })
                ]
              })
            ]
          })
        },
        children: [
          // ----------------------------------------------------
          // 1. DEPLOYED APPLICATION URLS & ARCHITECTURAL SUMMARY
          // ----------------------------------------------------
          createHeading1("1. Deployed Application URLs & Infrastructure"),
          createParagraph(
            "The Local Service Request Management System is deployed in production across decoupled cloud infrastructure providers for optimal performance, scalability, and security:"
          ),
          createStyledTable(
            ["Component", "Platform", "Production URL / Host", "Architecture Role"],
            [
              ["Frontend UI", "Vercel", "https://localservicesystem.vercel.app", "React 19 SPA, Global Edge CDN, Tailwind v4 Dark Mode, vercel.json API proxy."],
              ["Backend API", "Render", "https://localservicesystem.onrender.com", "Node.js & Express REST microservice, JWT auth, auto-dispatch, Nodemailer service."],
              ["Database", "Supabase", "aws-0-ap-northeast-2.pooler.supabase.com:5432", "Managed PostgreSQL 15, PgBouncer pooler (port 5432), SSL encrypted, AWS Seoul."],
              ["Source Code", "GitHub", "https://github.com/nithu2709/LocalServiceSystem", "Production Git repository containing frontend and backend codebases."]
            ],
            [18, 16, 36, 30]
          ),

          // ----------------------------------------------------
          // 2. CLOUD ARCHITECTURE DIAGRAM
          // ----------------------------------------------------
          new Paragraph({ children: [new PageBreak()] }),
          createHeading1("2. Cloud Architecture Diagram"),
          createParagraph(
            "The system implements a classic decoupled Three-Tier Cloud Architecture connecting the client presentation layer, containerized microservice application tier, and managed cloud relational database:"
          ),

          ...(hasArchImg ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 80 },
              children: [
                new ImageRun({
                  data: fs.readFileSync(archImgPath),
                  transformation: { width: 590, height: 271 }
                })
              ]
            })
          ] : []),

          createHeading2("Three-Tier Interaction & Proxy Flow"),
          createBullet(
            "Presentation Tier (Vercel Edge)",
            "The React 19 Single Page Application is bundled with Vite and distributed globally via Vercel's Anycast Edge CDN. Client API requests route through a vercel.json reverse-proxy rule (/api/:path* -> https://localservicesystem.onrender.com/api/:path*), preventing cross-origin preflight latencies."
          ),
          createBullet(
            "Application Tier (Render Container)",
            "The Express.js REST server handles business logic statelessly. Client authenticity is validated via HMAC-SHA256 signed JSON Web Tokens (JWT). The backend executes the automated provider dispatch algorithm and queues email verification tasks via Nodemailer."
          ),
          createBullet(
            "Data Persistence Tier (Supabase PostgreSQL)",
            "PostgreSQL 15 hosted on AWS Asia Pacific (Seoul) is accessed via an IPv4 PgBouncer transaction connection pooler over TLS/SSL encryption, ensuring connection resilience under burst traffic."
          ),

          // ----------------------------------------------------
          // 3. DATABASE DESIGN & ERD
          // ----------------------------------------------------
          new Paragraph({ children: [new PageBreak()] }),
          createHeading1("3. Database Design & Entity-Relationship Model"),
          createParagraph(
            "The relational database schema is structured around 3 primary core entities (Users, Categories, and Requests) supplemented by transactional assignments and reviews. Below is the Entity-Relationship Diagram:"
          ),

          ...(hasErdImg ? [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 60, after: 80 },
              children: [
                new ImageRun({
                  data: fs.readFileSync(erdImgPath),
                  transformation: { width: 590, height: 265 }
                })
              ]
            })
          ] : []),

          createHeading2("Relational Explanation (Users, Categories, Requests)"),
          createParagraph(
            "The USERS entity serves a dual polymorphic role within the cloud architecture by establishing two distinct one-to-many (1:N) foreign key relationships with the REQUESTS table. In the first relationship (USERS ||--o{ REQUESTS : \"creates (customer)\"), a user authenticated under the customer role originates a service request, storing their unique identifier as customer_id. Simultaneously, in the second relationship (USERS ||--o{ REQUESTS : \"assigned to (provider)\"), a user authenticated under the provider role is matched to fulfill the service task, with their identifier recorded as provider_id. This dual-foreign-key architecture enforces clear role boundaries, allowing customers to track all requested services and providers to manage their assigned queues without redundant entity replication or complex polymorphic junction tables."
          ),
          createParagraph(
            "The CATEGORIES entity maintains a one-to-many relationship with the REQUESTS table (CATEGORIES ||--o{ REQUESTS : \"categorizes\"), binding each service request to an explicit trade specialization via the category_id foreign key. This relationship enforces a strict operational constraint, ensuring every booking maps exclusively to one of the three designated trades: Electrician, Plumber, or AC Repair. Furthermore, this categorical binding serves as the foundation for the automated provider dispatch engine, which queries the database for available technicians whose registered specialization matches the category_id of the incoming request, thereby preventing mismatched task assignments."
          ),
          createParagraph(
            "The REQUESTS entity functions as the central junction and transactional state machine that ties the relational schema together. Holding references to both user parties and the trade category, REQUESTS governs the end-to-end lifecycle through the status attribute ('Pending', 'In-Progress', 'Pending Customer Confirmation', and 'Completed'). Foreign key cascading rules guarantee that modifying or deleting a pending request automatically unbinds assigned records without orphaned data. Additionally, relational validation mandates that users maintain is_verified = true before participating in any request transaction, ensuring that only cryptographically verified customer requests and active service providers are processed by the cloud system."
          ),

          createHeading2("Relational Tables & Schema Specifications"),
          createStyledTable(
            ["Table Name", "Primary Key", "Foreign Keys", "Key Attributes & Domain Constraints"],
            [
              ["users", "id (SERIAL)", "None", "name, email (UNIQUE), password_hash, role (CHECK: CUSTOMER, PROVIDER, ADMIN), is_verified (BOOL), verification_token, verification_token_expires_at"],
              ["service_categories", "id (SERIAL)", "None", "name (CHECK: Electrician, Plumber, AC Repair), description, created_at"],
              ["service_providers", "id (SERIAL)", "user_id -> users(id)\ncategory_id -> service_categories(id)", "experience, availability (BOOLEAN DEFAULT TRUE), location, created_at"],
              ["service_requests", "id (SERIAL)", "customer_id -> users(id)\ncategory_id -> service_categories(id)", "title, description, location, preferred_date, status (CHECK: PENDING, ASSIGNED, IN_PROGRESS, Pending Customer Confirmation, COMPLETED, CANCELLED)"],
              ["assignments", "id (SERIAL)", "request_id -> service_requests(id) [CASCADE]\nprovider_id -> service_providers(id)", "assigned_at (TIMESTAMPTZ), completed_at (TIMESTAMPTZ)"],
              ["reviews", "id (SERIAL)", "request_id -> service_requests(id) [CASCADE]\ncustomer_id -> users(id)", "rating (CHECK: 1 to 5), comment, created_at"]
            ],
            [18, 14, 28, 40]
          ),

          // ----------------------------------------------------
          // 4. API DOCUMENTATION
          // ----------------------------------------------------
          new Paragraph({ children: [new PageBreak()] }),
          createHeading1("4. RESTful API Documentation"),
          createParagraph(
            "The backend exposes structured REST endpoints with standardized JSON payloads, bearer token authorization headers, and deterministic HTTP response codes:"
          ),
          createStyledTable(
            ["Endpoint Route", "HTTP Method", "Authorized Roles", "Description & Validation Rules"],
            [
              ["/api/auth/register", "POST", "Public", "Registers Customer or Provider; validates 3 trades; issues 32-byte verification token."],
              ["/api/auth/login", "POST", "Public", "Bcrypt validation; strictly verifies is_verified === true; returns 7-day JWT."],
              ["/api/auth/verify-email", "GET / POST", "Public", "Validates activation token; sets is_verified = TRUE; activates user account."],
              ["/api/auth/resend-verification", "POST", "Public", "Dispatches a new verification email if previous token expired or unreceived."],
              ["/api/requests", "POST", "Customer", "Submits request; triggers automated load-balanced provider dispatch."],
              ["/api/requests", "GET", "Authenticated", "Role-filtered query: customers view own requests, providers view category."],
              ["/api/requests/:id", "PUT", "Customer", "Modifies request details. Enforces ownership & status in ('PENDING', 'ASSIGNED')."],
              ["/api/requests/:id", "DELETE", "Customer", "Cancels & purges request. Blocked if status is IN_PROGRESS or COMPLETED."],
              ["/api/requests/:id/status", "PATCH", "Authenticated", "Transitions request state (e.g. IN_PROGRESS, Confirmation, COMPLETED)."],
              ["/api/providers/availability", "PATCH", "Provider", "Toggles technician active availability between Available and Busy."],
              ["/api/reviews", "POST", "Customer", "Submits 1-5 star review and comment on completed service requests."],
              ["/api/admin/stats", "GET", "Admin", "Returns aggregate metrics: total requests, queue sizes, ratings, trade counts."]
            ],
            [26, 14, 18, 42]
          ),

          createHeading2("Key API Payloads & Contracts"),
          createBullet(
            "POST /api/requests",
            "Body: { category_id: 1, title: 'Wiring issue', description: 'Breaker tripped', location: '123 Main St', preferred_date: '2026-09-15' } -> Response: { success: true, request: { id: 10, status: 'ASSIGNED', provider_name: 'Hari' } }"
          ),
          createBullet(
            "PUT /api/requests/:id",
            "Body: { title: 'Updated issue', description: 'Updated details', location: 'New address' } -> Strict Status Check: Allowed only when status is PENDING or ASSIGNED. Rejects with 400 if IN_PROGRESS, Confirmation, or COMPLETED."
          ),
          createBullet(
            "DELETE /api/requests/:id",
            "Header: Authorization: Bearer <token> -> Cascades dependent assignments and deletes request. Blocked with 400 if job is active or completed."
          ),
          createBullet(
            "PATCH /api/requests/:id/status (Completion)",
            "Provider moves job to 'Pending Customer Confirmation'. Customer confirms with status: 'COMPLETED' to officially close request."
          ),

          // ----------------------------------------------------
          // 5. PRODUCTION SOURCE CODE (Matches Edited Website)
          // ----------------------------------------------------
          new Paragraph({ children: [new PageBreak()] }),
          createHeading1("5. Production Source Code"),
          createParagraph(
            "The following sections contain the complete, production-ready source code matching the latest deployed version of the website and backend microservice. Source code is version-controlled at https://github.com/nithu2709/LocalServiceSystem."
          ),

          // File 1: backend/index.js
          ...createCodeBlock("5.1 backend/index.js", serverJsCode),

          // File 2: backend/db.js
          new Paragraph({ children: [new PageBreak()] }),
          ...createCodeBlock("5.2 backend/db.js", dbJsCode),

          // File 3: backend/routes/requests.js
          new Paragraph({ children: [new PageBreak()] }),
          ...createCodeBlock("5.3 backend/routes/requests.js", requestsRouteCode),

          // File 4: backend/routes/auth.js
          new Paragraph({ children: [new PageBreak()] }),
          ...createCodeBlock("5.4 backend/routes/auth.js", authRouteCode),

          // File 5: frontend/src/api.js
          new Paragraph({ children: [new PageBreak()] }),
          ...createCodeBlock("5.5 frontend/src/api.js", apiJsCode),

          // File 6: frontend/src/App.jsx (Updated without the badge, exactly matching live site)
          new Paragraph({ children: [new PageBreak()] }),
          ...createCodeBlock("5.6 frontend/src/App.jsx", appJsxCode)
        ]
      }
    ]
  });

  const buffer = await Packer.toBuffer(doc);

  // Target paths: User Desktop and OneDrive Desktop
  const desktopPaths = [
    "C:\\Users\\Nidharshen\\OneDrive\\Desktop\\Cloud_Architecture_Submission.docx",
    "C:\\Users\\Nidharshen\\Desktop\\Cloud_Architecture_Submission.docx"
  ];

  for (const targetPath of desktopPaths) {
    try {
      const dir = path.dirname(targetPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(targetPath, buffer);
      console.log(`✅ File saved successfully to: ${targetPath}`);
    } catch (err) {
      console.warn(`Could not save to ${targetPath}:`, err.message);
    }
  }

  console.log(`Final submission document generation completed. Buffer size: ${buffer.length} bytes.`);
}

buildSubmissionDoc().catch(err => {
  console.error("Failed to build submission document:", err);
  process.exit(1);
});
