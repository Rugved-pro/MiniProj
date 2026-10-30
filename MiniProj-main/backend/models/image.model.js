import { createLocalModel } from "../db/localDb.js";

const Image = createLocalModel(
    "images",
    {
        image_url: "",
        crop: "",
        disease: ""
    },
    false
);

export default Image;