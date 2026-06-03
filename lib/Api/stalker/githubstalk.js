const { creator: CREATOR } = require("../creator.json");

const githubstalk = async (user) => {
  if (!user) {
    return {
      error: "Missing parameter Username",
      creator: CREATOR,
    };
  }

  const url = `https://api.github.com/users/${user}`;

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Accept: "application/vnd.github+json",
      },
    });

    if (!response.ok) {
      return {
        error: response.status === 404 ? "User not found" : "GitHub API request failed",
        status: response.status,
        creator: CREATOR,
      };
    }

    const data = await response.json();

    return {
      success: true,
      user: data,
      creator: CREATOR,
    };
  } catch (err) {
    return {
      error: err.message || "GitHub API request failed",
      status: 500,
      creator: CREATOR,
    };
  }
};

module.exports = githubstalk;
module.exports.default = githubstalk;
