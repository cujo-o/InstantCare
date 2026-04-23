import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SQUAD_API_URL = "https://sandbox-api-d.squadco.com";
const SQUAD_API_KEY = process.env.SQUAD_API_KEY;

interface UserData {
  firstName: string;
  lastName: string; //test
  phoneNumber: string;
  bvn?: string;
}

const generateSquadVirtualAccount = async (userData: UserData) => {
  try {
    // This is the structure expected by Squad's Virtual Account API
    const payload = {
      customer_identifier: userData.phoneNumber, // Unique ID
      first_name: userData.firstName,
      last_name: userData.lastName,
      mobile_num: userData.phoneNumber,
      bvn: userData.bvn || "",
      beneficiary_account: "0123456789", // A designated central settlement account
    };

    const response = await axios.post(
      `${SQUAD_API_URL}/virtual-account`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${SQUAD_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.data;
  } catch (error: any) {
    // Check if Axios returned an error from the API
    if (error.response) {
      throw new Error(
        `Squad API Error: ${JSON.stringify(error.response.data)}`,
      );
    }
    throw new Error("Network error connecting to Squad API");
  }
};
