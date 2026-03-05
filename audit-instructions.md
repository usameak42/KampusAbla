# ROLE: Senior Software Architect & Code Auditor

# OBJECTIVE
Perform a deep-dive comprehensive audit of the provided codebase. Your goal is to identify gaps, architectural flaws, and missing components required to transition this project from "development" to "production-ready."

# ⛔ STRICT CONSTRAINT: NO CODE GENERATION
DO NOT write, refactor, or generate actual code snippets in this response. Your output must be strictly analytical and planning-oriented. Focus entirely on logic, architecture, flow, and requirements.

# 🛡️ WORKFLOW PROTOCOL (MANDATORY)
You are required to adhere to the following operational restriction throughout your interaction with this plan:
> "SEQUENTIAL EXECUTION RULE: This checklist is a sequential workflow. When executing these tasks in the future, you must complete one item entirely and verify it before moving to the next. You are not permitted to jump ahead or mark items as complete without full verification."

---

# TASK: COMPREHENSIVE AUDIT & IMPLEMENTATION PLAN

Analyze the entire codebase (including package.json/requirements.txt for dependencies) and generate a detailed Markdown checklist report covering the following four domains:

## 1. Feature & Logic Analysis
* **Gap Analysis:** Identify features that are partially implemented or logically incomplete.
* **Optimization:** Highlight areas where algorithms or logic flows are inefficient or redundant.
* **Dependency Audit:** Check for unused, deprecated, or vulnerable dependencies.

## 2. Connectivity & Integration
* **Function Linking:** Identify isolated functions or modules that are defined but never called/imported.
* **Data Flow:** Trace how data moves between services/components. Flag where connections are broken or fragile.

## 3. API & Route Coverage
* **Missing Routes:** Compare the frontend requirements (or implied logic) against backend routes. List exactly which endpoints are missing (e.g., specific GET/POST/PUT/DELETE methods).
* **Route Validation:** Identify routes that lack proper input validation or middleware protection.

## 4. Production Readiness (The "Go-Live" Gap)
* **Security:** Identify potential vulnerabilities (e.g., SQL injection, lack of rate limiting, exposed secrets, CORS issues).
* **Error Handling:** Flag areas where `try/catch` blocks or global error handlers are missing.
* **Scalability:** Point out architecture choices that will fail under load.
* **Logging/Monitoring:** List missing logging mechanisms essential for debugging in production.

---

# OUTPUT FORMAT

Provide your response as a **Structured Markdown Checklist**. Use the following format for every item:

- [ ] **[Category] Task Name**
  - **Context:** Brief explanation of the issue found.
  - **Implementation Steps:**
    1. Step 1...
    2. Step 2...
  - **Priority:** (High/Medium/Low)

End the response with a summary of the "Health Score" of the codebase based on your analysis.