
import speakeasy from "speakeasy";
import os from "os";

const API_URL = "https://apiconnect.angelone.in";

let angelSession = null;
let loginPromise = null;

const getLocalNetworkDetails = () => {
  const interfaces = os.networkInterfaces();

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) {
        return {
          localIP: entry.address,
          macAddress: entry.mac
        };
      }
    }
  }

  return {
    localIP: "127.0.0.1",
    macAddress: "00:00:00:00:00:00"
  };
};

const getPublicIP = async () => {
  const response = await fetch(
    "https://api.ipify.org?format=json"
  );

  if (!response.ok) {
    throw new Error("Unable to determine public IP address");
  }

  const data = await response.json();

  if (!data.ip) {
    throw new Error("Public IP address was not returned");
  }

  return data.ip;
};

const getAngelOneHeaders = async (apiKey, jwtToken = "") => {
  const { localIP, macAddress } = getLocalNetworkDetails();
  const publicIP = await getPublicIP();

  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    "X-PrivateKey": apiKey,
    "X-UserType": "USER",
    "X-SourceID": "WEB",
    "X-ClientLocalIP": localIP,
    "X-ClientPublicIP": publicIP,
    "X-MACAddress": macAddress,
    ...(jwtToken
      ? { Authorization: `Bearer ${jwtToken}` }
      : {})
  };
};

export const loginAngelOne = async () => {
  if (angelSession?.jwtToken) {
    return {
      success: true,
      message: "Angel One session already authenticated"
    };
  }

  if (loginPromise) {
    return loginPromise;
  }

  loginPromise = (async () => {
    const {
      ANGELONE_API_KEY,
      ANGELONE_CLIENT_CODE,
      ANGELONE_PIN,
      ANGELONE_TOTP_SECRET
    } = process.env;

    if (
      !ANGELONE_API_KEY ||
      !ANGELONE_CLIENT_CODE ||
      !ANGELONE_PIN ||
      !ANGELONE_TOTP_SECRET
    ) {
      throw new Error(
        "Angel One environment variables are missing"
      );
    }

    const totp = speakeasy.totp({
      secret: ANGELONE_TOTP_SECRET,
      encoding: "base32"
    });

    const headers = await getAngelOneHeaders(
      ANGELONE_API_KEY
    );

    const response = await fetch(
      `${API_URL}/rest/auth/angelbroking/user/v1/loginByPassword`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          clientcode: ANGELONE_CLIENT_CODE,
          password: ANGELONE_PIN,
          totp
        })
      }
    );

    const result = await response.json();

    if (!response.ok || result.status !== true) {
      throw new Error(
        result.message ||
        result.errorcode ||
        "Angel One login failed"
      );
    }

    if (!result.data?.jwtToken) {
      throw new Error(
        "Angel One authentication response did not contain a JWT token"
      );
    }

    angelSession = {
      jwtToken: result.data.jwtToken,
      refreshToken: result.data.refreshToken,
      feedToken: result.data.feedToken,
      createdAt: new Date()
    };

    return {
      success: true,
      message: "Angel One authentication successful"
    };
  })();

  try {
    return await loginPromise;
  } finally {
    loginPromise = null;
  }
};

export const getAngelOneSession = () => angelSession;

export const clearAngelOneSession = () => {
  angelSession = null;
};

export const getAngelOneQuote = async (
  exchange = "NSE",
  symbolToken = "2885",
  mode = "LTP"
) => {
  if (!["LTP", "OHLC", "FULL"].includes(mode)) {
    throw new Error("Invalid Angel One quote mode");
  }

  if (!["NSE", "BSE", "NFO", "BFO", "MCX", "NCX"].includes(exchange)) {
    throw new Error("Invalid exchange");
  }

  if (!angelSession?.jwtToken) {
    await loginAngelOne();
  }

  const { ANGELONE_API_KEY } = process.env;

  if (!ANGELONE_API_KEY) {
    throw new Error("ANGELONE_API_KEY is missing");
  }

  const headers = await getAngelOneHeaders(
    ANGELONE_API_KEY,
    angelSession.jwtToken
  );

  const response = await fetch(
    `${API_URL}/rest/secure/angelbroking/market/v1/quote/`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        mode,
        exchangeTokens: {
          [exchange]: [String(symbolToken)]
        }
      })
    }
  );

  const result = await response.json();

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    clearAngelOneSession();
    throw new Error(
      "Angel One session expired or unauthorized. Please retry authentication."
    );
  }

  if (!response.ok || result.status !== true) {
    throw new Error(
      result.message ||
      result.errorcode ||
      "Unable to fetch Angel One quote"
    );
  }

  if (
    !result.data?.fetched ||
    result.data.fetched.length === 0
  ) {
    const failure = result.data?.unfetched?.[0];

    throw new Error(
      failure?.message ||
      "Angel One returned no quote"
    );
  }

  return result.data;
};
