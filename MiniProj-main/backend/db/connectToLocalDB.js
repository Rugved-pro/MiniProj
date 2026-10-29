import { initLocalDB } from "./localDb.js";

const connectToLocalDB = () => {
    if (!initLocalDB()) {
        throw new Error("Could not initialize the local JSON database.");
    }
    console.log("Connected to Local JSON Database (backend/db/database.json)");
};

export default connectToLocalDB;