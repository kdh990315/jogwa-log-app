export type ProfileSignupProvider = "apple" | "kakao" | "google" | null;

export type ProfileStatus = "active" | "blocked" | "deleted";

export interface MyProfile {
  avatarUrl: string | null;
  createdAt: string | null;
  email: string | null;
  id: string;
  nickname: string | null;
  signupProvider: ProfileSignupProvider;
  status: ProfileStatus;
  updatedAt: string | null;
}

export interface UpdateMyProfileInput {
  nickname: string | null;
}
