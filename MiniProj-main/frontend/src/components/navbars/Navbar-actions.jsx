import { useState } from "react";
import { HiOutlineBars3 } from "react-icons/hi2";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import HomeIcon from "@mui/icons-material/Home";
import { RiPlantLine } from "react-icons/ri";
import { FaCamera, FaHistory, FaUserCircle } from "react-icons/fa";
import { MdOutlineSensors, MdOutlineAssessment, MdLogout } from "react-icons/md";
import { Link, useLocation } from "react-router-dom";
import useLogout from "../../hooks/useLogout";
import { useAuthContext } from "../../context/AuthContext";
import CeresLogo from "../CeresLogo";

const NavbarActions = () => {
    const [openMenu, setOpenMenu] = useState(false);
    const { logout } = useLogout();
    const { authUser } = useAuthContext();
    const location = useLocation();

    const navLinks = [
        { text: "Overview", link: "/home", icon: <HomeIcon /> },
        { text: "Crop Health", link: "/upload", icon: <RiPlantLine className="text-lg" /> },
        { text: "Live Capture", link: "/capture", icon: <FaCamera /> },
        { text: "Field Intelligence", link: "/soil-intelligence", icon: <MdOutlineSensors className="text-lg" /> },
        { text: "Dashboard", link: "/dashboard", icon: <MdOutlineAssessment className="text-lg" /> },
        { text: "History", link: "/history", icon: <FaHistory /> },
    ];

    const isActive = (path) => location.pathname === path;

    return (
        <nav className="w-full flex items-center justify-between px-6 py-3.5 bg-[#FDFBF7]/90 backdrop-blur-md border-b border-[#A5A79B]/30 sticky top-0 z-40">
            <Link to="/home" className="no-underline">
                <CeresLogo size={32} />
            </Link>

            <div className="hidden lg:flex items-center gap-1">
                {navLinks.map((item) => {
                    const active = isActive(item.link);
                    return (
                        <Link
                            key={item.text}
                            to={item.link}
                            className={`px-3 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-150 ${
                                active
                                    ? "bg-[#590907] text-[#FDFBF7] shadow-sm"
                                    : "text-[#1C1E1B] hover:text-[#590907] hover:bg-[#E8D2B5]/30"
                            }`}
                        >
                            {item.text}
                        </Link>
                    );
                })}
            </div>

            <div className="hidden md:flex items-center gap-3">
                <Link
                    to="/profile"
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#545850] hover:text-[#590907] transition-colors"
                    title="Farmer Profile"
                >
                    <FaUserCircle className="text-lg text-[#A5A79B]" />
                    <span>{authUser?.name ? authUser.name.split(" ")[0] : "Farmer"}</span>
                </Link>
                <button
                    onClick={logout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#590907] border border-[#590907]/40 rounded-full hover:bg-[#590907] hover:text-[#FDFBF7] transition-all duration-150"
                >
                    <MdLogout className="text-sm" />
                    <span>Logout</span>
                </button>
            </div>

            <div className="lg:hidden flex items-center">
                <button
                    onClick={() => setOpenMenu(true)}
                    className="p-1.5 text-[#1C1E1B] hover:text-[#590907] focus:outline-none"
                    aria-label="Open navigation menu"
                >
                    <HiOutlineBars3 className="text-2xl" />
                </button>
            </div>

            <Drawer open={openMenu} onClose={() => setOpenMenu(false)} anchor="right">
                <Box
                    sx={{ width: 280, backgroundColor: "#FDFBF7", height: "100%", p: 2 }}
                    role="presentation"
                    onClick={() => setOpenMenu(false)}
                    onKeyDown={() => setOpenMenu(false)}
                >
                    <div className="mb-3 pt-2">
                        <CeresLogo size={30} />
                    </div>
                    {authUser?.name && (
                        <div className="px-2 py-1 mb-2 text-xs text-[#545850]">
                            Signed in as <strong className="text-[#1C1E1B]">{authUser.name}</strong>
                        </div>
                    )}
                    <Divider sx={{ borderColor: "rgba(165, 167, 155, 0.3)" }} />

                    <List sx={{ mt: 1 }}>
                        {navLinks.map((item) => {
                            const active = isActive(item.link);
                            return (
                                <ListItem key={item.text} disablePadding>
                                    <ListItemButton
                                        component={Link}
                                        to={item.link}
                                        sx={{
                                            borderRadius: "8px",
                                            my: 0.5,
                                            backgroundColor: active ? "rgba(89, 9, 7, 0.08)" : "transparent",
                                        }}
                                    >
                                        <ListItemIcon
                                            sx={{
                                                minWidth: 38,
                                                color: active ? "#590907" : "#545850",
                                            }}
                                        >
                                            {item.icon}
                                        </ListItemIcon>
                                        <span
                                            className={`text-sm ${
                                                active ? "font-bold text-[#590907]" : "font-medium text-[#1C1E1B]"
                                            }`}
                                        >
                                            {item.text}
                                        </span>
                                    </ListItemButton>
                                </ListItem>
                            );
                        })}
                    </List>

                    <Divider sx={{ my: 2, borderColor: "rgba(165, 167, 155, 0.3)" }} />

                    <div className="flex flex-col gap-2 pt-1">
                        <Link
                            to="/profile"
                            className="flex items-center gap-2 px-3 py-2 text-sm text-[#1C1E1B] hover:text-[#590907]"
                        >
                            <FaUserCircle className="text-base text-[#A5A79B]" />
                            <span>Profile Settings</span>
                        </Link>
                        <button
                            onClick={logout}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-sm font-semibold text-[#590907] border border-[#590907] rounded-full hover:bg-[#590907] hover:text-[#FDFBF7] transition"
                        >
                            <MdLogout className="text-base" />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </Box>
            </Drawer>
        </nav>
    );
};

export default NavbarActions;
