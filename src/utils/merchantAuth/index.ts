
// Re-export all merchant auth functions from this index file
export * from "./types";
// Export from validation explicitly to prevent naming conflicts
export { isValidEmail as validateMerchantEmail } from "./validation";
export * from "./authentication";
export * from "./profile";
