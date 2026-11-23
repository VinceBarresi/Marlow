export interface HealthResponseModel {
  ok: boolean;
  postgres: boolean;
  redis: boolean;
}

export const healthResponseModel = {
  ok: true,
  postgres: true,
  redis: true,
} satisfies HealthResponseModel;

export interface LogoutResponseModel {
  ok: boolean;
}

export const logoutResponseModel = {
  ok: true,
} satisfies LogoutResponseModel;
