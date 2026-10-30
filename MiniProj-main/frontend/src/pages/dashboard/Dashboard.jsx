import { useEffect, useRef, useState } from "react";
import Navbar from "../../components/navbars/Navbar-actions";
import { useNavigate } from "react-router-dom";
import { env_data } from "../../data/Rainfall_Soil.json";
import gsap from "gsap";
import { HiMagnifyingGlass } from "react-icons/hi2";

const Dashboard = () => {
	const navigate = useNavigate();
	const othersDashboardRef = useRef(null);
	const [searchEle, setSearchEle] = useState("");

	const matchingRegions = searchEle.trim()
		? env_data.filter((data) =>
			data.District.toLowerCase().includes(searchEle.toLowerCase().trim())
		)
		: env_data;

	useEffect(() => {
		gsap.from(othersDashboardRef.current, {
			y: 1200,
			opacity: 0,
		});

		gsap.to(othersDashboardRef.current, {
			y: 0,
			opacity: 1,
			duration: 0.5,
			ease: "power2.out",
		});
	}, []);

	const images = ["/vector.png", "/Vector2.png", "/vector3.png"];

	return (
		<div>
			<Navbar />
			<div className="mt-8">
				<h1 className="text-gray-800 font-bold text-3xl text-left ml-3 mt-4">
					Other Regions
				</h1>
				<div className="bg-gray-400 w-[98%] h-[2px] ml-3 mr-3 my-2" />

				<button
					type="button"
					onClick={() => navigate("/soil-intelligence")}
					className="mx-4 mt-3 rounded-lg border border-green-200 bg-green-50 px-5 py-4 text-left shadow-sm transition hover:bg-green-100"
				>
					<span className="block text-lg font-semibold text-green-900">Soil Analyzer &amp; Smart Irrigation</span>
					<span className="mt-1 block text-sm text-green-800">Upload soil readings and review crop-specific guidance</span>
				</button>

				<div className="ml-4 mt-4 mb-4 flex items-center gap-2 bg-gray-200 backdrop-blur-xl backdrop-filter w-fit py-2 px-3 rounded-xl active:border-2 active:border-gray-800">
					<input
						className="lg:w-[350px] md:w-[350px] sm:w-[200px] h-[30px] bg-transparent text-lg text-gray-800 outline-none border-none"
						type="text"
						placeholder="Search any region here..."
						value={searchEle}
						onChange={(e) => {
							setSearchEle(e.target.value);
						}}
					/>
					<HiMagnifyingGlass className="size-6" />
				</div>
				<div>
					<div ref={othersDashboardRef} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:mr-3">
						{matchingRegions.map((item, _idx) => {
							const imgSrc = images[_idx % images.length];
							return (
								<div
									className="m-4 rounded-lg overflow-hidden bg-gray-200 w-fit backdrop-blur-lg shadow-lg transform transition-transform hover:scale-105 flex flex-col items-center justify-center pb-2 cursor-pointer"
									onClick={() => {
										navigate(`/dashboard/${item.District}`);
									}}
									key={_idx}
								>
									<div className="lg:size-[310px] p-3 rounded-lg overflow-hidden md:size-[250px]">
										<img src={imgSrc} alt={item.District} className="w-full rounded-lg" />
									</div>
									<span className="font-semibold text-xl text-center text-gray-700">
										{item.District}
									</span>
								</div>
							);
						})}
					</div>
				</div>
			</div>
		</div>
	);
};

export default Dashboard;