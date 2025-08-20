import axios from "axios";

export const AxiosInstance = axios.create({
  baseURL: "http://localhost:5001/api",
  withCredentials: true,
});
