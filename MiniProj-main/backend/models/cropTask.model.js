import { createLocalModel } from "../db/localDb.js";

const CropTask = createLocalModel(
    "cropTasks",
    {
        userId: "",
        plotId: "",
        crop: "",
        taskTitle: "",
        category: "inspection", // inspection, irrigation, fertilizer, protection, harvest
        description: "",
        dueDate: "",
        completed: false,
        completedAt: null
    },
    true
);

export default CropTask;
