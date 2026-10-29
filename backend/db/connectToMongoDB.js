import { initLocalDB } from "./localDb.js";

const connectToMongoDB = async () => {
    try {
        initLocalDB();
        console.log("Connected to Local JSON Database (backend/db/database.json)");
    } catch (error) {
        console.log("Error in connecting to Local JSON Database", error);
    }
};

export default connectToMongoDB;