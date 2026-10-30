import { useState } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import Footer from "../../components/Footer";
import { useFarmContext } from "../../context/FarmContext";
import { Link } from "react-router-dom";
import { RiPlantLine, RiAddLine, RiEditLine, RiDeleteBinLine, RiCheckboxCircleLine } from "react-icons/ri";
import { WiDaySunny, WiRaindrop } from "react-icons/wi";
import { MdOutlineSensors, MdOutlineAssessment, MdLandscape } from "react-icons/md";
import { FaCalendarAlt, FaMapMarkerAlt, FaUser } from "react-icons/fa";

const INDIAN_CROPS = [
    "Wheat", "Rice", "Potato", "Maize", "Cotton", "Sugarcane", "Mustard",
    "Soybean", "Groundnut", "Tomato", "Onion", "Pulses", "Barley"
];

const SOIL_TYPES = ["Loamy", "Clayey", "Black", "Red", "Sandy"];
const IRRIGATION_METHODS = ["Drip Irrigation", "Sprinkler", "Flood / Furrow", "Rainfed / Natural"];
const GROWTH_STAGES = ["Sowing & Germination", "Vegetative / Tillering", "Flowering / Booting", "Grain Fill / Bulking", "Maturity & Ripening"];

export default function MyFarm() {
    const { farmProfile, activePlot, plots, switchPlot, updateProfile, addPlot, updatePlot, deletePlot, loading } = useFarmContext();

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingPlot, setEditingPlot] = useState(null);
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

    // Form state for add/edit plot
    const [plotForm, setPlotForm] = useState({
        name: "",
        area: 2.0,
        areaUnit: "Acres",
        crop: "Wheat",
        variety: "",
        sowingDate: new Date().toISOString().split("T")[0],
        growthStage: "Vegetative / Tillering",
        soilType: "Loamy",
        irrigationMethod: "Drip Irrigation"
    });

    // Form state for profile
    const [profileForm, setProfileForm] = useState({
        farmerName: farmProfile?.farmerName || "",
        state: farmProfile?.state || "Maharashtra",
        district: farmProfile?.district || "Pune",
        preferredLanguage: farmProfile?.preferredLanguage || "en"
    });

    const openAddModal = () => {
        setPlotForm({
            name: `Field Plot ${plots.length + 1}`,
            area: 2.0,
            areaUnit: "Acres",
            crop: "Wheat",
            variety: "Standard Variety",
            sowingDate: new Date().toISOString().split("T")[0],
            growthStage: "Vegetative / Tillering",
            soilType: "Loamy",
            irrigationMethod: "Drip Irrigation"
        });
        setEditingPlot(null);
        setIsAddModalOpen(true);
    };

    const openEditModal = (plot) => {
        setEditingPlot(plot);
        setPlotForm({
            name: plot.name,
            area: plot.area,
            areaUnit: plot.areaUnit || "Acres",
            crop: plot.crop,
            variety: plot.variety || "",
            sowingDate: plot.sowingDate ? plot.sowingDate.split("T")[0] : "",
            growthStage: plot.growthStage || "Vegetative / Tillering",
            soilType: plot.soilType || "Loamy",
            irrigationMethod: plot.irrigationMethod || "Drip Irrigation"
        });
        setIsAddModalOpen(true);
    };

    const handleSavePlot = async (e) => {
        e.preventDefault();
        if (editingPlot) {
            await updatePlot(editingPlot._id, plotForm);
        } else {
            await addPlot(plotForm);
        }
        setIsAddModalOpen(false);
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        await updateProfile(profileForm);
        setIsEditProfileOpen(false);
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7] text-[#1C1E1B] flex flex-col justify-between font-sans">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#590907]/10 via-[#E8D2B5]/30 to-[#A5A79B]/20 border border-[#A5A79B]/40 rounded-2xl p-6 sm:p-8 mb-8 shadow-sm">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#590907]/10 text-[#590907] text-xs font-semibold mb-2">
                                <MdLandscape className="text-sm" />
                                <span>Farm &amp; Field Intelligence Hub</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1C1E1B]">
                                {farmProfile?.farmerName || "My Farm"}
                            </h1>
                            <p className="text-sm text-[#545850] flex items-center gap-2 mt-1">
                                <FaMapMarkerAlt className="text-[#590907]" />
                                <span>{farmProfile?.district || "Pune"}, {farmProfile?.state || "Maharashtra"}</span>
                                <span className="text-[#A5A79B]">•</span>
                                <span>{plots.length} {plots.length === 1 ? "Plot" : "Plots"} Managed</span>
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setProfileForm({
                                        farmerName: farmProfile?.farmerName || "",
                                        state: farmProfile?.state || "Maharashtra",
                                        district: farmProfile?.district || "Pune",
                                        preferredLanguage: farmProfile?.preferredLanguage || "en"
                                    });
                                    setIsEditProfileOpen(true);
                                }}
                                className="px-4 py-2 text-xs font-semibold rounded-full border border-[#590907]/40 text-[#590907] hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                            >
                                Edit Farm Details
                            </button>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="px-4 py-2 text-xs font-semibold rounded-full bg-[#590907] text-[#FDFBF7] shadow hover:bg-[#420605] flex items-center gap-1.5 transition"
                            >
                                <RiAddLine className="text-base" />
                                <span>Add Field Plot</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Active Plot Highlight Card */}
                {activePlot && (
                    <div className="bg-[#FDFBF7] border-2 border-[#590907]/40 rounded-2xl p-6 mb-8 shadow-sm">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#A5A79B]/30">
                            <div>
                                <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block">
                                    Currently Active Field
                                </span>
                                <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1C1E1B] mt-0.5">
                                    {activePlot.name}
                                </h2>
                            </div>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold">
                                <RiCheckboxCircleLine className="text-sm" />
                                <span>All Ceres workflows tailored to this plot</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-5 text-sm">
                            <div className="p-3.5 rounded-xl bg-[#E8D2B5]/20 border border-[#A5A79B]/30">
                                <span className="text-xs text-[#545850] block font-medium">Cultivated Crop</span>
                                <span className="text-base font-bold text-[#590907]">{activePlot.crop}</span>
                                <span className="text-xs text-[#545850] block mt-0.5">{activePlot.variety || "Standard Variety"}</span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#E8D2B5]/20 border border-[#A5A79B]/30">
                                <span className="text-xs text-[#545850] block font-medium">Plot Area</span>
                                <span className="text-base font-bold text-[#1C1E1B]">{activePlot.area} {activePlot.areaUnit || "Acres"}</span>
                                <span className="text-xs text-[#545850] block mt-0.5">
                                    {activePlot.areaUnit === "Hectares"
                                        ? `≈ ${(activePlot.area * 2.47).toFixed(1)} Acres`
                                        : `≈ ${(activePlot.area / 2.47).toFixed(2)} Hectares`}
                                </span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#E8D2B5]/20 border border-[#A5A79B]/30">
                                <span className="text-xs text-[#545850] block font-medium">Growth Stage</span>
                                <span className="text-base font-bold text-[#1C1E1B]">{activePlot.growthStage || "Vegetative"}</span>
                                <span className="text-xs text-[#545850] block mt-0.5">Sown: {activePlot.sowingDate || "Recently"}</span>
                            </div>

                            <div className="p-3.5 rounded-xl bg-[#E8D2B5]/20 border border-[#A5A79B]/30">
                                <span className="text-xs text-[#545850] block font-medium">Soil &amp; Irrigation</span>
                                <span className="text-base font-bold text-[#1C1E1B]">{activePlot.soilType} Soil</span>
                                <span className="text-xs text-[#545850] block mt-0.5">{activePlot.irrigationMethod}</span>
                            </div>
                        </div>

                        {/* Quick Action Shortcuts for Active Plot */}
                        <div className="pt-4 border-t border-[#A5A79B]/20 flex flex-wrap gap-2.5">
                            <Link
                                to="/upload"
                                className="px-3.5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] text-xs font-semibold hover:bg-[#420605] flex items-center gap-1.5 transition"
                            >
                                <RiPlantLine />
                                <span>Diagnose Crop Leaf</span>
                            </Link>
                            <Link
                                to="/market-harvest"
                                className="px-3.5 py-2 rounded-full border border-[#590907]/40 text-[#590907] hover:bg-[#590907] hover:text-[#FDFBF7] text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                                <MdOutlineAssessment />
                                <span>Estimate Harvest &amp; Revenue</span>
                            </Link>
                            <Link
                                to="/field-intelligence"
                                className="px-3.5 py-2 rounded-full border border-[#590907]/40 text-[#590907] hover:bg-[#590907] hover:text-[#FDFBF7] text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                                <MdOutlineSensors />
                                <span>Watering Advice</span>
                            </Link>
                            <Link
                                to="/crop-planning"
                                className="px-3.5 py-2 rounded-full border border-[#590907]/40 text-[#590907] hover:bg-[#590907] hover:text-[#FDFBF7] text-xs font-semibold flex items-center gap-1.5 transition"
                            >
                                <FaCalendarAlt />
                                <span>Check Daily Tasks</span>
                            </Link>
                        </div>
                    </div>
                )}

                {/* All Plots Grid */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-serif font-bold text-[#1C1E1B]">
                            All Managed Field Plots ({plots.length})
                        </h2>
                    </div>

                    {plots.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {plots.map((plot) => {
                            const isSelected = activePlot?._id === plot._id;
                            return (
                                <div
                                    key={plot._id}
                                    className={`rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                                        isSelected
                                            ? "border-[#590907] bg-[#FDFBF7] shadow-md ring-2 ring-[#590907]/20"
                                            : "border-[#A5A79B]/40 bg-white hover:border-[#590907]/40 hover:shadow-sm"
                                    }`}
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <h3 className="font-bold text-base text-[#1C1E1B]">{plot.name}</h3>
                                                <span className="text-xs text-[#545850]">
                                                    {plot.area} {plot.areaUnit || "Acres"} • {plot.soilType}
                                                </span>
                                            </div>
                                            {isSelected ? (
                                                <span className="px-2.5 py-0.5 rounded-full bg-[#590907] text-[#FDFBF7] text-[10px] font-bold">
                                                    ACTIVE
                                                </span>
                                            ) : (
                                                <button
                                                    type="button"
                                                    onClick={() => switchPlot(plot._id)}
                                                    className="px-2.5 py-0.5 rounded-full border border-[#590907]/40 text-[#590907] text-[10px] font-semibold hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                                                >
                                                    Select
                                                </button>
                                            )}
                                        </div>

                                        <div className="space-y-2 py-3 border-y border-[#A5A79B]/20 text-xs">
                                            <div className="flex justify-between">
                                                <span className="text-[#545850]">Crop:</span>
                                                <span className="font-semibold text-[#590907]">{plot.crop}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#545850]">Stage:</span>
                                                <span className="font-medium text-[#1C1E1B]">{plot.growthStage || "Vegetative"}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-[#545850]">Irrigation:</span>
                                                <span className="font-medium text-[#1C1E1B]">{plot.irrigationMethod || "Drip"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-3 flex justify-between items-center text-xs">
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(plot)}
                                                className="text-[#590907] hover:underline flex items-center gap-1 font-medium"
                                            >
                                                <RiEditLine /> Edit
                                            </button>
                                            {plots.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => deletePlot(plot._id)}
                                                    className="text-rose-700 hover:underline flex items-center gap-1 font-medium"
                                                >
                                                    <RiDeleteBinLine /> Remove
                                                </button>
                                            )}
                                        </div>

                                        {!isSelected && (
                                            <button
                                                type="button"
                                                onClick={() => switchPlot(plot._id)}
                                                className="text-[#590907] font-bold hover:underline"
                                            >
                                                Work with this plot →
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    ) : (
                        <div className="p-8 sm:p-12 text-center rounded-2xl border-2 border-dashed border-[#A5A79B]/40 bg-[#FDFBF7] shadow-sm">
                            <div className="w-16 h-16 rounded-full bg-[#E8D2B5]/40 text-[#590907] flex items-center justify-center mx-auto mb-4 text-3xl">
                                <MdLandscape />
                            </div>
                            <h3 className="text-lg font-bold font-serif text-[#1C1E1B] mb-2">No Field Plots Configured Yet</h3>
                            <p className="text-xs sm:text-sm text-[#545850] max-w-lg mx-auto mb-6">
                                Configure your field plot with your real crop, soil type, and acreage so Ceres can personalize daily checklists, irrigation advisories, disease alerts, and harvest predictions.
                            </p>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="px-6 py-2.5 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold text-xs sm:text-sm shadow hover:bg-[#420605] inline-flex items-center gap-2 transition"
                            >
                                <RiAddLine className="text-base" />
                                <span>Add Your First Field Plot</span>
                            </button>
                        </div>
                    )}
                </div>
            </main>

            {/* Modal: Add / Edit Plot */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#FDFBF7] border border-[#A5A79B]/50 rounded-2xl max-w-lg w-full p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center pb-3 border-b border-[#A5A79B]/30 mb-4">
                            <h3 className="font-serif font-bold text-lg text-[#1C1E1B]">
                                {editingPlot ? "Edit Field Plot" : "Add New Field Plot"}
                            </h3>
                            <button
                                type="button"
                                onClick={() => setIsAddModalOpen(false)}
                                className="text-[#545850] hover:text-[#1C1E1B] text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSavePlot} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[#545850] font-semibold mb-1">Plot Name</label>
                                <input
                                    type="text"
                                    required
                                    value={plotForm.name}
                                    onChange={(e) => setPlotForm({ ...plotForm, name: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    placeholder="e.g. North Acre - Plot 2"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Cultivated Crop</label>
                                    <select
                                        value={plotForm.crop}
                                        onChange={(e) => setPlotForm({ ...plotForm, crop: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    >
                                        {INDIAN_CROPS.map((c) => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Variety (Optional)</label>
                                    <input
                                        type="text"
                                        value={plotForm.variety}
                                        onChange={(e) => setPlotForm({ ...plotForm, variety: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                        placeholder="e.g. Sharbati / HD 3086"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Area</label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0.1"
                                        required
                                        value={plotForm.area}
                                        onChange={(e) => setPlotForm({ ...plotForm, area: Number(e.target.value) })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Unit</label>
                                    <select
                                        value={plotForm.areaUnit}
                                        onChange={(e) => setPlotForm({ ...plotForm, areaUnit: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    >
                                        <option value="Acres">Acres</option>
                                        <option value="Hectares">Hectares</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Sowing Date</label>
                                    <input
                                        type="date"
                                        value={plotForm.sowingDate}
                                        onChange={(e) => setPlotForm({ ...plotForm, sowingDate: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Growth Stage</label>
                                    <select
                                        value={plotForm.growthStage}
                                        onChange={(e) => setPlotForm({ ...plotForm, growthStage: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    >
                                        {GROWTH_STAGES.map((s) => (
                                            <option key={s} value={s}>{s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Soil Type</label>
                                    <select
                                        value={plotForm.soilType}
                                        onChange={(e) => setPlotForm({ ...plotForm, soilType: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    >
                                        {SOIL_TYPES.map((s) => (
                                            <option key={s} value={s}>{s} Soil</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">Irrigation Method</label>
                                    <select
                                        value={plotForm.irrigationMethod}
                                        onChange={(e) => setPlotForm({ ...plotForm, irrigationMethod: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    >
                                        {IRRIGATION_METHODS.map((m) => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-[#A5A79B]/30">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 rounded-full border border-[#A5A79B]/50 text-[#545850] font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold shadow hover:bg-[#420605]"
                                >
                                    {editingPlot ? "Save Changes" : "Create Plot"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Edit Farm Profile */}
            {isEditProfileOpen && (
                <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#FDFBF7] border border-[#A5A79B]/50 rounded-2xl max-w-md w-full p-6 shadow-xl">
                        <div className="flex justify-between items-center pb-3 border-b border-[#A5A79B]/30 mb-4">
                            <h3 className="font-serif font-bold text-lg text-[#1C1E1B]">Edit Farmer Details</h3>
                            <button
                                type="button"
                                onClick={() => setIsEditProfileOpen(false)}
                                className="text-[#545850] hover:text-[#1C1E1B] text-lg font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                            <div>
                                <label className="block text-[#545850] font-semibold mb-1">Farmer / Farm Name</label>
                                <input
                                    type="text"
                                    required
                                    value={profileForm.farmerName}
                                    onChange={(e) => setProfileForm({ ...profileForm, farmerName: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">State</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.state}
                                        onChange={(e) => setProfileForm({ ...profileForm, state: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[#545850] font-semibold mb-1">District</label>
                                    <input
                                        type="text"
                                        required
                                        value={profileForm.district}
                                        onChange={(e) => setProfileForm({ ...profileForm, district: e.target.value })}
                                        className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[#545850] font-semibold mb-1">Preferred Language</label>
                                <select
                                    value={profileForm.preferredLanguage}
                                    onChange={(e) => setProfileForm({ ...profileForm, preferredLanguage: e.target.value })}
                                    className="w-full px-3 py-2 rounded-xl border border-[#A5A79B]/50 bg-white focus:outline-none focus:border-[#590907]"
                                >
                                    <option value="en">English</option>
                                    <option value="hi">हिन्दी (Hindi)</option>
                                    <option value="mr">मराठी (Marathi)</option>
                                </select>
                            </div>

                            <div className="pt-3 flex justify-end gap-2 border-t border-[#A5A79B]/30">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProfileOpen(false)}
                                    className="px-4 py-2 rounded-full border border-[#A5A79B]/50 text-[#545850] font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2 rounded-full bg-[#590907] text-[#FDFBF7] font-semibold shadow hover:bg-[#420605]"
                                >
                                    Save Details
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <Footer />
        </div>
    );
}
