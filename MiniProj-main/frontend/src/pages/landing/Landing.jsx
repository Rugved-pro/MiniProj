import "./Landing.css";
import Navbar from "../../components/navbars/Navbar";
import Layout from "../../components/Layout";
import About from "../../components/About";
import Work from "../../components/Work";
import Footer from "../../components/Footer";

const Landing = () => {
  return (
    <div className="landing min-h-screen bg-[#F7EFE4] text-[#1C1E1B]">
      <Navbar />
      <main>
        <Layout />
        <About />
        <Work />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
