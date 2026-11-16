import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import type pg from "pg";
import { deleteResumeFiles, resumeDir } from "./resumes.js";

type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "customer" | "staff" | "admin";
};

type Deps = {
  pool: pg.Pool;
  requireUser: (request: FastifyRequest, reply: FastifyReply) => Promise<SessionUser | null>;
};

const resumeTypes = new Map([
  ["application/pdf", ".pdf"],
  ["application/msword", ".doc"],
  ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"],
]);

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function staff(role: SessionUser["role"]) {
  return role === "staff" || role === "admin";
}

const departments = new Set(["marketing", "sales", "engineering", "retail"]);

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

function resumeExtension(filename: string, mimetype: string) {
  const fromType = resumeTypes.get(mimetype);
  if (fromType) return fromType;
  const lower = filename.toLowerCase();
  if (lower.endsWith(".pdf")) return ".pdf";
  if (lower.endsWith(".docx")) return ".docx";
  if (lower.endsWith(".doc")) return ".doc";
  return undefined;
}

export async function registerCareers(app: FastifyInstance, { pool, requireUser }: Deps) {
  await mkdir(resumeDir, { recursive: true });

  app.get<{
    Querystring: { department?: string; workplace?: string; location?: string };
  }>("/api/jobs", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const department = text(request.query.department) || null;
    const workplace = text(request.query.workplace) || null;
    const location = text(request.query.location) || null;
    const result = await pool.query(
      `select j.slug, j.title, j.department, j.workplace, j.summary,
              l.slug as location_slug, l.name as location_name, l.city as location_city
       from jobs j
       left join locations l on l.id = j.location_id
       where ($1::text is null or j.department = $1)
         and ($2::text is null or j.workplace = $2)
         and ($3::text is null or l.slug = $3)
       order by j.workplace, l.city nulls first, j.title`,
      [department, workplace, location],
    );
    return {
      jobs: result.rows.map((row) => ({
        slug: row.slug,
        title: row.title,
        department: row.department,
        workplace: row.workplace,
        summary: row.summary,
        location: row.location_slug
          ? { slug: row.location_slug, name: row.location_name, city: row.location_city }
          : null,
      })),
    };
  });

  app.get<{ Params: { slug: string } }>("/api/jobs/:slug", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    const result = await pool.query(
      `select j.slug, j.title, j.department, j.workplace, j.summary, j.description,
              l.slug as location_slug, l.name as location_name, l.city as location_city,
              l.line1, l.region, l.postal_code
       from jobs j
       left join locations l on l.id = j.location_id
       where j.slug = $1`,
      [request.params.slug],
    );
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "Job not found." });
    return {
      job: {
        slug: row.slug,
        title: row.title,
        department: row.department,
        workplace: row.workplace,
        summary: row.summary,
        description: row.description,
        location: row.location_slug
          ? {
              slug: row.location_slug,
              name: row.location_name,
              city: row.location_city,
              line1: row.line1,
              region: row.region,
              postalCode: row.postal_code,
            }
          : null,
      },
    };
  });

  app.post<{ Params: { slug: string } }>("/api/jobs/:slug/applications", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;

    const fields = new Map<string, string>();
    let resume: { filename: string; mimetype: string; buffer: Buffer } | null = null;
    try {
      const parts = request.parts();
      for await (const part of parts) {
        if (part.type === "file") {
          if (part.fieldname !== "resume") {
            await part.toBuffer();
            continue;
          }
          resume = {
            filename: part.filename,
            mimetype: part.mimetype,
            buffer: await part.toBuffer(),
          };
        } else {
          fields.set(part.fieldname, text(part.value));
        }
      }
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? error.code : "";
      if (code === "FST_REQ_FILE_TOO_LARGE") {
        return reply.code(400).send({ error: "Resume must be 5 MB or smaller." });
      }
      throw error;
    }

    const name = fields.get("name") ?? "";
    const email = fields.get("email") ?? "";
    const phone = fields.get("phone") ?? "";
    const city = fields.get("city") ?? "";
    const workAuthorization = fields.get("workAuthorization") ?? "";
    const startDate = fields.get("startDate") ?? "";
    const linkedin = fields.get("linkedin") || null;
    const website = fields.get("website") || null;
    const coverLetter = fields.get("coverLetter") ?? "";
    if (!name || !email.includes("@") || phone.replace(/\D/g, "").length < 7 || !city) {
      return reply.code(400).send({ error: "Name, email, phone, and city are required." });
    }
    if (workAuthorization !== "yes" && workAuthorization !== "no") {
      return reply.code(400).send({ error: "Say whether you are authorized to work in the US." });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return reply.code(400).send({ error: "Choose a start date." });
    }
    if (coverLetter.length < 20) {
      return reply.code(400).send({ error: "Write a short note about why you want the job." });
    }
    const extension = resume ? resumeExtension(resume.filename, resume.mimetype) : undefined;
    if (!resume || !extension || resume.buffer.length === 0) {
      return reply.code(400).send({ error: "Upload a PDF or Word resume." });
    }

    const job = await pool.query<{ id: string }>(`select id from jobs where slug = $1`, [
      request.params.slug,
    ]);
    const jobId = job.rows[0]?.id;
    if (!jobId) return reply.code(404).send({ error: "Job not found." });

    const id = randomUUID();
    const filename = `${id}${extension}`;
    await writeFile(path.join(resumeDir, filename), resume.buffer);
    const original =
      path
        .basename(resume.filename)
        .replace(/["\r\n]/g, "")
        .slice(0, 180) || `resume${extension}`;
    await pool.query(
      `insert into applications (
         id, job_id, name, email, phone, city, work_authorization, start_date,
         linkedin, website, cover_letter, resume_filename, resume_original_name
       ) values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        id,
        jobId,
        name,
        email,
        phone,
        city,
        workAuthorization,
        startDate,
        linkedin,
        website,
        coverLetter,
        filename,
        original,
      ],
    );
    return reply.code(201).send({ application: { id } });
  });

  app.get("/api/applications", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (!staff(user.role)) return reply.code(403).send({ error: "Staff only." });
    const result = await pool.query(
      `select a.id, a.name, a.email, a.phone, a.city, a.created_at, a.resume_original_name,
              j.title, j.slug, j.department, j.workplace, l.city as location_city
       from applications a
       join jobs j on j.id = a.job_id
       left join locations l on l.id = j.location_id
       order by a.created_at desc`,
    );
    return {
      applications: result.rows.map((row) => ({
        id: row.id,
        name: row.name,
        email: row.email,
        phone: row.phone,
        city: row.city,
        createdAt: row.created_at,
        resumeName: row.resume_original_name,
        job: {
          slug: row.slug,
          title: row.title,
          department: row.department,
          workplace: row.workplace,
          city: row.location_city,
        },
      })),
    };
  });

  app.get<{ Params: { id: string } }>("/api/applications/:id/resume", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (!staff(user.role)) return reply.code(403).send({ error: "Staff only." });
    const result = await pool.query<{ resume_filename: string; resume_original_name: string }>(
      `select resume_filename, resume_original_name from applications where id = $1`,
      [request.params.id],
    );
    const row = result.rows[0];
    if (!row) return reply.code(404).send({ error: "Application not found." });
    const safe = path.basename(row.resume_filename);
    return reply
      .header(
        "content-disposition",
        `attachment; filename="${row.resume_original_name.replaceAll('"', "")}"`,
      )
      .send(createReadStream(path.join(resumeDir, safe)));
  });

  app.post<{ Body: Record<string, unknown> }>("/api/jobs", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "admin") return reply.code(403).send({ error: "Admin only." });

    const title = text(request.body.title);
    const department = text(request.body.department);
    const workplace = text(request.body.workplace);
    const locationSlug = text(request.body.locationSlug);
    const summary = text(request.body.summary);
    const description = text(request.body.description);
    const base = slugify(title);
    if (!base || summary.length < 10 || description.length < 20) {
      return reply.code(400).send({ error: "Title, summary, and description are required." });
    }
    if (!departments.has(department) || (workplace !== "remote" && workplace !== "store")) {
      return reply.code(400).send({ error: "Choose a department and a workplace." });
    }
    if (workplace === "store" && !locationSlug) {
      return reply.code(400).send({ error: "Choose the store for this role." });
    }

    let locationId: string | null = null;
    let slug = base;
    if (workplace === "store") {
      const location = await pool.query<{ id: string }>(
        `select id from locations where slug = $1`,
        [locationSlug],
      );
      locationId = location.rows[0]?.id ?? null;
      if (!locationId) return reply.code(404).send({ error: "Store not found." });
      slug = `${base}-${locationSlug}`.slice(0, 80);
    }
    const taken = await pool.query(`select 1 from jobs where slug = $1`, [slug]);
    if (taken.rowCount)
      return reply.code(409).send({ error: "A role with that name already exists." });

    const id = randomUUID();
    await pool.query(
      `insert into jobs (id, slug, title, department, workplace, location_id, summary, description)
       values ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, slug, title, department, workplace, locationId, summary, description],
    );
    return reply.code(201).send({
      job: {
        slug,
        title,
        department,
        workplace,
        summary,
        location: locationId ? { slug: locationSlug } : null,
      },
    });
  });

  app.delete<{ Params: { slug: string } }>("/api/jobs/:slug", async (request, reply) => {
    const user = await requireUser(request, reply);
    if (!user) return;
    if (user.role !== "admin") return reply.code(403).send({ error: "Admin only." });

    const client = await pool.connect();
    try {
      await client.query("begin");
      const job = await client.query<{ id: string }>(`select id from jobs where slug = $1`, [
        request.params.slug,
      ]);
      const jobId = job.rows[0]?.id;
      if (!jobId) {
        await client.query("rollback");
        return reply.code(404).send({ error: "Job not found." });
      }
      const resumes = await client.query<{ resume_filename: string }>(
        `delete from applications where job_id = $1 returning resume_filename`,
        [jobId],
      );
      await client.query(`delete from jobs where id = $1`, [jobId]);
      await client.query("commit");
      await deleteResumeFiles(resumes.rows.map((row) => row.resume_filename));
      return reply.code(204).send();
    } catch (error) {
      await client.query("rollback");
      throw error;
    } finally {
      client.release();
    }
  });
}
