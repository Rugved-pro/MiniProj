import { useState, useRef, useEffect } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import CeresLogo from "../../components/CeresLogo";
import { useFarmContext } from "../../context/FarmContext";
import toast from "react-hot-toast";
import {
    IoSend,
    IoCopyOutline,
    IoCheckmark,
    IoRefreshOutline,
    IoSparklesOutline,
    IoImageOutline,
    IoCloseCircle
} from "react-icons/io5";
import { RiPlantLine, RiDropLine, RiFundsLine } from "react-icons/ri";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const SUGGESTIONS_BY_LANG = {
    en: [
        "Should I water my crop today based on current soil readings?",
        "My crop leaves have developed small yellow/brown spots.",
        "Which fertilizer does my soil need during this growth stage?",
        "What are the current mandi rates for my crop nearby?",
        "What tasks should I prioritize in my field this week?"
    ],
    hi: [
        "क्या मुझे वर्तमान नमी के आधार पर आज फसल को पानी देना चाहिए?",
        "मेरी फसल की पत्तियों पर छोटे पीले और भूरे धब्बे दिखाई दे रहे हैं।",
        "इस विकास चरण में मेरी मिट्टी को किस उर्वरक (खाद) की आवश्यकता है?",
        "आसपास की मंडियों में मेरी फसल का वर्तमान भाव क्या है?",
        "इस सप्ताह मुझे अपने खेत में किन कार्यों को प्राथमिकता देनी चाहिए?"
    ],
    mr: [
        "सध्याच्या जमिनीतील ओलाव्यानुसार मी आज पिकाला पाणी द्यावे का?",
        "माझ्या पिकाच्या पानांवर पिवळे आणि तपकिरी ठिपके दिसत आहेत.",
        "सध्याच्या वाढीच्या टप्प्यावर माझ्या जमिनीला कोणत्या खताची गरज आहे?",
        "जवळच्या बाजार समितीत माझ्या पिकाचा चालू बाजारभाव काय आहे?",
        "या आठवड्यात शेतात कोणती कामे प्राधान्याने करावीत?"
    ]
};

