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

export async function getUserProfile(uid: string): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/${uid}`);
  return handleResponse<UserProfileResponse>(res);
}

export interface UserUpdatePayload {
  name?: string;
  bio?: string;
  location?: string;
}

export async function updateMyProfile(payload: UserUpdatePayload): Promise<UserProfileResponse> {
  const res = await fetch(`${API_BASE}/users/me/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<UserProfileResponse>(res);
}

export async function deleteMyAccount(): Promise<any> {
  const res = await fetch(`${API_BASE}/users/me/account`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

// ---- User Analytics --------------------------------------------------------

export async function getUserPosts(uid: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/posts`);
  return handleResponse<any[]>(res);
}

export async function getUserPostDistribution(uid: string): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/post-distribution`);
  return handleResponse<any[]>(res);
}

export async function getUserTopPosts(uid: string, limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/top-posts?limit=${limit}`);
  return handleResponse<any[]>(res);
}

export async function getUserTopComments(uid: string, limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/top-comments?limit=${limit}`);
  return handleResponse<any[]>(res);
}

export async function getUserMostDislikedPosts(uid: string, limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/most-disliked-posts?limit=${limit}`);
  return handleResponse<any[]>(res);
}

export async function getMostActiveVerifiedUsers(limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/stats/most-active-verified?limit=${limit}`);
  return handleResponse<any[]>(res);
}

export async function getMostLikedUsers(limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/stats/most-liked?limit=${limit}`);
  return handleResponse<any[]>(res);
}

export async function getMostEngagedUsers(limit = 5): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/stats/most-engaged?limit=${limit}`);
  return handleResponse<any[]>(res);
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

// ---- Triggers (verification / dashboard) -----------------------------------

export async function fetchTriggerDashboard(): Promise<any> {
  const res = await fetch(`${API_BASE}/triggers/dashboard`);
  return handleResponse<any>(res);
}

export async function verifyPostStatsTrigger(pid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/triggers/verify/post-stats/${pid}`);
  return handleResponse<any>(res);
}

export async function verifyMemberCountTrigger(cid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/triggers/verify/member-count/${cid}`);
  return handleResponse<any>(res);
}

export async function verifyLastActiveTrigger(uid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/triggers/verify/last-active/${uid}`);
  return handleResponse<any>(res);
}

export async function joinCluster(cid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/join`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

export async function leaveCluster(cid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/leave`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

// ---- Cluster details -------------------------------------------------------

export interface ClusterDetailResponse {
  cid: string;
  name: string;
  category: string | null;
  is_private: boolean;
  profile_icon: string | null;
  description: string | null;
  creator_uid: string;
  created_at: string;
  tags: string | null;
  member_count: number;
}

export async function getClusterDetail(cid: string): Promise<ClusterDetailResponse> {
  const res = await fetch(`${API_BASE}/clusters/${cid}`);
  return handleResponse<ClusterDetailResponse>(res);
}

// ---- Comments for a post ---------------------------------------------------

export interface CommentResponse {
  mid: string;
  uid: string;
  pid: string | null;
  parent_mid: string | null;
  content: string;
  created_at: string;
  likes: number;
  dislikes: number;
}

export async function fetchCommentsForPost(pid: string): Promise<CommentResponse[]> {
  const res = await fetch(`${API_BASE}/comments/post/${pid}`);
  return handleResponse<CommentResponse[]>(res);
}

export interface CommentCreatePayload {
  uid: string;
  content: string;
  pid?: string;
  parent_mid?: string;
}

export async function createComment(payload: CommentCreatePayload): Promise<CommentResponse> {
  const res = await fetch(`${API_BASE}/comments/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<CommentResponse>(res);
}

// ---- Reactions on posts ----------------------------------------------------

export async function reactToPost(pid: string, uid: string, reaction_type: string): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ uid, reaction_type }),
  });
  return handleResponse<any>(res);
}

