import { useState } from "react";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import { FaPhoneAlt, FaUser, FaCalendarAlt } from "react-icons/fa";
import { FaBowlFood } from "react-icons/fa6";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiMiniEyeSlash } from "react-icons/hi2";
import useSignup from "../../hooks/useSignup";
import Spinner from "../../components/Spinner";
import CeresLogo from "../../components/CeresLogo";

const SignUp = () => {
  const [inputs, setInputs] = useState({
    name: '',
    phoneno: '',
    day: '',
    month: '',
    year: '',
    password: '',
    gender: '',
    crops: []
  });
  const [secure, setSecure] = useState(true);
  const [cropList, setCropList] = useState([]);
  const { loading, signup } = useSignup();
  const navigate = useNavigate();

  const cropOptions = [
    { value: "Rice", label: "Rice" },
    { value: "Wheat", label: "Wheat" },
    { value: "Corn", label: "Corn" },
    { value: "Potato", label: "Potato" },
    { value: "Sugarcane", label: "Sugarcane" },
  ];

  const handleCropChange = (selectedOptions) => {
    const values = selectedOptions ? selectedOptions.map(option => option.value) : [];
    setCropList(selectedOptions);
    setInputs({ ...inputs, crops: values });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (await signup(inputs)) {
      navigate("/home");
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <CeresLogo size={26} />
        </div>
        <h1>Create your Ceres account</h1>
        <p className="auth-intro">Register your contact and primary field crops to configure personalized health tracking.</p>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="auth-field flex items-center rounded-lg">
              <FaUser className="ml-4 text-[#A5A79B]" />
              <input
                type="text"
                placeholder="Full Name"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
              />
            </div>
            <div className="auth-field flex items-center rounded-lg">
              <FaPhoneAlt className="ml-4 text-[#A5A79B]" />
              <input
                type="text"
                placeholder="Contact Number (10 digits)"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.phoneno}
                onChange={(e) => setInputs({ ...inputs, phoneno: e.target.value })}
              />
            </div>
            <div className="auth-field flex items-center rounded-lg space-x-2">
              <FaCalendarAlt className="ml-4 text-[#A5A79B]" />
              <input
                type="text"
                placeholder="DD"
                className="w-1/4 p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.day}
                onChange={(e) => setInputs({ ...inputs, day: e.target.value })}
              />
              <input
                type="text"
                placeholder="MM"
                className="w-1/4 p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.month}
                onChange={(e) => setInputs({ ...inputs, month: e.target.value })}
              />
              <input
                type="text"
                placeholder="YYYY"
                className="w-1/2 p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.year}
                onChange={(e) => setInputs({ ...inputs, year: e.target.value })}
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
                onClick={(e) => {
                  e.preventDefault();
                  setSecure(!secure);
                }}
                className="bg-transparent hover:bg-gray-200/40 p-2 mr-2 rounded"
              >
                <HiMiniEyeSlash className="text-[#A5A79B]" />
              </button>
            </div>
            <div className="auth-options flex justify-around text-xs font-semibold py-1">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  className="mr-2"
                  value="M"
                  onChange={(e) => setInputs({ ...inputs, gender: e.target.value })}
                />
                MALE
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  className="mr-2"
                  value="F"
                  onChange={(e) => setInputs({ ...inputs, gender: e.target.value })}
                />
                FEMALE
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  name="gender"
                  className="mr-2"
                  value="O"
                  onChange={(e) => setInputs({ ...inputs, gender: e.target.value })}
                />
                OTHERS
              </label>
            </div>

            {/* Dropdown for crops */}
            <div className="auth-field rounded-lg">
              <div className="flex items-center px-4 py-2">
                <FaBowlFood className="mr-3 text-[#A5A79B] shrink-0" />
                <Select
                  options={cropOptions}
                  value={cropList}
                  placeholder="Select primary farm crops..."
                  onChange={handleCropChange}
                  isMulti={true}
                  classNamePrefix="auth-select"
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-center mt-8">
            <button className="primary-button-new w-full py-3 text-[#FDFBF7]" disabled={loading}>
              {loading ? <Spinner /> : "Create Ceres Account"}
            </button>
          </div>

          <Link to="/login" className="auth-link">
            Already have an account? Sign in →
          </Link>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
