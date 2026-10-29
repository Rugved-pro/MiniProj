import { useAuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import useLogout from "../hooks/useLogout";
import Translate from "./TranslateComponent.jsx";

const Layout = () => {
  const { authUser } = useAuthContext();
  const { loading, logout } = useLogout();

  return (
    <div className="home-container">

      <div className="home-banner-container">
        <div className="home-bannerImage-container">
          <img src="/home-banner-background.png" alt="" />
        </div>
        <div className="home-text-section">
          <h1 className="primary-heading">Healthy crops start here</h1>

          <p className="primary-text">
            Keep your crops away from potential outbreaks and other problems
          </p>

          {!authUser ? (
            <>
              <div className="landing-actions flex items-center justify-center gap-2">
                <button className="secondary-button">
                  <Link to="/signup">Signup</Link>
                </button>
                <button className="primary-button">
                  <Link to="/login">Login</Link>
                </button>
              </div>
              <div className="landing-translate">
                <span>Choose your language</span>
                <Translate />
              </div>
            </>
          ) : (
            <button className="secondary-button" onClick={logout}>
              {loading ? <span className="loading loading-spinner"></span> : "Logout"}
            </button>
          )}
        </div>
        <div className="home-image-section">
          <img src="/home-banner-image.png" alt="" />
        </div>
      </div>
    </div>
  );
};

export default Layout;
