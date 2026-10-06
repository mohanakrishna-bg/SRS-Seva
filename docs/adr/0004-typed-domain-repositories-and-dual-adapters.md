# Typed Domain Repositories and Dual Adapters

The frontend previously relied on `api.ts` pass-through wrappers returning untyped `AxiosResponse<any>`, forcing caller components and contexts to manage raw URLs, manual query string encoding, and unsafe type assertions. Unit tests frequently failed or threw console warnings due to brittle, incomplete `vi.mock('../api')` mock configurations.

We decided to establish a typed ports-and-adapters architecture for core frontend domain resources:
1. **Domain Interfaces (Ports)**:
   - `DevoteeDirectory`: typed methods for listing, pagination, searching, photo capture, and soft-delete cleanup.
   - `SevaCatalog`: typed catalog operations for active and special event sevas.
   - `SettingsStore`: strongly-typed key-value retrieval and persistence for organization configuration.
2. **Dual Concrete Adapters**:
   - **HTTP Adapters (`Http*Adapter`)**: Production implementations communicating with the FastAPI backend using Axios and JWT authorization headers.
   - **In-Memory Adapters (`Memory*Adapter`)**: Deterministic, self-contained implementations for fast headless testing and offline capability without server dependencies.
3. **Repository Registry & Backwards-Compatibility**:
   - Exposed unified repositories via a central registry (`repositories/`), while retaining `api.ts` delegates so legacy consumers remain uninterrupted.
