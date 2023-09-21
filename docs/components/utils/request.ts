import axios from "axios";

const service = axios.create({
  baseURL: "https://a.imingz.fun/v1", // url = base url + request url
  timeout: 5000, // request timeout
});

export default service;
