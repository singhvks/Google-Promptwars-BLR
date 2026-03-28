# SmartPath Maps Deployment Learnings (2026-03-28)

### 1. API Migration (Directions -> Routes API New)
- **Problem**: Directions API (Legacy) was returning a "Legacy API Not Activated" error.
- **Solution**: Migrated the backend to the **Routes API (New)** using the `https://routes.googleapis.com/directions/v2:computeRoutes` endpoint.
- **Key Note**: The new API requires a **FieldMask** (`X-Goog-FieldMask`) to return specific results like duration, distance, or polylines.

### 2. Networking Inside Containers (Node.js 18+)
- **Problem**: Express fetch was failing with "fetch failed" when calling `http://localhost:8000`.
- **Solution**: Changed internal API URL to **`http://127.0.0.1:8000`**.
- **Lesson**: In Alpine/Docker environments using Node 18+, `localhost` often defaults to IPv6 (`[::1]`), causing connection failures if the backend (FastAPI/Uvicorn) only binds to IPv4 loopback.

### 3. Startup Timing Race Condition
- **Problem**: Frontend started too fast, leading to proxy failures before the backend was ready.
- **Solution**: Added **`sleep 2`** in `entrypoint.sh` before starting the frontend npm script.

### 4. API Key Project Mismatch (403 Forbidden)
- **Problem**: 403 error saying "API not enabled for project 7088..." while gcloud showed it was enabled for "genai-cloudrun-vikas" (7650...).
- **Cause**: An API Key created in one project and reused in another project will bill the **original project**. Enabling the API in the new project does not help if the key itself identifies as belonging to the first one.
- **Solution**: Generate a native key in the current project or enable the API on the **originating project**.

### 5. Efficient Key Retrieval
- **Task**: Retrieving the correct API key string for the project.
- **Tool**: `gcloud services api-keys get-key-string <KEY_NAME>` is essential for verifying or pulling native project keys when `.env` is mismatched.
