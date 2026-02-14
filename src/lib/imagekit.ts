import ImageKit from "imagekit";
import { Env } from "./Env";
import { logger } from "./logger";

// Initialize ImageKit instance
export const imagekit = new ImageKit({
  publicKey: Env.IMAGEKIT_PUBLIC_KEY,
  privateKey: Env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: Env.IMAGEKIT_URL_ENDPOINT,
});

// Log initialization
logger.info("ImageKit initialized", {
  urlEndpoint: Env.IMAGEKIT_URL_ENDPOINT,
  publicKey: Env.IMAGEKIT_PUBLIC_KEY.substring(0, 10) + "...",
});

/**
 * Generate authentication parameters for client-side upload
 * @returns Authentication parameters including token, signature, and expire timestamp
 */
export const getImageKitAuthParams = () => {
  try {
    const authenticationParameters = imagekit.getAuthenticationParameters();
    logger.info("ImageKit auth parameters generated", {
      expire: authenticationParameters.expire,
    });
    return authenticationParameters;
  } catch (error) {
    logger.error("Failed to generate ImageKit auth parameters", { error });
    throw error;
  }
};
