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
  /** Present on `GET /users/{uid}` and `/users/me/profile` */
  follower_count?: number | null;
  following_count?: number | null;
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
  /** Present when this post has a linked Megaphone promotion record */
  megaphone?: {
    start_time: string;
    end_time: string;
    type: string;
    is_active: boolean;
    subscriber_count: number;
    cluster_cid?: string;
    cluster_name?: string | null;
    poll?: {
      options: { idx: number; label: string; votes: number }[];
      total_votes: number;
      my_vote?: number | null;
    };
    event?: {
      starts_at: string | null;
      ends_at: string | null;
      location: string | null;
      counts: { GOING: number; MAYBE: number; NOT_GOING: number; total_rsvps: number };
      my_status?: string | null;
    };
  };
  /** For WINDOW posts, the source post info */
  window_origin?: {
    origin_pid: string;
    origin_cid: string;
    cluster_name: string | null;
    author_name: string | null;
    author_uid: string;
    content: string | null;
    created_at: string | null;
  };
}

export async function fetchPosts(skip = 0, limit = 50, cid?: string): Promise<PostResponse[]> {
  const params = new URLSearchParams({ skip: String(skip), limit: String(limit) });
  if (cid) params.set("cid", cid);
  const res = await fetch(`${API_BASE}/posts/?${params}`);
  return handleResponse<PostResponse[]>(res);
}

export async function fetchPostById(pid: string): Promise<PostResponse> {
  const res = await fetch(`${API_BASE}/posts/${pid}`);
  return handleResponse<PostResponse>(res);
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

export async function editPost(pid: string, content: string, tags?: string): Promise<PostResponse> {
  const res = await fetch(`${API_BASE}/posts/${pid}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, tags }),
  });
  return handleResponse<PostResponse>(res);
}

export async function createMegaphone(payload: {
  cid: string;
  content: string;
  tags?: string;
  megaphone_type?: "ANNOUNCEMENT" | "POLL" | "EVENT";
  duration_hours?: number;
  poll_options?: string[];
  event_starts_at?: string | null;
  event_ends_at?: string | null;
  event_location?: string | null;
}): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/megaphone/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(payload),
  });
  return handleResponse<any>(res);
}

export async function sharePostToCluster(pid: string, target_cid: string): Promise<PostResponse> {
  const res = await fetch(`${API_BASE}/posts/${pid}/share`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ target_cid }),
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

export async function fetchWindowOrigin(pid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}/window-origin`);
  return handleResponse<any>(res);
}

export async function fetchMegaphoneInfo(pid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}/megaphone-info`);
  return handleResponse<any>(res);
}

export async function fetchMegaphoneEngagement(pid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}/megaphone/engagement`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

export async function voteMegaphonePoll(pid: string, optionIndex: number): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}/megaphone/poll/vote`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ option_index: optionIndex }),
  });
  return handleResponse<any>(res);
}

export async function rsvpMegaphoneEvent(
  pid: string,
  status: "GOING" | "MAYBE" | "NOT_GOING"
): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}/megaphone/event/rsvp`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ status }),
  });
  return handleResponse<any>(res);
}

// ---- Follow graph -----------------------------------------------------------

export async function fetchUserFollowers(uid: string): Promise<{ uid: string; name: string; bio: string | null }[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/followers`);
  return handleResponse(res);
}

export async function fetchUserFollowing(uid: string): Promise<{ uid: string; name: string; bio: string | null }[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/following`);
  return handleResponse(res);
}

export async function fetchClusterMembers(cid: string): Promise<{ uid: string; name: string; role: string }[]> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/members`);
  return handleResponse(res);
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

export async function fetchMyJoinedClusterIds(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/clusters/memberships/me`, {
    headers: { ...authHeaders() },
  });
  const data = await handleResponse<{ cluster_ids: string[] }>(res);
  return data.cluster_ids;
}

