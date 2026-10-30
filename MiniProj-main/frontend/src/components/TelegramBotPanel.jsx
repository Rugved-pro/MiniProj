import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useAuthContext } from "../context/AuthContext";
import { env_data } from "../data/Rainfall_Soil.json";
import {
    FaTelegramPlane,
    FaCheckCircle,
    FaQrcode,
    FaSyncAlt,
    FaPaperPlane,
    FaCopy,
    FaUnlink,
    FaCog,
    FaExternalLinkAlt
} from "react-icons/fa";
import { MdLocationOn, MdPhoneIphone } from "react-icons/md";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const DISTRICTS = Array.isArray(env_data)
    ? env_data.map((d) => d.District).sort()
    : ["PUNE", "BANKURA", "NASHIK", "NAGPUR", "KOLKATA", "HOOGHLY", "HOWRAH"];

const TelegramBotPanel = ({ compact = false }) => {
    const { authUser } = useAuthContext();
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);
    const [sendingReport, setSendingReport] = useState(false);
    const [updatingDistrict, setUpdatingDistrict] = useState(false);
    const [selectedDistrict, setSelectedDistrict] = useState("PUNE");
    const [showTokenConfig, setShowTokenConfig] = useState(false);
    const [tokenInput, setTokenInput] = useState("");
    const [savingToken, setSavingToken] = useState(false);
    const [showQr, setShowQr] = useState(false);

    const fetchBotStatus = useCallback(async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const userId = authUser?._id || "";
            const res = await fetch(`${API_URL}/telegram/status?userId=${encodeURIComponent(userId)}`);
            if (res.ok) {
                const data = await res.json();
                setStatus(data);
                if (data.district) {
                    setSelectedDistrict(data.district);
                }
            }
        } catch (err) {
            console.error("Failed to load Telegram bot status:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [authUser?._id]);

    useEffect(() => {
        fetchBotStatus(false);
        // Poll every 6 seconds while unlinked so UI auto-updates as soon as farmer taps Start on phone
        const interval = setInterval(() => {
            fetchBotStatus(true);
        }, 6000);
        return () => clearInterval(interval);
    }, [fetchBotStatus]);

    const handleCopy = (text, label = "Command") => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard!`);
    };

    const handleSendReportToPhone = async () => {
        if (!authUser?._id) {
            toast.error("Please log in to send your field report");
            return;
        }
        setSendingReport(true);
        try {
            const res = await fetch(`${API_URL}/telegram/send-report`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: authUser._id,
                    district: selectedDistrict
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Could not send report to Telegram");
            }
            toast.success("Field intelligence report sent to your phone on Telegram!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSendingReport(false);
        }
    };

    const handleDistrictChange = async (newDistrict) => {
        setSelectedDistrict(newDistrict);
        if (!authUser?._id) return;
        setUpdatingDistrict(true);
        try {
            const res = await fetch(`${API_URL}/telegram/district`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId: authUser._id,
                    district: newDistrict
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Failed to update district");
            }
            setStatus((prev) => ({ ...prev, ...data }));
            toast.success(`Active field district updated to ${newDistrict}`);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setUpdatingDistrict(false);
        }
    };

    const handleUnlink = async () => {
        if (!authUser?._id) return;
        try {
            const res = await fetch(`${API_URL}/telegram/unlink`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ userId: authUser._id })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus(data);
                toast.success("Telegram account unlinked");
            }
        } catch {
            toast.error("Failed to unlink Telegram account");
        }
    };

    const handleSaveBotToken = async (e) => {
        e.preventDefault();
        if (!tokenInput.trim()) return;
        setSavingToken(true);
        try {
            const res = await fetch(`${API_URL}/telegram/configure`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token: tokenInput.trim(),
                    userId: authUser?._id || ""
                })
            });
            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || "Invalid BotFather token");
            }
            setStatus(data);
            setTokenInput("");
            setShowTokenConfig(false);
            toast.success(data.message || "Telegram Bot connected!");
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSavingToken(false);
        }
    };

    const botUsername = status?.botInfo?.username || "Kisan_Ceres_Bot";
    const deepLink = status?.deepLink || `https://t.me/${botUsername}`;
    const linkCommand = authUser?.phoneno ? `/link ${authUser.phoneno}` : `/start`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&margin=8&data=${encodeURIComponent(deepLink)}`;

    if (loading && !status) {
        return (
            <div className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-2xl p-6 shadow-sm animate-pulse">
                <div className="h-5 w-48 bg-[#E8D2B5]/50 rounded mb-2"></div>
                <div className="h-4 w-72 bg-[#E8D2B5]/30 rounded"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#FDFBF7] border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-7 shadow-sm text-[#1C1E1B]">
            {/* Header Row */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#A5A79B]/25">
                <div className="flex items-start sm:items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-[#229ED9] text-white flex items-center justify-center text-2xl shrink-0 shadow-sm">
                        <FaTelegramPlane />
                    </div>
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-bold font-serif text-[#1C1E1B]">
                                Telegram Field Bot — Direct Phone Access
                            </h2>
                            {status?.botOnline ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-ping"></span>
                                    @{botUsername} Online
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                    Setup Ready
                                </span>
                            )}
                            {status?.userLinked && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#229ED9]/15 text-[#0077b5] border border-[#229ED9]/30">
                                    <FaCheckCircle className="text-xs" />
                                    Phone Linked
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-[#545850] mt-1">
                            Access live microclimate weather, FAO-56 soil &amp; irrigation rules, leaf photo disease diagnosis, and AI crop guidance directly on your phone via Telegram.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-center">
                    <button
                        type="button"
                        onClick={() => fetchBotStatus(false)}
                        className="p-2 rounded-lg border border-[#A5A79B]/40 text-[#545850] hover:text-[#1C1E1B] hover:bg-[#F7EFE4] transition"
                        title="Refresh Telegram link status"
                    >
                        <FaSyncAlt className={`text-xs ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button
                        type="button"
                        onClick={() => setShowTokenConfig((v) => !v)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#A5A79B]/40 text-xs font-semibold text-[#545850] hover:text-[#1C1E1B] hover:bg-[#F7EFE4] transition"
                        title="Configure BotFather API Token"
                    >
                        <FaCog className="text-xs" />
                        <span>BotFather Settings</span>
                    </button>
                </div>
            </div>

            {/* Collapsible BotFather Token Configuration */}
            {showTokenConfig && (
                <form
                    onSubmit={handleSaveBotToken}
                    className="mt-4 p-4 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/40"
                >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <strong className="text-xs font-bold text-[#1C1E1B]">
                            Telegram BotFather API Token Configuration
                        </strong>
                        <span className="text-[11px] text-[#545850]">
                            Current Bot: <strong>@{botUsername}</strong>
                        </span>
                    </div>
                    <p className="text-xs text-[#545850] mb-3">
                        Created a bot with <a href="https://t.me/BotFather" target="_blank" rel="noreferrer" className="text-[#0077b5] underline font-semibold">@BotFather</a>? Paste your HTTP API token below to switch or reload the active bot without restarting the server.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            value={tokenInput}
                            onChange={(e) => setTokenInput(e.target.value)}
                            placeholder=" s2"
                            className="flex-1 px-3 py-2 text-xs rounded-lg border border-[#A5A79B]/50 bg-white text-[#1C1E1B] focus:outline-none focus:border-[#229ED9]"
                        />
                        <button
                            type="submit"
                            disabled={savingToken || !tokenInput.trim()}
                            className="px-4 py-2 rounded-lg bg-[#229ED9] text-white text-xs font-semibold hover:bg-[#1b86ba] disabled:opacity-50 transition"
                        >
                            {savingToken ? "Connecting..." : "Save & Activate Bot"}
                        </button>
                    </div>
                </form>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-5">
                {/* Left Column: Connect & Actions */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-4">
                    {status?.userLinked ? (
                        <div className="p-4 rounded-xl bg-emerald-50/90 border border-emerald-200">
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex items-start gap-2.5">
                                    <FaCheckCircle className="text-emerald-600 text-lg shrink-0 mt-0.5" />
                                    <div>
                                        <strong className="text-xs font-bold text-emerald-950 block">
                                            Connected to Your Phone ({status.telegramUsername ? `@${status.telegramUsername}` : `Chat #${status.telegramChatId}`})
                                        </strong>
                                        <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                                            Your farmer profile (<strong>{authUser?.name}</strong> • {authUser?.phoneno}) and crops (<strong>{authUser?.crops?.join(", ") || "All"}</strong>) are synced with <strong>@{botUsername}</strong>.
                                        </p>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleUnlink}
                                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 hover:underline shrink-0"
                                    title="Unlink Telegram Chat"
                                >
                                    <FaUnlink />
                                    <span>Unlink</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-xl bg-[#F7EFE4] border border-[#A5A79B]/35">
                            <div className="flex items-start gap-2.5">
                                <MdPhoneIphone className="text-xl text-[#590907] shrink-0 mt-0.5" />
                                <div className="w-full">
                                    <strong className="text-xs font-bold text-[#1C1E1B] block">
                                        Link Your Farmer Account in 1 Click
                                    </strong>
                                    <p className="text-xs text-[#545850] mt-0.5 mb-3">
                                        Click <strong>Open in Telegram</strong> below and press <strong>Start</strong>, or send this command to <strong>@{botUsername}</strong> from your phone:
                                    </p>
                                    <div className="flex items-center justify-between gap-2 bg-white border border-[#A5A79B]/40 rounded-lg px-3 py-2">
                                        <code className="text-xs font-mono font-bold text-[#590907]">
                                            {linkCommand}
                                        </code>
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(linkCommand, "Link command")}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-[#229ED9] hover:underline"
                                        >
                                            <FaCopy />
                                            <span>Copy</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* District Selector & Action Buttons */}
                    <div className="p-4 rounded-xl bg-[#F7EFE4]/70 border border-[#A5A79B]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <MdLocationOn className="text-lg text-[#590907] shrink-0" />
                            <div>
                                <label htmlFor="telegram-district-select" className="text-xs font-bold text-[#1C1E1B] block">
                                    Active Field District for Phone Reports
                                </label>
                                <span className="text-[11px] text-[#545850]">
                                    Used for soil NPK/pH, rainfall &amp; live microclimate risk
                                </span>
                            </div>
                        </div>
                        <select
                            id="telegram-district-select"
                            value={selectedDistrict}
                            disabled={updatingDistrict}
                            onChange={(e) => handleDistrictChange(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-[#A5A79B]/50 bg-white text-xs font-semibold text-[#1C1E1B] focus:outline-none focus:border-[#590907]"
                        >
                            {DISTRICTS.map((d) => (
                                <option key={d} value={d}>
                                    {d}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Primary CTA Buttons */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        <a
                            href={deepLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#229ED9] text-white font-semibold text-xs shadow hover:bg-[#1b86ba] transition no-underline"
                        >
                            <FaTelegramPlane className="text-sm" />
                            <span>{status?.userLinked ? `Open @${botUsername}` : `Connect @${botUsername} on Telegram`}</span>
                            <FaExternalLinkAlt className="text-[10px] opacity-80" />
                        </a>

                        <button
                            type="button"
                            onClick={handleSendReportToPhone}
                            disabled={sendingReport || !status?.userLinked}
                            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] disabled:opacity-50 transition"
                            title={status?.userLinked ? "Push live field summary to your Telegram phone" : "Link your Telegram account first to push reports"}
                        >
                            <FaPaperPlane className="text-xs" />
                            <span>{sendingReport ? "Sending to Phone..." : "Send Field Report to Phone"}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowQr((v) => !v)}
                            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-[#FDFBF7] text-[#1C1E1B] border border-[#A5A79B]/50 font-semibold text-xs hover:border-[#229ED9] hover:text-[#229ED9] transition"
                        >
                            <FaQrcode className="text-sm" />
                            <span>{showQr ? "Hide QR Code" : "Scan QR with Phone"}</span>
                        </button>
                    </div>

                    {showQr && (
                        <div className="p-4 rounded-xl bg-white border border-[#A5A79B]/40 flex flex-col sm:flex-row items-center gap-4">
                            <img
                                src={qrUrl}
                                alt="Scan to open Kisan Ceres Telegram Bot"
                                className="w-36 h-36 rounded-lg border border-[#A5A79B]/30 p-1 bg-white shrink-0"
                            />
                            <div className="text-xs text-[#545850] space-y-1.5">
                                <strong className="text-sm text-[#1C1E1B] block">
                                    Scan with Your Phone Camera
                                </strong>
                                <p>
                                    1. Point your phone camera or Telegram QR scanner at this code.
                                </p>
                                <p>
                                    2. Tap <strong>Start</strong> inside <strong>@{botUsername}</strong> to automatically link <strong>{authUser?.name || "your account"}</strong>.
                                </p>
                                <p className="text-[11px] text-[#590907] font-semibold">
                                    Auto-Link Code: <code>{status?.linkCode || "READY"}</code>
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Phone Commands & Capabilities Cheat-Sheet */}
                {!compact && (
                    <div className="lg:col-span-5 bg-[#F7EFE4] border border-[#A5A79B]/35 rounded-xl p-4 flex flex-col justify-between">
                        <div>
                            <strong className="text-xs font-bold uppercase tracking-wider text-[#590907] block mb-2.5">
                                What Farmers Can Do on Telegram
                            </strong>
                            <ul className="space-y-2 text-xs text-[#1C1E1B]">
                                <li className="flex items-start gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-white border border-[#A5A79B]/40 font-mono text-[11px] text-[#590907] shrink-0">
                                        /myfield
                                    </code>
                                    <span className="text-[#545850]">
                                        Complete field report: soil N-P-K &amp; pH, rainfall departure, live weather &amp; latest leaf scan.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-white border border-[#A5A79B]/40 font-mono text-[11px] text-[#590907] shrink-0">
                                        /weather
                                    </code>
                                    <span className="text-[#545850]">
                                        Live Open-Meteo temperature, humidity &amp; fungal spore germination alert.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-white border border-[#A5A79B]/40 font-mono text-[11px] text-[#590907] shrink-0">
                                        /soil Wheat 19
                                    </code>
                                    <span className="text-[#545850]">
                                        FAO-56 root-zone depletion check (Irrigate Now vs. Postpone Irrigation).
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-white border border-[#A5A79B]/40 font-mono text-[11px] text-[#590907] shrink-0">
                                        /history
                                    </code>
                                    <span className="text-[#545850]">
                                        View your recent crop disease diagnoses and recommended fungicides.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-white border border-[#A5A79B]/40 font-mono text-[11px] text-[#590907] shrink-0">
                                        📷 Photo
                                    </code>
                                    <span className="text-[#545850]">
                                        Send a leaf photo from your phone camera for instant ViT disease detection.
                                    </span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <code className="px-1.5 py-0.5 rounded bg-white border border-[#A5A79B]/40 font-mono text-[11px] text-[#590907] shrink-0">
                                        💬 AI Chat
                                    </code>
                                    <span className="text-[#545850]">
                                        Ask any question in English, Hindi, or Marathi grounded in your field data.
                                    </span>
                                </li>
                            </ul>
                        </div>

                        <div className="mt-4 pt-3 border-t border-[#A5A79B]/25 flex items-center justify-between text-[11px] text-[#545850]">
                            <span>Bot Handle: <strong>@{botUsername}</strong></span>
                            <button
                                type="button"
                                onClick={() => handleCopy(`https://t.me/${botUsername}`, "Bot link")}
                                className="text-[#229ED9] font-semibold hover:underline"
                            >
                                Copy Bot Link
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TelegramBotPanel;
