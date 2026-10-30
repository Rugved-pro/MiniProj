import { useEffect, useRef, useState } from "react";
import { IoChatbubbleEllipsesOutline, IoClose, IoSend, IoOpenOutline } from "react-icons/io5";
import { Link } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";
import CeresLogo from "./CeresLogo";
import "./FarmerChat.css";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const SUGGESTIONS = [
    "What are early symptoms of crop rust or leaf blight?",
    "How does soil moisture affect crop yield under FAO-56?",
    "फसल में फफूंद (fungal disease) के लक्षण और जैविक उपाय क्या हैं?"
];

const FarmerChat = () => {
    const { authUser } = useAuthContext();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [error, setError] = useState("");
    const messageListRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    useEffect(() => {
        if (messageListRef.current) {
            messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
        }
    }, [messages, isSending]);

    const sendMessage = async (messageText = input) => {
        const text = messageText.trim();
        if (!text || isSending) return;

        const conversation = [...messages, { role: "user", content: text }];
        setMessages(conversation);
        setInput("");
        setError("");
        setIsSending(true);

        try {
            const token = authUser?.token || localStorage.getItem("token");
            const response = await fetch(`${API_URL}/chat`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ messages: conversation.slice(-12) })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || "The assistant could not answer. Please try again.");
            }
            setMessages([...conversation, { role: "assistant", content: data.reply }]);
        } catch (requestError) {
            setMessages(messages);
            setInput(text);
            setError(requestError.message || "Could not reach the assistant. Check your connection and try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        sendMessage();
    };

    return (
        <div className="farmer-chat">
            {isOpen && (
                <section className="farmer-chat__panel" aria-label="Ceres agricultural assistant">
                    <header className="farmer-chat__header">
                        <div className="flex items-center gap-2">
                            <CeresLogo size={24} showWordmark={false} invert={true} />
                            <div>
                                <strong>Ceres Assistant</strong>
                                <span>Grounded Agricultural Intelligence</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Link
                                to="/assistant"
                                className="text-white/80 hover:text-white p-1 rounded transition text-sm flex items-center gap-1"
                                title="Open full-page assistant"
                                onClick={() => setIsOpen(false)}
                            >
                                <IoOpenOutline className="text-base" />
                                <span className="text-[11px] font-medium hidden sm:inline">Full Page</span>
                            </Link>
                            <button
                                type="button"
                                className="farmer-chat__close"
                                aria-label="Close chat"
                                onClick={() => setIsOpen(false)}
                            >
                                <IoClose aria-hidden="true" />
                            </button>
                        </div>
                    </header>

                    <div className="farmer-chat__messages" ref={messageListRef} aria-live="polite">
                        {messages.length === 0 ? (
                            <div className="farmer-chat__welcome">
                                <p>
                                    Namaste! I am <strong>Ceres</strong>, your agricultural intelligence assistant.
                                    Ask me about crop diseases, irrigation depletion thresholds, or soil health.
                                </p>
                                <div className="farmer-chat__suggestions">
                                    {SUGGESTIONS.map((suggestion) => (
                                        <button
                                            type="button"
                                            key={suggestion}
                                            disabled={isSending}
                                            onClick={() => sendMessage(suggestion)}
                                        >
                                            {suggestion}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((message, index) => (
                                <p
                                    className={`farmer-chat__message farmer-chat__message--${message.role}`}
                                    key={`${message.role}-${index}`}
                                >
                                    {message.content}
                                </p>
                            ))
                        )}
                        {isSending && <p className="farmer-chat__typing" role="status">Ceres is analyzing…</p>}
                    </div>

                    {error && <p className="farmer-chat__error" role="alert">{error}</p>}

                    <form className="farmer-chat__form" onSubmit={handleSubmit}>
                        <label className="farmer-chat__visually-hidden" htmlFor="farmer-chat-input">
                            Ask an agricultural question
                        </label>
                        <textarea
                            id="farmer-chat-input"
                            ref={inputRef}
                            value={input}
                            maxLength={4000}
                            rows={1}
                            placeholder="Ask about crops, disease symptoms, or soil…"
                            onChange={(event) => setInput(event.target.value)}
                            onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                    event.preventDefault();
                                    sendMessage();
                                }
                            }}
                        />
                        <button
                            type="submit"
                            aria-label="Send message"
                            disabled={!input.trim() || isSending}
                        >
                            <IoSend aria-hidden="true" />
                        </button>
                    </form>
                    <p className="farmer-chat__disclaimer">
                        Evidence-based guidance. Verify chemical treatments with local Krishi Vigyan Kendra (KVK).
                    </p>
                </section>
            )}

            <button
                type="button"
                className="farmer-chat__toggle"
                aria-label={isOpen ? "Close Ceres assistant" : "Open Ceres assistant"}
                aria-expanded={isOpen}
                onClick={() => setIsOpen((open) => !open)}
            >
                {isOpen ? <IoClose aria-hidden="true" /> : <IoChatbubbleEllipsesOutline aria-hidden="true" />}
                <span>{isOpen ? "Close" : "Ceres Assistant"}</span>
            </button>
        </div>
    );
};

export default FarmerChat;
