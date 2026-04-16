import { supabase } from "../config/db.js";

export const registerNewUser = async (email, password, firstName, lastName, phone, birthday) => {
    console.log("CHECKING DATA BEFORE SIGNUP:", { email, firstName, lastName, phone, birthday });
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                first_name: firstName,
                last_name: lastName,
                phone: phone,
                date_of_birth: birthday, 
            }
        }
    });

    if (error) throw error;
    return data;
};

export const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
};

export const isUserExists = async (email) => {
    const { data } = await supabase.from('users').select('email').eq('email', email).maybeSingle();
    return !!data;
};

export const getUserById = async (id) => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (error) throw error;
    return data;
};

export const deleteUser = async (id) => {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
};

export const updateUser = async (id, updates) => {
    const { data, error } = await supabase.from('users').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
};