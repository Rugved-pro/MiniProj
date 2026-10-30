/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from "react";
import useGetIsElevatedUser from "../hooks/getIsElevatedUser";
import { useAuthContext } from "./AuthContext";
import { useEnrollmentContext } from "./EnrollmentContext";

export const ElevatedUserContext = createContext();

export const useElevatedUserContext = () => {
    return useContext(ElevatedUserContext);
};

export const ElevatedUserContextProvider = ({ children }) => {
    const { isElevatedUser } = useGetIsElevatedUser();
    const { authUser } = useAuthContext();
    const { enrolledUser } = useEnrollmentContext();
    const [elevatedUser, setElevatedUser] = useState(false);

    useEffect(() => {
        const getElevatedUser = async () => {
            if (!authUser?._id) {
                setElevatedUser(false);
                return;
            }
            const data = await isElevatedUser();
            setElevatedUser(Boolean(data));
        };
        getElevatedUser();
    }, [authUser, enrolledUser]);

    return (
        <ElevatedUserContext.Provider value={{ elevatedUser, setElevatedUser }}>
            {children}
        </ElevatedUserContext.Provider>
    );
};