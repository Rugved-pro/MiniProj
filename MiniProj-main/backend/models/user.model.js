import { createLocalModel } from "../db/localDb.js";

const User = createLocalModel(
    "users",
    {
        name: "",
        gender: "M",
        dob: "",
        phoneno: "",
        password: "",
        crops: [],
        district: "PUNE",
        telegramChatId: "",
        telegramUsername: "",
        telegramLinkedAt: "",
        telegramLinkCode: ""
    },
    true
);

export default User;
