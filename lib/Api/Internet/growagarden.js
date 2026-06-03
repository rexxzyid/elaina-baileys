const { creator: CREATOR } = require("../creator.json");

const growagarden = async () => {
  try {
    const res = await fetch("https://gagstock.gleeze.com/grow-a-garden");
    if (!res.ok) {
      throw new Error("@rexxhayanasi/elaina-baileys API Grow A Garden gagal mengambil data");
    }

    const json = await res.json();

    return {
      creator: CREATOR,
      status: json.status,
      updated_at: json.updated_at,
      data: json.data
    };
  } catch (err) {
    return {
      creator: CREATOR,
      error: err.message,
      status: 500
    };
  }
};

module.exports = growagarden;
module.exports.default = growagarden;
