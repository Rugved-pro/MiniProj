import { useState } from "react";
import { Link } from "react-router-dom";
import { FaPhoneAlt } from "react-icons/fa";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiMiniEyeSlash } from "react-icons/hi2";
import useLogin from "../../hooks/useLogin";
import Spinner from "../../components/Spinner";
import useGetMetadata from "../../hooks/useGetMetadata";

const Login = () => {
  const [inputs, setInputs] = useState({
    phoneno: "",
    password: ""
  });
  const [secure, setSecure] = useState(true);
  const { loading, login } = useLogin();
  const {loading: enloading, metadata} = useGetMetadata();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(inputs);
    await metadata();
  };


  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">KisanSahayak</div>
        <h1>Welcome back</h1>
        <p className="auth-intro">Sign in to check on your crops and continue where you left off.</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div className="auth-field flex items-center rounded-lg">
              <FaPhoneAlt className="fa-solid fa-phone ml-4 text-gray-500" />
              <input
                type="text"
                placeholder="Contact Number"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.phoneno}
                onChange={(e) => setInputs({ ...inputs, phoneno: e.target.value })}
              />
            </div>
            <div className="auth-field flex items-center rounded-lg">
              <RiLockPasswordFill className="fa-solid fa-phone ml-4 text-gray-500" />
              <input
                type={secure ? "password" : "text"}
                placeholder="Password"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.password}
                onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
              />
              <button
                onClick={(e) => {
                  e.preventDefault();
                  setSecure(!secure);
                }}
                className="bg-transparent hover:bg-gray-200"
              ><HiMiniEyeSlash className="fa-solid fa-phone mr-4 text-gray-500" /></button>
            </div>

            <div className="auth-options flex justify-between items-center">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" /> Remember Me
              </label>
              <a href="#" className="underline">Forgot Password?</a>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button className="w-full py-2" disabled={loading}>
              {loading ? <Spinner /> : "Login"}
            </button>
          </div>

          <Link to="/signup" className="auth-link">{"Don't"} have an account? Sign up</Link>
        </form>
      </div>
    </div>
  );
};

export default Login;
