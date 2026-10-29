import { useState } from "react";
import Select from "react-select";
import { Link, useNavigate } from "react-router-dom";
import { FaPhoneAlt, FaUser, FaCalendarAlt } from "react-icons/fa";
import { FaBowlFood } from "react-icons/fa6";
import { RiLockPasswordFill } from "react-icons/ri";
import { HiMiniEyeSlash } from "react-icons/hi2";
import useSignup from "../../hooks/useSignup";
import Spinner from "../../components/Spinner";

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
    <div
      className="flex items-center justify-center min-h-screen min-w-screen bg-cover bg-center"
      style={{ backgroundImage: "url('bg.jpg')" }}
    >
      <div className="w-11/12 max-w-md bg-yellow-100 p-14 text-center rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-yellow-700">Sign Up</h1>
        <div className="w-8 h-1 bg-yellow-700 mx-auto my-4 rounded-full"></div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="flex items-center bg-gray-200 rounded-lg">
              <FaUser className="ml-4 text-gray-500" />
              <input
                type="text"
                placeholder="Name"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.name}
                onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
              />
            </div>
            <div className="flex items-center bg-gray-200 rounded-lg">
              <FaPhoneAlt className="ml-4 text-gray-500" />
              <input
                type="text"
                placeholder="Contact Number"
                className="w-full p-4 bg-transparent border-0 focus:outline-none"
                value={inputs.phoneno}
                onChange={(e) => setInputs({ ...inputs, phoneno: e.target.value })}
              />
            </div>
            <div className="flex items-center bg-gray-200 rounded-lg space-x-2">
              <FaCalendarAlt className="ml-4 text-gray-500" />
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
            <div className="flex items-center bg-gray-200 rounded-lg">
              <RiLockPasswordFill className="ml-4 text-gray-500" />
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
                className="bg-transparent hover:bg-slate-200"
              >
                <HiMiniEyeSlash className="mr-4 text-gray-500" />
              </button>
            </div>
            <div className="flex justify-around text-brown-600">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  className="mr-2"
                  value="M"
                  onChange={(e) => setInputs({ ...inputs, gender: e.target.value })}
                />
                MALE
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="gender"
                  className="mr-2"
                  value="F"
                  onChange={(e) => setInputs({ ...inputs, gender: e.target.value })}
                />
                FEMALE
              </label>
              <label className="flex items-center">
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

            {/*Dropdown*/}
            <div className="bg-gray-200 rounded-lg">
              <div className="flex items-center px-4 py-2">
                <FaBowlFood className="mr-4 text-gray-500" />
                <Select
                  options={cropOptions}
                  value={cropList}
                  onChange={handleCropChange}
                  isMulti={true}
                  className="w-full"
                />
              </div>
            </div>

          </div>

          <div className="flex justify-center mt-8">
            <button className="w-full bg-yellow-700 text-white py-2 rounded-full hover:bg-yellow-600 transition-colors" disabled={loading}>
              {loading ? <Spinner /> : "Sign Up"}
            </button>
          </div>

          <Link to="/login" className="text-green-700 mt-4 block hover:underline hover:text-green-900">Already have an Account? Login</Link>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
