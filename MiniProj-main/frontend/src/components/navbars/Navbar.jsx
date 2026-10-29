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
import InfoIcon from "@mui/icons-material/Info";
import { MdLogin } from "react-icons/md";
import { RiPlantLine } from "react-icons/ri";
import { MdOutlineSensors } from "react-icons/md";
import { useNavigate, Link } from "react-router-dom";
import CeresLogo from "../CeresLogo";

const Navbar = () => {
  const navigate = useNavigate();
  const [openMenu, setOpenMenu] = useState(false);

  const menuOptions = [
    {
      text: "Overview",
      icon: <HomeIcon className="text-[#590907]" />,
      link: "/"
    },
    {
      text: "Crop Health",
      icon: <RiPlantLine className="text-[#590907] text-xl" />,
      link: "/upload"
    },
    {
      text: "Field Intelligence",
      icon: <MdOutlineSensors className="text-[#590907] text-xl" />,
      link: "/soil-intelligence"
    },
    {
      text: "About Platform",
      icon: <InfoIcon className="text-[#590907]" />,
      link: "#about-section-container"
    },
  ];

  return (
    <nav className="w-full flex items-center justify-between px-6 py-4 bg-transparent border-b border-[#A5A79B]/30">
      <Link to="/" className="no-underline">
        <CeresLogo size={34} />
      </Link>

      <div className="navbar-links-container hidden md:flex items-center gap-7">
        <Link
          to="/"
          className="text-[#1C1E1B] font-medium text-sm transition-colors duration-200 hover:text-[#590907]"
        >
          Overview
        </Link>
        <Link
          to="/upload"
          className="text-[#1C1E1B] font-medium text-sm transition-colors duration-200 hover:text-[#590907]"
        >
          Crop Health
        </Link>
        <Link
          to="/soil-intelligence"
          className="text-[#1C1E1B] font-medium text-sm transition-colors duration-200 hover:text-[#590907]"
        >
          Field Intelligence
        </Link>
        <a
          href="#about-section-container"
          className="text-[#1C1E1B] font-medium text-sm transition-colors duration-200 hover:text-[#590907]"
        >
          About
        </a>
      </div>

      <div className="hidden md:flex items-center gap-3">
        <button
          onClick={() => navigate("/login")}
          className="px-4 py-2 text-sm font-semibold text-[#590907] border border-[#590907]/40 rounded-full hover:border-[#590907] hover:bg-[#590907]/5 transition-all duration-150"
        >
          Sign In
        </button>
        <button
          onClick={() => navigate("/signup")}
          className="primary-button px-5 py-2 text-sm font-semibold text-[#FDFBF7] bg-[#590907] rounded-full hover:bg-[#420605] shadow-sm transition-all duration-150"
        >
          Get Started
        </button>
      </div>

      <div className="navbar-menu-container md:hidden flex items-center">
        <button
          onClick={() => setOpenMenu(true)}
          className="p-2 text-[#1C1E1B] hover:text-[#590907] focus:outline-none"
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
          <div className="mb-4 pt-2">
            <CeresLogo size={30} />
          </div>
          <Divider sx={{ borderColor: "rgba(165, 167, 155, 0.3)" }} />

          <List sx={{ mt: 1 }}>
            {menuOptions.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => {
                    if (item.link.startsWith("#")) {
                      window.location.hash = item.link;
                    } else {
                      navigate(item.link);
                    }
                  }}
                  sx={{ borderRadius: "8px", my: 0.5 }}
                >
                  <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
                  <span className="text-[#1C1E1B] font-medium text-sm">{item.text}</span>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <Divider sx={{ my: 2, borderColor: "rgba(165, 167, 155, 0.3)" }} />

          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => navigate("/login")}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold text-[#590907] border border-[#590907] rounded-full hover:bg-[#590907]/5 transition"
            >
              <MdLogin className="text-lg" />
              <span>Sign In</span>
            </button>
            <button
              onClick={() => navigate("/signup")}
              className="w-full py-2.5 px-4 text-sm font-semibold text-[#FDFBF7] bg-[#590907] rounded-full hover:bg-[#420605] shadow transition"
            >
              Create Account
            </button>
          </div>
        </Box>
      </Drawer>
    </nav>
  );
};

export default Navbar;
