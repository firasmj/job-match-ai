/// testing axios URL requests
import axios from "axios";

export const testUrl = async (url: string) => {
    try {
        const response = await axios.get(url);
        return response.data;
    } catch (error) {
        console.error("Error fetching data:", error);
    }
};
