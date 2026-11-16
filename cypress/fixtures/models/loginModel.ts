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
    }
}

export const loginResponseModel = {
    user: {
        email: "customer@marlow.test",
        name: "Mina Adler",
        role: "customer",
    },
} satisfies {
    user: Omit<LoginResponseModel["user"], "id">;
};

