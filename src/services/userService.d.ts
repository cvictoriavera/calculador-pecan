export interface User {
  id: number;
  name: string;
  // Add other user properties as needed
}

export declare const getCurrentUser: () => Promise<User>;