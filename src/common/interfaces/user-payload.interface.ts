export interface UserPayload {
  userId: string;       // MongoDB _id of the user
  email: string;        // user's email
  name?: string;        // optional, user's name
  roles?: string[];     // e.g., ['user', 'admin']
}