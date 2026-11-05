"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Sparkles,
  Heart,
  MessageSquare,
  Share2,
  ExternalLink,
  Plus,
  Send,
  Lightbulb,
  Rocket,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Globe,
  Clock,
  Layers,
  Flame,
  Check,
  Copy,
} from "lucide-react";

interface CommunityPost {
  id: number;
  user_id: string;
  title: string;
  content: string;
  post_type: "idea" | "showcase";
  likes_count: number;
  created_at: string;
  author_name?: string;
  author_email?: string;
  comments_count?: number;
}

interface PublicProject {
  id: number;
  name: string;
  description: string | null;
  github_url: string | null;
  risk_score: number;
  progress_pct: number;
  share_token: string;
  created_at: string;
  author_name?: string;
}

interface CommentItem {
  id: number;
  post_id: number;
  user_id: string;
  comment_text: string;
  created_at: string;
  author_name?: string;
  author_email?: string;
}

export default function CommunityPage() {
  const { user, isLoaded } = useUser();

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [publicProjects, setPublicProjects] = useState<PublicProject[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"all" | "idea" | "showcase" | "projects">("all");

  // Post creation modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false);
  const [postTitle, setPostTitle] = useState<string>("");
  const [postContent, setPostContent] = useState<string>("");
  const [postType, setPostType] = useState<"idea" | "showcase">("showcase");
  const [isSubmittingPost, setIsSubmittingPost] = useState<boolean>(false);

  // Comments state per post
  const [openCommentPostId, setOpenCommentPostId] = useState<number | null>(null);
  const [postComments, setPostComments] = useState<Record<number, CommentItem[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [isSubmittingComment, setIsSubmittingComment] = useState<boolean>(false);
  const [loadingCommentsPostId, setLoadingCommentsPostId] = useState<number | null>(null);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Community Feed
  const fetchFeed = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/community/posts");
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts || []);
        setPublicProjects(data.publicProjects || []);
      }
    } catch (err: any) {
      console.error("Failed to load community feed:", err);
      showToast("Unable to load community posts", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  // Handle Optimistic Upvote / Like
  const handleLikePost = async (postId: number) => {
    // 1. Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p))
    );

    try {
      const res = await fetch("/api/community/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        // Rollback on failure
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p))
        );
        showToast("Could not like post", "error");
      }
    } catch {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p))
      );
    }
  };

  // Toggle comments and fetch them if needed
  const toggleComments = async (postId: number) => {
    if (openCommentPostId === postId) {
      setOpenCommentPostId(null);
      return;
    }

    setOpenCommentPostId(postId);
    if (!postComments[postId]) {
      setLoadingCommentsPostId(postId);
      try {
        const res = await fetch(`/api/community/comment?postId=${postId}`);
        if (res.ok) {
          const data = await res.json();
          setPostComments((prev) => ({ ...prev, [postId]: data.comments || [] }));
        }
      } catch (err) {
        console.error("Failed to load comments:", err);
      } finally {
        setLoadingCommentsPostId(null);
      }
    }
  };

  // Submit comment
  const handleSubmitComment = async (postId: number) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;

    setIsSubmittingComment(true);
    const commenterName =
      user?.fullName || (user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Developer");

    // Optimistic comment insert
    const tempComment: CommentItem = {
      id: Date.now(),
      post_id: postId,
      user_id: user?.id || "user_demo_1",
      comment_text: text,
      created_at: new Date().toISOString(),
      author_name: commenterName,
    };

    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), tempComment],
    }));

    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p))
    );

    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));

    try {
      const res = await fetch("/api/community/comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, commentText: text }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast("Comment posted! Author notified via Resend email.");
      } else {
        showToast(data.error || "Failed to post comment", "error");
      }
    } catch (err: any) {
      showToast("Error posting comment: " + err.message, "error");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Submit new community post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;

    setIsSubmittingPost(true);
    try {
      const res = await fetch("/api/community/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: postTitle.trim(),
          content: postContent.trim(),
          postType,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.post) {
        setPosts((prev) => [data.post, ...prev]);
        setCreateModalOpen(false);
        setPostTitle("");
        setPostContent("");
        showToast("Published to ShipPilot Community Feed!");
      } else {
        showToast(data.error || "Failed to publish post", "error");
      }
    } catch (err: any) {
      showToast("Error creating post: " + err.message, "error");
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter((p) => {
    if (activeTab === "all") return true;
    if (activeTab === "idea") return p.post_type === "idea";
    if (activeTab === "showcase") return p.post_type === "showcase";
    return true;
  });

  return (
    <div className="min-h-screen bg-[#070a13] text-slate-100 font-sans antialiased selection:bg-sky-500 selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-top-4 ${
            toast.type === "success"
              ? "bg-emerald-950/90 border-emerald-500/40 text-emerald-200"
              : "bg-red-950/90 border-red-500/40 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
          )}
          <span className="text-xs sm:text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-[#070a13]/85 backdrop-blur-md px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center font-bold text-white shadow-lg shadow-sky-500/20">
                ⚡
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                ShipPilot
              </span>
            </Link>
            <span className="text-slate-700 hidden sm:inline">/</span>
            <span className="text-xs font-semibold text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20 hidden sm:inline">
              Developer Community & Idea Hub
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-xs font-medium text-slate-300 hover:text-white px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 transition-colors"
            >
              Back to Dashboard
            </Link>

            <button
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Share Idea / Showcase</span>
            </button>

            <div className="pl-1">
              <UserButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* Hero banner */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-[#0c1322] via-[#0d172e] to-[#0c1322] border border-slate-800 shadow-xl text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>The Autonomous Developer Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
              Ship Faster. Inspire Engineers. Share Ideas.
            </h1>
            <p className="mt-2 text-xs sm:text-sm text-slate-400 max-w-xl">
              Discuss architecture solutions, discover public client radar status pages, and get instant Resend notification alerts whenever peers comment on your ideas.
            </p>
          </div>

          <button
            onClick={() => setCreateModalOpen(true)}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-sky-500/25 hover:scale-[1.02] transition-all shrink-0 flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            <span>Publish Tech Idea</span>
          </button>
        </div>

        {/* Tab Filters */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === "all"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Updates ({posts.length})
          </button>
          <button
            onClick={() => setActiveTab("idea")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "idea"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Lightbulb className="w-3.5 h-3.5" />
            <span>Tech Ideas</span>
          </button>
          <button
            onClick={() => setActiveTab("showcase")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "showcase"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Rocket className="w-3.5 h-3.5" />
            <span>Showcases</span>
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              activeTab === "projects"
                ? "bg-sky-500 text-slate-950"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Public Status Radars ({publicProjects.length})</span>
          </button>
        </div>

        {/* Content: Public Projects List (if tab is projects) */}
        {activeTab === "projects" && (
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Public Projects Live on Neon Postgres
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {publicProjects.map((proj) => {
                const health = proj.risk_score <= 35 ? "Healthy" : proj.risk_score <= 70 ? "At Risk" : "Critical";
                return (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-[#0c1220]/90 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-slate-400">
                          By {proj.author_name || "Lead"}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            health === "Healthy"
                              ? "bg-emerald-500/20 text-emerald-400"
                              : health === "At Risk"
                              ? "bg-amber-500/20 text-amber-400"
                              : "bg-red-500/20 text-red-400"
                          }`}
                        >
                          {health} ({proj.risk_score}/100 Risk)
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-2">{proj.name}</h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {proj.description || "Active ShipPilot monitored project."}
                      </p>
                    </div>

                    <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <span className="text-xs text-sky-400 font-semibold">{proj.progress_pct}% Completed</span>
                      <Link
                        href={`/p/${proj.share_token || proj.id}`}
                        target="_blank"
                        className="text-xs text-slate-300 hover:text-white flex items-center gap-1 font-medium"
                      >
                        <span>Open Status Page</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Content: Community Posts Feed */}
        {activeTab !== "projects" && (
          <div className="space-y-6">
            {filteredPosts.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-12">
                No posts found under this category. Be the first to publish a post!
              </p>
            ) : (
              filteredPosts.map((post) => {
                const isOpenComments = openCommentPostId === post.id;
                const comments = postComments[post.id] || [];
                const isIdea = post.post_type === "idea";

                return (
                  <article
                    key={post.id}
                    id={`post-${post.id}`}
                    className="p-6 rounded-2xl bg-[#0c1220]/90 border border-slate-800 shadow-xl transition-all"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-slate-300">
                          {(post.author_name || "D").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <span className="text-xs font-semibold text-slate-200">
                            {post.author_name || "Developer"}
                          </span>
                          <span className="text-[11px] text-slate-500 block">
                            {new Date(post.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          isIdea
                            ? "bg-amber-500/10 text-amber-300 border-amber-500/30"
                            : "bg-sky-500/10 text-sky-300 border-sky-500/30"
                        }`}
                      >
                        {isIdea ? "💡 Tech Idea" : "🚀 Showcase"}
                      </span>
                    </div>

                    {/* Title & Content */}
                    <h2 className="text-base sm:text-lg font-bold text-white mb-2 leading-snug">
                      {post.title}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                      {post.content}
                    </p>

                    {/* Actions Bar (Upvote & Comments) */}
                    <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Interactive Upvote Button */}
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-rose-400 transition-colors group cursor-pointer"
                        >
                          <Heart className="w-4 h-4 text-slate-500 group-hover:text-rose-400 transition-colors" />
                          <span className="font-semibold text-slate-300">{post.likes_count || 0}</span>
                        </button>

                        {/* Comments Toggle Button */}
                        <button
                          onClick={() => toggleComments(post.id)}
                          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-sky-400 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-500" />
                          <span>
                            {post.comments_count || comments.length || 0} Comments
                          </span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-500">
                        ⚡ Neon DB • Resend Alerts
                      </span>
                    </div>

                    {/* Collapsible Comments Section */}
                    {isOpenComments && (
                      <div className="mt-4 pt-4 border-t border-slate-800/60 space-y-3">
                        <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                          Discussion
                        </h4>

                        {/* Comments List */}
                        {loadingCommentsPostId === post.id ? (
                          <p className="text-xs text-slate-500 py-2">Loading discussion...</p>
                        ) : comments.length === 0 ? (
                          <p className="text-xs text-slate-500 py-1">
                            No comments yet. Share your thoughts below to notify the author!
                          </p>
                        ) : (
                          <div className="space-y-2.5">
                            {comments.map((c) => (
                              <div
                                key={c.id}
                                className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs text-slate-300"
                              >
                                <div className="flex items-center justify-between mb-1 text-[11px] text-slate-400">
                                  <strong className="text-slate-200">
                                    {c.author_name || "Developer"}
                                  </strong>
                                  <span className="text-[10px] text-slate-500">
                                    {new Date(c.created_at).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>
                                <p className="leading-relaxed">{c.comment_text}</p>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Comment Input Form */}
                        <div className="flex items-center gap-2 pt-2">
                          <input
                            type="text"
                            value={commentInputs[post.id] || ""}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [post.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSubmitComment(post.id);
                            }}
                            placeholder="Add your reply... (Author will be notified via Resend)"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                          />
                          <button
                            onClick={() => handleSubmitComment(post.id)}
                            disabled={isSubmittingComment || !commentInputs[post.id]?.trim()}
                            className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs transition-colors shrink-0 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Reply</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* Post Creation Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#0e1628] border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-1">Publish to Community Feed</h3>
            <p className="text-xs text-slate-400 mb-4">
              Share your engineering idea, showcase a breakthrough, or ask for peer feedback.
            </p>

            <form onSubmit={handleCreatePost} className="space-y-4">
              {/* Type Switcher */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPostType("showcase")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    postType === "showcase"
                      ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                      : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}
                >
                  <Rocket className="w-3.5 h-3.5" />
                  <span>Showcase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPostType("idea")}
                  className={`flex-1 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                    postType === "idea"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : "bg-slate-900 text-slate-400 border border-slate-800"
                  }`}
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Tech Idea</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Post Title *
                </label>
                <input
                  type="text"
                  required
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="e.g. How we dropped Groq LPU latency to 280ms on Next.js 14"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Description / Content *
                </label>
                <textarea
                  required
                  rows={4}
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Explain the background, how it works, architectural decisions, and why developers should care..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingPost || !postTitle.trim() || !postContent.trim()}
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold text-xs shadow-md shadow-sky-500/20 disabled:opacity-50 transition-all cursor-pointer"
                >
                  {isSubmittingPost ? "Publishing..." : "Publish Post"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