export default function AssistantPage() {
    const { activePlot, farmProfile } = useFarmContext();

    const [language, setLanguage] = useState(farmProfile?.preferredLanguage || "en");
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [attachedImage, setAttachedImage] = useState(null);
    const [copiedIndex, setCopiedIndex] = useState(null);

    const messageListRef = useRef(null);
    const fileInputRef = useRef(null);

    // Auto-scroll
    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, isSending]);

    const handleCopy = (text, idx) => {
        navigator.clipboard.writeText(text);
        setCopiedIndex(idx);
        toast.success("Answer copied to clipboard");
        setTimeout(() => setCopiedIndex(null), 2000);
    };

    const handleClearChat = () => {
        setMessages([]);
        toast.success("New conversation started");
    };

    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image size must be less than 5MB");
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setAttachedImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const sendMessage = async (overrideText = null) => {
        const text = (overrideText !== null ? overrideText : input).trim();
        if ((!text && !attachedImage) || isSending) return;

        let contentToSend = text;
        if (attachedImage) {
            contentToSend = `${text}\n[Farmer attached a crop leaf photo for inspection]`;
        }

        const newMessages = [...messages, { role: "user", content: contentToSend, image: attachedImage }];
        setMessages(newMessages);
        setInput("");
        setAttachedImage(null);
        setIsSending(true);

        try {
            const token = localStorage.getItem("token");
            const clientContext = activePlot
                ? `Active Plot: ${activePlot.name}, Crop: ${activePlot.crop}, Stage: ${activePlot.growthStage}, Soil: ${activePlot.soilType}, Language: ${language}`
                : `Language: ${language}`;

            const res = await fetch(`${API_BASE}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({ role: m.role, content: m.content })).slice(-12),
                    clientContext
                })
            });

            const data = await res.json();
            if (res.ok && data.reply) {
                setMessages([...newMessages, { role: "assistant", content: data.reply }]);
            } else {
                throw new Error(data.error || "Could not retrieve answer.");
            }
        } catch (err) {
            toast.error(err.message || "Failed to reach assistant. Please try again.");
            setMessages([...newMessages, {
                role: "assistant",
                content: "I am having trouble connecting to the network right now. Please verify your connection or check backend configuration."
            }]);
        } finally {
            setIsSending(false);
        }
    };

    const suggestions = SUGGESTIONS_BY_LANG[language] || SUGGESTIONS_BY_LANG.en;

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C1E1B] flex flex-col justify-between font-sans">
            <Navbar />

            <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 w-full flex-1 flex flex-col">
                {/* Assistant Identity & Header */}
                <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-4 sm:p-5 mb-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-[#590907] flex items-center justify-center shrink-0 shadow">
                            <CeresLogo size={28} showWordmark={false} invert={true} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="font-serif font-bold text-lg text-[#1C1E1B]">Ceres Assistant</h1>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                    AI Agronomist
                                </span>
                            </div>
                            <p className="text-xs text-[#545850]">
                                Practical, context-aware agricultural support for Indian farmers.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 self-end sm:self-auto">
                        {/* Language Selector */}
                        <div className="flex items-center gap-1 bg-[#FDFBF7] px-2.5 py-1 rounded-full border border-[#A5A79B]/40 text-xs font-semibold">
                            <span className="text-[#545850]">Lang:</span>
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="bg-transparent text-[#590907] font-bold outline-none cursor-pointer"
                            >
                                <option value="en">English</option>
                                <option value="hi">हिन्दी</option>
                                <option value="mr">मराठी</option>
                            </select>
                        </div>

                        <button
                            type="button"
                            onClick={handleClearChat}
                            className="px-3 py-1 rounded-full border border-[#590907]/40 text-[#590907] text-xs font-semibold hover:bg-[#590907] hover:text-[#FDFBF7] flex items-center gap-1 transition"
                            title="Start New Conversation"
                        >
                            <IoRefreshOutline />
                            <span>New Chat</span>
                        </button>
                    </div>
                </div>

                {/* Active Farm Context Pill */}
                {activePlot && (
                    <div className="mb-4 px-4 py-2 rounded-xl bg-[#E8D2B5]/30 border border-[#A5A79B]/35 flex flex-wrap items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-2">
                            <RiPlantLine className="text-[#590907] text-sm" />
                            <span>
                                Context Connected: <strong>{activePlot.name}</strong> ({activePlot.crop} • {activePlot.growthStage || "Vegetative"} • {farmProfile?.district || "Pune"})
                            </span>
                        </div>
                        <span className="text-[11px] text-[#545850] italic">
                            Answers are automatically tailored to this field
                        </span>
                    </div>
                )}

                {/* Chat Messages Box */}
                <div
                    ref={messageListRef}
                    className="flex-1 bg-white border border-[#A5A79B]/40 rounded-2xl p-4 sm:p-6 shadow-sm overflow-y-auto min-h-[380px] max-h-[560px] space-y-4 mb-4"
                >
                    {messages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-5">
                            <div className="w-16 h-16 rounded-2xl bg-[#E8D2B5]/30 text-[#590907] flex items-center justify-center text-3xl">
                                <IoSparklesOutline />
                            </div>

                            <div className="max-w-md">
                                <h3 className="font-serif font-bold text-lg text-[#1C1E1B]">
                                    {language === "hi"
                                        ? "नमस्ते! मैं सेरेस, आपका कृषि सहायक हूँ।"
                                        : language === "mr"
                                        ? "नमस्कार! मी सेरेस, तुमचा कृषी सहाय्यक आहे."
                                        : "Namaste! I am Ceres, your agricultural assistant."}
                                </h3>
                                <p className="text-xs text-[#545850] mt-1.5 leading-relaxed">
                                    {language === "hi"
                                        ? "अपनी फसल की बीमारी, पानी देने के समय, खाद या मंडी भाव के बारे में कोई भी प्रश्न पूछें।"
                                        : language === "mr"
                                        ? "आपल्या पिकावरील रोग, पाणी व्यवस्थापन, खते किंवा बाजारभावाविषयी कोणताही प्रश्न विचारा."
                                        : "Ask me about leaf diagnosis, practical watering advice, fertilizer requirements, or regional mandi prices."}
                                </p>
                            </div>

                            {/* Suggestion Chips */}
                            <div className="w-full max-w-xl space-y-2 text-left">
                                <span className="text-[11px] font-bold text-[#590907] uppercase tracking-wider block">
                                    Quick Suggestions
                                </span>
                                <div className="flex flex-col gap-2">
                                    {suggestions.map((s, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => sendMessage(s)}
                                            className="px-4 py-2.5 rounded-xl border border-[#A5A79B]/40 bg-[#FDFBF7] hover:border-[#590907] hover:bg-[#E8D2B5]/20 text-xs text-[#1C1E1B] text-left transition flex items-center justify-between group"
                                        >
                                            <span>{s}</span>
                                            <span className="text-[#590907] opacity-0 group-hover:opacity-100 transition">→</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        messages.map((msg, idx) => {
                            const isUser = msg.role === "user";
                            return (
                                <div
                                    key={idx}
                                    className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                                >
                                    <div
                                        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs leading-relaxed ${
                                            isUser
                                                ? "bg-[#590907] text-[#FDFBF7] rounded-tr-none shadow-sm"
                                                : "bg-[#FDFBF7] border border-[#A5A79B]/40 text-[#1C1E1B] rounded-tl-none shadow-xs"
                                        }`}
                                    >
                                        {msg.image && (
                                            <div className="mb-2 rounded-lg overflow-hidden border border-black/10">
                                                <img src={msg.image} alt="Crop inspection" className="max-h-48 object-cover" />
                                            </div>
                                        )}
                                        <div className="whitespace-pre-wrap">{msg.content}</div>
                                    </div>

                                    {!isUser && (
                                        <button
                                            type="button"
                                            onClick={() => handleCopy(msg.content, idx)}
                                            className="mt-1 ml-1 text-[11px] text-[#545850] hover:text-[#590907] flex items-center gap-1 font-medium transition"
                                        >
                                            {copiedIndex === idx ? (
                                                <>
                                                    <IoCheckmark className="text-emerald-700" />
                                                    <span className="text-emerald-700">Copied</span>
                                                </>
                                            ) : (
                                                <>
                                                    <IoCopyOutline />
                                                    <span>Copy response</span>
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            );
                        })
                    )}

                    {isSending && (
                        <div className="flex items-start gap-2">
                            <div className="bg-[#FDFBF7] border border-[#A5A79B]/40 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-[#545850] flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#590907] animate-ping" />
                                <span>Ceres Assistant is analyzing agricultural data...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Attached Image Preview */}
                {attachedImage && (
                    <div className="mb-2 px-4 py-2 bg-white border border-[#A5A79B]/40 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <img src={attachedImage} alt="Thumbnail" className="w-8 h-8 rounded object-cover" />
                            <span className="text-[#545850]">Leaf photo attached for assistant review</span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setAttachedImage(null)}
                            className="text-rose-700 hover:text-rose-900 text-base"
                        >
                            <IoCloseCircle />
                        </button>
                    </div>
                )}

                {/* Input Bar */}
                <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="flex items-center gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                    />

                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl border border-[#A5A79B]/40 bg-white hover:bg-[#E8D2B5]/30 text-[#590907] text-lg shadow-sm transition shrink-0"
                        title="Attach Crop Photo"
                    >
                        <IoImageOutline />
                    </button>

                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={
                            language === "hi"
                                ? "अपनी फसल, पत्ती, पानी या मंडी भाव के बारे में पूछें..."
                                : language === "mr"
                                ? "तुमच्या पिकाविषयी, पाण्याविषयी किंवा बाजारभावाविषयी विचारा..."
                                : "Ask about disease symptoms, watering advice, fertilizers, or mandi rates..."
                        }
                        className="flex-1 px-4 py-3 rounded-xl border border-[#A5A79B]/40 bg-white text-xs outline-none focus:border-[#590907] shadow-sm"
                    />

                    <button
                        type="submit"
                        disabled={isSending || (!input.trim() && !attachedImage)}
                        className="px-5 py-3 rounded-xl bg-[#590907] text-[#FDFBF7] text-sm font-semibold shadow hover:bg-[#420605] transition disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    >
                        <IoSend />
                        <span className="hidden sm:inline">Send</span>
                    </button>
                </form>
            </main>

            <Footer />
        </div>
    );
}
