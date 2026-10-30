import { useState, useEffect, useCallback } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import toast from "react-hot-toast";
import {
    RiCalendarCheckLine,
    RiTimeLine,
    RiFlaskLine,
    RiAddLine,
    RiCheckboxCircleFill,
    RiCheckboxBlankCircleLine,
    RiAlertLine,
    RiInformationLine,
    RiLeafLine
} from "react-icons/ri";
import { FaCalendarAlt, FaSeedling, FaWater } from "react-icons/fa";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";

const INDIAN_CROPS = [
    "Wheat", "Rice", "Potato", "Maize", "Cotton", "Sugarcane", "Mustard",
    "Soybean", "Groundnut", "Tomato", "Onion", "Pulses", "Barley"
];

export default function CropPlanning() {
    const { activePlot, farmProfile } = useFarmContext();

    const [activeTab, setActiveTab] = useState("tasks"); // 'tasks', 'calendar', 'fertilizer'

    // Task Checklist State
    const [tasks, setTasks] = useState([]);
    const [isLoadingTasks, setIsLoadingTasks] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");
    const [newTaskCategory, setNewTaskCategory] = useState("inspection");
    const [isAddingTask, setIsAddingTask] = useState(false);

    // Calendar State
    const [calendarData, setCalendarData] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState(activePlot?.crop || "Wheat");

    // Fertilizer State
    const [fertForm, setFertForm] = useState({
        crop: activePlot?.crop || "Wheat",
        soilType: activePlot?.soilType || "Loamy",
        nitrogen: 45,
        phosphorous: 35,
        potassium: 40,
        soil_pH: 6.8,
        moisture: 45
    });
    const [fertResult, setFertResult] = useState(null);
    const [isLoadingFert, setIsLoadingFert] = useState(false);

    const fetchTasks = useCallback(async () => {
        setIsLoadingTasks(true);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/intelligence/tasks`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            const data = await res.json();
            if (res.ok && data.tasks) {
                setTasks(data.tasks);
            }
        } catch (err) {
            console.warn("Could not load tasks:", err);
        } finally {
            setIsLoadingTasks(false);
        }
    }, []);

    const fetchCalendar = useCallback(async () => {
        try {
            const res = await fetch(`${API_BASE}/intelligence/crop-calendar`);
            const data = await res.json();
            if (res.ok && data.crops) {
                setCalendarData(data.crops);
            }
        } catch (err) {
            console.warn("Could not load calendar:", err);
        }
    }, []);

    const handleToggleTask = async (taskId, currentStatus) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/intelligence/tasks/${taskId}/toggle`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ completed: !currentStatus })
            });
            if (res.ok) {
                setTasks(prev => prev.map(t => t._id === taskId ? { ...t, completed: !currentStatus } : t));
                toast.success(!currentStatus ? "Task completed! Great job." : "Task reopened.");
            }
        } catch {
            toast.error("Could not update task status");
        }
    };

    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${API_BASE}/intelligence/tasks`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    taskTitle: newTaskTitle.trim(),
                    category: newTaskCategory,
                    crop: activePlot?.crop || "Wheat",
                    dueDate: new Date().toISOString().split("T")[0]
                })
            });
            const data = await res.json();
            if (res.ok && data.task) {
                setTasks(prev => [data.task, ...prev]);
                setNewTaskTitle("");
                setIsAddingTask(false);
                toast.success("New field task scheduled");
            }
        } catch {
            toast.error("Failed to add task");
        }
    };

    const handleRunFertilizer = async (e) => {
        if (e) e.preventDefault();
        setIsLoadingFert(true);
        try {
            const params = new URLSearchParams(fertForm);
            const res = await fetch(`${API_BASE}/intelligence/fertilizer?${params.toString()}`);
            const data = await res.json();
            if (res.ok && data.recommendation) {
                setFertResult(data);
            }
        } catch {
            toast.error("Could not calculate fertilizer advisory");
        } finally {
            setIsLoadingFert(false);
        }
    };

    useEffect(() => {
        fetchTasks();
        fetchCalendar();
        handleRunFertilizer();
    }, [fetchTasks, fetchCalendar]); // eslint-disable-line react-hooks/exhaustive-deps

    // Active crop calendar lookup
    const activeCropCal = calendarData.find(c => c.crop.toLowerCase() === selectedCrop.toLowerCase()) || calendarData[0];

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C1E1B] flex flex-col justify-between font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#590907]/10 via-[#E8D2B5]/30 to-[#A5A79B]/20 border border-[#A5A79B]/40 rounded-2xl p-6 mb-8">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#590907]/10 text-[#590907] text-xs font-semibold mb-2">
                                <FaCalendarAlt className="text-xs" />
                                <span>Seasonal Guidance &amp; Daily Farm Tasks</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                Crop Planning &amp; Daily Advisory
                            </h1>
                            <p className="text-sm text-[#545850] mt-1">
                                Daily agricultural checklist, seasonal plantation calendar, and soil nutrient fertilizer recommendations.
                            </p>
                        </div>

                        {/* Navigation Tabs */}
                        <div className="inline-flex p-1 bg-white border border-[#A5A79B]/40 rounded-full shadow-sm">
                            <button
                                type="button"
                                onClick={() => setActiveTab("tasks")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                                    activeTab === "tasks"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                What Should I Do Today?
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("calendar")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                                    activeTab === "calendar"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Plantation Calendar
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab("fertilizer")}
                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                                    activeTab === "fertilizer"
                                        ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                        : "text-[#545850] hover:text-[#590907]"
                                }`}
                            >
                                Fertilizer Advisor
                            </button>
                        </div>
                    </div>
                </div>

                {/* TAB 1: WHAT SHOULD I DO TODAY? */}
                {activeTab === "tasks" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-4">
                            <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-center pb-4 border-b border-[#A5A79B]/30 mb-5">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                            Daily Field Action Items
                                        </span>
                                        <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                            Tasks for {activePlot?.crop || "Wheat"} ({activePlot?.name || "Main Field"})
                                        </h2>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsAddingTask(!isAddingTask)}
                                        className="px-3.5 py-1.5 rounded-full bg-[#590907] text-[#FDFBF7] text-xs font-semibold flex items-center gap-1 shadow hover:bg-[#420605] transition"
                                    >
                                        <RiAddLine className="text-sm" />
                                        <span>Add Task</span>
                                    </button>
                                </div>

                                {/* Add Task Form */}
                                {isAddingTask && (
                                    <form onSubmit={handleAddTask} className="p-4 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/40 mb-6 space-y-3 text-xs">
                                        <h3 className="font-bold text-[#1C1E1B]">New Agricultural Task</h3>
                                        <div>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Inspect lower leaves for yellow rust spots"
                                                value={newTaskTitle}
                                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                                className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white outline-none focus:border-[#590907]"
                                            />
                                        </div>
                                        <div className="flex gap-3">
                                            <select
                                                value={newTaskCategory}
                                                onChange={(e) => setNewTaskCategory(e.target.value)}
                                                className="px-3 py-1.5 rounded-xl border border-[#A5A79B]/50 bg-white outline-none focus:border-[#590907]"
                                            >
                                                <option value="inspection">Field Inspection</option>
                                                <option value="irrigation">Watering / Irrigation</option>
                                                <option value="fertilizer">Fertilizer Application</option>
                                                <option value="protection">Pest &amp; Disease Protection</option>
                                            </select>
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold"
                                            >
                                                Save Task
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setIsAddingTask(false)}
                                                className="px-3 py-1.5 rounded-full border border-[#A5A79B]/50 text-[#545850]"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}

                                {/* Task Checklist */}
                                {isLoadingTasks ? (
                                    <p className="text-xs text-[#545850] py-4 text-center">Loading today's field checklist...</p>
                                ) : tasks.length > 0 ? (
                                    <div className="space-y-3">
                                        {tasks.map((task) => (
                                            <div
                                                key={task._id}
                                                className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                                                    task.completed
                                                        ? "bg-[#E8D2B5]/15 border-[#A5A79B]/25 opacity-75"
                                                        : "bg-[#FDFBF7] border-[#A5A79B]/40 hover:border-[#590907]/40 shadow-xs"
                                                }`}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleTask(task._id, task.completed)}
                                                        className="mt-0.5 text-xl text-[#590907] shrink-0"
                                                    >
                                                        {task.completed ? (
                                                            <RiCheckboxCircleFill className="text-emerald-700" />
                                                        ) : (
                                                            <RiCheckboxBlankCircleLine className="text-[#A5A79B] hover:text-[#590907]" />
                                                        )}
                                                    </button>
                                                    <div>
                                                        <h4 className={`text-sm font-bold ${task.completed ? "line-through text-[#545850]" : "text-[#1C1E1B]"}`}>
                                                            {task.taskTitle}
                                                        </h4>
                                                        {task.description && (
                                                            <p className="text-xs text-[#545850] mt-1 leading-relaxed">
                                                                {task.description}
                                                            </p>
                                                        )}
                                                        <div className="flex items-center gap-2 mt-2 text-[11px] text-[#545850]">
                                                            <span className="capitalize font-semibold text-[#590907]">
                                                                ● {task.category}
                                                            </span>
                                                            <span>•</span>
                                                            <span>Due: {task.dueDate || "Today"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-[#545850] py-4 text-center">No tasks scheduled yet. Add one above!</p>
                                )}
                            </div>
                        </div>

                        {/* Sidebar: Stage Information */}
                        <div className="lg:col-span-4 space-y-6">
                            <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                                    Current Growth Stage
                                </span>
                                <h3 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                    {activePlot?.growthStage || "Vegetative / Tillering"}
                                </h3>
                                <p className="text-xs text-[#545850] mt-1">
                                    Active Crop: <strong>{activePlot?.crop || "Wheat"}</strong>
                                    {activePlot?.sowingDate ? ` (Sown: ${activePlot.sowingDate})` : ""}
                                </p>

                                <div className="mt-4 p-3.5 rounded-xl bg-[#E8D2B5]/25 border border-[#A5A79B]/30 text-xs text-[#545850] space-y-2">
                                    <div className="flex items-center gap-2 text-[#590907] font-bold">
                                        <FaSeedling />
                                        <span>Key Agronomic Focus:</span>
                                    </div>
                                    <p>
                                        Root elongation and tiller formation are active. Maintain consistent root-zone moisture and watch for nutrient hunger signs.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 2: PLANTATION CALENDAR */}
                {activeTab === "calendar" && (
                    <div className="bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-[#A5A79B]/30">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                    Agro-Climatic Plantation Calendar
                                </span>
                                <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                    Growth Stages &amp; Sowing Schedule
                                </h2>
                            </div>

                            <div className="flex items-center gap-2 text-xs">
                                <label className="font-semibold text-[#545850]">Select Crop:</label>
                                <select
                                    value={selectedCrop}
                                    onChange={(e) => setSelectedCrop(e.target.value)}
                                    className="px-3 py-1.5 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none font-semibold text-[#590907]"
                                >
                                    {INDIAN_CROPS.map((c) => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {activeCropCal ? (
                            <div>
                                <div className="flex flex-wrap gap-4 mb-6 text-xs">
                                    <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/30">
                                        <span className="text-[#545850] block">Season</span>
                                        <span className="text-sm font-bold text-[#590907]">{activeCropCal.season}</span>
                                    </div>
                                    <div className="p-3 rounded-xl bg-[#FDFBF7] border border-[#A5A79B]/30">
                                        <span className="text-[#545850] block">Duration</span>
                                        <span className="text-sm font-bold text-[#1C1E1B]">{activeCropCal.durationDays} Days</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold text-[#1C1E1B] uppercase tracking-wider">
                                        Growth Stage Milestones &amp; Management
                                    </h3>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {activeCropCal.stages.map((stage, idx) => (
                                            <div
                                                key={stage.name}
                                                className="p-4 rounded-xl border border-[#A5A79B]/35 bg-[#FDFBF7] shadow-xs flex flex-col justify-between"
                                            >
                                                <div>
                                                    <span className="text-[10px] font-bold text-[#590907] uppercase tracking-widest block mb-1">
                                                        Phase {idx + 1}
                                                    </span>
                                                    <h4 className="font-bold text-sm text-[#1C1E1B]">{stage.name}</h4>
                                                    <span className="text-xs text-[#545850] block mb-2 font-medium">
                                                        Timeline: {stage.dayRange}
                                                    </span>
                                                    <p className="text-xs text-[#545850] leading-relaxed">
                                                        {stage.tips}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="text-xs text-[#545850]">No calendar data for selected crop.</p>
                        )}
                    </div>
                )}

                {/* TAB 3: FERTILIZER RECOMMENDATION */}
                {activeTab === "fertilizer" && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                        {/* Form */}
                        <div className="lg:col-span-5 bg-white border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm">
                            <h2 className="text-lg font-serif font-bold text-[#1C1E1B] mb-1">
                                Soil Test &amp; Nutrient Inputs
                            </h2>
                            <p className="text-xs text-[#545850] mb-5">
                                Enter your laboratory soil test values (in kg/ha or test levels 0-140) to determine optimal fertilizer formulation.
                            </p>

                            <form onSubmit={handleRunFertilizer} className="space-y-4 text-xs">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Crop</label>
                                    <select
                                        value={fertForm.crop}
                                        onChange={(e) => setFertForm({ ...fertForm, crop: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                    >
                                        {INDIAN_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Soil Type</label>
                                    <select
                                        value={fertForm.soilType}
                                        onChange={(e) => setFertForm({ ...fertForm, soilType: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                    >
                                        <option value="Loamy">Loamy Soil</option>
                                        <option value="Clayey">Clayey Soil</option>
                                        <option value="Black">Black Soil (Regur)</option>
                                        <option value="Red">Red Soil</option>
                                        <option value="Sandy">Sandy Loam</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-3 gap-2.5">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Nitrogen (N)</label>
                                        <input
                                            type="number"
                                            value={fertForm.nitrogen}
                                            onChange={(e) => setFertForm({ ...fertForm, nitrogen: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Phosphorus (P)</label>
                                        <input
                                            type="number"
                                            value={fertForm.phosphorous}
                                            onChange={(e) => setFertForm({ ...fertForm, phosphorous: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Potassium (K)</label>
                                        <input
                                            type="number"
                                            value={fertForm.potassium}
                                            onChange={(e) => setFertForm({ ...fertForm, potassium: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Soil pH</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={fertForm.soil_pH}
                                            onChange={(e) => setFertForm({ ...fertForm, soil_pH: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[#545850] font-semibold mb-1">Moisture (%)</label>
                                        <input
                                            type="number"
                                            value={fertForm.moisture}
                                            onChange={(e) => setFertForm({ ...fertForm, moisture: Number(e.target.value) })}
                                            className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-[#FDFBF7] outline-none"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={isLoadingFert}
                                    className="w-full py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs shadow hover:bg-[#420605] transition disabled:opacity-50 mt-2"
                                >
                                    {isLoadingFert ? "Analyzing Nutrients..." : "Analyze & Recommend Fertilizer"}
                                </button>
                            </form>
                        </div>

                        {/* Recommendation Result */}
                        <div className="lg:col-span-7 flex flex-col gap-6">
                            {fertResult ? (
                                <div className="bg-[#FDFBF7] border border-[#A5A79B]/40 rounded-2xl p-6 shadow-sm space-y-5">
                                    <div>
                                        <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-1">
                                            Nutrient Analysis &amp; Advisory
                                        </span>
                                        <h3 className="text-xl font-serif font-bold text-[#1C1E1B]">
                                            Recommended Fertilizer: {fertResult.recommendation.primaryFertilizer}
                                        </h3>
                                    </div>

                                    {/* Nutrient Status Badges */}
                                    <div className="grid grid-cols-3 gap-3">
                                        <div className="p-3 rounded-xl bg-white border border-[#A5A79B]/30 text-center">
                                            <span className="text-xs text-[#545850] block">Nitrogen (N)</span>
                                            <span className={`text-sm font-bold ${
                                                fertResult.nutrients.nitrogen.status === "Low" ? "text-rose-700" : "text-emerald-700"
                                            }`}>
                                                {fertResult.nutrients.nitrogen.status}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white border border-[#A5A79B]/30 text-center">
                                            <span className="text-xs text-[#545850] block">Phosphorus (P)</span>
                                            <span className={`text-sm font-bold ${
                                                fertResult.nutrients.phosphorous.status === "Low" ? "text-rose-700" : "text-emerald-700"
                                            }`}>
                                                {fertResult.nutrients.phosphorous.status}
                                            </span>
                                        </div>
                                        <div className="p-3 rounded-xl bg-white border border-[#A5A79B]/30 text-center">
                                            <span className="text-xs text-[#545850] block">Potassium (K)</span>
                                            <span className={`text-sm font-bold ${
                                                fertResult.nutrients.potassium.status === "Low" ? "text-rose-700" : "text-emerald-700"
                                            }`}>
                                                {fertResult.nutrients.potassium.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Rationale & Application Timing */}
                                    <div className="p-4 rounded-xl bg-white border border-[#A5A79B]/30 text-xs space-y-3">
                                        <div>
                                            <span className="font-bold text-[#590907] block mb-1">Why this was recommended:</span>
                                            <p className="text-[#545850] leading-relaxed">{fertResult.recommendation.rationale}</p>
                                        </div>
                                        <div>
                                            <span className="font-bold text-[#1C1E1B] block mb-1">Application Timing &amp; Placement:</span>
                                            <p className="text-[#545850] leading-relaxed">{fertResult.recommendation.applicationTiming}</p>
                                        </div>
                                    </div>

                                    {/* Warnings if any */}
                                    {fertResult.soilHealthWarnings?.length > 0 && (
                                        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-xs space-y-1 text-amber-950">
                                            <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-1">
                                                <RiAlertLine />
                                                <span>Soil Condition Warnings</span>
                                            </div>
                                            {fertResult.soilHealthWarnings.map((w, idx) => (
                                                <p key={idx}>• {w}</p>
                                            ))}
                                        </div>
                                    )}

                                    <p className="text-[11px] text-[#545850] italic">
                                        * {fertResult.disclaimer}
                                    </p>
                                </div>
                            ) : (
                                <div className="p-8 text-center text-xs text-[#545850] bg-white rounded-2xl border border-[#A5A79B]/40">
                                    Click "Analyze &amp; Recommend Fertilizer" to calculate suitable formulations.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
