export interface LoginRequestModel {
  email: string;
  password: string;
}

export interface LoginResponseModel {
  user: {
    email: string;
    id: string;
    name: string;
    role: string;
  };
}

type LoginUserExpectation = Omit<LoginResponseModel["user"], "id">;

export const customerLoginResponseModel = {
  user: {
    email: "customer@marlow.test",
    name: "Mina Adler",
    role: "customer",
  },
} satisfies { user: LoginUserExpectation };

export const adminLoginResponseModel = {
  user: {
    email: "admin@marlow.test",
    name: "Avery Chen",
    role: "admin",
  },
} satisfies { user: LoginUserExpectation };

export const staffLoginResponseModel = {
  user: {
    email: "staff@marlow.test",
    name: "Jordan Walsh",
    role: "staff",
  },
} satisfies { user: LoginUserExpectation };

export interface LoginErrorResponseModel {
  error: string;
}

export const loginUnauthorizedErrorModel = {
  error: "Email or password is wrong.",
} satisfies LoginErrorResponseModel;

export const loginValidationErrorModel = {
  error: "Enter an email and password.",
} satisfies LoginErrorResponseModel;
