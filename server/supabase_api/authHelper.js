import supabase from "../config/db.js";

export const getUserFromToken = async (token) => {
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw new Error("Unauthorized");
  }

  return data.user;
};