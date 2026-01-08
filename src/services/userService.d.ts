export interface User {
  id: number;
  name: string;
  email?: string;
  username?: string;
  roles?: string[];
  // Add other user properties as needed
}

export declare const getCurrentUser: () => Promise<User>;