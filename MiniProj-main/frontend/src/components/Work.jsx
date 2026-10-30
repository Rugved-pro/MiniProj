import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { RiUploadCloud2Line, RiCpuLine, RiFileList3Line } from "react-icons/ri";

const Work = () => {
  useEffect(() => {
    AOS.init({ duration: 800, once: true });
  }, []);

  const steps = [
    {
      num: "01",
      icon: <RiUploadCloud2Line className="text-2xl text-[#590907]" />,
      title: "Upload or Capture Leaf Photo",
      text: "Submit 1 to 3 photos of affected leaves. Ceres computes Laplacian sharpness across angles to analyze the clearest focal frame.",
    },
    {
      num: "02",
      icon: <RiCpuLine className="text-2xl text-[#590907]" />,
      title: "Vision Transformer Inference",
      text: "The model inspects pathological visual symptoms against 38+ plant-disease classifications with confidence boundaries.",
    },
    {
      num: "03",
      icon: <RiFileList3Line className="text-2xl text-[#590907]" />,
      title: "Calibrated Remediation Plan",
      text: "Receive actionable next steps, approved organic or chemical treatments, and regional agricultural extension recommendations.",
    },
  ];

  return (
    <section className="w-full max-w-6xl mx-auto px-6 py-12" data-aos="fade-up">
      <div className="text-center max-w-xl mx-auto mb-10">
        <span className="text-xs font-bold uppercase tracking-widest text-[#590907] block mb-2">
          Assessment Workflow
        </span>
        <h2 className="text-2xl sm:text-3xl font-bold font-serif text-[#1C1E1B] mb-2">
          How Ceres Works in Three Steps
        </h2>
        <p className="text-xs sm:text-sm text-[#545850]">
          Designed for quick field operation on desktop or mobile browsers.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((step) => (
          <div
            key={step.num}
            className="bg-[#FDFBF7] border border-[#A5A79B]/35 rounded-xl p-6 relative flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-[#E8D2B5]/30 border border-[#A5A79B]/30 flex items-center justify-center">
                  {step.icon}
                </div>
                <span className="font-mono text-xs font-bold text-[#A5A79B]">
                  STEP {step.num}
                </span>
              </div>
              <h3 className="text-base font-bold text-[#1C1E1B] mb-2">{step.title}</h3>
              <p className="text-xs sm:text-sm text-[#545850] leading-relaxed">{step.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Work;