export async function bookmarkCluster(cid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/bookmark`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

export async function unbookmarkCluster(cid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/bookmark`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

export interface BookmarkedCluster {
  cid: string;
  name: string;
  category: string | null;
  bookmarked_at: string;
  chat_enabled: boolean;
  is_member: boolean;
}

export async function fetchMyBookmarkedClusters(): Promise<BookmarkedCluster[]> {
  const res = await fetch(`${API_BASE}/clusters/bookmarks/me`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<BookmarkedCluster[]>(res);
}

export async function setClusterChatOption(cid: string, chat_enabled: boolean): Promise<any> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/chat-options`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ chat_enabled }),
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

export async function reactToComment(mid: string, uid: string, reaction_type: string): Promise<{ likes: number; dislikes: number }> {
  const res = await fetch(`${API_BASE}/comments/${mid}/react`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ uid, reaction_type }),
  });
  return handleResponse<{ likes: number; dislikes: number }>(res);
}

export interface PostReactionResponse {
  likes: number;
  dislikes: number;
  current_reaction: "LIKE" | "DISLIKE" | null;
}

export async function fetchMyPostReaction(
  pid: string
): Promise<{ reaction: "LIKE" | "DISLIKE" | "LOVE" | null }> {
  const res = await fetch(`${API_BASE}/posts/${pid}/reaction/me`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<{ reaction: "LIKE" | "DISLIKE" | "LOVE" | null }>(res);
}

/** Per-type reaction counts (LIKE, DISLIKE, LOVE, …) for display chips */
export async function fetchPostReactionStats(
  pid: string
): Promise<{ reaction_type: string; count: number }[]> {
  const res = await fetch(`${API_BASE}/posts/${pid}/reactions/stats`);
  return handleResponse<{ reaction_type: string; count: number }[]>(res);
}

export async function removeMyPostReaction(pid: string): Promise<PostReactionResponse> {
  const res = await fetch(`${API_BASE}/posts/${pid}/react`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<PostReactionResponse>(res);
}

// ---- Posts — moderator actions --------------------------------------------

export async function deletePost(pid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/posts/${pid}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

// ---- Comments — moderator actions -----------------------------------------

export async function deleteComment(mid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/comments/${mid}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

// ---- Clusters — search & membership ---------------------------------------

export async function searchClusters(query: string): Promise<ClusterBasic[]> {
  const res = await fetch(`${API_BASE}/clusters/search/${encodeURIComponent(query)}`);
  return handleResponse<ClusterBasic[]>(res);
}

export interface ClusterMembershipStatus {
  is_member: boolean;
  role: string | null;
  is_moderator: boolean;
  is_creator: boolean;
}

export async function checkMyClusterMembership(cid: string): Promise<ClusterMembershipStatus> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/membership/me`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<ClusterMembershipStatus>(res);
}

export async function addClusterModerator(cid: string, uid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/clusters/${cid}/moderators`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ uid }),
  });
  return handleResponse<any>(res);
}

/**
 * Fetches full ClusterBasic info for each cluster the current user has joined.
 * Uses the membership list endpoint then batch-fetches cluster details.
 */
export async function fetchMyJoinedClusters(): Promise<ClusterBasic[]> {
  const ids = await fetchMyJoinedClusterIds();
  if (ids.length === 0) return [];
  const results = await Promise.allSettled(
    ids.map((cid) =>
      fetch(`${API_BASE}/clusters/${cid}`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null)
    )
  );
  return results
    .filter((r): r is PromiseFulfilledResult<any> => r.status === "fulfilled" && r.value !== null)
    .map((r) => ({ cid: r.value.cid, name: r.value.name, category: r.value.category ?? null }));
}

// ---- Global Search ---------------------------------------------------------

export interface GlobalSearchResult {
  users: { uid: string; name: string; bio: string | null }[];
  clusters: { cid: string; name: string; category: string | null }[];
  posts: { pid: string; uid: string; cid: string; content: string; likes: number; dislikes: number }[];
}

export async function globalSearch(q: string): Promise<GlobalSearchResult> {
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  return handleResponse<GlobalSearchResult>(res);
}

// ---- Follow / Unfollow -----------------------------------------------------

export async function followUser(uid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/users/${uid}/follow`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

export async function unfollowUser(uid: string): Promise<any> {
  const res = await fetch(`${API_BASE}/users/${uid}/follow`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  return handleResponse<any>(res);
}

export async function checkFollowStatus(uid: string): Promise<{ is_following: boolean; follower_count: number }> {
  const res = await fetch(`${API_BASE}/users/${uid}/follow/me`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<{ is_following: boolean; follower_count: number }>(res);
}

// ---- Public user data -------------------------------------------------------

export async function getUserRecentPosts(uid: string, limit = 30): Promise<PostResponse[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/recent-posts?limit=${limit}`);
  return handleResponse<PostResponse[]>(res);
}

export async function getUserRecentComments(uid: string, limit = 30): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/${uid}/recent-comments?limit=${limit}`);
  return handleResponse<any[]>(res);
}

// ---- Comment reaction check ------------------------------------------------

export async function getCommentReaction(mid: string): Promise<{ reaction_type: string | null }> {
  const res = await fetch(`${API_BASE}/comments/${mid}/reaction/me`, {
    headers: { ...authHeaders() },
  });
  return handleResponse<{ reaction_type: string | null }>(res);
}

// ---- Feed variants ---------------------------------------------------------

export async function fetchMyFeed(limit = 50): Promise<PostResponse[]> {
  const res = await fetch(`${API_BASE}/posts/me/feed?limit=${limit}`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) return [];
  const raw: any[] = await res.json();
  // Normalise the tuple/object shape returned by the service
  return raw.map((item) => {
    if (Array.isArray(item)) {
      const [core, content, stats] = item;
      return { pid: core.pid ?? item[0], uid: core.uid ?? item[1], cid: core.cid ?? item[2], type: core.type ?? item[3], content: content?.content ?? item[4], tags: content?.tags ?? null, created_at: core.created_at ?? item[5], likes: stats?.likes ?? 0, dislikes: stats?.dislikes ?? 0 };
    }
    return item as PostResponse;
  });
}

export async function fetchTrendingFeed(limit = 30): Promise<PostResponse[]> {
  const res = await fetch(`${API_BASE}/posts/trending/global?limit=${limit}`);
  if (!res.ok) return [];
  const raw: any[] = await res.json();
  return raw.map((item) => {
    if (Array.isArray(item)) {
      const [core, content, stats] = item;
      return { pid: core.pid ?? item[0], uid: core.uid ?? item[1], cid: core.cid ?? item[2], type: core.type ?? item[3], content: content?.content ?? item[4], tags: content?.tags ?? null, created_at: core.created_at ?? item[5], likes: stats?.likes ?? 0, dislikes: stats?.dislikes ?? 0 };
    }
    return item as PostResponse;
  });
}

export async function fetchActiveMegaphones(): Promise<any[]> {
  const res = await fetch(`${API_BASE}/posts/megaphones/active`);
  if (!res.ok) return [];
  return res.json();
}

// ---- User search ------------------------------------------------------------

export async function searchUsers(q: string, limit = 20): Promise<any[]> {
  const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(q)}&limit=${limit}`);
  return handleResponse<any[]>(res);
}

