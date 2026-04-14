const axios = require("axios");

const detectTraffic = async () => {
  axios.post("http://localhost:8001/analyze-video")
  return res.data;
};

module.exports = { detectTraffic };