import { createLocalModel } from "../db/localDb.js";

const User = createLocalModel(
    "users",
    {
        name: "",
        gender: "M",
        dob: "",
        phoneno: "",
        password: "",
        crops: []
    },
    true
);

export default User;