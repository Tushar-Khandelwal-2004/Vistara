import axios from "axios";


export async function isUserSignedIn(): Promise<boolean> {
    try {
        const token = localStorage.getItem("token");
        if (!token) {
            return false;
        }
        const result = await axios.get(`${process.env.NEXT_PUBLIC_BACKEND_URL}/me`, {
            headers: {
                Authorization: token
            }
        })
        return result.data.success;
    } catch (e) {
        return false;
    }

}