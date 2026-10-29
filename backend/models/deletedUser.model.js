import { createLocalModel } from "../db/localDb.js";

const DeletedUser = createLocalModel(
    "deletedUsers",
    {
        userId: "",
        name: "",
        gender: "M",
        dob: "",
        phoneno: "",
        password: "",
        crops: []
    },
    true
);

export default DeletedUser;