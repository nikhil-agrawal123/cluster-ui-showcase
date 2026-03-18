/**
 * triggerCheck.ts — Console-only verification of backend SQL triggers.
 * 
 * Runs once on app startup, hits /triggers/dashboard, and logs OK/FAIL
 * for each of the 5 triggers to the browser dev console.
 */

const API_BASE = "http://localhost:8000";

export async function runTriggerCheck(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/triggers/dashboard`);
    if (!res.ok) {
      console.warn("[Triggers] ⚠️ Could not reach /triggers/dashboard — backend may be offline");
      return;
    }
    const d = await res.json();

    console.group("%c🗄️ SQL Trigger Status", "font-weight:bold; font-size:13px; color:#7c3aed");

    // 1. trg_init_post_stats
    const ps = d.trg_init_post_stats;
    if (ps) {
      const ok = ps.posts_with_stats >= ps.total_posts * 0.95;
      console.log(
        `${ok ? "✅" : "❌"} trg_init_post_stats — ${ps.coverage} coverage (${ps.posts_with_stats}/${ps.total_posts} posts have stats)`
      );
    }

    // 2. trg_init_comment_stats
    const cs = d.trg_init_comment_stats;
    if (cs) {
      const ok = cs.comments_with_stats >= cs.total_comments * 0.95;
      console.log(
        `${ok ? "✅" : "❌"} trg_init_comment_stats — ${cs.coverage} coverage (${cs.comments_with_stats}/${cs.total_comments} comments have stats)`
      );
    }

    // 3/4. trg_increment/decrement_member_count
    const mc = d.trg_member_count;
    if (mc) {
      console.log(
        `${mc.all_counts_accurate ? "✅" : "⚠️"} trg_member_count — ${mc.total_clusters} clusters tracked, ${mc.mismatched_clusters} mismatches`
      );
    }

    // 5. trg_update_last_active
    const la = d.trg_update_last_active;
    if (la) {
      const topUser = la.recently_active_users?.[0];
      console.log(
        `✅ trg_update_last_active — most recent: ${topUser?.name ?? "N/A"} at ${topUser?.last_active ?? "N/A"}`
      );
    }

    // Summary
    console.log(
      `\n📋 Registered triggers (${d.trigger_count}): ${d.registered_triggers.join(", ")}`
    );

    console.groupEnd();
  } catch {
    console.warn("[Triggers] ⚠️ Backend unreachable — trigger checks skipped");
  }
}
