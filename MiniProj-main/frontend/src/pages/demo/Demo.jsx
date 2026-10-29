import { useState } from "react";
import { Link } from "react-router-dom";

const rainfall = [
  { district: "Nashik", actual: "82 mm", normal: "74 mm", status: "Above normal" },
  { district: "Pune", actual: "61 mm", normal: "68 mm", status: "Near normal" },
  { district: "Nagpur", actual: "49 mm", normal: "72 mm", status: "Below normal" },
];

const Demo = () => {
  const [profile, setProfile] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("KS-demo-profile") || "null");
    } catch (error) {
      console.error("Could not read the local demo profile:", error);
      return null;
    }
  });

  const clearProfile = () => {
    localStorage.removeItem("KS-demo-profile");
    setProfile(null);
  };

  return (
    <main className="min-h-screen bg-stone-50 px-5 py-8 text-stone-800 sm:px-10">
      <div className="mx-auto max-w-6xl">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#590907]">Ceres</p>
          <h1 className="mt-1 text-3xl font-bold">Sample farmer dashboard</h1>
        </div>
        <Link className="rounded-full border border-green-700 px-5 py-2 font-semibold text-green-800 hover:bg-green-50" to="/">
          Back to welcome page
        </Link>
      </header>

      <aside className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950">
        <strong>Read-only demo:</strong> This page uses sample data only. A local profile is not an account and does not connect to protected features.
      </aside>

      {profile && (
        <section className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white p-5 shadow-sm" aria-label="Local demo profile">
          <div>
            <h2 className="font-bold">Demo profile: {profile.name}</h2>
            <p className="text-sm text-stone-600">Crops: {profile.crops.join(", ")}</p>
          </div>
          <button className="rounded-full border border-stone-400 px-4 py-2 text-sm hover:bg-stone-50" onClick={clearProfile}>
            Clear local profile
          </button>
        </section>
      )}

      <section aria-label="Sample farm conditions" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          ["Location", "Nashik, Maharashtra"],
          ["Temperature", "29°C"],
          ["Humidity", "68%"],
          ["Soil moisture", "Moderate"],
        ].map(([label, value]) => (
          <article className="rounded-xl bg-white p-5 shadow-sm" key={label}>
            <h2 className="text-sm font-medium text-stone-500">{label}</h2>
            <p className="mt-2 text-xl font-bold">{value}</p>
          </article>
        ))}
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-2">
        <article className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Example crop suggestions</h2>
          <p className="mt-1 text-sm text-stone-500">Illustrative suggestions, not a live prediction.</p>
          <ul className="mt-5 space-y-3">
            <li className="flex items-center justify-between rounded-lg bg-green-50 p-4">
              <span className="font-semibold">Wheat</span><span className="text-green-800">Suitable</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-green-50 p-4">
              <span className="font-semibold">Chickpea</span><span className="text-green-800">Suitable</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-stone-100 p-4">
              <span className="font-semibold">Rice</span><span className="text-stone-600">Needs more water</span>
            </li>
          </ul>
        </article>

        <article className="rounded-xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold">Example rainfall report</h2>
          <p className="mt-1 text-sm text-stone-500">Sample district figures for demonstration.</p>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-stone-500">
                <tr>
                  <th className="py-3 pr-3">District</th>
                  <th className="py-3 pr-3">Actual</th>
                  <th className="py-3 pr-3">Normal</th>
                  <th className="py-3">Trend</th>
                </tr>
              </thead>
              <tbody>
                {rainfall.map(({ district, actual, normal, status }) => (
                  <tr className="border-b last:border-0" key={district}>
                    <td className="py-3 pr-3 font-medium">{district}</td>
                    <td className="py-3 pr-3">{actual}</td>
                    <td className="py-3 pr-3">{normal}</td>
                    <td className="py-3">{status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
      </div>
    </main>
  );
};

export default Demo;
