import supabase from "../config/db.js";

export const registerNewUser = async (
  email,
  password,
  first_name,
  last_name,
  phone,
  date_of_birth
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password
  });

  if (error) throw error;

  const userId = data.user.id;

  const { error: insertError } = await supabase
    .from("users")
    .insert([{
      id: userId,
      first_name,
      last_name,
      email,
      phone,
      date_of_birth,
      avatar_url: ""
    }]);

  if (insertError) throw insertError;

  return true;
};

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) throw error;

  return {
    access_token: data.session.access_token,
    user: data.user
  };
};


