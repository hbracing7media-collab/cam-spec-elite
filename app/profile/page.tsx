"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CAM_MAKE_OPTIONS, CAM_ENGINE_FAMILIES } from "@/lib/engineOptions";
import { UserAwardsProfile } from "@/components/UserAwardsProfile";
import { UserDynoSubmissions } from "@/components/UserDynoSubmissions";

interface UserProfile {
  email: string;
  forum_handle?: string;
  forum_avatar_url?: string;
  [key: string]: any;
}

interface ShortBlock {
  id: string;
  block_name: string;
  engine_make?: string;
  engine_family?: string;
  displacement?: string;
  bore?: string;
  stroke?: string;
  deck_height?: string;
  piston_dome_dish?: string;
  head_gasket_bore?: string;
  head_gasket_compressed_thickness?: string;
  rod_length?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [forumHandle, setForumHandle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Short Blocks state
  const [shortBlocks, setShortBlocks] = useState<ShortBlock[]>([]);
  const [showNewBlockForm, setShowNewBlockForm] = useState(false);
  const [newBlock, setNewBlock] = useState({
    block_name: "",
    engine_make: "",
    engine_family: "",
    displacement: "",
    bore: "",
    stroke: "",
    deck_height: "",
    piston_dome_dish: "",
    head_gasket_bore: "",
    head_gasket_compressed_thickness: "",
    rod_length: "",
  });
  const [savingBlock, setSavingBlock] = useState(false);

  // Cam Builds state
  const [camBuilds, setCamBuilds] = useState<any[]>([]);
  const [availableCams, setAvailableCams] = useState<any[]>([]);
  const [showNewBuildForm, setShowNewBuildForm] = useState(false);
  const [selectedBlockForBuild, setSelectedBlockForBuild] = useState<string>("");

  // Head Builds state (like cam builds)
  const [headBuilds, setHeadBuilds] = useState<any[]>([]);
  const [availableHeads, setAvailableHeads] = useState<any[]>([]);
  const [showNewHeadBuildForm, setShowNewHeadBuildForm] = useState(false);
  const [selectedBlockForHeadBuild, setSelectedBlockForHeadBuild] = useState<string>("");

  // Engine Submissions state
  const [engineSubmissions, setEngineSubmissions] = useState<any[]>([]);
  const [showNewEngineForm, setShowNewEngineForm] = useState(false);
  const [newEngine, setNewEngine] = useState({
    engine_name: "",
    short_block_id: "",
    head_id: "",
    cam_ids: "",
    description: "",
    notes: "",
  });
  const [engineFiles, setEngineFiles] = useState<{ dyno_sheet: File | null; cam_card: File | null }>({
    dyno_sheet: null,
    cam_card: null,
  });
  const [savingEngine, setSavingEngine] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        router.replace("/auth/login");
      } else {
        const data = await res.json();
        setUser(data.user);
        setForumHandle(data.user.forum_handle || "");
        setAvatarUrl(data.user.forum_avatar_url || "");
        setChecking(false);

        // Load short blocks and cam builds
        await loadShortBlocks();
        await loadCamBuilds();
        await loadHeadBuilds();
        await loadEngineSubmissions();
      }
    };
    checkAuth();
  }, [router]);

  const loadShortBlocks = async () => {
    try {
      const res = await fetch("/api/profile/short-blocks");
      if (res.ok) {
        const data = await res.json();
        setShortBlocks(data.blocks || []);
      }
    } catch (err) {
      console.error("Failed to load short blocks:", err);
    }
  };

  const loadCamBuilds = async () => {
    try {
      const res = await fetch("/api/profile/cam-builds");
      if (res.ok) {
        const data = await res.json();
        setCamBuilds(data.builds || []);
      }
    } catch (err) {
      console.error("Failed to load cam builds:", err);
    }
  };

  const loadAvailableCams = async (engineMake: string, engineFamily: string) => {
    if (!engineMake || !engineFamily) {
      setAvailableCams([]);
      return;
    }
    try {
      const res = await fetch(`/api/cams/search-by-family?engine_make=${encodeURIComponent(engineMake)}&engine_family=${encodeURIComponent(engineFamily)}`);
      if (res.ok) {
        const data = await res.json();
        setAvailableCams(data.cams || []);
      }
    } catch (err) {
      console.error("Failed to load cams:", err);
    }
  };

  const handleSaveShortBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBlock.block_name) {
      alert("Block name is required");
      return;
    }

    setSavingBlock(true);
    try {
      const res = await fetch("/api/profile/short-blocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newBlock),
      });

      if (res.ok) {
        setNewBlock({
          block_name: "",
          engine_make: "",
          engine_family: "",
          displacement: "",
          bore: "",
          stroke: "",
          deck_height: "",
          piston_dome_dish: "",
          head_gasket_bore: "",
          head_gasket_compressed_thickness: "",
          rod_length: "",
        });
        setShowNewBlockForm(false);
        await loadShortBlocks();
      } else {
        const err = await res.json();
        alert("Failed to save short block: " + err.message);
      }
    } catch (err: any) {
      alert("Error saving short block: " + err.message);
    } finally {
      setSavingBlock(false);
    }
  };

  const handleDeleteShortBlock = async (blockId: string) => {
    if (!confirm("Delete this short block?")) return;

    try {
      const res = await fetch(`/api/profile/short-blocks/${blockId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadShortBlocks();
      } else {
        alert("Failed to delete short block");
      }
    } catch (err: any) {
      alert("Error deleting short block: " + err.message);
    }
  };

  const handleCreateCamBuild = async (blockId: string) => {
    try {
      console.log("Creating cam build for block:", blockId);
      const res = await fetch("/api/profile/cam-builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ short_block_id: blockId }),
      });

      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);

      if (res.ok) {
        const data = await res.json();
        console.log("Build created successfully:", data);
        const block = shortBlocks.find((b) => b.id === blockId);
        if (block && block.engine_make && block.engine_family) {
          await loadAvailableCams(block.engine_make, block.engine_family);
        }
        await loadCamBuilds();
        setSelectedBlockForBuild(blockId);
      } else {
        const text = await res.text();
        console.error("Error response text:", text);
        let errData;
        try {
          errData = JSON.parse(text);
        } catch {
          errData = { message: text || `HTTP ${res.status}` };
        }
        console.error("Parsed error:", errData);
        alert("Failed to create cam build: " + (errData.message || "Unknown error"));
      }
    } catch (err: any) {
      console.error("Exception creating cam build:", err);
      alert("Error creating cam build: " + err.message);
    }
  };

  const handleUpdateCamBuild = async (buildId: string, camSlot: number, camId: string | null) => {
    const build = camBuilds.find((b) => b.id === buildId);
    if (!build) return;

    const updates: any = {
      cam1_id: build.cam1_id,
      cam2_id: build.cam2_id,
      cam3_id: build.cam3_id,
    };

    if (camSlot === 1) updates.cam1_id = camId;
    if (camSlot === 2) updates.cam2_id = camId;
    if (camSlot === 3) updates.cam3_id = camId;

    console.log(`Updating build ${buildId} slot ${camSlot} with cam ${camId}:`, updates);

    try {
      const res = await fetch(`/api/profile/cam-builds/${buildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        console.log("Update successful, reloading builds...");
        await loadCamBuilds();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || `HTTP ${res.status}`;
        console.error("Update failed:", errorMsg);
        alert(`Failed to update cam build: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error("Error updating cam build:", err);
      alert("Error updating cam build: " + err.message);
    }
  };

  const handleDeleteCamBuild = async (buildId: string) => {
    if (!confirm("Delete this cam build?")) return;

    try {
      const res = await fetch(`/api/profile/cam-builds/${buildId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadCamBuilds();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || `HTTP ${res.status}`;
        alert(`Failed to delete: ${errorMsg}`);
      }
    } catch (err: any) {
      alert("Error deleting cam build: " + err.message);
    }
  };

  // --------- Head Builds Functions (like Cam Builds) ---------
  const loadHeadBuilds = async () => {
    try {
      const res = await fetch("/api/profile/head-builds");
      if (res.ok) {
        const data = await res.json();
        setHeadBuilds(data.builds || []);
      }
    } catch (err) {
      console.error("Failed to load head builds:", err);
    }
  };

  const handleCreateHeadBuild = async (blockId: string) => {
    if (!blockId) {
      alert("Please select a short block");
      return;
    }

    try {
      // Fetch available heads for this block
      const block = shortBlocks.find((b) => b.id === blockId);
      if (!block || !block.engine_make || !block.engine_family) {
        alert("Please set engine make and family on the short block first");
        return;
      }

      const searchParams = new URLSearchParams({
        make: block.engine_make,
        family: block.engine_family,
      });
      const headsRes = await fetch(`/api/heads/search-by-family?${searchParams}`);
      if (!headsRes.ok) {
        alert("Failed to fetch available heads");
        return;
      }

      const headsData = await headsRes.json();
      setAvailableHeads(headsData.heads || []);

      // Create a head build (user will select head from dropdown)
      // For now, just show the available heads
      setShowNewHeadBuildForm(true);
      setSelectedBlockForHeadBuild(blockId);
    } catch (err: any) {
      alert("Error loading available heads: " + err.message);
    }
  };

  const handleAddHeadToBlock = async (blockId: string, headId: string) => {
    try {
      const res = await fetch("/api/profile/head-builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_block_id: blockId,
          head_id: headId,
        }),
      });

      if (res.ok) {
        await loadHeadBuilds();
        setShowNewHeadBuildForm(false);
        setAvailableHeads([]);
      } else {
        alert("Failed to add head build");
      }
    } catch (err: any) {
      alert("Error adding head build: " + err.message);
    }
  };

  const handleDeleteHeadBuild = async (buildId: string) => {
    if (!confirm("Remove this head from the build?")) return;

    try {
      const res = await fetch(`/api/profile/head-builds/${buildId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadHeadBuilds();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || `HTTP ${res.status}`;
        alert(`Failed to remove: ${errorMsg}`);
      }
    } catch (err: any) {
      alert("Error removing head build: " + err.message);
    }
  };

  const handleUpdateHeadBuild = async (buildId: string, headId: string | null) => {
    const build = headBuilds.find((b) => b.id === buildId);
    if (!build) return;

    console.log(`Updating build ${buildId} with head ${headId}`);

    try {
      const res = await fetch(`/api/profile/head-builds/${buildId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ head_id: headId }),
      });

      if (res.ok) {
        console.log("Update successful, reloading builds...");
        await loadHeadBuilds();
      } else {
        const errData = await res.json().catch(() => ({}));
        const errorMsg = errData.message || `HTTP ${res.status}`;
        console.error("Update failed:", errorMsg);
        alert(`Failed to update head: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error("Error updating head build:", err);
      alert("Error updating head build: " + err.message);
    }
  };

  const loadAvailableHeads = async (engineMake: string, engineFamily: string) => {
    if (!engineMake || !engineFamily) {
      setAvailableHeads([]);
      return;
    }
    try {
      const url = `/api/heads/search-by-family?make=${encodeURIComponent(engineMake)}&family=${encodeURIComponent(engineFamily)}`;
      console.log("Fetching heads from:", url);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        console.log("Heads data received:", data);
        setAvailableHeads(data.heads || []);
        console.log("Available heads state updated:", data.heads || []);
      } else {
        console.error("Failed to fetch heads:", res.status);
      }
    } catch (err) {
      console.error("Failed to load heads:", err);
    }
  };

  // --------- Engine Submissions Functions ---------
  const loadEngineSubmissions = async () => {
    try {
      const res = await fetch("/api/profile/engine-submissions");
      if (res.ok) {
        const data = await res.json();
        setEngineSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.error("Failed to load engine submissions:", err);
    }
  };

  const handleCreateEngineSubmission = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingEngine(true);

    try {
      if (!newEngine.engine_name || !newEngine.short_block_id || !engineFiles.dyno_sheet) {
        alert("Engine name, short block, and dyno sheet are required");
        setSavingEngine(false);
        return;
      }

      const formData = new FormData();
      formData.append("engine_name", newEngine.engine_name);
      formData.append("short_block_id", newEngine.short_block_id);
      formData.append("head_id", newEngine.head_id);
      formData.append("cam_ids", newEngine.cam_ids);
      formData.append("description", newEngine.description);
      formData.append("notes", newEngine.notes);
      formData.append("dyno_sheet", engineFiles.dyno_sheet);
      if (engineFiles.cam_card) {
        formData.append("cam_card", engineFiles.cam_card);
      }

      const res = await fetch("/api/profile/engine-submissions", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        await loadEngineSubmissions();
        setNewEngine({
          engine_name: "",
          short_block_id: "",
          head_id: "",
          cam_ids: "",
          description: "",
          notes: "",
        });
        setEngineFiles({ dyno_sheet: null, cam_card: null });
        setShowNewEngineForm(false);
      } else {
        const data = await res.json();
        alert("Failed to submit engine: " + (data.message || "Unknown error"));
      }
    } catch (err: any) {
      alert("Error submitting engine: " + err.message);
    } finally {
      setSavingEngine(false);
    }
  };

  const handleDeleteEngineSubmission = async (submissionId: string) => {
    if (!confirm("Delete this engine submission?")) return;

    try {
      const res = await fetch(`/api/profile/engine-submissions/${submissionId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        await loadEngineSubmissions();
      } else {
        alert("Failed to delete submission");
      }
    } catch (err: any) {
      alert("Error deleting submission: " + err.message);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setAvatarFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) setAvatarUrl(ev.target.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);

    const formData = new FormData();
    formData.append("forum_handle", forumHandle);
    if (avatarFile) {
      formData.append("forum_avatar", avatarFile);
    }

    console.log("Saving profile with handle:", forumHandle, "and avatar file:", avatarFile?.name);

    const res = await fetch("/api/profile/update", {
      method: "POST",
      body: formData,
    });
    
    console.log("Profile update response status:", res.status);
    const result = await res.json();
    console.log("Profile update response:", result);
    
    if (res.ok) {
      setMsg("Profile updated!");
      setAvatarFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Refetch user data to confirm changes were saved
      console.log("Refetching user data from /api/auth/me");
      const meRes = await fetch("/api/auth/me");
      console.log("Auth/me response status:", meRes.status);
      
      if (meRes.ok) {
        const meData = await meRes.json();
        console.log("Auth/me response data:", meData);
        const updatedUser = meData.user;
        setUser(updatedUser);
        setForumHandle(updatedUser.forum_handle || "");
        setAvatarUrl(updatedUser.forum_avatar_url || "");
        console.log("Updated state - handle:", updatedUser.forum_handle, "avatar:", updatedUser.forum_avatar_url);
      } else {
        console.error("Failed to refetch user data");
      }
    } else {
      setMsg(result.message || "Failed to update profile.");
      console.error("Profile update failed:", result.message);
    }
    setSaving(false);
  };

  if (checking) {
    return (
      <main style={{ padding: 40, textAlign: "center" }}>
        <h1>Loading...</h1>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        padding: "40px 20px",
        background:
          "radial-gradient(circle at 20% 10%, rgba(34,211,238,0.10), rgba(15,23,42,0.92))",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 24,
          maxWidth: "1200px",
          width: "100%",
        }}
      >
        {/* Left Column - Profile Info */}
        <div
          style={{
            borderRadius: 18,
            padding: 36,
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(2,6,23,0.85)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            color: "#e2e8f0",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <h1
            style={{
              margin: "0 0 12px 0",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontSize: 22,
              color: "#7dd3fc",
              textAlign: "center",
            }}
          >
            My Garage
          </h1>

        {/* Avatar Display Section */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            marginBottom: 24,
            padding: 16,
            borderRadius: 12,
            background: "rgba(0,212,255,0.05)",
            border: "1px solid rgba(0,212,255,0.2)",
          }}
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Your Avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
                marginBottom: 12,
                border: "2px solid #7dd3fc",
                boxShadow: "0 0 20px rgba(125,211,252,0.3)",
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "rgba(125,211,252,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 12,
                border: "2px dashed #7dd3fc",
                fontSize: 32,
                fontWeight: "bold",
                color: "#7dd3fc",
              }}
            >
              ?
            </div>
          )}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: 700, color: "#00d4ff", fontSize: 14 }}>
              {forumHandle || "No Handle Set"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(226,232,240,0.6)", marginTop: 4 }}>
              {avatarUrl ? "Avatar Set ✓" : "No Avatar Yet"}
            </div>
          </div>
        </div>

        <div
          style={{
            marginBottom: 24,
            textAlign: "center",
            color: "rgba(226,232,240,0.85)",
            fontSize: 15,
          }}
        >
          <div style={{ marginBottom: 8 }}>
            <span style={{ fontWeight: 600, color: "#7dd3fc" }}>Email:</span>
            <br />
            {user?.email}
          </div>
        </div>

        <form onSubmit={handleSave} style={{ marginBottom: 18 }}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#7dd3fc",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Forum Handle
            </label>
            <input
              type="text"
              value={forumHandle}
              onChange={(e) => setForumHandle(e.target.value)}
              placeholder="Your forum handle"
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: 8,
                border: "1px solid rgba(148,163,184,0.3)",
                background: "rgba(2,6,23,0.6)",
                color: "#e2e8f0",
                fontSize: 14,
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                fontWeight: 600,
                color: "#7dd3fc",
                fontSize: 13,
                marginBottom: 6,
              }}
            >
              Forum Avatar
            </label>
            <input
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              style={{
                width: "100%",
                padding: "8px 0",
                color: "#e2e8f0",
                background: "rgba(2,6,23,0.6)",
                border: "none",
              }}
            />
          </div>
          {avatarUrl && (
            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <img
                src={avatarUrl}
                alt="Forum Avatar"
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #7dd3fc",
                  background: "#0e172a",
                  margin: "0 auto",
                }}
              />
            </div>
          )}
          <button
            type="submit"
            disabled={saving}
            style={{
              width: "100%",
              padding: "12px 0",
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.5)",
              background: saving
                ? "rgba(100,116,139,0.25)"
                : "rgba(56,189,248,0.2)",
              color: "#7dd3fc",
              fontWeight: 700,
              fontSize: 14,
              cursor: saving ? "not-allowed" : "pointer",
              marginBottom: 4,
            }}
          >
            {saving ? "Saving..." : "Save"}
          </button>
          {msg && (
            <div
              style={{
                marginTop: 10,
                color: msg === "Profile updated!" ? "#86efac" : "#fb7185",
                fontSize: 13,
                textAlign: "center",
              }}
            >
              {msg}
            </div>
          )}
        </form>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Link href="/">
            <button
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 8,
                border: "1px solid rgba(56,189,248,0.5)",
                background: "rgba(56,189,248,0.15)",
                color: "#7dd3fc",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                marginBottom: 4,
              }}
            >
              Home
            </button>
          </Link>
          <Link href="/logout">
            <button
              style={{
                width: "100%",
                padding: "12px 0",
                borderRadius: 8,
                border: "1px solid rgba(251,113,133,0.5)",
                background: "rgba(251,113,133,0.13)",
                color: "#fb7185",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </Link>
        </div>
        </div>

        {/* Right Column - My Short Blocks */}
        <div
          style={{
            borderRadius: 18,
            padding: 36,
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(2,6,23,0.85)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            color: "#e2e8f0",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <h2
            style={{
              margin: "0 0 16px 0",
              fontSize: 16,
              fontWeight: 700,
              color: "#7dd3fc",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            My Short Blocks
          </h2>

          {shortBlocks.length > 0 ? (
            <div style={{ marginBottom: 16 }}>
              {shortBlocks.map((block) => (
                <div
                  key={block.id}
                  style={{
                    padding: 12,
                    marginBottom: 10,
                    borderRadius: 8,
                    background: "rgba(2,6,23,0.8)",
                    border: "1px solid rgba(125,211,252,0.2)",
                    color: "#e2e8f0",
                    fontSize: 13,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: 8,
                    }}
                  >
                    <div style={{ fontWeight: 700, color: "#00d4ff" }}>
                      {block.block_name}
                    </div>
                    <button
                      onClick={() => handleDeleteShortBlock(block.id)}
                      style={{
                        padding: "4px 12px",
                        borderRadius: 4,
                        border: "1px solid rgba(251,113,133,0.3)",
                        background: "rgba(251,113,133,0.1)",
                        color: "#fb7185",
                        fontSize: 11,
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </div>
                  {block.engine_make && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Make:</strong> {block.engine_make}
                      {block.engine_family && ` - ${block.engine_family}`}
                    </div>
                  )}
                  {block.displacement && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Displacement:</strong> {block.displacement}
                    </div>
                  )}
                  {block.bore && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Bore:</strong> {block.bore}
                    </div>
                  )}
                  {block.stroke && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Stroke:</strong> {block.stroke}
                    </div>
                  )}
                  {block.deck_height && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Deck Height:</strong> {block.deck_height}
                    </div>
                  )}
                  {block.piston_dome_dish && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Piston:</strong> {block.piston_dome_dish}
                    </div>
                  )}
                  {block.rod_length && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>Rod Length:</strong> {block.rod_length}
                    </div>
                  )}
                  {block.head_gasket_bore && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>HG Bore:</strong> {block.head_gasket_bore}
                    </div>
                  )}
                  {block.head_gasket_compressed_thickness && (
                    <div style={{ color: "rgba(226,232,240,0.75)" }}>
                      <strong>HG Thickness:</strong> {block.head_gasket_compressed_thickness}
                    </div>
                  )}

                  {/* Quick Action Buttons */}
                  <div
                    style={{
                      display: "flex",
                      gap: 8,
                      marginTop: 12,
                      paddingTop: 8,
                      borderTop: "1px solid rgba(125,211,252,0.15)",
                    }}
                  >
                    <button
                      onClick={() => {
                        setSelectedBlockForBuild(block.id);
                        if (block.engine_make && block.engine_family) {
                          loadAvailableCams(block.engine_make, block.engine_family);
                        }
                        setShowNewBuildForm(true);
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: 4,
                        border: "1px solid rgba(56,189,248,0.3)",
                        background: "rgba(56,189,248,0.1)",
                        color: "#7dd3fc",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = "rgba(56,189,248,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = "rgba(56,189,248,0.1)";
                      }}
                    >
                      Link Cams
                    </button>

                    <button
                      onClick={() => {
                        setSelectedBlockForHeadBuild(block.id);
                        handleCreateHeadBuild(block.id);
                      }}
                      style={{
                        flex: 1,
                        padding: "6px 8px",
                        borderRadius: 4,
                        border: "1px solid rgba(56,189,248,0.3)",
                        background: "rgba(56,189,248,0.1)",
                        color: "#7dd3fc",
                        fontSize: 10,
                        fontWeight: 600,
                        cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        (e.target as HTMLButtonElement).style.background = "rgba(56,189,248,0.2)";
                      }}
                      onMouseLeave={(e) => {
                        (e.target as HTMLButtonElement).style.background = "rgba(56,189,248,0.1)";
                      }}
                    >
                      Link Heads
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: "rgba(226,232,240,0.5)",
                fontSize: 13,
                marginBottom: 12,
              }}
            >
              No short blocks yet
            </div>
          )}

          <button
            onClick={() => setShowNewBlockForm(!showNewBlockForm)}
            style={{
              width: "100%",
              padding: "10px 0",
              borderRadius: 8,
              border: "1px solid rgba(56,189,248,0.3)",
              background: "rgba(56,189,248,0.1)",
              color: "#7dd3fc",
              fontWeight: 600,
              fontSize: 13,
              cursor: "pointer",
              marginBottom: 12,
            }}
          >
            {showNewBlockForm ? "Cancel" : "+ Add Short Block"}
          </button>

          {showNewBlockForm && (
            <form onSubmit={handleSaveShortBlock}>
              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Block Name *
                </label>
                <input
                  type="text"
                  value={newBlock.block_name}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, block_name: e.target.value })
                  }
                  placeholder="e.g., Street 302"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Engine Make
                </label>
                <select
                  value={newBlock.engine_make}
                  onChange={(e) =>
                    setNewBlock({
                      ...newBlock,
                      engine_make: e.target.value,
                      engine_family: "",
                    })
                  }
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                >
                  <option value="">Select make...</option>
                  {CAM_MAKE_OPTIONS.map((make) => (
                    <option key={make} value={make}>
                      {make}
                    </option>
                  ))}
                </select>
              </div>

              {newBlock.engine_make && (
                <div style={{ marginBottom: 12 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Engine Family
                  </label>
                  <select
                    value={newBlock.engine_family}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, engine_family: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 6,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 12,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">Select family...</option>
                    {CAM_ENGINE_FAMILIES[
                      newBlock.engine_make as keyof typeof CAM_ENGINE_FAMILIES
                    ]?.map((family) => (
                      <option key={family} value={family}>
                        {family}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Displacement (e.g., 302 ci)
                </label>
                <input
                  type="text"
                  value={newBlock.displacement}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, displacement: e.target.value })
                  }
                  placeholder="302 ci"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Bore
                  </label>
                  <input
                    type="text"
                    value={newBlock.bore}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, bore: e.target.value })
                    }
                    placeholder="e.g., 4.00"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 6,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 12,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 12,
                      marginBottom: 4,
                    }}
                  >
                    Stroke
                  </label>
                  <input
                    type="text"
                    value={newBlock.stroke}
                    onChange={(e) =>
                      setNewBlock({ ...newBlock, stroke: e.target.value })
                    }
                    placeholder="e.g., 3.00"
                    style={{
                      width: "100%",
                      padding: "8px",
                      borderRadius: 6,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 12,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Deck Height
                </label>
                <input
                  type="text"
                  value={newBlock.deck_height}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, deck_height: e.target.value })
                  }
                  placeholder="e.g., 9.000"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Piston Dome/Dish
                </label>
                <input
                  type="text"
                  value={newBlock.piston_dome_dish}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, piston_dome_dish: e.target.value })
                  }
                  placeholder="e.g., -14cc Dish"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Head Gasket Bore
                </label>
                <input
                  type="text"
                  value={newBlock.head_gasket_bore}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, head_gasket_bore: e.target.value })
                  }
                  placeholder="e.g., 4.06"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Head Gasket Compressed Thickness
                </label>
                <input
                  type="text"
                  value={newBlock.head_gasket_compressed_thickness}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, head_gasket_compressed_thickness: e.target.value })
                  }
                  placeholder="e.g., 0.04"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 12 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 12,
                    marginBottom: 4,
                  }}
                >
                  Rod Length
                </label>
                <input
                  type="text"
                  value={newBlock.rod_length}
                  onChange={(e) =>
                    setNewBlock({ ...newBlock, rod_length: e.target.value })
                  }
                  placeholder="e.g., 5.956"
                  style={{
                    width: "100%",
                    padding: "8px",
                    borderRadius: 6,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 12,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={savingBlock}
                style={{
                  width: "100%",
                  padding: "10px 0",
                  borderRadius: 8,
                  border: "1px solid rgba(56,189,248,0.5)",
                  background: savingBlock
                    ? "rgba(100,116,139,0.25)"
                    : "rgba(56,189,248,0.2)",
                  color: "#7dd3fc",
                  fontWeight: 700,
                  fontSize: 12,
                  cursor: savingBlock ? "not-allowed" : "pointer",
                }}
              >
                {savingBlock ? "Saving..." : "Save Block"}
              </button>
            </form>
          )}
        </div>

        {/* My Cams Section - Inside My Short Blocks */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(56,189,248,0.25)",
            background: "rgba(0,212,255,0.03)",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: 14,
              fontWeight: 700,
              color: "#7dd3fc",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            My Cams
          </h2>

          {camBuilds.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              {camBuilds.map((build) => {
                const blockName = shortBlocks.find((b) => b.id === build.short_block_id)?.block_name || "Unknown Block";
                const block = shortBlocks.find((b) => b.id === build.short_block_id);
                
                return (
                  <div
                    key={build.id}
                    style={{
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 8,
                      background: "rgba(2,6,23,0.8)",
                      border: "1px solid rgba(125,211,252,0.15)",
                      color: "#e2e8f0",
                      fontSize: 12,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#00d4ff", fontSize: 11 }}>
                        {blockName}
                      </div>
                      <button
                        onClick={() => handleDeleteCamBuild(build.id)}
                        style={{
                          padding: "3px 10px",
                          borderRadius: 4,
                          border: "1px solid rgba(251,113,133,0.3)",
                          background: "rgba(251,113,133,0.1)",
                          color: "#fb7185",
                          fontSize: 10,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>

                    {[1, 2, 3].map((slot) => {
                      const camIdKey = `cam${slot}_id` as any;
                      const camKey = `cam${slot}` as any;
                      const currentCamId = build[camIdKey];
                      const currentCam = build[camKey];

                      return (
                        <div
                          key={`cam-slot-${slot}`}
                          style={{
                            padding: 6,
                            marginBottom: 6,
                            borderRadius: 4,
                            background: "rgba(0,212,255,0.05)",
                            border: "1px solid rgba(0,212,255,0.1)",
                            fontSize: 10,
                          }}
                        >
                          <div style={{ color: "rgba(226,232,240,0.6)", marginBottom: 3 }}>
                            Cam {slot}: {currentCam?.brand || "—"} {currentCam?.cam_name || "None"}
                          </div>
                          <select
                            value={currentCamId || ""}
                            onChange={(e) => handleUpdateCamBuild(build.id, slot, e.target.value || null)}
                            onFocus={() => {
                              // Load available cams when user focuses on the select
                              if (block && block.engine_make && block.engine_family) {
                                loadAvailableCams(block.engine_make, block.engine_family);
                              }
                            }}
                            style={{
                              width: "100%",
                              padding: "4px 6px",
                              borderRadius: 3,
                              border: "1px solid rgba(125,211,252,0.15)",
                              background: "rgba(2,6,23,0.6)",
                              color: "#e2e8f0",
                              fontSize: 10,
                              fontFamily: "monospace",
                              cursor: "pointer",
                            }}
                          >
                            <option value="">-- Select --</option>
                            {availableCams.map((cam) => (
                              <option key={cam.id} value={cam.id}>
                                {cam.brand} {cam.cam_name}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: 8,
                textAlign: "center",
                color: "rgba(226,232,240,0.5)",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              No cam builds yet
            </div>
          )}

          {shortBlocks.length > 0 && (
            <div>
              <p style={{ fontSize: 11, color: "rgba(226,232,240,0.6)", marginBottom: 6 }}>
                Create cam build:
              </p>
              <select
                value={selectedBlockForBuild}
                onChange={(e) => {
                  const blockId = e.target.value;
                  setSelectedBlockForBuild(blockId);
                  if (blockId) {
                    const block = shortBlocks.find((b) => b.id === blockId);
                    if (block && block.engine_make && block.engine_family) {
                      loadAvailableCams(block.engine_make, block.engine_family);
                    }
                  }
                }}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: 4,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e2e8f0",
                  fontSize: 11,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: 6,
                }}
              >
                <option value="">-- Select block --</option>
                {shortBlocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedBlockForBuild) {
                    handleCreateCamBuild(selectedBlockForBuild);
                  } else {
                    alert("Please select a short block");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "1px solid rgba(56,189,248,0.3)",
                  background: "rgba(56,189,248,0.1)",
                  color: "#7dd3fc",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                + Create Build
              </button>
            </div>
          )}
        </div>

        {/* My Heads Section - Inside My Short Blocks */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(56,189,248,0.25)",
            background: "rgba(0,212,255,0.03)",
          }}
        >
          <h2
            style={{
              margin: "0 0 12px 0",
              fontSize: 14,
              fontWeight: 700,
              color: "#7dd3fc",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            My Heads
          </h2>

          {headBuilds.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              {headBuilds.map((build) => {
                const blockName = shortBlocks.find((b) => b.id === build.short_block_id)?.block_name || "Unknown Block";
                const block = shortBlocks.find((b) => b.id === build.short_block_id);
                const head = build.cylinder_heads;
                const currentHeadId = build.head_id;
                
                return (
                  <div
                    key={build.id}
                    style={{
                      padding: 10,
                      marginBottom: 8,
                      borderRadius: 6,
                      background: "rgba(2,6,23,0.95)",
                      border: "1px solid rgba(125,211,252,0.15)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "start",
                        marginBottom: 6,
                      }}
                    >
                      <div style={{ fontWeight: 700, color: "#00d4ff", fontSize: 12 }}>
                        {blockName}
                      </div>
                      <button
                        onClick={() => handleDeleteHeadBuild(build.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          borderRadius: 3,
                          border: "1px solid rgba(251,113,133,0.3)",
                          background: "rgba(251,113,133,0.1)",
                          color: "#fb7185",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    </div>
                    
                    <div
                      style={{
                        padding: 6,
                        marginBottom: 8,
                        borderRadius: 4,
                        background: "rgba(0,212,255,0.05)",
                        border: "1px solid rgba(0,212,255,0.1)",
                        fontSize: 10,
                      }}
                    >
                      <div style={{ color: "rgba(226,232,240,0.6)", marginBottom: 3 }}>
                        Head: {head?.brand || "—"} {head?.part_number || "None"}
                      </div>
                      <select
                        value={currentHeadId || ""}
                        onFocus={() => {
                          if (block && block.engine_make && block.engine_family) {
                            loadAvailableHeads(block.engine_make, block.engine_family);
                          }
                        }}
                        onChange={(e) => handleUpdateHeadBuild(build.id, e.target.value || null)}
                        style={{
                          width: "100%",
                          padding: "4px 6px",
                          borderRadius: 3,
                          border: "1px solid rgba(125,211,252,0.15)",
                          background: "rgba(2,6,23,0.6)",
                          color: "#e2e8f0",
                          fontSize: 10,
                          fontFamily: "monospace",
                          cursor: "pointer",
                        }}
                      >
                        <option value="">-- Select --</option>
                        {availableHeads.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.brand} {h.part_number}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {head && (
                      <>
                        {head.chamber_cc && (
                          <div style={{ color: "rgba(226,232,240,0.75)", fontSize: 11 }}>
                            <strong>Chamber:</strong> {head.chamber_cc}cc
                          </div>
                        )}
                        {head.intake_runner_cc && (
                          <div style={{ color: "rgba(226,232,240,0.75)", fontSize: 11 }}>
                            <strong>Intake:</strong> {head.intake_runner_cc}cc
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: "rgba(226,232,240,0.5)",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              No head builds yet
            </div>
          )}

          {showNewHeadBuildForm && (
            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: "rgba(2,6,23,0.95)",
                border: "1px solid rgba(56,189,248,0.2)",
              }}
            >
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  color: "#7dd3fc",
                  fontSize: 11,
                  marginBottom: 6,
                }}
              >
                Select Cylinder Head for {shortBlocks.find((b) => b.id === selectedBlockForHeadBuild)?.block_name}
              </label>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleAddHeadToBlock(selectedBlockForHeadBuild, e.target.value);
                  }
                }}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: 4,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e2e8f0",
                  fontSize: 11,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: 6,
                }}
              >
                <option value="">-- Select --</option>
                {availableHeads.map((head) => (
                  <option key={head.id} value={head.id}>
                    {head.brand} {head.part_number}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowNewHeadBuildForm(false)}
                style={{
                  width: "100%",
                  padding: "6px 0",
                  borderRadius: 4,
                  border: "1px solid rgba(251,113,133,0.3)",
                  background: "rgba(251,113,133,0.1)",
                  color: "#fb7185",
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {!showNewHeadBuildForm && (
            <div>
              <select
                value={selectedBlockForHeadBuild}
                onChange={(e) => setSelectedBlockForHeadBuild(e.target.value)}
                style={{
                  width: "100%",
                  padding: "6px",
                  borderRadius: 4,
                  border: "1px solid rgba(148,163,184,0.3)",
                  background: "rgba(2,6,23,0.6)",
                  color: "#e2e8f0",
                  fontSize: 11,
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  marginBottom: 6,
                }}
              >
                <option value="">-- Select block --</option>
                {shortBlocks.map((block) => (
                  <option key={block.id} value={block.id}>
                    {block.block_name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedBlockForHeadBuild) {
                    handleCreateHeadBuild(selectedBlockForHeadBuild);
                  } else {
                    alert("Please select a short block");
                  }
                }}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "1px solid rgba(56,189,248,0.3)",
                  background: "rgba(56,189,248,0.1)",
                  color: "#7dd3fc",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                }}
              >
                + Add Head
              </button>
            </div>
          )}
        </div>

        {/* My Engines Section */}
        <div
          style={{
            marginTop: 20,
            padding: 16,
            borderRadius: 12,
            border: "1px solid rgba(56,189,248,0.25)",
            background: "rgba(0,212,255,0.03)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: "#7dd3fc",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
              }}
            >
              My Engines
            </h2>
            <button
              onClick={() => setShowNewEngineForm(!showNewEngineForm)}
              style={{
                padding: "4px 10px",
                fontSize: 11,
                borderRadius: 4,
                border: "1px solid rgba(56,189,248,0.3)",
                background: "rgba(56,189,248,0.1)",
                color: "#7dd3fc",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {showNewEngineForm ? "Cancel" : "+ Submit Engine"}
            </button>
          </div>

          {engineSubmissions.length > 0 ? (
            <div style={{ marginBottom: 12 }}>
              {engineSubmissions.map((engine) => (
                <div
                  key={engine.id}
                  style={{
                    padding: 12,
                    marginBottom: 10,
                    borderRadius: 8,
                    background: "rgba(2,6,23,0.95)",
                    border: "1px solid rgba(125,211,252,0.15)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "start",
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, color: "#00d4ff", fontSize: 13 }}>
                        {engine.engine_name}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color:
                            engine.status === "approved"
                              ? "#10b981"
                              : engine.status === "rejected"
                              ? "#ef4444"
                              : "#f59e0b",
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        {engine.status.toUpperCase()}
                      </div>
                    </div>
                    {engine.status === "pending" && (
                      <button
                        onClick={() => handleDeleteEngineSubmission(engine.id)}
                        style={{
                          padding: "4px 8px",
                          fontSize: 10,
                          borderRadius: 3,
                          border: "1px solid rgba(251,113,133,0.3)",
                          background: "rgba(251,113,133,0.1)",
                          color: "#fb7185",
                          cursor: "pointer",
                        }}
                      >
                        Delete
                      </button>
                    )}
                  </div>

                  <div style={{ color: "rgba(226,232,240,0.75)", fontSize: 11, marginBottom: 6 }}>
                    <strong>Block:</strong> {engine.user_short_blocks?.block_name}
                  </div>

                  {engine.cylinder_heads && (
                    <div style={{ color: "rgba(226,232,240,0.75)", fontSize: 11, marginBottom: 6 }}>
                      <strong>Head:</strong> {engine.cylinder_heads.brand} {engine.cylinder_heads.part_number}
                    </div>
                  )}

                  {engine.description && (
                    <div style={{ color: "rgba(226,232,240,0.75)", fontSize: 11, marginBottom: 6 }}>
                      <strong>Description:</strong> {engine.description}
                    </div>
                  )}

                  {engine.status === "rejected" && engine.rejection_reason && (
                    <div
                      style={{
                        color: "#ef4444",
                        fontSize: 10,
                        marginBottom: 6,
                        padding: "6px 8px",
                        background: "rgba(239,68,68,0.1)",
                        borderRadius: 4,
                      }}
                    >
                      <strong>Rejection Reason:</strong> {engine.rejection_reason}
                    </div>
                  )}

                  <div style={{ fontSize: 10, color: "rgba(226,232,240,0.5)" }}>
                    Submitted {new Date(engine.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: 12,
                textAlign: "center",
                color: "rgba(226,232,240,0.5)",
                fontSize: 11,
                marginBottom: 8,
              }}
            >
              No engine submissions yet
            </div>
          )}

          {showNewEngineForm && (
            <form
              onSubmit={handleCreateEngineSubmission}
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 8,
                background: "rgba(2,6,23,0.95)",
                border: "1px solid rgba(56,189,248,0.2)",
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  Engine Name *
                </label>
                <input
                  type="text"
                  value={newEngine.engine_name}
                  onChange={(e) => setNewEngine({ ...newEngine, engine_name: e.target.value })}
                  placeholder="e.g., 427 Stroker Build"
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  Short Block *
                </label>
                <select
                  value={newEngine.short_block_id}
                  onChange={(e) => setNewEngine({ ...newEngine, short_block_id: e.target.value })}
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    marginBottom: 8,
                  }}
                >
                  <option value="">-- Select --</option>
                  {shortBlocks.map((block) => (
                    <option key={block.id} value={block.id}>
                      {block.block_name} ({block.displacement})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <label
                    style={{
                      display: "block",
                      fontWeight: 600,
                      color: "#7dd3fc",
                      fontSize: 11,
                      marginBottom: 3,
                    }}
                  >
                    Cylinder Head
                  </label>
                  <select
                    value={newEngine.head_id}
                    onChange={(e) => setNewEngine({ ...newEngine, head_id: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "6px",
                      borderRadius: 4,
                      border: "1px solid rgba(148,163,184,0.3)",
                      background: "rgba(2,6,23,0.6)",
                      color: "#e2e8f0",
                      fontSize: 11,
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                    }}
                  >
                    <option value="">-- Optional --</option>
                    {/* Load approved heads */}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  Description
                </label>
                <textarea
                  value={newEngine.description}
                  onChange={(e) => setNewEngine({ ...newEngine, description: e.target.value })}
                  placeholder="Describe your engine build..."
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    minHeight: "60px",
                  }}
                />
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  Dyno Sheet (PDF or Image) *
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setEngineFiles({ ...engineFiles, dyno_sheet: e.target.files?.[0] || null })
                  }
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                {engineFiles.dyno_sheet && (
                  <div style={{ color: "#7dd3fc", fontSize: 10, marginTop: 4 }}>
                    ✓ {engineFiles.dyno_sheet.name}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  Cam Card (Optional)
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) =>
                    setEngineFiles({ ...engineFiles, cam_card: e.target.files?.[0] || null })
                  }
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                {engineFiles.cam_card && (
                  <div style={{ color: "#7dd3fc", fontSize: 10, marginTop: 4 }}>
                    ✓ {engineFiles.cam_card.name}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: 10 }}>
                <label
                  style={{
                    display: "block",
                    fontWeight: 600,
                    color: "#7dd3fc",
                    fontSize: 11,
                    marginBottom: 3,
                  }}
                >
                  Notes
                </label>
                <textarea
                  value={newEngine.notes}
                  onChange={(e) => setNewEngine({ ...newEngine, notes: e.target.value })}
                  placeholder="Any additional notes about the build..."
                  style={{
                    width: "100%",
                    padding: "6px",
                    borderRadius: 4,
                    border: "1px solid rgba(148,163,184,0.3)",
                    background: "rgba(2,6,23,0.6)",
                    color: "#e2e8f0",
                    fontSize: 11,
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    minHeight: "50px",
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={savingEngine}
                style={{
                  width: "100%",
                  padding: "8px 0",
                  borderRadius: 6,
                  border: "1px solid rgba(56,189,248,0.3)",
                  background: "rgba(56,189,248,0.1)",
                  color: "#7dd3fc",
                  fontWeight: 600,
                  fontSize: 11,
                  cursor: "pointer",
                  opacity: savingEngine ? 0.6 : 1,
                }}
              >
                {savingEngine ? "Submitting..." : "+ Submit Engine"}
              </button>
            </form>
          )}
        </div>

        {/* My Dyno Submissions Section */}
        <div
          style={{
            gridColumn: "1 / -1",
            borderRadius: 18,
            padding: 36,
            border: "1px solid rgba(56,189,248,0.35)",
            background: "rgba(2,6,23,0.85)",
            boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            color: "#e2e8f0",
            fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
          }}
        >
          <h2
            style={{
              margin: "0 0 20px 0",
              fontSize: 18,
              fontWeight: 700,
              color: "#7dd3fc",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
            }}
          >
            My Dyno Wars Submissions
          </h2>
          {user?.id && <UserDynoSubmissions userId={user.id} />}
        </div>

        {/* Awards & Tokens Section */}
        {user?.id && (
          <div
            style={{
              gridColumn: "1 / -1",
              borderRadius: 18,
              padding: 36,
              border: "1px solid rgba(56,189,248,0.35)",
              background: "rgba(2,6,23,0.85)",
              boxShadow: "0 18px 50px rgba(0,0,0,0.6)",
            }}
          >
            <UserAwardsProfile userId={user.id} isOwnProfile={true} />
          </div>
        )}
      </div>
    </main>
  );
}


