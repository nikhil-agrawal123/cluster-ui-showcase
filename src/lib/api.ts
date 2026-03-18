// ---------------------------------------------------------------------------
// api.ts – thin wrapper around the FastAPI backend running on :8000
// ---------------------------------------------------------------------------

const API_BASE = "http://localhost:8000";

// ---- helpers ---------------------------------------------------------------

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem("access_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `API error ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---- Auth ------------------------------------------------------------------

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  // FastAPI's OAuth2PasswordRequestForm expects x-www-form-urlencoded
  const body = new URLSearchParams({ username: email, password });
  const res = await fetch(`${API_BASE}/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  return handleResponse<LoginResponse>(res);
}

export interface UserResponse {
  uid: string;
  email: string | null;
  phone: string | null;
  role: string;
  is_verified: boolean;
}

export interface UserCreatePayload {
  name: string;
  password: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
}

export async function registerUser(payload: UserCreatePayload): Promise<UserResponse> {
  const res = await fetch(`${API_BASE}/users/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<UserResponse>(res);
}

// ---- User Profile ----------------------------------------------------------

export interface UserProfileResponse {
  uid: string;
  name: string;
  bio: string | null;
  location: string | null;
  profile_image: string | null;
  created_at: string;
  last_active: string;
}

export async function getMyProfile(): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/me/profile`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<UserProfileResponse>(res);
}

// ---- Posts -----------------------------------------------------------------

export interface PostResponse {
  pid: string;
  uid: string;
  cid: string;
  type: string;
  content: string | null;
  tags: string | null;
  created_at: string;
  likes: number;
  dislikes: number;
}

export async function fetchPosts(skip = 0, limit = 50): Promise<PostResponse[]> {
  const res = await fetch(`${API_BASE}/posts/?skip=${skip}&limit=${limit}`);
  return handleResponse<PostResponse[]>(res);
}

export interface PostCreatePayload {
  uid: string;
  cid: string;
  content: string;
  tags?: string;
  type?: string;
}

export async function createPost(payload: PostCreatePayload): Promise<PostResponse> {
  const res = await fetch(`${API_BASE}/posts/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<PostResponse>(res);
}

// ---- Clusters (basic list for the create-post dropdown) --------------------

export interface ClusterBasic {
  cid: string;
  name: string;
  category: string | null;
}

export async function fetchClusters(skip = 0, limit = 50): Promise<ClusterBasic[]> {
  const res = await fetch(`${API_BASE}/clusters/?skip=${skip}&limit=${limit}`);
  return handleResponse<ClusterBasic[]>(res);
}
