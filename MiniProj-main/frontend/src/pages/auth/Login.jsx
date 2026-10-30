import { useState } from "react";
import { Link } from "react-router-dom";
import { FaPhoneAlt } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiMiniEyeSlash } from "react-icons/hi2";
import useLogin from "../../hooks/useLogin";
import Spinner from "../../components/Spinner";
import useGetMetadata from "../../hooks/useGetMetadata";
import CeresLogo from "../../components/CeresLogo";

const Login = () => {
  const [inputs, setInputs] = useState({
    phoneno: "",
    password: ""
  });
  const [secure, setSecure] = useState(true);
  const { loading, login } = useLogin();
  const { loading: enloading, metadata } = useGetMetadata();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(inputs);
    await metadata();
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <CeresLogo size={26} />
        </div>
        <h1>Welcome back</h1>
        <p className="auth-intro">Sign in to access your field intelligence and crop assessment records.</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="auth-field flex items-center rounded-lg">
              <FaPhoneAlt className="ml-4 text-[#A5A79B]" />
              <input
                type="text"
                placeholder="Contact Number"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.phoneno}
                onChange={(e) => setInputs({ ...inputs, phoneno: e.target.value })}
              />
            </div>
            <div className="auth-field flex items-center rounded-lg">
              <RiLockPasswordFill className="ml-4 text-[#A5A79B]" />
              <input
                type={secure ? "password" : "text"}
                placeholder="Password"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.password}
                onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setSecure(!secure)}
                className="bg-transparent hover:bg-gray-200/40 p-2 mr-2 rounded"
              >
                <HiMiniEyeSlash className="text-[#A5A79B]" />
              </button>
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              disabled={loading || enloading}
              className="primary-button-new w-full text-[#FDFBF7]"
            >
              {loading ? <Spinner /> : "Sign In"}
            </button>
          </div>
        </form>

        <Link to="/signup" className="auth-link">
          Need an account? Sign up for Ceres →
        </Link>
      </div>
    </div>
  );
};

export default Login;
