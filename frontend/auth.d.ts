import 'next-auth'

declare module 'next-auth' {
    interface Session {
        user?: {
            id: string;
            plan: 'free' | 'premium';
        } & DefaultSession['user'];
    }

    interface User {
        id: string;
    }
}

declare module 'next-auth/jwt' {
    interface JWT {
        id: string;
    }
}